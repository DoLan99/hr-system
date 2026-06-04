import { prisma } from "@/lib/prisma";
import { getRequestContext } from "@/lib/request-context";

type AuditAction = "CREATED" | "UPDATED" | "STATUS_CHANGED" | "DELETED";

interface AuditOptions {
  messageId: number;
  /** Override actor; nếu không truyền sẽ tự lấy từ RequestContext */
  actorId?: number | null;
  action: AuditAction;
  changes?: Record<string, { from: unknown; to: unknown }>;
}

/**
 * Ghi 1 MessageAuditLog entry. Tự động enrich với context từ RequestContext
 * (ip / userAgent / sessionId / requestId / endpoint / method) — đảm bảo
 * thông tin truy vết đồng nhất với AuditLog tổng.
 */
export async function logMessageAudit({ messageId, actorId, action, changes }: AuditOptions) {
  const ctx = getRequestContext();
  await prisma.messageAuditLog.create({
    data: {
      messageId,
      actorId: actorId ?? ctx?.actorId ?? null,
      action,
      changes: changes ? (changes as object) : undefined,
      ipAddress: ctx?.ipAddress ?? null,
      userAgent: ctx?.userAgent ?? null,
      sessionId: ctx?.sessionId ?? null,
      requestId: ctx?.requestId ?? null,
      endpoint: ctx?.endpoint ?? null,
      method: ctx?.method ?? null,
    },
  });
}

export function diffObjects(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  fields: string[]
): Record<string, { from: unknown; to: unknown }> {
  const result: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of fields) {
    if (before[key] !== after[key]) {
      result[key] = { from: before[key] ?? null, to: after[key] ?? null };
    }
  }
  return result;
}
