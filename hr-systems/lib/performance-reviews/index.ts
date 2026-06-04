import { prisma } from "@/lib/prisma";
import { computeKpiSuggestion, type KpiSuggestion } from "@/lib/kpi";

export interface PeriodSpec {
  type: "QUARTERLY" | "ANNUAL" | "CUSTOM";
  start: Date;
  end: Date;
}

/**
 * Compute the period KPI snapshot for an employee.
 * Averages the monthly Auto-KPI suggestions across the period to give a single snapshot.
 */
export async function snapshotKpiForPeriod(
  orgId: string,
  employeeId: number,
  period: PeriodSpec,
): Promise<KpiSuggestion> {
  const months: { month: number; year: number }[] = [];
  const cursor = new Date(period.start.getFullYear(), period.start.getMonth(), 1);
  const last = new Date(period.end.getFullYear(), period.end.getMonth(), 1);
  while (cursor <= last) {
    months.push({ month: cursor.getMonth() + 1, year: cursor.getFullYear() });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  if (months.length === 0) {
    months.push({ month: period.end.getMonth() + 1, year: period.end.getFullYear() });
  }

  const monthly = await Promise.all(
    months.map(m => computeKpiSuggestion(orgId, employeeId, m.month, m.year)),
  );

  const KEYS = ["scoreWorkSpeed", "scoreQuality", "scoreLearning", "scoreDeadlines", "scoreInitiative"] as const;
  const agg: Record<string, { sum: number; n: number; reasons: string[]; sample: number }> = {};
  for (const k of KEYS) agg[k] = { sum: 0, n: 0, reasons: [], sample: 0 };

  for (const m of monthly) {
    for (const k of KEYS) {
      const s = m[k];
      if (s.score != null) {
        agg[k].sum += s.score;
        agg[k].n += 1;
        agg[k].sample += s.sampleSize;
        if (s.reason && agg[k].reasons.length < 3) agg[k].reasons.push(s.reason);
      }
    }
  }

  const result: KpiSuggestion = {
    scoreWorkSpeed: makeScore(agg.scoreWorkSpeed, months.length),
    scoreQuality: makeScore(agg.scoreQuality, months.length),
    scoreLearning: makeScore(agg.scoreLearning, months.length),
    scoreDeadlines: makeScore(agg.scoreDeadlines, months.length),
    scoreInitiative: makeScore(agg.scoreInitiative, months.length),
    computedAt: new Date().toISOString(),
  };
  return result;
}

function makeScore(a: { sum: number; n: number; reasons: string[]; sample: number }, totalMonths: number): KpiSuggestion["scoreWorkSpeed"] {
  if (a.n === 0) {
    return { score: null, confidence: "low", sampleSize: 0, reason: "Không đủ data trong kỳ" };
  }
  const avg = Math.round((a.sum / a.n) * 10) / 10;
  const conf = a.n === totalMonths && a.sample >= 5 ? "high" : a.n >= Math.ceil(totalMonths / 2) ? "medium" : "low";
  return {
    score: avg,
    confidence: conf,
    sampleSize: a.sample,
    reason: a.reasons.join("; "),
  };
}

/**
 * Create PerformanceReview rows for all ACTIVE employees in the cycle.
 * Idempotent: skips employees who already have a review row for this cycle.
 */
export async function seedReviewsForCycle(orgId: string, cycleId: number, period: PeriodSpec): Promise<number> {
  const employees = await prisma.employee.findMany({
    where: { organizationId: orgId, status: "ACTIVE" },
    select: { id: true },
  });

  const existing = await prisma.performanceReview.findMany({
    where: { organizationId: orgId, cycleId },
    select: { employeeId: true },
  });
  const existingSet = new Set(existing.map(e => e.employeeId));

  let created = 0;
  for (const emp of employees) {
    if (existingSet.has(emp.id)) continue;
    const snapshot = await snapshotKpiForPeriod(orgId, emp.id, period);
    await prisma.performanceReview.create({
      data: {
        organizationId: orgId,
        cycleId,
        employeeId: emp.id,
        kpiSnapshot: snapshot as any,
        status: "PENDING",
      },
    });
    created += 1;
  }
  return created;
}

export function periodLabel(type: string, year: number, periodMonth?: number | null): string {
  if (type === "QUARTERLY" && periodMonth) {
    const q = Math.ceil(periodMonth / 3);
    return `Q${q} ${year}`;
  }
  if (type === "ANNUAL") return `Năm ${year}`;
  return `Custom ${year}`;
}

export function quarterDates(year: number, quarter: 1 | 2 | 3 | 4): { start: Date; end: Date } {
  const startMonth = (quarter - 1) * 3;
  const start = new Date(year, startMonth, 1);
  const end = new Date(year, startMonth + 3, 0, 23, 59, 59);
  return { start, end };
}

export function annualDates(year: number): { start: Date; end: Date } {
  return {
    start: new Date(year, 0, 1),
    end: new Date(year, 11, 31, 23, 59, 59),
  };
}
