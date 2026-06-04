import { NextRequest, NextResponse } from "next/server";
import { runAnomalyDetection } from "@/lib/anomaly-detection";
import { verifyCronAuth } from "@/lib/cron-auth";

/**
 * GET /api/cron/anomalies
 *
 * Endpoint do Vercel Cron gọi định kỳ. Quét sự kiện trong 2 giờ gần nhất
 * (cửa sổ chồng lấn nhẹ với chu kỳ 1 giờ để không sót khi cron chạy chậm)
 * và tạo AnomalyAlert mới. Idempotent qua dedupKey nên gọi nhiều lần
 * không tạo trùng.
 *
 * Yêu cầu header `Authorization: Bearer ${CRON_SECRET}`.
 */
export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await runAnomalyDetection(2);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron/anomalies] failed:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
