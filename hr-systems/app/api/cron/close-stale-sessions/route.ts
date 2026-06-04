import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCronAuth } from "@/lib/cron-auth";

const STALE_HOURS = 8; // JWT maxAge cũng 8h — sau ngần đó không activity → coi như timeout

/**
 * GET /api/cron/close-stale-sessions
 *
 * Đóng các UserSession mở (logoutAt = null) mà không có activity trong N giờ.
 * User có thể đóng tab/tắt máy mà không signOut → session sẽ "treo" mãi
 * trong DB. Job này dọn dẹp, đánh dấu logoutReason = TIMEOUT.
 *
 * Idempotent (dùng updateMany với điều kiện chính xác).
 */
export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const cutoff = new Date(Date.now() - STALE_HOURS * 3600_000);
    const now = new Date();

    const result = await prisma.userSession.updateMany({
      where: {
        logoutAt: null,
        lastActivityAt: { lt: cutoff },
      },
      data: {
        logoutAt: now,
        logoutReason: "TIMEOUT",
      },
    });

    return NextResponse.json({ ok: true, closed: result.count, staleHours: STALE_HOURS });
  } catch (err) {
    console.error("[cron/close-stale-sessions] failed:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
