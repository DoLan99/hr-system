import type { TaskType } from "@prisma/client";

// Task types đếm vào "learn hours" cho KPI learning_ability
export const LEARN_TASK_TYPES: TaskType[] = ["LEARNING"];

export interface SalaryInput {
  payType: string;
  hourlyRate: number | null;
  monthlySalary: number | null;
  bonusMPct: number;
  bonusAPct: number;
  bonusTPct: number;
  /** Tổng credited_minutes từ time_logs trong tháng (đã được duyệt: AUTO_APPROVED hoặc APPROVED) */
  creditedMinutes: number;
  /** Tổng duration cho task type LEARNING (vào learn_hours, không vào salary) */
  learnMinutes: number;
  /** Tổng credited_minutes của task billable=TRUE */
  billableMinutes?: number;
  /** Tổng tiền billable (€) — tính sẵn từ billable_minutes × rate */
  billableAmount?: number;
}

export interface SalaryResult {
  creditedHours: number;
  learnHours: number;
  billableHours: number;
  billableAmount: number;
  salaryCalc: number;
  bonusCalc: number;
  totalCalc: number;
}

export function calcSalary(p: SalaryInput): SalaryResult {
  const creditedHours = p.creditedMinutes / 60;
  const learnHours = p.learnMinutes / 60;
  const billableHours = (p.billableMinutes ?? 0) / 60;
  const billableAmount = p.billableAmount ?? 0;

  let salaryCalc = 0;
  if (p.payType === "HOURLY" && p.hourlyRate) {
    salaryCalc = creditedHours * p.hourlyRate;
  } else if (p.payType === "MONTHLY" && p.monthlySalary) {
    salaryCalc = p.monthlySalary;
  }

  const totalBonusPct = p.bonusMPct + p.bonusAPct + p.bonusTPct;
  const bonusCalc = (salaryCalc * totalBonusPct) / 100;
  const totalCalc = salaryCalc + bonusCalc;

  return { creditedHours, learnHours, billableHours, billableAmount, salaryCalc, bonusCalc, totalCalc };
}

export function calcTotalScore(scores: {
  scoreWorkSpeed?: number | null;
  scoreQuality?: number | null;
  scoreLearning?: number | null;
  scoreDeadlines?: number | null;
  scoreInitiative?: number | null;
}): number | null {
  const vals = [
    scores.scoreWorkSpeed,
    scores.scoreQuality,
    scores.scoreLearning,
    scores.scoreDeadlines,
    scores.scoreInitiative,
  ].filter((v): v is number => v !== null && v !== undefined);

  if (vals.length === 0) return null;
  return Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 100) / 100;
}

export const SCORE_LABELS: Record<string, string> = {
  scoreWorkSpeed: "Tốc độ làm việc",
  scoreQuality: "Chất lượng",
  scoreLearning: "Học hỏi & phát triển",
  scoreDeadlines: "Hoàn thành đúng hạn",
  scoreInitiative: "Chủ động & sáng tạo",
};
