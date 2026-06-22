import { Prisma, PrismaClient } from "@prisma/client";
import { getOrgId, getRequestContext } from "./request-context";

// ─────────────────────────────────────────────────────────────
// Tenant isolation: auto-inject organizationId into Prisma queries
// ─────────────────────────────────────────────────────────────

const TENANT_SCOPED_MODELS = new Set<string>([
  "Role",
  "Department",
  "Team",
  "TeamDepartment",
  "Employee",
  "SalaryHistory",
  "Customer",
  "CustomerContact",
  "CustomerActivity",
  "TaskTemplate",
  "Task",
  "TimeLog",
  "OfficeTime",
  "TemplateSuggestion",
  "EstimateFlag",
  "SalarySummary",
  "Payment",
  "Leave",
  "Message",
  "MessageAuditLog",
  "PasswordVault",
  "VaultAccessLog",
  "WorkRule",
  "UserSession",
  "UserActivity",
  "AnomalyAlert",
  "SystemLabel",
]);

const NULLABLE_ORG_MODELS = new Set<string>(["ApiAccessLog", "AuditLog"]);

function shouldFilter(model: string): boolean {
  return TENANT_SCOPED_MODELS.has(model) || NULLABLE_ORG_MODELS.has(model);
}

function withWhereFilter<A extends { where?: any }>(args: A, orgId: string): A {
  return { ...args, where: { ...(args.where ?? {}), organizationId: orgId } };
}

function withDataInject<A extends { data?: any }>(args: A, orgId: string): A {
  const data = args.data;
  if (Array.isArray(data)) {
    return {
      ...args,
      data: data.map((row: any) =>
        row?.organizationId ? row : { ...row, organizationId: orgId },
      ),
    };
  }
  if (data && !data.organizationId) {
    return { ...args, data: { ...data, organizationId: orgId } };
  }
  return args;
}

// ─────────────────────────────────────────────────────────────
// Audit log: auto-write AuditLog rows on create/update/delete
// ─────────────────────────────────────────────────────────────

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
]);

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
    console.error("[audit-extension] failed to write audit log:", err);
  }
}

// ─────────────────────────────────────────────────────────────
// Combined extension: tenant inject + audit log in one pipeline
// ─────────────────────────────────────────────────────────────

export function createCombinedExtension(writer: PrismaClient) {
  return Prisma.defineExtension({
    name: "tenant-audit",
    query: {
      $allModels: {
        async findMany({ model, args, query }) {
          const orgId = getOrgId();
          return query(orgId && shouldFilter(model) ? withWhereFilter(args, orgId) : args);
        },
        async findFirst({ model, args, query }) {
          const orgId = getOrgId();
          return query(orgId && shouldFilter(model) ? withWhereFilter(args, orgId) : args);
        },
        async findFirstOrThrow({ model, args, query }) {
          const orgId = getOrgId();
          return query(orgId && shouldFilter(model) ? withWhereFilter(args, orgId) : args);
        },
        async count({ model, args, query }) {
          const orgId = getOrgId();
          return query(orgId && shouldFilter(model) ? withWhereFilter(args, orgId) : args);
        },
        async aggregate({ model, args, query }) {
          const orgId = getOrgId();
          return query(orgId && shouldFilter(model) ? withWhereFilter(args, orgId) : args);
        },
        async groupBy({ model, args, query }) {
          const orgId = getOrgId();
          return query(orgId && shouldFilter(model) ? withWhereFilter(args, orgId) : args);
        },

        async create({ model, args, query }) {
          const orgId = getOrgId();
          const finalArgs = orgId && shouldFilter(model) ? withDataInject(args, orgId) : args;
          const result = (await query(finalArgs)) as { id?: number } | null;
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

        async createMany({ model, args, query }) {
          const orgId = getOrgId();
          const finalArgs = orgId && shouldFilter(model) ? withDataInject(args, orgId) : args;
          return query(finalArgs);
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
              // ignore
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
          const orgId = getOrgId();
          const finalArgs = orgId && shouldFilter(model) ? withDataInject(args as any, orgId) : args;

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

          const result = (await query(finalArgs)) as { id?: number } | null;

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
          const orgId = getOrgId();
          const finalArgs = orgId && shouldFilter(model) ? withWhereFilter(args, orgId) : args;
          const result = (await query(finalArgs)) as { count: number };
          if (AUDITED_MODELS.has(model) && result.count > 0) {
            await writeAudit(writer, {
              model,
              action: "UPDATE",
              recordId: null,
              newData: {
                bulk: true,
                count: result.count,
                where: (finalArgs as any)?.where,
                data: sanitize((finalArgs as any)?.data),
              },
            });
          }
          return result;
        },

        async deleteMany({ model, args, query }) {
          const orgId = getOrgId();
          const finalArgs = orgId && shouldFilter(model) ? withWhereFilter(args, orgId) : args;
          const result = (await query(finalArgs)) as { count: number };
          if (AUDITED_MODELS.has(model) && result.count > 0) {
            await writeAudit(writer, {
              model,
              action: "DELETE",
              recordId: null,
              oldData: {
                bulk: true,
                count: result.count,
                where: (finalArgs as any)?.where,
              },
            });
          }
          return result;
        },
      },
    },
  });
}
