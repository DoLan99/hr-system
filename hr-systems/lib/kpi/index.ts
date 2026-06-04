import { computeSpeedScore } from "./speed";
import { computeQualityScore } from "./quality";
import { computeDeadlineScore } from "./deadline";
import { computeLearningScore } from "./learning";
import { computeInitiativeScore } from "./initiative";
import type { KpiSuggestion } from "./types";

export * from "./types";

export async function computeKpiSuggestion(
  orgId: string,
  empId: number,
  month: number,
  year: number,
): Promise<KpiSuggestion> {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const [scoreWorkSpeed, scoreQuality, scoreDeadlines, scoreLearning, scoreInitiative] = await Promise.all([
    computeSpeedScore(orgId, empId, start, end),
    computeQualityScore(orgId, empId, start, end),
    computeDeadlineScore(orgId, empId, start, end),
    computeLearningScore(orgId, empId, start, end),
    computeInitiativeScore(orgId, empId, start, end),
  ]);

  return {
    scoreWorkSpeed,
    scoreQuality,
    scoreLearning,
    scoreDeadlines,
    scoreInitiative,
    computedAt: new Date().toISOString(),
  };
}
