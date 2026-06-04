import { prisma } from "@/lib/prisma";
import { type KpiScore, confidenceFromSample, clamp, round1 } from "./types";

const APPROVED_STATUSES = ["APPROVED", "AUTO_APPROVED"] as const;

export async function computeInitiativeScore(
  orgId: string,
  empId: number,
  start: Date,
  end: Date,
): Promise<KpiScore> {
  const [approvedSuggestions, researchAgg, totalAgg] = await Promise.all([
    prisma.templateSuggestion.count({
      where: {
        organizationId: orgId,
        employeeId: empId,
        status: "APPROVED",
        reviewedAt: { gte: start, lt: end },
      },
    }),
    prisma.timeLog.aggregate({
      where: {
        organizationId: orgId,
        employeeId: empId,
        date: { gte: start, lt: end },
        approvalStatus: { in: [...APPROVED_STATUSES] },
        task: { taskType: "NEW_RESEARCH" },
      },
      _sum: { creditedMinutes: true, durationMinutes: true },
    }),
    prisma.timeLog.aggregate({
      where: {
        organizationId: orgId,
        employeeId: empId,
        date: { gte: start, lt: end },
        approvalStatus: { in: [...APPROVED_STATUSES] },
      },
      _sum: { creditedMinutes: true, durationMinutes: true },
    }),
  ]);

  const researchMinutes = researchAgg._sum.creditedMinutes ?? researchAgg._sum.durationMinutes ?? 0;
  const totalMinutes = totalAgg._sum.creditedMinutes ?? totalAgg._sum.durationMinutes ?? 0;
  const researchPct = totalMinutes > 0 ? (researchMinutes / totalMinutes) * 100 : 0;

  let score = 5;
  const reasons: string[] = [];

  const suggestionBonus = Math.min(5, approvedSuggestions * 3);
  if (suggestionBonus > 0) {
    score += suggestionBonus;
    reasons.push(`${approvedSuggestions} đề xuất template được duyệt (+${suggestionBonus})`);
  }

  if (researchPct >= 10) {
    score += 2;
    reasons.push(`${researchPct.toFixed(0)}% thời gian R&D (+2)`);
  } else if (researchPct >= 5) {
    score += 1;
    reasons.push(`${researchPct.toFixed(0)}% thời gian R&D (+1)`);
  }

  if (reasons.length === 0) reasons.push("Chưa có đề xuất hoặc R&D đáng kể (base 5đ)");

  const finalScore = round1(clamp(score));
  const sampleSize = approvedSuggestions + Math.round(researchMinutes / 60);

  return {
    score: finalScore,
    confidence: confidenceFromSample(sampleSize, 2, 5),
    sampleSize,
    reason: reasons.join("; "),
    details: {
      approvedSuggestions,
      researchHours: round1(researchMinutes / 60),
      researchPct: round1(researchPct),
    },
  };
}
