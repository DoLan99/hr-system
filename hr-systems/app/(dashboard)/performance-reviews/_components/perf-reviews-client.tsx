"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Loader2, ClipboardList, ClipboardCheck, Clock, CheckCircle2, ChevronRight, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { vi as viLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CreateCycleModal } from "./create-cycle-modal";
import { ReviewFormModal } from "./review-form-modal";

interface Cycle {
  id: number;
  name: string;
  periodType: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  selfDueDate: string | null;
  managerDueDate: string | null;
  createdBy: { fullName: string };
  statusCounts: { PENDING: number; SELF_DONE: number; COMPLETED: number };
}

interface ReviewListItem {
  id: number;
  status: string;
  cycleId: number;
  employeeId: number;
  selfTotalScore: string | number | null;
  mgrTotalScore: string | number | null;
  finalizedAt: string | null;
  cycle: { id: number; name: string; periodStart: string; periodEnd: string; status: string };
  employee: { id: number; fullName: string; department: string | null };
  mgrReviewer: { id: number; fullName: string } | null;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Chờ tự đánh giá",
  SELF_DONE: "Chờ manager",
  COMPLETED: "Hoàn tất",
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: "text-slate-500 bg-slate-100",
  SELF_DONE: "text-blue-700 bg-blue-100",
  COMPLETED: "text-green-700 bg-green-100",
};

const CYCLE_STATUS_COLOR: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  OPEN: "bg-blue-100 text-blue-700",
  CLOSED: "bg-slate-200 text-slate-500",
};

export function PerformanceReviewsClient({ isManager, currentEmployeeId }: { isManager: boolean; currentEmployeeId: number }) {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [myReviews, setMyReviews] = useState<ReviewListItem[]>([]);
  const [allReviews, setAllReviews] = useState<ReviewListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [activeReviewId, setActiveReviewId] = useState<number | null>(null);
  const [activeCycleId, setActiveCycleId] = useState<number | null>(null);

  const fetchAll = useCallback(async () => {
    async function safeJson(url: string): Promise<{ data?: any } | null> {
      try {
        const res = await fetch(url);
        const text = await res.text();
        if (!text) {
          console.error(`[perf-reviews] ${url} returned empty body (status ${res.status})`);
          return null;
        }
        try {
          return JSON.parse(text);
        } catch {
          console.error(`[perf-reviews] ${url} returned non-JSON (status ${res.status}):`, text.slice(0, 200));
          return null;
        }
      } catch (e) {
        console.error(`[perf-reviews] fetch ${url} failed:`, e);
        return null;
      }
    }

    const reqs: Promise<{ data?: any } | null>[] = [safeJson("/api/performance-reviews")];
    if (isManager) reqs.push(safeJson("/api/performance-reviews/cycles"));
    const [myRes, cyclesRes] = await Promise.all(reqs);
    const myData = (myRes?.data ?? []) as ReviewListItem[];
    setMyReviews(myData.filter(r => r.employeeId === currentEmployeeId));
    setAllReviews(myData);
    if (isManager) setCycles((cyclesRes?.data ?? []) as Cycle[]);
  }, [isManager, currentEmployeeId]);

  useEffect(() => {
    setLoading(true);
    fetchAll().finally(() => setLoading(false));
  }, [fetchAll]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải…
      </div>
    );
  }

  const reviewsByCycle = activeCycleId
    ? allReviews.filter(r => r.cycleId === activeCycleId)
    : [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Đánh giá hiệu suất</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Self-review · Manager review · Auto-KPI snapshot từ Tasks + Time Logs
          </p>
        </div>
        {isManager && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
            <Plus className="w-4 h-4" /> Tạo chu kỳ mới
          </button>
        )}
      </div>

      {/* My pending reviews — for everyone */}
      {myReviews.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Đánh giá của tôi</h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {myReviews.map(r => (
              <button
                key={r.id}
                onClick={() => setActiveReviewId(r.id)}
                className="w-full px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center",
                    r.status === "COMPLETED" ? "bg-green-100 text-green-600" :
                      r.status === "SELF_DONE" ? "bg-blue-100 text-blue-600" :
                        "bg-yellow-100 text-yellow-600")}>
                    {r.status === "COMPLETED" ? <CheckCircle2 className="w-4 h-4" /> :
                      r.status === "SELF_DONE" ? <ClipboardCheck className="w-4 h-4" /> :
                        <Clock className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{r.cycle.name}</p>
                    <p className="text-xs text-slate-500">
                      {format(new Date(r.cycle.periodStart), "dd/MM")} – {format(new Date(r.cycle.periodEnd), "dd/MM/yyyy")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-medium", STATUS_COLOR[r.status])}>
                    {STATUS_LABEL[r.status]}
                  </span>
                  {r.mgrTotalScore != null && (
                    <span className="text-sm font-bold text-blue-600">{Number(r.mgrTotalScore).toFixed(1)}/10</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Manager: cycles */}
      {isManager && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-600" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Quản lý chu kỳ</h3>
          </div>
          {cycles.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              Chưa có chu kỳ. Bấm "Tạo chu kỳ mới" để bắt đầu.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {cycles.map(c => {
                const total = c.statusCounts.PENDING + c.statusCounts.SELF_DONE + c.statusCounts.COMPLETED;
                const pct = total > 0 ? Math.round((c.statusCounts.COMPLETED / total) * 100) : 0;
                return (
                  <div key={c.id} className="px-5 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{c.name}</p>
                        <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-medium", CYCLE_STATUS_COLOR[c.status])}>
                          {c.status}
                        </span>
                        <span className="text-xs text-slate-400">
                          {format(new Date(c.periodStart), "dd/MM/yyyy")} – {format(new Date(c.periodEnd), "dd/MM/yyyy")}
                        </span>
                      </div>
                      <button onClick={() => setActiveCycleId(activeCycleId === c.id ? null : c.id)}
                        className="text-xs text-blue-600 hover:underline">
                        {activeCycleId === c.id ? "Ẩn" : "Xem chi tiết"} →
                      </button>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                          <span>{pct}% hoàn tất</span>
                          <span>{c.statusCounts.COMPLETED}/{total}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="text-slate-500">⏳ {c.statusCounts.PENDING}</span>
                        <span className="text-blue-600">📝 {c.statusCounts.SELF_DONE}</span>
                        <span className="text-green-600">✓ {c.statusCounts.COMPLETED}</span>
                      </div>
                    </div>

                    {activeCycleId === c.id && (
                      <div className="mt-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg p-3 max-h-80 overflow-y-auto">
                        {reviewsByCycle.length === 0 ? (
                          <p className="text-xs text-slate-400 text-center py-4">Không có review</p>
                        ) : (
                          <div className="space-y-1">
                            {reviewsByCycle.map(r => (
                              <button key={r.id}
                                onClick={() => setActiveReviewId(r.id)}
                                className="w-full px-3 py-2 hover:bg-white dark:hover:bg-slate-900 rounded transition flex items-center justify-between text-left">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{r.employee.fullName}</span>
                                  <span className="text-[10px] text-slate-400">{r.employee.department}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", STATUS_COLOR[r.status])}>
                                    {STATUS_LABEL[r.status]}
                                  </span>
                                  {r.mgrTotalScore != null && (
                                    <span className="text-xs font-bold text-blue-600">{Number(r.mgrTotalScore).toFixed(1)}</span>
                                  )}
                                  <ChevronRight className="w-3 h-3 text-slate-300" />
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!isManager && myReviews.length === 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-10 text-center">
          <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Chưa có chu kỳ đánh giá nào. Đợi manager khởi tạo.</p>
        </div>
      )}

      {showCreate && (
        <CreateCycleModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchAll(); }}
        />
      )}

      {activeReviewId && (
        <ReviewFormModal
          reviewId={activeReviewId}
          isManager={isManager}
          currentEmployeeId={currentEmployeeId}
          onClose={() => setActiveReviewId(null)}
          onSaved={() => { fetchAll(); }}
        />
      )}
    </div>
  );
}
