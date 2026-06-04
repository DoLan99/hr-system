"use client";

import { useState } from "react";
import { X, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function CreateCycleModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [periodType, setPeriodType] = useState<"QUARTERLY" | "ANNUAL" | "CUSTOM">("QUARTERLY");
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [quarter, setQuarter] = useState<1 | 2 | 3 | 4>(Math.ceil((now.getMonth() + 1) / 3) as any);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [selfDueDate, setSelfDueDate] = useState("");
  const [managerDueDate, setManagerDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const body: any = { periodType, year };
      if (periodType === "QUARTERLY") body.quarter = quarter;
      if (periodType === "CUSTOM") {
        body.periodStart = periodStart;
        body.periodEnd = periodEnd;
      }
      if (selfDueDate) body.selfDueDate = selfDueDate;
      if (managerDueDate) body.managerDueDate = managerDueDate;

      const res = await fetch("/api/performance-reviews/cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.formErrors?.[0] ?? JSON.stringify(json.error) ?? "Lỗi tạo cycle");
        return;
      }
      onCreated();
    } catch (e: any) {
      setError(e?.message ?? "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Tạo chu kỳ đánh giá</h2>
            <p className="text-xs text-slate-500">Tự động sinh review cho tất cả nhân viên ACTIVE</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Period type */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Loại chu kỳ</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: "QUARTERLY", label: "Theo quý" },
                { val: "ANNUAL", label: "Theo năm" },
                { val: "CUSTOM", label: "Tùy chỉnh" },
              ].map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setPeriodType(opt.val as any)}
                  className={cn(
                    "px-3 py-2 text-xs rounded-lg border-2 transition",
                    periodType === opt.val
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Year + Quarter */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Năm</label>
              <input
                type="number"
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                min={2020}
                max={2100}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {periodType === "QUARTERLY" && (
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Quý</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map(q => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQuarter(q as any)}
                      className={cn(
                        "flex-1 py-2 text-xs rounded-lg border-2 transition",
                        quarter === q
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400",
                      )}
                    >
                      Q{q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {periodType === "CUSTOM" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Từ ngày</label>
                <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} required
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Đến ngày</label>
                <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} required
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          )}

          {/* Due dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Hạn self-review</label>
              <input type="date" value={selfDueDate} onChange={e => setSelfDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Hạn manager review</label>
              <input type="date" value={managerDueDate} onChange={e => setManagerDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800" />
            </div>
          </div>

          <div className="flex items-start gap-2 px-3 py-2 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-lg">
            <Sparkles className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 mt-0.5 shrink-0" />
            <p className="text-[11px] text-violet-700 dark:text-violet-300">
              Hệ thống sẽ tính Auto-KPI (Tốc độ/Chất lượng/Đúng hạn/Học hỏi/Chủ động) trong period và đính kèm vào mỗi review.
              Quá trình có thể mất vài giây nếu nhiều nhân viên.
            </p>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 dark:bg-red-950/40 px-3 py-2 rounded">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition">
              Hủy
            </button>
            <button type="submit" disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition flex items-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Tạo & mở cycle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
