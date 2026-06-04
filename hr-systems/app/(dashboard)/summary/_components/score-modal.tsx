"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Star, Sparkles, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { SCORE_LABELS } from "@/lib/salary";

interface SummaryItem {
  id: number;
  employeeId: number;
  month: number;
  year: number;
  scoreWorkSpeed?: number | null;
  scoreQuality?: number | null;
  scoreLearning?: number | null;
  scoreDeadlines?: number | null;
  scoreInitiative?: number | null;
  totalScore?: number | null;
  employee: { fullName: string };
}

interface Props {
  summary: SummaryItem;
  onClose: () => void;
  onSaved: (item: any) => void;
}

type ScoreKey = "scoreWorkSpeed" | "scoreQuality" | "scoreLearning" | "scoreDeadlines" | "scoreInitiative";
const SCORE_KEYS: ScoreKey[] = ["scoreWorkSpeed", "scoreQuality", "scoreLearning", "scoreDeadlines", "scoreInitiative"];

interface KpiScore {
  score: number | null;
  confidence: "low" | "medium" | "high";
  sampleSize: number;
  reason: string;
}
type KpiSuggestion = Record<ScoreKey, KpiScore>;

function ConfidenceDot({ level }: { level: "low" | "medium" | "high" }) {
  const color = level === "high" ? "bg-green-500" : level === "medium" ? "bg-blue-500" : "bg-slate-300";
  return <span className={cn("inline-block w-1.5 h-1.5 rounded-full", color)} />;
}

function ScoreRow({
  label, value, suggested, onChange, onApply,
}: {
  label: string;
  value: number | null;
  suggested?: KpiScore;
  onChange: (v: number | null) => void;
  onApply: () => void;
}) {
  const hasSuggestion = suggested?.score != null;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-slate-700 dark:text-slate-300 flex-1">{label}</span>
        <div className="flex items-center gap-1">
          {[2, 4, 6, 8, 10].map(v => (
            <button
              key={v}
              type="button"
              onClick={() => onChange(value === v ? null : v)}
              className={cn(
                "w-8 h-8 rounded-lg text-xs font-bold border-2 transition",
                value !== null && value >= v
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-blue-400"
              )}
            >
              {v}
            </button>
          ))}
          <input
            type="number"
            min={0}
            max={10}
            step={0.5}
            value={value ?? ""}
            onChange={e => onChange(e.target.value === "" ? null : Number(e.target.value))}
            className="w-14 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded-lg text-xs text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ml-1"
            placeholder="0-10"
          />
        </div>
      </div>
      {suggested && (
        <div className="flex items-start gap-2 pl-1">
          <Sparkles className="w-3 h-3 mt-0.5 text-violet-500 shrink-0" />
          {hasSuggestion ? (
            <div className="flex-1 flex items-center justify-between gap-2 text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-violet-600 dark:text-violet-400">Gợi ý: {suggested.score!.toFixed(1)}</span>
                <ConfidenceDot level={suggested.confidence} />
                <span className="ml-1 italic">{suggested.reason}</span>
              </span>
              <button
                type="button"
                onClick={onApply}
                className="px-2 py-0.5 text-[11px] font-medium text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 dark:hover:bg-violet-900/40 rounded border border-violet-200 dark:border-violet-800 transition shrink-0"
              >
                Áp dụng
              </button>
            </div>
          ) : (
            <span className="text-[11px] text-slate-400 italic">{suggested.reason}</span>
          )}
        </div>
      )}
    </div>
  );
}

export function ScoreModal({ summary, onClose, onSaved }: Props) {
  const [scores, setScores] = useState<Record<ScoreKey, number | null>>({
    scoreWorkSpeed: summary.scoreWorkSpeed ?? null,
    scoreQuality: summary.scoreQuality ?? null,
    scoreLearning: summary.scoreLearning ?? null,
    scoreDeadlines: summary.scoreDeadlines ?? null,
    scoreInitiative: summary.scoreInitiative ?? null,
  });
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<KpiSuggestion | null>(null);
  const [suggestLoading, setSuggestLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchSuggestion() {
      setSuggestLoading(true);
      try {
        const res = await fetch(
          `/api/summary/kpi-suggest?month=${summary.month}&year=${summary.year}&employeeId=${summary.employeeId}`,
        );
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) setSuggestion(json.data);
      } finally {
        if (!cancelled) setSuggestLoading(false);
      }
    }
    fetchSuggestion();
    return () => { cancelled = true; };
  }, [summary.employeeId, summary.month, summary.year]);

  const avg = (() => {
    const vals = Object.values(scores).filter((v): v is number => v !== null);
    return vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
  })();

  function setScore(key: ScoreKey, val: number | null) {
    setScores(prev => ({ ...prev, [key]: val }));
  }

  function applyAllSuggested() {
    if (!suggestion) return;
    const next: Record<ScoreKey, number | null> = { ...scores };
    SCORE_KEYS.forEach(k => {
      const s = suggestion[k]?.score;
      if (s != null) next[k] = s;
    });
    setScores(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/summary/${summary.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scores),
      });
      const json = await res.json();
      if (res.ok) onSaved(json.data);
    } finally {
      setLoading(false);
    }
  }

  const hasAnySuggestion = suggestion && SCORE_KEYS.some(k => suggestion[k]?.score != null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Đánh giá hiệu suất</h2>
            <p className="text-xs text-slate-500">{summary.employee.fullName} · {String(summary.month).padStart(2, "0")}/{summary.year}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div className="flex items-start gap-2 px-3 py-2 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-lg">
            <Info className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 mt-0.5 shrink-0" />
            <div className="flex-1 text-[11px] text-violet-700 dark:text-violet-300">
              {suggestLoading ? "Đang tính gợi ý từ data Tasks + Time Logs…" : hasAnySuggestion
                ? "Gợi ý tự động dựa trên data thực tế. Bạn có thể áp dụng hoặc nhập điểm khác."
                : "Chưa đủ data để gợi ý. Nhập điểm thủ công."}
            </div>
            {hasAnySuggestion && (
              <button type="button" onClick={applyAllSuggested}
                className="px-2 py-0.5 text-[11px] font-medium text-violet-700 dark:text-violet-300 bg-white dark:bg-slate-900 hover:bg-violet-100 dark:hover:bg-violet-900/40 rounded border border-violet-300 dark:border-violet-700 transition">
                Áp dụng tất cả
              </button>
            )}
          </div>

          {SCORE_KEYS.map(key => (
            <ScoreRow
              key={key}
              label={SCORE_LABELS[key]}
              value={scores[key]}
              suggested={suggestion?.[key]}
              onChange={val => setScore(key, val)}
              onApply={() => {
                const s = suggestion?.[key]?.score;
                if (s != null) setScore(key, s);
              }}
            />
          ))}

          {avg !== null && (
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Star className="w-4 h-4 text-yellow-500" />
                Điểm trung bình
              </span>
              <span className={cn(
                "text-lg font-bold",
                avg >= 8 ? "text-green-600" : avg >= 6 ? "text-blue-600" : avg >= 4 ? "text-yellow-600" : "text-red-500"
              )}>
                {avg.toFixed(1)} / 10
              </span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition">
              Hủy
            </button>
            <button type="submit" disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition flex items-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Lưu điểm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
