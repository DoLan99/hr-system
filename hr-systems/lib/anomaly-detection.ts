import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { AnomalyType, AnomalySeverity } from "@prisma/client";

interface AnomalyCandidate {
  type: AnomalyType;
  severity: AnomalySeverity;
  employeeId: number | null;
  dedupKey: string;
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
  auditLogId?: number;
  sessionId?: string;
  apiAccessLogId?: bigint;
}

// ── Thresholds — có thể đẩy ra system_label sau ─────────────────────────────
const HISTORICAL_IP_WINDOW_DAYS = 90;
const OFF_HOURS_START = 22; // 22:00
const OFF_HOURS_END = 6;    // 06:00
const BULK_DELETE_THRESHOLD = 10;
const TIMELOG_OVER_ESTIMATE_RATIO = 2.0; // 200% estimate
const FAILED_API_THRESHOLD_PER_HOUR = 20;

// ── Detector 1: IP lạ ──────────────────────────────────────────────────────
async function detectUnusualIp(since: Date): Promise<AnomalyCandidate[]> {
  const recentSessions = await prisma.userSession.findMany({
    where: { loginAt: { gte: since }, ipAddress: { not: null } },
    select: { id: true, employeeId: true, loginAt: true, ipAddress: true, country: true, city: true, employee: { select: { fullName: true } } },
  });

  const candidates: AnomalyCandidate[] = [];
  for (const s of recentSessions) {
    if (!s.ipAddress) continue;
    // Lấy historical IPs (loại trừ session hiện tại)
    const historyStart = new Date(Date.now() - HISTORICAL_IP_WINDOW_DAYS * 86400_000);
    const history = await prisma.userSession.findMany({
      where: {
        employeeId: s.employeeId,
        loginAt: { gte: historyStart, lt: s.loginAt },
        id: { not: s.id },
      },
      select: { ipAddress: true },
      take: 500,
    });
    const known = new Set(history.map((h) => h.ipAddress).filter(Boolean));
    if (history.length === 0) continue; // user mới, không đủ data
    if (!known.has(s.ipAddress)) {
      candidates.push({
        type: "UNUSUAL_IP",
        severity: "WARNING",
        employeeId: s.employeeId,
        dedupKey: `UNUSUAL_IP|${s.id}`,
        title: `IP lạ: ${s.ipAddress}`,
        description: `${s.employee?.fullName ?? "User"} đăng nhập từ IP ${s.ipAddress} (chưa từng dùng trong ${HISTORICAL_IP_WINDOW_DAYS} ngày).`,
        metadata: {
          newIp: s.ipAddress,
          country: s.country,
          city: s.city,
          historicalIps: Array.from(known).slice(0, 5),
        },
        sessionId: s.id,
      });
    }
  }
  return candidates;
}

// ── Detector 2: Truy cập Vault ngoài giờ ────────────────────────────────────
async function detectOffHoursVault(since: Date): Promise<AnomalyCandidate[]> {
  const accesses = await prisma.vaultAccessLog.findMany({
    where: { accessedAt: { gte: since } },
    select: {
      id: true,
      accessedAt: true,
      action: true,
      accessedById: true,
      accessedBy: { select: { fullName: true } },
      vault: { select: { id: true, entityName: true, serviceApp: true } },
    },
  });

  const candidates: AnomalyCandidate[] = [];
  for (const a of accesses) {
    const hour = a.accessedAt.getHours();
    const isOffHours = hour >= OFF_HOURS_START || hour < OFF_HOURS_END;
    if (!isOffHours) continue;
    candidates.push({
      type: "OFF_HOURS_VAULT",
      severity: "WARNING",
      employeeId: a.accessedById,
      dedupKey: `OFF_HOURS_VAULT|${a.id}`,
      title: `Truy cập Vault lúc ${String(hour).padStart(2, "0")}:${String(a.accessedAt.getMinutes()).padStart(2, "0")}`,
      description: `${a.accessedBy?.fullName ?? "User"} truy cập vault "${a.vault?.entityName ?? a.vault?.serviceApp ?? "?"}" ngoài giờ làm việc.`,
      metadata: {
        vaultId: a.vault?.id,
        vaultName: a.vault?.entityName ?? a.vault?.serviceApp,
        action: a.action,
        hour,
      },
    });
  }
  return candidates;
}

// ── Detector 3: Bulk delete bất thường ──────────────────────────────────────
async function detectBulkDelete(since: Date): Promise<AnomalyCandidate[]> {
  const rows = await prisma.auditLog.findMany({
    where: {
      action: "DELETE",
      changedAt: { gte: since },
      oldData: { path: ["bulk"], equals: true },
    },
    select: {
      id: true,
      changedById: true,
      changedBy: { select: { fullName: true } },
      tableName: true,
      oldData: true,
      changedAt: true,
    },
  });

  const candidates: AnomalyCandidate[] = [];
  for (const r of rows) {
    const od = (r.oldData ?? {}) as { count?: number; where?: unknown };
    const count = Number(od.count ?? 0);
    if (count < BULK_DELETE_THRESHOLD) continue;
    candidates.push({
      type: "BULK_DELETE",
      severity: count >= 100 ? "CRITICAL" : "WARNING",
      employeeId: r.changedById,
      dedupKey: `BULK_DELETE|${r.id}`,
      title: `Bulk delete ${count} bản ghi từ ${r.tableName}`,
      description: `${r.changedBy?.fullName ?? "User"} đã xoá ${count} bản ghi cùng lúc khỏi bảng ${r.tableName}.`,
      metadata: { tableName: r.tableName, count, where: od.where },
      auditLogId: r.id,
    });
  }
  return candidates;
}

// ── Detector 4: TimeLog vượt estimate quá nhiều ─────────────────────────────
async function detectTimelogOverEstimate(since: Date): Promise<AnomalyCandidate[]> {
  const logs = await prisma.timeLog.findMany({
    where: {
      createdAt: { gte: since },
      durationMinutes: { gt: 0 },
      task: { estimatedTime: { not: null, gt: 0 } },
    },
    select: {
      id: true,
      employeeId: true,
      durationMinutes: true,
      employee: { select: { fullName: true } },
      task: { select: { id: true, code: true, title: true, estimatedTime: true } },
    },
    take: 1000,
  });

  const candidates: AnomalyCandidate[] = [];
  for (const log of logs) {
    const est = log.task.estimatedTime ?? 0;
    if (est <= 0) continue;
    const ratio = log.durationMinutes / est;
    if (ratio < TIMELOG_OVER_ESTIMATE_RATIO) continue;
    candidates.push({
      type: "TIMELOG_OVER_ESTIMATE",
      severity: ratio >= 3.0 ? "WARNING" : "INFO",
      employeeId: log.employeeId,
      dedupKey: `TIMELOG_OVER_ESTIMATE|${log.id}`,
      title: `Task ${log.task.code}: ${log.durationMinutes}p (estimate ${est}p)`,
      description: `${log.employee?.fullName ?? "User"} log ${log.durationMinutes} phút trong khi task ${log.task.code} ("${log.task.title}") chỉ ước tính ${est} phút (${ratio.toFixed(1)}× estimate).`,
      metadata: {
        taskCode: log.task.code,
        durationMinutes: log.durationMinutes,
        estimatedMinutes: est,
        ratio: Number(ratio.toFixed(2)),
      },
    });
  }
  return candidates;
}

// ── Detector 5: Spike lỗi API (gợi ý brute force hoặc lỗi hệ thống) ────────
async function detectFailedApiSpike(since: Date): Promise<AnomalyCandidate[]> {
  // Group by (employeeId, hour bucket)
  const rows = await prisma.$queryRaw<{ employeeId: number | null; bucket: Date; cnt: bigint }[]>`
    SELECT
      "employeeId",
      date_trunc('hour', "createdAt") AS bucket,
      COUNT(*)::bigint AS cnt
    FROM api_access_log
    WHERE "createdAt" >= ${since}
      AND "statusCode" >= 400
    GROUP BY 1, 2
    HAVING COUNT(*) >= ${FAILED_API_THRESHOLD_PER_HOUR}
  `;

  const candidates: AnomalyCandidate[] = [];
  for (const r of rows) {
    if (r.employeeId === null) continue;
    const cnt = Number(r.cnt);
    const bucketIso = new Date(r.bucket).toISOString();
    candidates.push({
      type: "FAILED_API_SPIKE",
      severity: cnt >= 100 ? "CRITICAL" : "WARNING",
      employeeId: r.employeeId,
      dedupKey: `FAILED_API_SPIKE|${r.employeeId}|${bucketIso.slice(0, 13)}`, // YYYY-MM-DDTHH
      title: `${cnt} lỗi API trong 1 giờ`,
      description: `User #${r.employeeId} có ${cnt} request API trả lỗi (4xx/5xx) trong khung giờ ${bucketIso}.`,
      metadata: { count: cnt, bucket: bucketIso },
    });
  }
  return candidates;
}

// ── Orchestrator ───────────────────────────────────────────────────────────
export interface AnomalyDetectionResult {
  candidates: number;
  created: number;
  skipped: number;
  byType: Record<string, number>;
}

/**
 * Quét các sự kiện gần đây và tạo AnomalyAlert mới (idempotent qua dedupKey).
 *
 * @param hours khoảng thời gian quét ngược (default 24 giờ)
 */
export async function runAnomalyDetection(hours = 24): Promise<AnomalyDetectionResult> {
  const since = new Date(Date.now() - hours * 3600_000);

  const allResults = await Promise.all([
    detectUnusualIp(since).catch((e) => { console.error("[anomaly] unusual_ip:", e); return []; }),
    detectOffHoursVault(since).catch((e) => { console.error("[anomaly] off_hours_vault:", e); return []; }),
    detectBulkDelete(since).catch((e) => { console.error("[anomaly] bulk_delete:", e); return []; }),
    detectTimelogOverEstimate(since).catch((e) => { console.error("[anomaly] timelog_over_estimate:", e); return []; }),
    detectFailedApiSpike(since).catch((e) => { console.error("[anomaly] failed_api_spike:", e); return []; }),
  ]);
  const candidates = allResults.flat();

  let created = 0;
  let skipped = 0;
  const byType: Record<string, number> = {};

  for (const c of candidates) {
    try {
      // Dùng createMany với skipDuplicates không work vì dedupKey unique;
      // dùng upsert nhưng "update: {}" để không ghi đè cái cũ.
      const result = await prisma.anomalyAlert.upsert({
        where: { dedupKey: c.dedupKey },
        update: {}, // no-op — giữ alert đầu tiên
        create: {
          type: c.type,
          severity: c.severity,
          employeeId: c.employeeId,
          dedupKey: c.dedupKey,
          title: c.title,
          description: c.description,
          metadata: (c.metadata ?? null) as Prisma.InputJsonValue,
          auditLogId: c.auditLogId ?? null,
          sessionId: c.sessionId ?? null,
          apiAccessLogId: c.apiAccessLogId ?? null,
        },
        select: { id: true, createdAt: true },
      });
      // Hơi khó phân biệt new vs existing trong upsert — kiểm tra createdAt mới (~1s)
      const isNew = Date.now() - result.createdAt.getTime() < 2000;
      if (isNew) {
        created++;
        byType[c.type] = (byType[c.type] ?? 0) + 1;
      } else {
        skipped++;
      }
    } catch (e) {
      console.error("[anomaly] upsert failed:", e);
    }
  }

  return { candidates: candidates.length, created, skipped, byType };
}
