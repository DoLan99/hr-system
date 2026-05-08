"use client";

import { useState, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  ChevronLeft, ChevronRight, PlayCircle, Coffee, StopCircle,
  CheckCircle2, XCircle, Clock, AlertTriangle, Pencil, Check, X,
} from "lucide-react";
import { format, addMonths, subMonths, getDaysInMonth, isToday, isWeekend } from "date-fns";
import { vi } from "date-fns/locale";
import { cn, formatMinutes } from "@/lib/utils";
import { deltaLabel, CHECKPOINT_META, type CheckpointKey } from "@/lib/office-time";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];

interface OfficeRecord {
  id: number;
  date: string | Date;
  employeeId: number;
  startWork1: string | null;
  startLunch: string | null;
  startWork2: string | null;
  startAfternoonBreak: string | null;
  startWork3: string | null;
  endWorkday: string | null;
  workReportTotal: number;
  actualWorked: number | null;
  delta: number | null;
  explanation: string | null;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  approvedBy: { fullName: string } | null;
  approvedAt: string | null;
}

interface Props {
  initialRecords: OfficeRecord[];
  initialMonth: number;
  initialYear: number;
  employeeId: number;
  employees?: { id: number; fullName: string; department: string | null }[];
}

function fmtTime(d: string | null | undefined): string {
  if (!d) return "—";
  return format(new Date(d), "HH:mm");
}

export function OfficeTimeClient({
  initialRecords,
  initialMonth,
  initialYear,
  employeeId,
  employees,
}: Props) {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role ?? "";
  const isManager = MANAGER_ROLES.includes(role);
  const currentUserId = Number((session?.user as any)?.id);

  const [viewDate, setViewDate] = useState(new Date(initialYear, initialMonth - 1));
  const [records, setRecords] = useState<OfficeRecord[]>(initialRecords);
  const [targetEmpId, setTargetEmpId] = useState(employeeId);
  const [loading, setLoading] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Record<CheckpointKey, string>>>({});
  const [explanation, setExplanation] = useState("");

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayRecord = records.find(r => format(new Date(r.date), "yyyy-MM-dd") === todayStr) ?? null;
  const isCurrentMonth =
    viewDate.getMonth() === new Date().getMonth() &&
    viewDate.getFullYear() === new Date().getFullYear();

  const fetchRecords = useCallback(async (date: Date, empId: number) => {
    setLoading("fetch");
    try {
      const m = date.getMonth() + 1;
      const y = date.getFullYear();
      const url = `/api/office-time?month=${m}&year=${y}&employeeId=${empId}`;
      const res = await fetch(url);
      const json = await res.json();
      setRecords(json.data ?? []);
    } finally {
      setLoading(null);
    }
  }, []);

  async function clockIn(checkpoint: CheckpointKey, dateStr: string) {
    setLoading(checkpoint);
    try {
      const res = await fetch("/api/office-time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr, checkpoint, employeeId: targetEmpId }),
      });
      const json = await res.json();
      if (json.data) {
        setRecords(prev => {
          const idx = prev.findIndex(r => r.id === json.data.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = json.data;
            return next;
          }
          return [...prev, json.data];
        });
      }
    } finally {
      setLoading(null);
    }
  }

  async function submitEdit(id: number) {
    setLoading("edit-" + id);
    try {
      const res = await fetch(`/api/office-time/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editForm, explanation: explanation || undefined }),
      });
      const json = await res.json();
      if (json.data) {
        setRecords(prev => prev.map(r => r.id === id ? json.data : r));
        setEditingId(null);
        setEditForm({});
        setExplanation("");
      }
    } finally {
      setLoading(null);
    }
  }

  async function approve(id: number, status: "APPROVED" | "REJECTED") {
    setLoading("approve-" + id);
    try {
      const res = await fetch(`/api/office-time/${id}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.data) setRecords(prev => prev.map(r => r.id === id ? json.data : r));
    } finally {
      setLoading(null);
    }
  }

  function navigateMonth(dir: 1 | -1) {
    const next = dir === 1 ? addMonths(viewDate, 1) : subMonths(viewDate, 1);
    setViewDate(next);
    fetchRecords(next, targetEmpId);
  }

  function switchEmployee(empId: number) {
    setTargetEmpId(empId);
    fetchRecords(viewDate, empId);
  }

  function startEdit(r: OfficeRecord) {
    setEditingId(r.id);
    setEditForm({
      startWork1: r.startWork1 ? fmtTime(r.startWork1) : "",
      startLunch: r.startLunch ? fmtTime(r.startLunch) : "",
      startWork2: r.startWork2 ? fmtTime(r.startWork2) : "",
      startAfternoonBreak: r.startAfternoonBreak ? fmtTime(r.startAfternoonBreak) : "",
      startWork3: r.startWork3 ? fmtTime(r.startWork3) : "",
      endWorkday: r.endWorkday ? fmtTime(r.endWorkday) : "",
    });
    setExplanation(r.explanation ?? "");
  }

  // Tạo danh sách ngày trong tháng
  const daysInMonth = useMemo(() => {
    const days: Date[] = [];
    const count = getDaysInMonth(viewDate);
    for (let i = 1; i <= count; i++) {
      days.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), i));
    }
    return days;
  }, [viewDate]);

  // Thống kê tháng
  const stats = useMemo(() => {
    const total = records.reduce((s, r) => s + (r.actualWorked ?? 0), 0);
    const approved = records.filter(r => r.approvalStatus === "APPROVED").length;
    const pending = records.filter(r => r.approvalStatus === "PENDING" && r.startWork1).length;
    const issues = records.filter(r => r.delta !== null && Math.abs(r.delta) > 30).length;
    return { total, approved, pending, issues };
  }, [records]);

  // Next checkpoint cho today
  const nextCp = useMemo((): CheckpointKey | null => {
    if (!todayRecord) return "startWork1";
    if (!todayRecord.startWork1) return "startWork1";
    if (!todayRecord.startLunch) return "startLunch";
    if (!todayRecord.startWork2) return "startWork2";
    if (todayRecord.startAfternoonBreak && !todayRecord.startWork3) return "startWork3";
    if (!todayRecord.endWorkday) return "endWorkday";
    return null;
  }, [todayRecord]);

  const statusBadge = (status: OfficeRecord["approvalStatus"]) => {
    if (status === "APPROVED") return <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full"><CheckCircle2 className="w-3 h-3" />Approved</span>;
    if (status === "REJECTED") return <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full"><XCircle className="w-3 h-3" />Rejected</span>;
    return <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full"><Clock className="w-3 h-3" />Pending</span>;
  };

  return (
    <div className="space-y-5">

      {/* Manager: employee switcher */}
      {isManager && employees && employees.length > 0 && (
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3">
          <span className="text-xs font-medium text-slate-600">Xem của:</span>
          <select
            value={targetEmpId}
            onChange={(e) => switchEmployee(Number(e.target.value))}
            className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.fullName}{emp.department ? ` — ${emp.department}` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Today Panel — chỉ hiện tháng hiện tại */}
      {isCurrentMonth && (currentUserId === targetEmpId || isManager) && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide">Hôm nay</p>
              <p className="text-lg font-semibold text-slate-900 capitalize">
                {format(new Date(), "EEEE, dd/MM/yyyy", { locale: vi })}
              </p>
            </div>
            {todayRecord?.actualWorked ? (
              <div className="text-right">
                <p className="text-xs text-slate-500">Đã làm</p>
                <p className="text-xl font-bold text-blue-600">{formatMinutes(todayRecord.actualWorked)}</p>
              </div>
            ) : null}
          </div>

          {/* Timeline */}
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
            {(["startWork1", "startLunch", "startWork2", "endWorkday"] as CheckpointKey[]).map((cp, i, arr) => {
              const val = todayRecord?.[cp];
              const filled = !!val;
              return (
                <div key={cp} className="flex items-center gap-2">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-colors",
                      filled
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-white border-slate-300 text-slate-400"
                    )}>
                      {filled ? <Check className="w-4 h-4" /> : <span>{i + 1}</span>}
                    </div>
                    <p className={cn("text-xs mt-1 whitespace-nowrap", filled ? "text-slate-700 font-medium" : "text-slate-400")}>
                      {filled ? fmtTime(val) : CHECKPOINT_META[cp].label}
                    </p>
                  </div>
                  {i < arr.length - 1 && (
                    <div className={cn("h-0.5 w-8 mt-[-14px]", todayRecord?.[arr[i + 1]] ? "bg-blue-400" : "bg-slate-200")} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          {nextCp === null ? (
            <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Đã hoàn thành ngày làm việc
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {/* Primary action */}
              <button
                onClick={() => clockIn(nextCp!, todayStr)}
                disabled={!!loading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
              >
                {loading === nextCp ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <PlayCircle className="w-4 h-4" />
                )}
                {CHECKPOINT_META[nextCp!].actionLabel}
              </button>

              {/* Optional: giải lao sau startWork2 */}
              {nextCp === "endWorkday" && !todayRecord?.startAfternoonBreak && (
                <button
                  onClick={() => clockIn("startAfternoonBreak", todayStr)}
                  disabled={!!loading}
                  className="flex items-center gap-2 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-sm font-medium px-4 py-2 rounded-lg transition"
                >
                  <Coffee className="w-4 h-4" />
                  Nghỉ giải lao
                </button>
              )}

              {/* Force end */}
              {nextCp !== "startWork1" && nextCp !== "endWorkday" && (
                <button
                  onClick={() => clockIn("endWorkday", todayStr)}
                  disabled={!!loading}
                  className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-sm font-medium px-4 py-2 rounded-lg transition"
                >
                  <StopCircle className="w-4 h-4" />
                  Kết thúc ngày
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Month summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Tổng giờ làm", value: formatMinutes(stats.total), color: "text-blue-600" },
          { label: "Đã duyệt", value: `${stats.approved} ngày`, color: "text-green-600" },
          { label: "Chờ duyệt", value: `${stats.pending} ngày`, color: "text-yellow-600" },
          { label: "Cần giải thích (Δ>30m)", value: `${stats.issues} ngày`, color: "text-red-600" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl px-4 py-3">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={cn("text-xl font-bold mt-0.5", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Month table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {/* Header: month nav */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <p className="text-sm font-semibold text-slate-800 capitalize">
            {format(viewDate, "MMMM yyyy", { locale: vi })}
          </p>
          <button
            onClick={() => navigateMonth(1)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {loading === "fetch" ? (
          <div className="flex items-center justify-center h-32 text-slate-400 text-sm">Đang tải...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <th className="text-left px-4 py-2.5 w-28">Ngày</th>
                  <th className="text-center px-3 py-2.5">Vào làm</th>
                  <th className="text-center px-3 py-2.5">Nghỉ trưa</th>
                  <th className="text-center px-3 py-2.5">Làm lại</th>
                  <th className="text-center px-3 py-2.5">Kết thúc</th>
                  <th className="text-center px-3 py-2.5">Thực làm</th>
                  <th className="text-center px-3 py-2.5">Work Report</th>
                  <th className="text-center px-3 py-2.5">Δ</th>
                  <th className="text-center px-3 py-2.5">Trạng thái</th>
                  <th className="text-right px-4 py-2.5">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {daysInMonth.map(day => {
                  const dayStr = format(day, "yyyy-MM-dd");
                  const record = records.find(r => format(new Date(r.date), "yyyy-MM-dd") === dayStr);
                  const isWeekDay = !isWeekend(day);
                  const isTodayDay = isToday(day);
                  const isEditing = editingId === record?.id;
                  const dl = deltaLabel(record?.delta);

                  if (!isWeekDay && !record) return null; // bỏ qua CN không có record

                  return (
                    <tr
                      key={dayStr}
                      className={cn(
                        "transition-colors",
                        isTodayDay ? "bg-blue-50" : isWeekend(day) ? "bg-slate-50/50" : "hover:bg-slate-50",
                        !record && "opacity-50"
                      )}
                    >
                      {/* Ngày */}
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          {isTodayDay && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />}
                          <div>
                            <span className={cn(
                              "font-medium",
                              isTodayDay ? "text-blue-700" : isWeekend(day) ? "text-slate-400" : "text-slate-800"
                            )}>
                              {format(day, "dd")}
                            </span>
                            <span className="text-xs text-slate-400 ml-1 capitalize">
                              {format(day, "EEE", { locale: vi })}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Checkpoints */}
                      {isEditing ? (
                        <>
                          {(["startWork1", "startLunch", "startWork2", "endWorkday"] as CheckpointKey[]).map(cp => (
                            <td key={cp} className="px-2 py-1.5 text-center">
                              <input
                                type="time"
                                value={editForm[cp] ?? ""}
                                onChange={e => setEditForm(f => ({ ...f, [cp]: e.target.value }))}
                                className="w-24 border border-slate-300 rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                          ))}
                        </>
                      ) : (
                        <>
                          <td className="px-3 py-2.5 text-center font-mono text-xs text-slate-700">{fmtTime(record?.startWork1)}</td>
                          <td className="px-3 py-2.5 text-center font-mono text-xs text-slate-700">{fmtTime(record?.startLunch)}</td>
                          <td className="px-3 py-2.5 text-center font-mono text-xs text-slate-700">{fmtTime(record?.startWork2)}</td>
                          <td className="px-3 py-2.5 text-center font-mono text-xs text-slate-700">{fmtTime(record?.endWorkday)}</td>
                        </>
                      )}

                      {/* Thực làm */}
                      <td className="px-3 py-2.5 text-center text-xs font-medium text-slate-700">
                        {record?.actualWorked ? formatMinutes(record.actualWorked) : "—"}
                      </td>

                      {/* Work Report */}
                      <td className="px-3 py-2.5 text-center text-xs text-slate-600">
                        {record ? formatMinutes(record.workReportTotal) : "—"}
                      </td>

                      {/* Delta */}
                      <td className="px-3 py-2.5 text-center">
                        <span className={cn("text-xs font-medium", dl.color)}>{record ? dl.text : "—"}</span>
                        {record?.delta && Math.abs(record.delta) > 30 && !record.explanation && (
                          <AlertTriangle className="w-3 h-3 text-orange-400 inline ml-1" />
                        )}
                      </td>

                      {/* Trạng thái */}
                      <td className="px-3 py-2.5 text-center">
                        {record ? statusBadge(record.approvalStatus) : "—"}
                      </td>

                      {/* Thao tác */}
                      <td className="px-4 py-2.5 text-right">
                        {record && (
                          <div className="flex items-center justify-end gap-1">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => submitEdit(record.id)}
                                  disabled={!!loading}
                                  className="p-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 transition"
                                  title="Lưu"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => { setEditingId(null); setEditForm({}); }}
                                  className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 transition"
                                  title="Hủy"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <>
                                {(currentUserId === record.employeeId || isManager) && (
                                  <button
                                    onClick={() => startEdit(record)}
                                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                                    title="Sửa giờ"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {isManager && record.approvalStatus === "PENDING" && record.startWork1 && (
                                  <>
                                    <button
                                      onClick={() => approve(record.id, "APPROVED")}
                                      disabled={loading === "approve-" + record.id}
                                      className="p-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 transition"
                                      title="Duyệt"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => approve(record.id, "REJECTED")}
                                      disabled={loading === "approve-" + record.id}
                                      className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition"
                                      title="Từ chối"
                                    >
                                      <XCircle className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Explanation legend */}
      <p className="text-xs text-slate-400 px-1">
        Δ = Work Report − Thực làm. Âm: đã làm nhiều hơn report. Dương: report nhiều hơn giờ thực.
        Cờ <AlertTriangle className="w-3 h-3 inline text-orange-400" /> = chênh lệch &gt;30 phút, cần giải thích.
      </p>
    </div>
  );
}
