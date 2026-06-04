import { prisma } from "@/lib/prisma";
import { type KpiScore, INSUFFICIENT, confidenceFromSample, clamp, round1 } from "./types";

const MIN_SAMPLES = 3;
const EXCLUDED_TYPES = ["LEARNING", "MEETING", "ADMIN"] as const;

function median(nums: number[]): number {
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function efficiencyToScore(eff: number): number {
  if (eff >= 1.2) return 10;
  if (eff >= 1.0) return 8 + (eff - 1.0) * 10;
  if (eff >= 0.75) return 6 + (eff - 0.75) * 8;
  if (eff >= 0.5) return 4 + (eff - 0.5) * 8;
  if (eff >= 0.33) return 2 + (eff - 0.33) * 12;
  return clamp(eff * 6, 0, 2);
}

export async function computeSpeedScore(
  orgId: string,
  empId: number,
  start: Date,
  end: Date,
): Promise<KpiScore> {
  const tasks = await prisma.task.findMany({
    where: {
      organizationId: orgId,
      assignedToId: empId,
      status: "DONE",
      dateCompleted: { gte: start, lt: end },
      estimatedTime: { gt: 0 },
      actualTimeTotal: { gt: 0 },
      taskType: { notIn: [...EXCLUDED_TYPES] },
    },
    select: { estimatedTime: true, actualTimeTotal: true },
  });

  if (tasks.length < MIN_SAMPLES) {
    return {
      ...INSUFFICIENT,
      sampleSize: tasks.length,
      reason: `Chỉ có ${tasks.length} task hoàn thành có estimate (cần ≥${MIN_SAMPLES})`,
    };
  }

  const efficiencies = tasks.map(t => (t.estimatedTime ?? 0) / t.actualTimeTotal);
  const medEff = median(efficiencies);
  const score = round1(clamp(efficiencyToScore(medEff)));

  return {
    score,
    confidence: confidenceFromSample(tasks.length),
    sampleSize: tasks.length,
    reason: `Median efficiency ${medEff.toFixed(2)}× estimate trên ${tasks.length} task`,
    details: { medianEfficiency: round1(medEff), tasksAnalyzed: tasks.length },
  };
}
