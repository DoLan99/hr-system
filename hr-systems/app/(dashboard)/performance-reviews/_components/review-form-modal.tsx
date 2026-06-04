"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Sparkles, User, Crown, CheckCircle2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { SCORE_LABELS } from "@/lib/salary";

type ScoreKey = "scoreWorkSpeed" | "scoreQuality" | "scoreLearning" | "scoreDeadlines" | "scoreInitiative";
const SCORE_KEYS: ScoreKey[] = ["scoreWorkSpeed", "scoreQuality", "scoreLearning", "scoreDeadlines", "scoreInitiative"];

interface KpiScoreSnapshot {
  score: number | null;
  confidence: string;
  reason: string;
}
type KpiSnapshot = Record<ScoreKey, KpiScoreSnapshot> & { computedAt?: string };

interface Review {
  id: number;
  status: string;
  employeeId: number;
  kpiSnapshot: KpiSnapshot | null;
  selfScoreWorkSpeed: string | null; selfScoreQuality: string | null; selfScoreLearning: string | null;
  selfScoreDeadlines: string | null; selfScoreInitiative: string | null;
  selfTotalScore: string | null;
  selfHighlights: string | null; selfChallenges: string | null; selfGoalsNext: string | null;
  selfSubmittedAt: string | null;
  mgrScoreWorkSpeed: string | null; mgrScoreQuality: string | null; mgrScoreLearning: string | null;
  mgrScoreDeadlines: string | null; mgrScoreInitiative: string | null;
  mgrTotalScore: string | null;
  mgrStrengths: string | null; mgrAreasToImprove: string | null; mgrActionItems: string | null;
  recommendedSalaryAdjustPct: string | null; recommendedPromotion: string | null;
  mgrSubmittedAt: string | null; finalizedAt: string | null;
  cycle: { id: number; name: string; status: string; periodStart: string; periodEnd: string };
  employee: { id: number; fullName: string; department: string | null };
  mgrReviewer: { fullName: string } | null;
}

const n = (v: string | number | null | undefined): number | null => {
  if (v === null || v === undefined || v === "") return null;
  return typeof v === "number" ? v : Number(v);
};

function ScoreSlider({ value, onChange, disabled }: { value: number | null; onChange: (v: number | null) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center gap-1">
      {[2, 4, 6, 8, 10].map(v => (
        <button
          key={v}
          type="button"
          disabled={disabled}
          onClick={() => onChange(value === v ? null : v)}
          className={cn(
            "w-7 h-7 rounded-md text-[10px] font-bold border-2 transition",
            value !== null && value >= v
              ? "bg-blue-600 border-blue-600 text-white"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-blue-400",
            disabled && "opacity-60 cursor-not-allowed",
          )}
        >
          {v}
        </button>
      ))}
      <input
        type="number"
        min={0} max={10} step={0.5}
        value={value ?? ""}
        disabled={disabled}
        onChange={e => onChange(e.target.value === "" ? null : Number(e.target.value))}
        className="w-12 px-1 py-1 border border-slate-300 dark:border-slate-600 rounded text-[11px] text-center bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder="–"
      />
    </div>
  );
}

export function ReviewFormModal({
  reviewId, isManager, currentEmployeeId, onClose, onSaved,
}: {
  reviewId: number;
  isManager: boolean;
  currentEmployeeId: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selfScores, setSelfScores] = useState<Record<ScoreKey, number | null>>({} as any);
  const [selfText, setSelfText] = useState({ selfHighlights: "", selfChallenges: "", selfGoalsNext: "" });

  const [mgrScores, setMgrScores] = useState<Record<ScoreKey, number | null>>({} as any);
  const [mgrText, setMgrText] = useState({ mgrStrengths: "", mgrAreasToImprove: "", mgrActionItems: "" });
  const [salaryAdjust, setSalaryAdjust] = useState<number | null>(null);
  const [promotion, setPromotion] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/performance-reviews/${reviewId}`)
      .then(r => r.json())
      .then(json => {
        if (cancelled) return;
        const r: Review = json.data;
        setReview(r);
        setSelfScores({
          scoreWorkSpeed: n(r.selfScoreWorkSpeed), scoreQuality: n(r.selfScoreQuality),
          scoreLearning: n(r.selfScoreLearning), scoreDeadlines: n(r.selfScoreDeadlines),
          scoreInitiative: n(r.selfScoreInitiative),
        });
        setSelfText({
          selfHighlights: r.selfHighlights ?? "", selfChallenges: r.selfChallenges ?? "", selfGoalsNext: r.selfGoalsNext ?? "",
        });
        setMgrScores({
          scoreWorkSpeed: n(r.mgrScoreWorkSpeed), scoreQuality: n(r.mgrScoreQuality),
          scoreLearning: n(r.mgrScoreLearning), scoreDeadlines: n(r.mgrScoreDeadlines),
          scoreInitiative: n(r.mgrScoreInitiative),
        });
        setMgrText({
          mgrStrengths: r.mgrStrengths ?? "", mgrAreasToImprove: r.mgrAreasToImprove ?? "", mgrActionItems: r.mgrActionItems ?? "",
        });
        setSalaryAdjust(n(r.recommendedSalaryAdjustPct));
        setPromotion(r.recommendedPromotion ?? "");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reviewId]);

  if (loading || !review) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-8 flex items-center gap-2 text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Đang tải…
        </div>
      </div>
    );
  }

  const isOwner = review.employeeId === currentEmployeeId;
  const cycleClosed = review.cycle.status === "CLOSED";
  const isCompleted = review.status === "COMPLETED";

  const canEditSelf = isOwner && !isCompleted && !cycleClosed;
  const canEditMgr = isManager && !cycleClosed;

  function applyKpi(key: ScoreKey, target: "self" | "mgr") {
    const v = review!.kpiSnapshot?.[key]?.score;
    if (v == null) return;
    if (target === "self") setSelfScores(prev => ({ ...prev, [key]: v }));
    else setMgrScores(prev => ({ ...prev, [key]: v }));
  }

  function applyAllKpi(target: "self" | "mgr") {
    if (!review!.kpiSnapshot) return;
    const updates: Record<string, number | null> = {};
    SCORE_KEYS.forEach(k => {
      const v = review!.kpiSnapshot![k]?.score;
      if (v != null) updates[k] = v;
    });
    if (target === "self") setSelfScores(prev => ({ ...prev, ...updates }));
    else setMgrScores(prev => ({ ...prev, ...updates }));
  }

  async function save(opts: { submitSelf?: boolean; finalize?: boolean } = {}) {
    setSaving(true);
    try {
      const body: any = {};
      if (canEditSelf) {
        body.selfScoreWorkSpeed = selfScores.scoreWorkSpeed;
        body.selfScoreQuality = selfScores.scoreQuality;
        body.selfScoreLearning = selfScores.scoreLearning;
        body.selfScoreDeadlines = selfScores.scoreDeadlines;
        body.selfScoreInitiative = selfScores.scoreInitiative;
        Object.assign(body, selfText);
        if (opts.submitSelf) body.submitSelf = true;
      }
      if (canEditMgr) {
        body.mgrScoreWorkSpeed = mgrScores.scoreWorkSpeed;
        body.mgrScoreQuality = mgrScores.scoreQuality;
        body.mgrScoreLearning = mgrScores.scoreLearning;
        body.mgrScoreDeadlines = mgrScores.scoreDeadlines;
        body.mgrScoreInitiative = mgrScores.scoreInitiative;
        Object.assign(body, mgrText);
        body.recommendedSalaryAdjustPct = salaryAdjust;
        body.recommendedPromotion = promotion;
        if (opts.finalize) body.finalize = true;
      }

      const res = await fetch(`/api/performance-reviews/${reviewId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        onSaved();
        if (opts.submitSelf || opts.finalize) onClose();
      }
    } finally {
      setSaving(false);
    }
  }

  const selfAvg = (() => {
    const vals = SCORE_KEYS.map(k => selfScores[k]).filter((v): v is number => v != null);
    return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
  })();
  const mgrAvg = (() => {
    const vals = SCORE_KEYS.map(k => mgrScores[k]).filter((v): v is number => v != null);
    return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-4xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-slate-900 z-10 flex items-center justify-between px-6 py-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {review.employee.fullName}
              <span className="ml-2 text-xs font-normal text-slate-500">· {review.cycle.name}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isCompleted && review.finalizedAt && (
                <span className="text-green-600 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Đã hoàn tất bởi {review.mgrReviewer?.fullName}
                </span>
              )}
              {!isCompleted && review.status === "SELF_DONE" && "Đã tự đánh giá, chờ manager"}
              {!isCompleted && review.status === "PENDING" && "Chờ tự đánh giá"}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Scores triple column */}
          <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Điểm 5 tiêu chí</p>
              <div className="flex gap-2">
                {canEditSelf && review.kpiSnapshot && (
                  <button type="button" onClick={() => applyAllKpi("self")}
                    className="text-[11px] px-2 py-1 rounded bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 hover:bg-violet-200 transition">
                    Self ← Auto-KPI
                  </button>
                )}
                {canEditMgr && review.kpiSnapshot && (
                  <button type="button" onClick={() => applyAllKpi("mgr")}
                    className="text-[11px] px-2 py-1 rounded bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 hover:bg-violet-200 transition">
                    Manager ← Auto-KPI
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-2 font-medium">Tiêu chí</th>
                    <th className="text-center py-2 font-medium min-w-[140px]">
                      <span className="inline-flex items-center gap-1"><Sparkles className="w-3 h-3 text-violet-500" /> Auto-KPI</span>
                    </th>
                    <th className="text-center py-2 font-medium min-w-[200px]">
                      <span className="inline-flex items-center gap-1"><User className="w-3 h-3 text-blue-500" /> Self</span>
                    </th>
                    <th className="text-center py-2 font-medium min-w-[200px]">
                      <span className="inline-flex items-center gap-1"><Crown className="w-3 h-3 text-yellow-500" /> Manager (cuối)</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {SCORE_KEYS.map(k => {
                    const auto = review.kpiSnapshot?.[k];
                    return (
                      <tr key={k}>
                        <td className="py-2 pr-3 text-slate-700 dark:text-slate-300">{SCORE_LABELS[k]}</td>
                        <td className="py-2 text-center">
                          {auto?.score != null ? (
                            <button
                              type="button"
                              onClick={() => canEditMgr ? applyKpi(k, "mgr") : canEditSelf ? applyKpi(k, "self") : undefined}
                              className="inline-flex flex-col items-center group"
                              title={auto.reason}
                            >
                              <span className="text-sm font-bold text-violet-600 dark:text-violet-400">{auto.score.toFixed(1)}</span>
                              <span className="text-[9px] text-slate-400">{auto.confidence}</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-300 italic">{auto?.reason ?? "—"}</span>
                          )}
                        </td>
                        <td className="py-2 text-center">
                          <ScoreSlider value={selfScores[k] ?? null} onChange={v => setSelfScores(prev => ({ ...prev, [k]: v }))} disabled={!canEditSelf} />
                        </td>
                        <td className="py-2 text-center">
                          <ScoreSlider value={mgrScores[k] ?? null} onChange={v => setMgrScores(prev => ({ ...prev, [k]: v }))} disabled={!canEditMgr} />
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="border-t-2 border-slate-300 dark:border-slate-600 font-bold">
                    <td className="py-2 pr-3 text-slate-700 dark:text-slate-300">Trung bình</td>
                    <td className="py-2 text-center text-violet-600 dark:text-violet-400">
                      {(() => {
                        if (!review.kpiSnapshot) return "—";
                        const vs = SCORE_KEYS.map(k => review.kpiSnapshot![k]?.score).filter((v): v is number => v != null);
                        return vs.length ? (vs.reduce((s, v) => s + v, 0) / vs.length).toFixed(1) : "—";
                      })()}
                    </td>
                    <td className="py-2 text-center text-blue-600">{selfAvg != null ? selfAvg.toFixed(1) : "—"}</td>
                    <td className="py-2 text-center text-yellow-600">{mgrAvg != null ? mgrAvg.toFixed(1) : "—"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Self review text */}
          {(canEditSelf || review.selfHighlights || review.selfChallenges || review.selfGoalsNext) && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-500" /> Tự đánh giá
              </h3>
              {[
                { key: "selfHighlights", label: "Điểm sáng / thành tựu", val: selfText.selfHighlights, placeholder: "Tôi tự hào nhất với…" },
                { key: "selfChallenges", label: "Khó khăn gặp phải", val: selfText.selfChallenges, placeholder: "Tôi gặp khó khăn ở…" },
                { key: "selfGoalsNext", label: "Mục tiêu kỳ tới", val: selfText.selfGoalsNext, placeholder: "Kỳ tới tôi muốn…" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{f.label}</label>
                  <textarea
                    value={f.val}
                    disabled={!canEditSelf}
                    onChange={e => setSelfText(prev => ({ ...prev, [f.key]: e.target.value }))}
                    rows={2}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Manager review text */}
          {(canEditMgr || review.mgrStrengths || review.mgrAreasToImprove || review.mgrActionItems) && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Crown className="w-4 h-4 text-yellow-500" /> Manager nhận xét
              </h3>
              {[
                { key: "mgrStrengths", label: "Điểm mạnh", val: mgrText.mgrStrengths, placeholder: "Anh/chị làm tốt ở…" },
                { key: "mgrAreasToImprove", label: "Cần cải thiện", val: mgrText.mgrAreasToImprove, placeholder: "Anh/chị nên cải thiện…" },
                { key: "mgrActionItems", label: "Action items", val: mgrText.mgrActionItems, placeholder: "Kỳ tới làm: …" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{f.label}</label>
                  <textarea
                    value={f.val}
                    disabled={!canEditMgr}
                    onChange={e => setMgrText(prev => ({ ...prev, [f.key]: e.target.value }))}
                    rows={2}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              ))}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Đề xuất điều chỉnh lương (%)</label>
                  <input
                    type="number" step={0.5} min={-50} max={100}
                    value={salaryAdjust ?? ""}
                    disabled={!canEditMgr}
                    onChange={e => setSalaryAdjust(e.target.value === "" ? null : Number(e.target.value))}
                    placeholder="vd: 10"
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Đề xuất thăng chức (nếu có)</label>
                  <input
                    type="text"
                    value={promotion}
                    disabled={!canEditMgr}
                    onChange={e => setPromotion(e.target.value)}
                    placeholder="vd: Lên Senior Dev"
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-60"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500">
              {cycleClosed && "🔒 Chu kỳ đã đóng — không thể chỉnh sửa"}
              {!cycleClosed && isCompleted && "✓ Review đã hoàn tất"}
              {!cycleClosed && !isCompleted && (canEditSelf || canEditMgr) && "Bấm Lưu để giữ nháp, hoặc Submit/Finalize để chốt"}
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={onClose}
                className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                Đóng
              </button>
              {(canEditSelf || canEditMgr) && (
                <button type="button" onClick={() => save()} disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 rounded-lg transition flex items-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Lưu nháp
                </button>
              )}
              {canEditSelf && review.status === "PENDING" && (
                <button type="button" onClick={() => save({ submitSelf: true })} disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition flex items-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Gửi self-review
                </button>
              )}
              {canEditMgr && !isCompleted && (
                <button type="button" onClick={() => save({ finalize: true })} disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 rounded-lg transition flex items-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Finalize
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
