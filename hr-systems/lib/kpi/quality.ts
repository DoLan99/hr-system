import { prisma } from "@/lib/prisma";
import { type KpiScore, INSUFFICIENT, confidenceFromSample, clamp, round1 } from "./types";

const MIN_SAMPLES = 5;
const APPROVED_STATUSES = ["APPROVED", "AUTO_APPROVED"] as const;

function approvalPctToScore(pct: number): number {
  if (pct >= 95) return 10;
  if (pct >= 85) return 8 + ((pct - 85) / 10) * 2;
  if (pct >= 75) return 6 + ((pct - 75) / 10) * 2;
  if (pct >= 60) return 4 + ((pct - 60) / 15) * 2;
  if (pct >= 40) return 2 + ((pct - 40) / 20) * 2;
  return clamp((pct / 40) * 2, 0, 2);
}

export async function computeQualityScore(
  orgId: string,
  empId: number,
  start: Date,
  end: Date,
): Promise<KpiScore> {
  const logs = await prisma.timeLog.findMany({
    where: { organizationId: orgId, employeeId: empId, date: { gte: start, lt: end } },
    select: { approvalStatus: true, rating: true },
  });

  const total = logs.length;
  if (total < MIN_SAMPLES) {
    return {
      ...INSUFFICIENT,
      sampleSize: total,
      reason: `Chỉ có ${total} time log (cần ≥${MIN_SAMPLES})`,
    };
  }

  const approved = logs.filter(l => APPROVED_STATUSES.includes(l.approvalStatus as any)).length;
  const approvalPct = (approved / total) * 100;
  const approvalScore = approvalPctToScore(approvalPct);

  const ratings = logs.map(l => l.rating).filter((r): r is number => typeof r === "number" && r > 0);
  let finalScore: number;
  let detail: string;

  if (ratings.length >= 3) {
    const avgRating = ratings.reduce((s, r) => s + r, 0) / ratings.length;
    const ratingScore = clamp(avgRating * 2);
    finalScore = 0.5 * approvalScore + 0.5 * ratingScore;
    detail = `Approval ${approvalPct.toFixed(0)}% + avg rating ${avgRating.toFixed(1)}/5`;
  } else {
    finalScore = approvalScore;
    detail = `Approval ${approvalPct.toFixed(0)}% (${approved}/${total} logs duyệt)`;
  }

  return {
    score: round1(clamp(finalScore)),
    confidence: confidenceFromSample(total),
    sampleSize: total,
    reason: detail,
    details: {
      approvalPct: round1(approvalPct),
      approvedLogs: approved,
      totalLogs: total,
      ratingsCount: ratings.length,
    },
  };
}
