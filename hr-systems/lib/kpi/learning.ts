import { prisma } from "@/lib/prisma";
import { type KpiScore, INSUFFICIENT, confidenceFromSample, clamp, round1 } from "./types";

const APPROVED_STATUSES = ["APPROVED", "AUTO_APPROVED"] as const;
const MIN_TOTAL_HOURS = 10;

function pctToScore(pct: number): number {
  if (pct >= 15) return 10;
  if (pct >= 10) return 8 + ((pct - 10) / 5) * 2;
  if (pct >= 7) return 6 + ((pct - 7) / 3) * 2;
  if (pct >= 4) return 4 + ((pct - 4) / 3) * 2;
  if (pct >= 2) return 2 + ((pct - 2) / 2) * 2;
  return clamp(pct, 0, 2);
}

export async function computeLearningScore(
  orgId: string,
  empId: number,
  start: Date,
  end: Date,
): Promise<KpiScore> {
  const totalAgg = await prisma.timeLog.aggregate({
    where: {
      organizationId: orgId,
      employeeId: empId,
      date: { gte: start, lt: end },
      approvalStatus: { in: [...APPROVED_STATUSES] },
    },
    _sum: { creditedMinutes: true, durationMinutes: true },
  });
  const totalMinutes = totalAgg._sum.creditedMinutes ?? totalAgg._sum.durationMinutes ?? 0;
  const totalHours = totalMinutes / 60;

  if (totalHours < MIN_TOTAL_HOURS) {
    return {
      ...INSUFFICIENT,
      sampleSize: Math.round(totalHours),
      reason: `Chỉ ${totalHours.toFixed(1)}h làm việc (cần ≥${MIN_TOTAL_HOURS}h)`,
    };
  }

  const learnLogs = await prisma.timeLog.findMany({
    where: {
      organizationId: orgId,
      employeeId: empId,
      date: { gte: start, lt: end },
      approvalStatus: { in: [...APPROVED_STATUSES] },
      task: { taskType: "LEARNING" },
    },
    select: { creditedMinutes: true, durationMinutes: true },
  });
  const learnMinutes = learnLogs.reduce((s, l) => s + (l.creditedMinutes ?? l.durationMinutes ?? 0), 0);
  const learnHours = learnMinutes / 60;
  const pct = totalMinutes > 0 ? (learnMinutes / totalMinutes) * 100 : 0;

  return {
    score: round1(clamp(pctToScore(pct))),
    confidence: confidenceFromSample(Math.round(totalHours), 20, 80),
    sampleSize: Math.round(totalHours),
    reason: `${learnHours.toFixed(1)}h học / ${totalHours.toFixed(1)}h tổng = ${pct.toFixed(1)}%`,
    details: { learnHours: round1(learnHours), totalHours: round1(totalHours), pct: round1(pct) },
  };
}
