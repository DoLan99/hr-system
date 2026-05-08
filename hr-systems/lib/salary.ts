export const LEARN_TASK_IDS = ["2001", "2002"];

export interface SalaryInput {
  payType: string;
  hourlyRate: number | null;
  monthlySalary: number | null;
  bonusMPct: number;
  bonusAPct: number;
  bonusTPct: number;
  creditedMinutes: number;      // từ work_reports.creditedTime trong tháng
  missingApprovedMinutes: number; // từ missing_tasks approved trong tháng
  learnMinutes: number;          // creditedTime cho task 2001/2002
}

export interface SalaryResult {
  creditedHours: number;
  learnHours: number;
  salaryCalc: number;
  bonusCalc: number;
  totalCalc: number;
}

export function calcSalary(p: SalaryInput): SalaryResult {
  // Tổng giờ credited = work report + missing tasks approved
  const totalCreditedMin = p.creditedMinutes + p.missingApprovedMinutes;
  const creditedHours = totalCreditedMin / 60;
  const learnHours = p.learnMinutes / 60;

  let salaryCalc = 0;
  if (p.payType === "HOURLY" && p.hourlyRate) {
    salaryCalc = creditedHours * p.hourlyRate;
  } else if (p.payType === "MONTHLY" && p.monthlySalary) {
    salaryCalc = p.monthlySalary;
  }

  const totalBonusPct = p.bonusMPct + p.bonusAPct + p.bonusTPct;
  const bonusCalc = (salaryCalc * totalBonusPct) / 100;
  const totalCalc = salaryCalc + bonusCalc;

  return { creditedHours, learnHours, salaryCalc, bonusCalc, totalCalc };
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
