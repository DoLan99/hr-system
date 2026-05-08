"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  ChevronLeft, ChevronRight, Plus, Pencil, Trash2,
  AlertTriangle, CheckCircle2, Clock, Star, Video,
  ExternalLink, CalendarDays,
} from "lucide-react";
import { format, addDays, subDays, isToday } from "date-fns";
import { vi } from "date-fns/locale";
import { formatMinutes, cn } from "@/lib/utils";
import { calcCreditedTime, creditStatusLabel } from "@/lib/work-report";
import { EntryFormModal } from "./entry-form-modal";
import { EmptyState } from "@/components/shared/empty-state";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];

interface ReportEntry {
  id: number;
  date: Date;
  taskId: string | null;
  quantity: number;
  taskName: string | null;
  description: string | null;
  stdTime: number | null;
  actualTime: number;
  delta: number | null;
  creditedTime: number | null;
  completionPct: number;
  stdTimeIssue: boolean;
  videoLink: string | null;
  videoDuration: number | null;
  note: string | null;
  link: string | null;
  wlId: string | null;
  rating: number | null;
  task?: { taskId: string; taskName: string; stdTime: number } | null;
  workList?: { wlId: string; title: string } | null;
}

interface WorkList {
  wlId: string;
  title: string;
}

interface Props {
  initialDate: string;
  initialEntries: ReportEntry[];
  openTasks: WorkList[];
  employeeId: number;
}

export function WorkReportClient({ initialDate, initialEntries, openTasks, employeeId }: Props) {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role ?? "";
  const isManager = MANAGER_ROLES.includes(role);
  const currentUserId = Number((session?.user as any)?.id);
  const isOwnReport = currentUserId === employeeId;

  const [currentDate, setCurrentDate] = useState(new Date(initialDate + "T00:00:00"));
  const [entries, setEntries] = useState<ReportEntry[]>(initialEntries);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ReportEntry | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [ratingId, setRatingId] = useState<number | null>(null);

  const dateStr = format(currentDate, "yyyy-MM-dd");
  const isTodayDate = isToday(currentDate);

  // Fetch khi đổi ngày
  useEffect(() => {
    setLoading(true);
    fetch(`/api/work-report?date=${dateStr}&employeeId=${employeeId}`)
      .then((r) => r.json())
      .then(({ data }) => setEntries(data ?? []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [dateStr, employeeId]);

  // ── Summary ─────────────────────────────────────────────────────────────────
  const totalActual = useMemo(
    () => entries.reduce((s, e) => s + e.actualTime, 0),
    [entries]
  );
  const totalCredited = useMemo(
    () => entries.reduce((s, e) => s + (e.creditedTime ?? 0), 0),
    [entries]
  );
  const warningCount = useMemo(
    () =>
      entries.filter(
        (e) =>
          e.stdTimeIssue && !e.videoLink
      ).length,
    [entries]
  );
  const efficiency =
    totalActual > 0 ? Math.round((totalCredited / totalActual) * 100) : 0;

  // ── Actions ──────────────────────────────────────────────────────────────────
  function openAdd() { setEditingEntry(null); setModalOpen(true); }
  function openEdit(e: ReportEntry) { setEditingEntry(e); setModalOpen(true); }

  function handleSaved(saved: ReportEntry) {
    setEntries((prev) => {
      const idx = prev.findIndex((e) => e.id === saved.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = saved; return n; }
      return [...prev, saved].sort((a, b) => a.id - b.id);
    });
  }

  async function handleDelete(entry: ReportEntry) {
    if (!confirm(`Xóa dòng "${entry.taskName ?? entry.taskId}"?`)) return;
    setDeletingId(entry.id);
    try {
      await fetch(`/api/work-report/${entry.id}`, { method: "DELETE" });
      setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleRate(entryId: number, rating: number) {
    setRatingId(entryId);
    try {
      const res = await fetch(`/api/work-report/${entryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });
      if (res.ok) {
        const { data } = await res.json();
        setEntries((prev) => prev.map((e) => (e.id === entryId ? data : e)));
      }
    } finally {
      setRatingId(null);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Date Navigator */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentDate(subDays(currentDate, 1))}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="text-center">
            <p className="text-base font-semibold text-slate-900">
              {format(currentDate, "EEEE, dd/MM/yyyy", { locale: vi })}
            </p>
            {isTodayDate && (
              <span className="text-xs text-blue-600 font-medium">Hôm nay</span>
            )}
          </div>

          <button
            onClick={() => setCurrentDate(addDays(currentDate, 1))}
            disabled={isTodayDate}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Jump to today */}
        {!isTodayDate && (
          <div className="text-center mt-2">
            <button
              onClick={() => setCurrentDate(new Date())}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1 mx-auto"
            >
              <CalendarDays className="w-3 h-3" />
              Về hôm nay
            </button>
          </div>
        )}
      </div>

      {/* Summary bar */}
      {entries.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          <SummaryCard label="Thực tế" value={formatMinutes(totalActual)} icon={Clock} color="gray" />
          <SummaryCard
            label="Credited"
            value={formatMinutes(totalCredited)}
            icon={CheckCircle2}
            color={totalCredited >= totalActual ? "green" : "amber"}
          />
          <SummaryCard
            label="Hiệu suất"
            value={`${efficiency}%`}
            icon={Star}
            color={efficiency >= 100 ? "green" : efficiency >= 80 ? "amber" : "red"}
          />
          <SummaryCard
            label="Cần bổ sung"
            value={warningCount > 0 ? `${warningCount} video` : "OK"}
            icon={AlertTriangle}
            color={warningCount > 0 ? "red" : "green"}
          />
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Table header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-800">
            {entries.length} dòng báo cáo
          </p>
          {(isOwnReport || isManager) && (
            <button
              onClick={openAdd}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm dòng
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 text-sm gap-2">
            <Clock className="w-4 h-4 animate-spin" />
            Đang tải...
          </div>
        ) : entries.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title={`Chưa có báo cáo ngày ${dateStr}`}
            description="Nhấn '+ Thêm dòng' để bắt đầu ghi nhận công việc hôm nay"
            action={
              isOwnReport ? (
                <button onClick={openAdd}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
                  <Plus className="w-4 h-4" /> Thêm dòng đầu tiên
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 font-medium border-b border-slate-100">
                  <th className="text-left px-5 py-2.5 w-6">#</th>
                  <th className="text-left px-3 py-2.5 w-24">Task ID</th>
                  <th className="text-left px-3 py-2.5">Tên task / Mô tả</th>
                  <th className="text-center px-3 py-2.5 w-20">Std</th>
                  <th className="text-center px-3 py-2.5 w-20">Actual</th>
                  <th className="text-center px-3 py-2.5 w-28">Credited</th>
                  <th className="text-center px-3 py-2.5 w-16">Video</th>
                  <th className="text-center px-3 py-2.5 w-16">%</th>
                  {isManager && <th className="text-center px-3 py-2.5 w-28">Rating</th>}
                  <th className="text-right px-5 py-2.5 w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, idx) => {
                  const credit = calcCreditedTime({
                    taskId: entry.taskId ?? "",
                    actualTime: entry.actualTime,
                    stdTime: entry.task?.stdTime ?? null,
                    quantity: entry.quantity,
                    videoLink: entry.videoLink,
                  });
                  const statusStyle = creditStatusLabel(
                    entry.creditedTime === 0 && credit.status === "zero"
                      ? "zero"
                      : entry.creditedTime !== null && entry.creditedTime < entry.actualTime
                      ? "capped"
                      : credit.status
                  );

                  return (
                    <tr key={entry.id}
                      className="border-b border-gray-50 last:border-0 hover:bg-slate-50/50 transition">
                      {/* # */}
                      <td className="px-5 py-3 text-xs text-slate-400">{idx + 1}</td>

                      {/* Task ID */}
                      <td className="px-3 py-3">
                        <span className="font-mono text-xs font-bold text-slate-700">
                          {entry.taskId}
                        </span>
                        {entry.wlId && (
                          <p className="text-xs text-blue-500 mt-0.5">{entry.wlId}</p>
                        )}
                      </td>

                      {/* Name + desc */}
                      <td className="px-3 py-3 max-w-xs">
                        <p className="font-medium text-slate-800 truncate">
                          {entry.taskName ?? entry.taskId}
                        </p>
                        {entry.description && (
                          <p className="text-xs text-slate-400 mt-0.5 truncate">{entry.description}</p>
                        )}
                        {entry.note && (
                          <p className="text-xs text-slate-500 mt-0.5 italic truncate">{entry.note}</p>
                        )}
                      </td>

                      {/* Std */}
                      <td className="px-3 py-3 text-center">
                        <span className="text-xs font-mono text-slate-500">
                          {entry.stdTime ? formatMinutes(entry.stdTime) : "—"}
                        </span>
                      </td>

                      {/* Actual */}
                      <td className="px-3 py-3 text-center">
                        <span className={cn(
                          "text-xs font-mono font-semibold",
                          entry.stdTimeIssue ? "text-red-600" : "text-slate-700"
                        )}>
                          {formatMinutes(entry.actualTime)}
                        </span>
                        {entry.quantity > 1 && (
                          <span className="text-xs text-slate-400 block">×{entry.quantity}</span>
                        )}
                      </td>

                      {/* Credited */}
                      <td className="px-3 py-3 text-center">
                        <span className={cn(
                          "inline-block px-2 py-0.5 rounded-full text-xs font-semibold",
                          statusStyle.color
                        )}>
                          {formatMinutes(entry.creditedTime ?? 0)}
                        </span>
                        <span className="text-xs text-slate-400 block mt-0.5">
                          {statusStyle.label}
                        </span>
                      </td>

                      {/* Video */}
                      <td className="px-3 py-3 text-center">
                        {entry.videoLink ? (
                          <a href={entry.videoLink} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-green-600 hover:text-green-700">
                            <Video className="w-3.5 h-3.5" />
                            {entry.videoDuration ? (
                              <span className="text-xs">{entry.videoDuration}m</span>
                            ) : null}
                          </a>
                        ) : entry.stdTimeIssue ? (
                          <span className="text-red-400">
                            <AlertTriangle className="w-3.5 h-3.5 mx-auto" />
                          </span>
                        ) : (
                          <span className="text-gray-200">—</span>
                        )}
                      </td>

                      {/* % */}
                      <td className="px-3 py-3 text-center">
                        <span className={cn(
                          "text-xs font-medium",
                          entry.completionPct === 100 ? "text-green-600" :
                          entry.completionPct >= 50 ? "text-amber-600" : "text-red-500"
                        )}>
                          {entry.completionPct}%
                        </span>
                      </td>

                      {/* Rating (manager only) */}
                      {isManager && (
                        <td className="px-3 py-3 text-center">
                          <StarRating
                            value={entry.rating ?? 0}
                            loading={ratingId === entry.id}
                            onChange={(r) => handleRate(entry.id, r)}
                          />
                        </td>
                      )}

                      {/* Actions */}
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {entry.link && (
                            <a href={entry.link} target="_blank" rel="noopener noreferrer"
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {(isOwnReport || isManager) && (
                            <>
                              <button onClick={() => openEdit(entry)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDelete(entry)}
                                disabled={deletingId === entry.id}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-40">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Footer totals */}
              {entries.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50">
                    <td colSpan={3} className="px-5 py-2.5 text-xs font-semibold text-slate-600">
                      TỔNG ({entries.length} dòng)
                    </td>
                    <td />
                    <td className="px-3 py-2.5 text-center text-xs font-bold text-slate-700">
                      {formatMinutes(totalActual)}
                    </td>
                    <td className="px-3 py-2.5 text-center text-xs font-bold text-green-700">
                      {formatMinutes(totalCredited)}
                    </td>
                    <td colSpan={isManager ? 4 : 3} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <EntryFormModal
        open={modalOpen}
        date={dateStr}
        entry={editingEntry ? {
          ...editingEntry,
          taskId: editingEntry.taskId ?? undefined,
          description: editingEntry.description ?? undefined,
          videoLink: editingEntry.videoLink ?? undefined,
          videoDuration: editingEntry.videoDuration ?? undefined,
          note: editingEntry.note ?? undefined,
          link: editingEntry.link ?? undefined,
          wlId: editingEntry.wlId ?? undefined,
        } : null}
        openTasks={openTasks}
        onClose={() => { setModalOpen(false); setEditingEntry(null); }}
        onSaved={handleSaved}
      />
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SummaryCard({
  label, value, icon: Icon, color,
}: {
  label: string; value: string; icon: any;
  color: "gray" | "green" | "amber" | "red";
}) {
  const colors = {
    gray:  "bg-slate-50  text-slate-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
    red:   "bg-red-50   text-red-600",
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-1.5">
        <div className={cn("p-1.5 rounded-lg", colors[color])}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
      <p className="text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}

function StarRating({
  value, loading, onChange,
}: {
  value: number; loading: boolean; onChange: (r: number) => void;
}) {
  const [hover, setHover] = useState(0);
  if (loading) return <Clock className="w-4 h-4 animate-spin text-slate-300 mx-auto" />;
  return (
    <div className="flex items-center justify-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button"
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          className="transition"
        >
          <Star className={cn(
            "w-3.5 h-3.5",
            (hover || value) >= n ? "fill-amber-400 text-amber-400" : "text-gray-200"
          )} />
        </button>
      ))}
    </div>
  );
}
