"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  ChevronLeft, ChevronRight, RefreshCw, Star,
  CheckCircle2, Clock, AlertTriangle, TrendingUp,
  Loader2, BarChart2,
} from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";
import { vi } from "date-fns/locale";
import { cn, formatCurrency, formatMinutes } from "@/lib/utils";
import { SCORE_LABELS } from "@/lib/salary";
import { ScoreModal } from "./score-modal";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];

interface SummaryItem {
  id: number;
  employeeId: number;
  month: number;
  year: number;
  creditedHours: number | string;
  workHoursReal: number | string;
  learnHours: number | string;
  deltaHours: number | string;
  salaryCalc: number | string;
  bonusCalc: number | string;
  totalCalc: number | string;
  salaryPaid: number | string;
  bonusPaid: number | string;
  moneyReceived: number | string;
  deltaMoney: number | string;
  scoreWorkSpeed?: number | string | null;
  scoreQuality?: number | string | null;
  scoreLearning?: number | string | null;
  scoreDeadlines?: number | string | null;
  scoreInitiative?: number | string | null;
  totalScore?: number | string | null;
  totalTasks: number;
  completedTasks: number;
  openTasks: number;
  overdueTasks: number;
  completionRate: number | string;
  confirmedAt?: string | null;
  confirmedById?: number | null;
  employee: { id: number; fullName: string; department: string | null; payType: string; hourlyRate: any; monthlySalary: any };
  confirmedBy?: { fullName: string } | null;
}

interface Props {
  initialSummaries: SummaryItem[];
  initialMonth: number;
  initialYear: number;
  employeeId: number;
}

const n = (v: any) => Number(v ?? 0);
const h = (v: any) => n(v).toFixed(1);

export function SummaryClient({ initialSummaries, initialMonth, initialYear, employeeId }: Props) {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role ?? "";
  const isManager = MANAGER_ROLES.includes(role);

  const [viewDate, setViewDate] = useState(new Date(initialYear, initialMonth - 1));
  const [summaries, setSummaries] = useState<SummaryItem[]>(initialSummaries);
  const [calculating, setCalculating] = useState(false);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [scoringItem, setScoringItem] = useState<SummaryItem | null>(null);
  const [paidEdit, setPaidEdit] = useState<{ id: number; salaryPaid: string; bonusPaid: string; moneyReceived: string } | null>(null);

  const month = viewDate.getMonth() + 1;
  const year = viewDate.getFullYear();

  async function fetchSummaries(date: Date) {
    const m = date.getMonth() + 1;
    const y = date.getFullYear();
    const res = await fetch(`/api/summary?month=${m}&year=${y}`);
    const json = await res.json();
    setSummaries(json.data ?? []);
  }

  function navigateMonth(dir: 1 | -1) {
    const next = dir === 1 ? addMonths(viewDate, 1) : subMonths(viewDate, 1);
    setViewDate(next);
    fetchSummaries(next);
  }

  async function calculate(empId?: number) {
    setCalculating(true);
    try {
      const res = await fetch("/api/summary/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, year, ...(empId && { employeeId: empId }) }),
      });
      const json = await res.json();
      if (res.ok) {
        const updated = Array.isArray(json.data) ? json.data.filter(Boolean) : [json.data].filter(Boolean);
        setSummaries(prev => {
          const map = new Map(prev.map(s => [s.employeeId, s]));
          updated.forEach((s: SummaryItem) => map.set(s.employeeId, s));
          return Array.from(map.values());
        });
      }
    } finally {
      setCalculating(false);
    }
  }

  async function confirmSummary(id: number) {
    setConfirmingId(id);
    try {
      const res = await fetch(`/api/summary/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });
      const json = await res.json();
      if (res.ok) updateSummary(json.data);
    } finally {
      setConfirmingId(null);
    }
  }

  async function savePaid() {
    if (!paidEdit) return;
    const res = await fetch(`/api/summary/${paidEdit.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        salaryPaid: Number(paidEdit.salaryPaid),
        bonusPaid: Number(paidEdit.bonusPaid),
        moneyReceived: Number(paidEdit.moneyReceived),
      }),
    });
    const json = await res.json();
    if (res.ok) { updateSummary(json.data); setPaidEdit(null); }
  }

  function updateSummary(item: SummaryItem) {
    setSummaries(prev => prev.map(s => s.id === item.id ? item : s));
  }

  // Tổng cộng
  const totals = useMemo(() => ({
    salaryCalc: summaries.reduce((s, i) => s + n(i.salaryCalc), 0),
    bonusCalc: summaries.reduce((s, i) => s + n(i.bonusCalc), 0),
    totalCalc: summaries.reduce((s, i) => s + n(i.totalCalc), 0),
    creditedHours: summaries.reduce((s, i) => s + n(i.creditedHours), 0),
  }), [summaries]);

  // Employee tự xem — 1 record
  const myRecord = !isManager ? summaries.find(s => s.employeeId === employeeId) : null;

  return (
    <div className="space-y-5">
      {/* Month navigator */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-5 py-3">
        <button onClick={() => navigateMonth(-1)}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-slate-800 capitalize">
          {format(viewDate, "MMMM yyyy", { locale: vi })}
        </span>
        <button onClick={() => navigateMonth(1)}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Manager: actions + totals */}
      {isManager && (
        <>
          <div className="flex items-center gap-3">
            <button onClick={() => calculate()}
              disabled={calculating}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
              {calculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Tính lại tất cả
            </button>
            <p className="text-xs text-slate-400">
              {summaries.length} nhân viên · Nhấn để recalculate từ dữ liệu thực tế
            </p>
          </div>

          {/* Totals row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Tổng giờ credited", value: `${totals.creditedHours.toFixed(1)}h`, color: "text-blue-600" },
              { label: "Tổng lương cơ bản", value: formatCurrency(totals.salaryCalc, "€"), color: "text-slate-700" },
              { label: "Tổng bonus", value: formatCurrency(totals.bonusCalc, "€"), color: "text-green-600" },
              { label: "Tổng phải trả", value: formatCurrency(totals.totalCalc, "€"), color: "text-blue-700" },
            ].map(s => (
              <div key={s.label} className="bg-white border border-slate-200 rounded-xl px-4 py-3">
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className={cn("text-lg font-bold mt-0.5", s.color)}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Manager: table view */}
          {summaries.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
              <BarChart2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Chưa có dữ liệu. Nhấn <strong>Tính lại tất cả</strong> để tính.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      <th className="text-left px-4 py-2.5">Nhân viên</th>
                      <th className="text-center px-3 py-2.5">Giờ TT</th>
                      <th className="text-center px-3 py-2.5">Giờ Thực</th>
                      <th className="text-center px-3 py-2.5">Δ</th>
                      <th className="text-right px-3 py-2.5">Lương calc</th>
                      <th className="text-right px-3 py-2.5">Bonus</th>
                      <th className="text-right px-3 py-2.5">Tổng</th>
                      <th className="text-center px-3 py-2.5">Score</th>
                      <th className="text-center px-3 py-2.5">Tasks</th>
                      <th className="text-center px-3 py-2.5">Xác nhận</th>
                      <th className="text-right px-4 py-2.5">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {summaries.map(s => {
                      const dh = n(s.deltaHours);
                      const confirmed = !!s.confirmedAt;
                      return (
                        <tr key={s.id} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-2.5">
                            <p className="font-medium text-slate-900 text-xs">{s.employee.fullName}</p>
                            <p className="text-xs text-slate-400">{s.employee.department}</p>
                          </td>
                          <td className="px-3 py-2.5 text-center text-xs font-mono">{h(s.creditedHours)}h</td>
                          <td className="px-3 py-2.5 text-center text-xs font-mono">{h(s.workHoursReal)}h</td>
                          <td className="px-3 py-2.5 text-center">
                            <span className={cn("text-xs font-medium",
                              Math.abs(dh) < 1 ? "text-green-600" : dh > 0 ? "text-blue-600" : "text-red-500")}>
                              {dh > 0 ? "+" : ""}{dh.toFixed(1)}h
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right text-xs font-mono">{formatCurrency(n(s.salaryCalc), "€")}</td>
                          <td className="px-3 py-2.5 text-right text-xs font-mono text-green-600">{formatCurrency(n(s.bonusCalc), "€")}</td>
                          <td className="px-3 py-2.5 text-right text-xs font-bold text-blue-700">{formatCurrency(n(s.totalCalc), "€")}</td>
                          <td className="px-3 py-2.5 text-center">
                            {s.totalScore ? (
                              <span className={cn("text-xs font-bold",
                                n(s.totalScore) >= 8 ? "text-green-600" : n(s.totalScore) >= 6 ? "text-blue-600" : "text-orange-500")}>
                                {n(s.totalScore).toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-300">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-center text-xs text-slate-500">
                            {s.completedTasks}/{s.totalTasks}
                            {s.overdueTasks > 0 && (
                              <span className="text-red-500 ml-1">({s.overdueTasks}!)</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            {confirmed ? (
                              <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                <CheckCircle2 className="w-3 h-3" />Đã xác nhận
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 flex items-center justify-center gap-1">
                                <Clock className="w-3 h-3" />Chưa
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => calculate(s.employeeId)}
                                disabled={calculating}
                                className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition" title="Tính lại">
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setScoringItem(s)}
                                className="p-1.5 rounded-lg hover:bg-yellow-50 text-yellow-500 transition" title="Đánh giá">
                                <Star className="w-3.5 h-3.5" />
                              </button>
                              {!confirmed && (
                                <button onClick={() => confirmSummary(s.id)}
                                  disabled={confirmingId === s.id}
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 text-xs font-medium transition">
                                  {confirmingId === s.id
                                    ? <Loader2 className="w-3 h-3 animate-spin" />
                                    : <CheckCircle2 className="w-3 h-3" />}
                                  Xác nhận
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Employee: self view */}
      {!isManager && (
        <div className="space-y-4">
          {!myRecord ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
              <BarChart2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Chưa có dữ liệu tháng này. Manager sẽ tính sau khi kết thúc tháng.</p>
            </div>
          ) : (
            <>
              {/* Hours section */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Giờ credited", value: `${h(myRecord.creditedHours)}h`, sub: "Work Report", color: "text-blue-600" },
                  { label: "Giờ thực làm", value: `${h(myRecord.workHoursReal)}h`, sub: "Office Time", color: "text-slate-700" },
                  { label: "Giờ học", value: `${h(myRecord.learnHours)}h`, sub: "Task 2001/2002", color: "text-purple-600" },
                  {
                    label: "Chênh lệch", value: `${n(myRecord.deltaHours) >= 0 ? "+" : ""}${h(myRecord.deltaHours)}h`,
                    sub: "Credited − Thực làm",
                    color: Math.abs(n(myRecord.deltaHours)) < 1 ? "text-green-600" : "text-orange-500",
                  },
                ].map(c => (
                  <div key={c.label} className="bg-white border border-slate-200 rounded-xl px-4 py-3">
                    <p className="text-xs text-slate-500">{c.label}</p>
                    <p className={cn("text-xl font-bold mt-0.5", c.color)}>{c.value}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{c.sub}</p>
                  </div>
                ))}
              </div>

              {/* Salary section */}
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">Lương tháng {month}/{year}</h3>
                <div className="space-y-2">
                  {[
                    { label: "Lương cơ bản (calc)", value: formatCurrency(n(myRecord.salaryCalc), "€") },
                    { label: "Bonus", value: formatCurrency(n(myRecord.bonusCalc), "€"), color: "text-green-600" },
                    { label: "Tổng (calc)", value: formatCurrency(n(myRecord.totalCalc), "€"), bold: true, color: "text-blue-700" },
                    { label: "Đã nhận", value: formatCurrency(n(myRecord.moneyReceived), "€"), divider: true },
                    {
                      label: "Chênh lệch",
                      value: formatCurrency(n(myRecord.deltaMoney), "€"),
                      color: n(myRecord.deltaMoney) === 0 ? "text-green-600" : "text-orange-500",
                    },
                  ].map((row, i) => (
                    <div key={i}>
                      {row.divider && <div className="border-t border-slate-100 my-2" />}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">{row.label}</span>
                        <span className={cn(row.bold && "font-bold text-base", row.color ?? "text-slate-800")}>
                          {row.value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Work stats */}
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">Thống kê công việc</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Tổng tasks", value: myRecord.totalTasks },
                    { label: "Hoàn thành", value: myRecord.completedTasks, color: "text-green-600" },
                    { label: "Đang mở", value: myRecord.openTasks, color: "text-blue-600" },
                    { label: "Quá hạn", value: myRecord.overdueTasks, color: myRecord.overdueTasks > 0 ? "text-red-500" : "text-slate-500" },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <p className={cn("text-2xl font-bold", s.color ?? "text-slate-700")}>{s.value}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
                {/* Completion rate bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Tỷ lệ hoàn thành</span>
                    <span className="font-medium">{n(myRecord.completionRate).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, n(myRecord.completionRate))}%` }} />
                  </div>
                </div>
              </div>

              {/* Performance scores */}
              {myRecord.totalScore && (
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-800">Đánh giá hiệu suất</h3>
                    <span className={cn(
                      "text-xl font-bold",
                      n(myRecord.totalScore) >= 8 ? "text-green-600" : n(myRecord.totalScore) >= 6 ? "text-blue-600" : "text-orange-500"
                    )}>
                      {n(myRecord.totalScore).toFixed(1)}<span className="text-sm font-normal text-slate-400">/10</span>
                    </span>
                  </div>
                  <div className="space-y-2">
                    {(Object.keys(SCORE_LABELS) as string[]).map(key => {
                      const val = n((myRecord as any)[key]);
                      if (!val) return null;
                      return (
                        <div key={key} className="flex items-center gap-3">
                          <span className="text-xs text-slate-500 w-40">{SCORE_LABELS[key]}</span>
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={cn("h-full rounded-full", val >= 8 ? "bg-green-500" : val >= 6 ? "bg-blue-500" : "bg-orange-400")}
                              style={{ width: `${val * 10}%` }} />
                          </div>
                          <span className="text-xs font-bold text-slate-700 w-6 text-right">{val}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Status */}
              {myRecord.confirmedAt ? (
                <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <CheckCircle2 className="w-4 h-4" />
                  Đã xác nhận bởi {myRecord.confirmedBy?.fullName}
                  {" · "}{format(new Date(myRecord.confirmedAt), "dd/MM/yyyy HH:mm")}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-yellow-600 text-sm bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
                  <Clock className="w-4 h-4" />
                  Chờ manager xác nhận
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Score modal */}
      {scoringItem && (
        <ScoreModal
          summary={{
            ...scoringItem,
            scoreWorkSpeed: scoringItem.scoreWorkSpeed != null ? Number(scoringItem.scoreWorkSpeed) : null,
            scoreQuality: scoringItem.scoreQuality != null ? Number(scoringItem.scoreQuality) : null,
            scoreLearning: scoringItem.scoreLearning != null ? Number(scoringItem.scoreLearning) : null,
            scoreDeadlines: scoringItem.scoreDeadlines != null ? Number(scoringItem.scoreDeadlines) : null,
            scoreInitiative: scoringItem.scoreInitiative != null ? Number(scoringItem.scoreInitiative) : null,
            totalScore: scoringItem.totalScore != null ? Number(scoringItem.totalScore) : null,
          }}
          onClose={() => setScoringItem(null)}
          onSaved={item => { updateSummary(item); setScoringItem(null); }}
        />
      )}
    </div>
  );
}
