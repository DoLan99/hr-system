import { Prisma, PrismaClient } from "@prisma/client";
import { getRequestContext } from "./request-context";

/**
 * Danh sách các model SẼ được tự động ghi audit log.
 * Thêm/bớt tại đây để bật/tắt tracking cho từng bảng.
 */
const AUDITED_MODELS = new Set<string>([
  "Employee",
  "Role",
  "Department",
  "Team",
  "Task",
  "TaskTemplate",
  "TimeLog",
  "OfficeTime",
  "Customer",
  "Leave",
  "Payment",
  "SalarySummary",
  "PasswordVault",
  "WorkRule",
  "SystemLabel",
  "TemplateSuggestion",
  "EstimateFlag",
  "ReviewCycle",
  "PerformanceReview",
  "Skill",
  "EmployeeSkill",
  "RoleSkillRequirement",
]);

/**
 * Các field không bao giờ được log (mật khẩu, secret).
 */
const SENSITIVE_FIELDS = new Set<string>([
  "passwordHash",
  "passwordEncrypted",
  "twoFaBackup",
  "twoFaMethod",
]);

const REDACTED = "[REDACTED]";

function sanitize(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return value.map(sanitize);
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE_FIELDS.has(k) ? REDACTED : sanitize(v);
    }
    return out;
  }
  return value;
}

function diff(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined,
): Record<string, { from: unknown; to: unknown }> {
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  const keys = new Set<string>([
    ...Object.keys(before ?? {}),
    ...Object.keys(after ?? {}),
  ]);
  for (const key of keys) {
    const a = (before as any)?.[key];
    const b = (after as any)?.[key];
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      changes[key] = { from: a ?? null, to: b ?? null };
    }
  }
  return changes;
}

function delegateName(model: string): string {
  return model.charAt(0).toLowerCase() + model.slice(1);
}

async function writeAudit(
  writer: PrismaClient,
  params: {
    model: string;
    action: "CREATE" | "UPDATE" | "DELETE";
    recordId: number | null;
    oldData?: unknown;
    newData?: unknown;
  },
): Promise<void> {
  const ctx = getRequestContext();
  try {
    await writer.auditLog.create({
      data: {
        organizationId: ctx?.organizationId ?? null,
        tableName: params.model,
        recordId: params.recordId,
        action: params.action,
        oldData: (params.oldData as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        newData: (params.newData as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        changedById: ctx?.actorId ?? null,
        ipAddress: ctx?.ipAddress ?? null,
        userAgent: ctx?.userAgent ?? null,
        sessionId: ctx?.sessionId ?? null,
        requestId: ctx?.requestId ?? null,
        endpoint: ctx?.endpoint ?? null,
        method: ctx?.method ?? null,
      },
    });
  } catch (err) {
    // Audit log không bao giờ được phép ngăn business logic chạy.
    console.error("[audit-extension] failed to write audit log:", err);
  }
}

/**
 * Tạo Prisma Client Extension tự động ghi AuditLog khi có create/update/delete.
 *
 * `writer` là raw PrismaClient (chưa có extension) — dùng để ghi AuditLog
 * mà không bị extension intercept lại (tránh đệ quy).
 */
export function createAuditExtension(writer: PrismaClient) {
  return Prisma.defineExtension({
    name: "audit",
    query: {
      $allModels: {
        async create({ model, args, query }) {
          const result = (await query(args)) as { id?: number } | null;
          if (AUDITED_MODELS.has(model)) {
            await writeAudit(writer, {
              model,
              action: "CREATE",
              recordId: result?.id ?? null,
              newData: sanitize(result),
            });
          }
          return result;
        },

        async update({ model, args, query }) {
          let oldData: unknown = null;
          if (AUDITED_MODELS.has(model) && (args as any)?.where) {
            try {
              const delegate = (writer as any)[delegateName(model)];
              if (delegate?.findUnique) {
                oldData = await delegate.findUnique({ where: (args as any).where });
              }
            } catch {
              // bỏ qua — vẫn ghi audit dù không có oldData
            }
          }

          const result = (await query(args)) as { id?: number } | null;

          if (AUDITED_MODELS.has(model)) {
            const sanitizedOld = sanitize(oldData) as Record<string, unknown> | null;
            const sanitizedNew = sanitize(result) as Record<string, unknown> | null;
            const changes = diff(sanitizedOld, sanitizedNew);
            if (Object.keys(changes).length > 0) {
              await writeAudit(writer, {
                model,
                action: "UPDATE",
                recordId: result?.id ?? null,
                oldData: sanitizedOld,
                newData: changes,
              });
            }
          }
          return result;
        },

        async upsert({ model, args, query }) {
          let oldData: unknown = null;
          if (AUDITED_MODELS.has(model) && (args as any)?.where) {
            try {
              const delegate = (writer as any)[delegateName(model)];
              if (delegate?.findUnique) {
                oldData = await delegate.findUnique({ where: (args as any).where });
              }
            } catch {
              // ignore
            }
          }

          const result = (await query(args)) as { id?: number } | null;

          if (AUDITED_MODELS.has(model)) {
            if (oldData) {
              const sanitizedOld = sanitize(oldData) as Record<string, unknown> | null;
              const sanitizedNew = sanitize(result) as Record<string, unknown> | null;
              const changes = diff(sanitizedOld, sanitizedNew);
              if (Object.keys(changes).length > 0) {
                await writeAudit(writer, {
                  model,
                  action: "UPDATE",
                  recordId: result?.id ?? null,
                  oldData: sanitizedOld,
                  newData: changes,
                });
              }
            } else {
              await writeAudit(writer, {
                model,
                action: "CREATE",
                recordId: result?.id ?? null,
                newData: sanitize(result),
              });
            }
          }
          return result;
        },

        async delete({ model, args, query }) {
          let oldData: unknown = null;
          if (AUDITED_MODELS.has(model) && (args as any)?.where) {
            try {
              const delegate = (writer as any)[delegateName(model)];
              if (delegate?.findUnique) {
                oldData = await delegate.findUnique({ where: (args as any).where });
              }
            } catch {
              // ignore
            }
          }

          const result = (await query(args)) as { id?: number } | null;

          if (AUDITED_MODELS.has(model)) {
            await writeAudit(writer, {
              model,
              action: "DELETE",
              recordId: (oldData as any)?.id ?? result?.id ?? null,
              oldData: sanitize(oldData),
            });
          }
          return result;
        },

        async updateMany({ model, args, query }) {
          const result = (await query(args)) as { count: number };
          if (AUDITED_MODELS.has(model) && result.count > 0) {
            await writeAudit(writer, {
              model,
              action: "UPDATE",
              recordId: null,
              newData: {
                bulk: true,
                count: result.count,
                where: (args as any)?.where,
                data: sanitize((args as any)?.data),
              },
            });
          }
          return result;
        },

        async deleteMany({ model, args, query }) {
          const result = (await query(args)) as { count: number };
          if (AUDITED_MODELS.has(model) && result.count > 0) {
            await writeAudit(writer, {
              model,
              action: "DELETE",
              recordId: null,
              oldData: {
                bulk: true,
                count: result.count,
                where: (args as any)?.where,
              },
            });
          }
          return result;
        },
      },
    },
  });
}
