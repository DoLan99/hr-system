import { rawPrisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface PageViewDelta {
  path: string;
  durationSec: number;
}

export interface ActivityDelta {
  employeeId: number;
  organizationId: string;
  sessionId: string;
  date: Date; // ngày (sẽ chuẩn hoá về 00:00:00)
  activeSeconds: number;
  idleSeconds: number;
  pageViews: PageViewDelta[];
  occurredAt: Date; // mốc thời gian của heartbeat
}

/**
 * Gộp 2 mảng pageViews theo path (cộng durationSec).
 */
function mergePageViews(
  existing: PageViewDelta[],
  incoming: PageViewDelta[],
): PageViewDelta[] {
  const map = new Map<string, number>();
  for (const pv of existing) {
    map.set(pv.path, (map.get(pv.path) ?? 0) + (pv.durationSec || 0));
  }
  for (const pv of incoming) {
    if (!pv.path) continue;
    map.set(pv.path, (map.get(pv.path) ?? 0) + (pv.durationSec || 0));
  }
  return Array.from(map.entries()).map(([path, durationSec]) => ({ path, durationSec }));
}

function normalizeDate(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

/**
 * Upsert UserActivity cho (sessionId, date). Cộng dồn delta.
 * Race-safe: dùng transaction findFirst + create/update.
 *
 * Lưu ý: vì sessionId là FK NOT NULL tới UserSession, caller phải đảm bảo
 * session tồn tại (withContext đã đảm bảo điều này).
 */
export async function applyActivityDelta(delta: ActivityDelta): Promise<void> {
  const date = normalizeDate(delta.date);

  await rawPrisma.$transaction(async (tx) => {
    const existing = await tx.userActivity.findUnique({
      where: { sessionId_date: { sessionId: delta.sessionId, date } },
    });

    if (!existing) {
      await tx.userActivity.create({
        data: {
          organizationId: delta.organizationId,
          employeeId: delta.employeeId,
          sessionId: delta.sessionId,
          date,
          activeSeconds: Math.max(0, delta.activeSeconds),
          idleSeconds: Math.max(0, delta.idleSeconds),
          pageViews: delta.pageViews as unknown as Prisma.InputJsonValue,
          firstActivityAt: delta.occurredAt,
          lastActivityAt: delta.occurredAt,
        },
      });
      return;
    }

    const existingPV = Array.isArray(existing.pageViews)
      ? (existing.pageViews as unknown as PageViewDelta[])
      : [];

    await tx.userActivity.update({
      where: { id: existing.id },
      data: {
        activeSeconds: { increment: Math.max(0, delta.activeSeconds) },
        idleSeconds: { increment: Math.max(0, delta.idleSeconds) },
        pageViews: mergePageViews(existingPV, delta.pageViews) as unknown as Prisma.InputJsonValue,
        lastActivityAt:
          delta.occurredAt > existing.lastActivityAt ? delta.occurredAt : existing.lastActivityAt,
      },
    });
  });
}
