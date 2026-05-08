"use client";

import { useState } from "react";
import { X, Loader2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { SCORE_LABELS } from "@/lib/salary";

interface SummaryItem {
  id: number;
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

function ScoreInput({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-slate-700 flex-1">{label}</span>
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
                : "bg-white border-slate-200 text-slate-400 hover:border-blue-400"
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
          className="w-14 px-2 py-1 border border-slate-300 rounded-lg text-xs text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ml-1"
          placeholder="0-10"
        />
      </div>
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

  const avg = (() => {
    const vals = Object.values(scores).filter((v): v is number => v !== null);
    return vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
  })();

  function setScore(key: ScoreKey, val: number | null) {
    setScores(prev => ({ ...prev, [key]: val }));
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Đánh giá hiệu suất</h2>
            <p className="text-xs text-slate-500">{summary.employee.fullName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-3">
          <p className="text-xs text-slate-500 mb-3">Thang điểm 0–10. Nhấn ô để chọn nhanh hoặc nhập trực tiếp.</p>

          {SCORE_KEYS.map(key => (
            <ScoreInput
              key={key}
              label={SCORE_LABELS[key]}
              value={scores[key]}
              onChange={val => setScore(key, val)}
            />
          ))}

          {avg !== null && (
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
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
              className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition">
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
