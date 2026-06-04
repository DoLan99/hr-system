import { prisma } from "@/lib/prisma";
import { type KpiScore, INSUFFICIENT, confidenceFromSample, clamp, round1 } from "./types";

const MIN_SAMPLES = 3;

export async function computeDeadlineScore(
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
      dueDate: { not: null },
    },
    select: { dueDate: true, dateCompleted: true },
  });

  if (tasks.length < MIN_SAMPLES) {
    return {
      ...INSUFFICIENT,
      sampleSize: tasks.length,
      reason: `Chỉ có ${tasks.length} task có deadline hoàn thành (cần ≥${MIN_SAMPLES})`,
    };
  }

  const onTime = tasks.filter(t => {
    if (!t.dueDate || !t.dateCompleted) return false;
    return t.dateCompleted.getTime() <= t.dueDate.getTime();
  }).length;

  const onTimePct = (onTime / tasks.length) * 100;
  const baseScore = onTimePct / 10;

  const openOverdue = await prisma.task.count({
    where: {
      organizationId: orgId,
      assignedToId: empId,
      isOverdue: true,
      status: { notIn: ["DONE", "CANCELLED"] },
    },
  });

  const penalty = Math.min(2, openOverdue * 0.5);
  const finalScore = clamp(baseScore - penalty);

  return {
    score: round1(finalScore),
    confidence: confidenceFromSample(tasks.length),
    sampleSize: tasks.length,
    reason: `${onTime}/${tasks.length} task đúng hạn (${onTimePct.toFixed(0)}%)${openOverdue > 0 ? ` − phạt ${penalty}đ do ${openOverdue} task quá hạn đang mở` : ""}`,
    details: {
      onTimePct: round1(onTimePct),
      onTime,
      totalCompleted: tasks.length,
      openOverdue,
      penalty,
    },
  };
}
