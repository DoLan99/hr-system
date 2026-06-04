export type Confidence = "low" | "medium" | "high";

export interface KpiScore {
  score: number | null;
  confidence: Confidence;
  sampleSize: number;
  reason: string;
  details?: Record<string, number | string | null>;
}

export interface KpiSuggestion {
  scoreWorkSpeed: KpiScore;
  scoreQuality: KpiScore;
  scoreLearning: KpiScore;
  scoreDeadlines: KpiScore;
  scoreInitiative: KpiScore;
  computedAt: string;
}

export const INSUFFICIENT: KpiScore = {
  score: null,
  confidence: "low",
  sampleSize: 0,
  reason: "Không đủ dữ liệu",
};

export function confidenceFromSample(n: number, minMedium = 5, minHigh = 10): Confidence {
  if (n >= minHigh) return "high";
  if (n >= minMedium) return "medium";
  return "low";
}

export function clamp(v: number, min = 0, max = 10): number {
  return Math.max(min, Math.min(max, v));
}

export function round1(v: number): number {
  return Math.round(v * 10) / 10;
}
