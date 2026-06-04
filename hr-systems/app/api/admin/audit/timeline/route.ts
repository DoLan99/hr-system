import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { ADMIN_ROLES, SUB_MANAGER_ROLES, getManagedEmployeeIds } from "@/lib/managed-scope";
import { requireApiAuth } from "@/lib/api-auth";

type EventType =
  | "SESSION_LOGIN"
  | "SESSION_LOGOUT"
  | "AUDIT_CREATE"
  | "AUDIT_UPDATE"
  | "AUDIT_DELETE"
  | "TIMELOG_START"
  | "TIMELOG_STOP"
  | "OFFICE_CLOCK"
  | "VAULT_ACCESS"
  | "MESSAGE_AUDIT"
  | "API_ERROR";

interface TimelineEvent {
  at: string;
  type: EventType;
  summary: string;
  meta?: Record<string, unknown>;
}

/**
 * GET /api/admin/audit/timeline?employeeId=X&date=YYYY-MM-DD
 *
 * Gộp toàn bộ hoạt động của 1 user trong 1 ngày từ:
 * UserSession, AuditLog, TimeLog, OfficeTime, VaultAccessLog,
 * MessageAuditLog, ApiAccessLog (chỉ lỗi 4xx/5xx).
 *
 * Sắp xếp theo thời gian mới nhất trước. Dùng cho timeline view.
 */
export const GET = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const role = auth.roleName;
  const userId = auth.actorId;
  const isAdmin = ADMIN_ROLES.includes(role);
  const isSubManager = SUB_MANAGER_ROLES.includes(role);
  if (!isAdmin && !isSubManager) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const employeeIdParam = searchParams.get("employeeId");
  const dateParam = searchParams.get("date");
  if (!employeeIdParam || !dateParam) {
    return NextResponse.json(
      { error: "Thiếu employeeId hoặc date (?date=YYYY-MM-DD)" },
      { status: 422 },
    );
  }
  const targetId = Number(employeeIdParam);

  // Scope check
  if (!isAdmin && isSubManager) {
    const managed = await getManagedEmployeeIds(userId, role);
    if (managed !== null && targetId !== userId && !managed.includes(targetId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const dayStart = new Date(dateParam);
  if (Number.isNaN(dayStart.getTime())) {
    return NextResponse.json({ error: "date không hợp lệ" }, { status: 422 });
  }
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  // ── Pull from all sources in parallel ──────────────────────────────────────
  const [sessions, audits, timeLogs, officeTime, vaultAccess, messageAudits, apiErrors] =
    await Promise.all([
      prisma.userSession.findMany({
        where: {
          employeeId: targetId,
          OR: [
            { loginAt: { gte: dayStart, lt: dayEnd } },
            { logoutAt: { gte: dayStart, lt: dayEnd } },
          ],
        },
        select: { id: true, loginAt: true, logoutAt: true, ipAddress: true, device: true, browser: true, os: true, logoutReason: true, loginMethod: true },
      }),

      prisma.auditLog.findMany({
        where: {
          changedById: targetId,
          changedAt: { gte: dayStart, lt: dayEnd },
        },
        select: {
          id: true,
          tableName: true,
          action: true,
          recordId: true,
          changedAt: true,
          ipAddress: true,
          endpoint: true,
          method: true,
          requestId: true,
          sessionId: true,
        },
        orderBy: { changedAt: "asc" },
      }),

      prisma.timeLog.findMany({
        where: {
          employeeId: targetId,
          OR: [
            { startTime: { gte: dayStart, lt: dayEnd } },
            { endTime: { gte: dayStart, lt: dayEnd } },
          ],
        },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          durationMinutes: true,
          task: { select: { code: true, title: true } },
        },
      }),

      prisma.officeTime.findMany({
        where: { employeeId: targetId, date: dayStart },
        select: {
          id: true,
          startWork1: true,
          startLunch: true,
          startWork2: true,
          startAfternoonBreak: true,
          startWork3: true,
          endWorkday: true,
        },
      }),

      prisma.vaultAccessLog.findMany({
        where: {
          accessedById: targetId,
          accessedAt: { gte: dayStart, lt: dayEnd },
        },
        select: {
          id: true,
          accessedAt: true,
          action: true,
          vault: { select: { id: true, entityName: true, serviceApp: true } },
        },
      }),

      prisma.messageAuditLog.findMany({
        where: {
          actorId: targetId,
          createdAt: { gte: dayStart, lt: dayEnd },
        },
        select: { id: true, action: true, createdAt: true, messageId: true },
      }),

      prisma.apiAccessLog.findMany({
        where: {
          employeeId: targetId,
          createdAt: { gte: dayStart, lt: dayEnd },
          statusCode: { gte: 400 },
        },
        select: {
          id: true,
          createdAt: true,
          endpoint: true,
          method: true,
          statusCode: true,
          errorMessage: true,
          durationMs: true,
        },
        take: 200,
        orderBy: { createdAt: "asc" },
      }),
    ]);

  // ── Build unified event list ──────────────────────────────────────────────
  const events: TimelineEvent[] = [];

  for (const s of sessions) {
    if (s.loginAt >= dayStart && s.loginAt < dayEnd) {
      events.push({
        at: s.loginAt.toISOString(),
        type: "SESSION_LOGIN",
        summary: `Đăng nhập từ ${s.ipAddress ?? "?"} · ${s.browser ?? "?"} / ${s.os ?? "?"}`,
        meta: {
          sessionId: s.id,
          ipAddress: s.ipAddress,
          device: s.device,
          browser: s.browser,
          os: s.os,
          method: s.loginMethod,
        },
      });
    }
    if (s.logoutAt && s.logoutAt >= dayStart && s.logoutAt < dayEnd) {
      events.push({
        at: s.logoutAt.toISOString(),
        type: "SESSION_LOGOUT",
        summary: `Đăng xuất (${s.logoutReason ?? "UNKNOWN"})`,
        meta: { sessionId: s.id, reason: s.logoutReason },
      });
    }
  }

  for (const a of audits) {
    const action = a.action.toUpperCase();
    const type: EventType = action === "CREATE"
      ? "AUDIT_CREATE"
      : action === "DELETE"
      ? "AUDIT_DELETE"
      : "AUDIT_UPDATE";
    events.push({
      at: a.changedAt.toISOString(),
      type,
      summary: `${action} ${a.tableName}${a.recordId ? `#${a.recordId}` : ""} · ${a.method ?? ""} ${a.endpoint ?? ""}`.trim(),
      meta: {
        auditLogId: a.id,
        tableName: a.tableName,
        recordId: a.recordId,
        requestId: a.requestId,
        sessionId: a.sessionId,
      },
    });
  }

  for (const tl of timeLogs) {
    if (tl.startTime && tl.startTime >= dayStart && tl.startTime < dayEnd) {
      events.push({
        at: tl.startTime.toISOString(),
        type: "TIMELOG_START",
        summary: `Bắt đầu task ${tl.task.code} — ${tl.task.title}`,
        meta: { timeLogId: tl.id, taskCode: tl.task.code },
      });
    }
    if (tl.endTime && tl.endTime >= dayStart && tl.endTime < dayEnd) {
      events.push({
        at: tl.endTime.toISOString(),
        type: "TIMELOG_STOP",
        summary: `Dừng task ${tl.task.code} — ${tl.durationMinutes} phút`,
        meta: { timeLogId: tl.id, taskCode: tl.task.code, durationMinutes: tl.durationMinutes },
      });
    }
  }

  if (officeTime[0]) {
    const ot = officeTime[0];
    const checkpoints = [
      ["startWork1", "Vào làm (sáng)"],
      ["startLunch", "Bắt đầu nghỉ trưa"],
      ["startWork2", "Vào làm (chiều)"],
      ["startAfternoonBreak", "Nghỉ giải lao chiều"],
      ["startWork3", "Quay lại làm (sau giải lao)"],
      ["endWorkday", "Kết thúc ngày"],
    ] as const;
    for (const [key, label] of checkpoints) {
      const value = ot[key as keyof typeof ot] as Date | null;
      if (value && value >= dayStart && value < dayEnd) {
        events.push({
          at: value.toISOString(),
          type: "OFFICE_CLOCK",
          summary: label,
          meta: { checkpoint: key, officeTimeId: ot.id },
        });
      }
    }
  }

  for (const v of vaultAccess) {
    events.push({
      at: v.accessedAt.toISOString(),
      type: "VAULT_ACCESS",
      summary: `Vault: ${v.action ?? "ACCESS"} · ${v.vault?.entityName ?? v.vault?.serviceApp ?? "?"}`,
      meta: { vaultId: v.vault?.id, action: v.action },
    });
  }

  for (const m of messageAudits) {
    events.push({
      at: m.createdAt.toISOString(),
      type: "MESSAGE_AUDIT",
      summary: `Message ${m.action}${m.messageId ? ` #${m.messageId}` : ""}`,
      meta: { messageId: m.messageId, action: m.action },
    });
  }

  for (const e of apiErrors) {
    events.push({
      at: e.createdAt.toISOString(),
      type: "API_ERROR",
      summary: `${e.statusCode} ${e.method} ${e.endpoint}${e.errorMessage ? ` — ${e.errorMessage.slice(0, 80)}` : ""}`,
      meta: {
        endpoint: e.endpoint,
        method: e.method,
        statusCode: e.statusCode,
        durationMs: e.durationMs,
      },
    });
  }

  events.sort((a, b) => b.at.localeCompare(a.at));

  return NextResponse.json({
    data: {
      employeeId: targetId,
      date: dayStart.toISOString().slice(0, 10),
      events,
      stats: {
        total: events.length,
        sessionCount: sessions.length,
        auditCount: audits.length,
        timeLogStartCount: timeLogs.filter((t) => t.startTime && t.startTime >= dayStart && t.startTime < dayEnd).length,
        vaultAccessCount: vaultAccess.length,
        apiErrorCount: apiErrors.length,
      },
    },
  });
});
