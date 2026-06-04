"use client";

import { useMemo, useState } from "react";
import { Calendar, Users, ChevronLeft, ChevronRight } from "lucide-react";
import type { WorkloadResponse, DayLoad } from "@/lib/capacity";
import { cn } from "@/lib/utils";

function utilColor(util: number, isBusiness: boolean): string {
  if (!isBusiness) return "bg-slate-50 dark:bg-slate-900/40";
  if (util === 0) return "bg-slate-100 dark:bg-slate-800";
  if (util < 50) return "bg-green-200 dark:bg-green-900/60";
  if (util < 80) return "bg-lime-300 dark:bg-lime-800/60";
  if (util <= 100) return "bg-yellow-300 dark:bg-yellow-700/70";
  if (util <= 120) return "bg-orange-400 dark:bg-orange-700/80";
  return "bg-red-500 dark:bg-red-700/90 text-white";
}

function utilTextColor(util: number): string {
  if (util > 100) return "text-white font-bold";
  if (util > 80) return "text-slate-900 font-semibold";
  return "text-slate-700 dark:text-slate-300";
}

function formatDayLabel(dateStr: string): { day: string; weekday: string; isToday: boolean; isWeekend: boolean } {
  const d = new Date(dateStr);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
  const weekdays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  return {
    day: String(d.getDate()).padStart(2, "0"),
    weekday: weekdays[d.getDay()],
    isToday,
    isWeekend,
  };
}

export function WorkloadHeatmap({ data, onShiftStart }: {
  data: WorkloadResponse;
  onShiftStart: (deltaDays: number) => void;
}) {
  const [hoverCell, setHoverCell] = useState<{ emp: string; day: DayLoad } | null>(null);

  const sorted = useMemo(
    () => [...data.employees].sort((a, b) => b.avgUtilization - a.avgUtilization),
    [data.employees],
  );

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Workload Heatmap {data.dayCount} ngày
          </h3>
          <span className="text-xs text-slate-400">
            {data.startDate} → {data.endDate}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onShiftStart(-7)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition" title="Lùi 7 ngày">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => onShiftStart(0)} className="px-2 py-1 text-xs rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 transition">
            Hôm nay
          </button>
          <button onClick={() => onShiftStart(7)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition" title="Tiến 7 ngày">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-400">
          <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          Chưa có nhân viên ACTIVE
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60">
                <th className="text-left px-3 py-2 font-semibold text-slate-500 dark:text-slate-400 sticky left-0 bg-slate-50 dark:bg-slate-800/60 min-w-[160px]">
                  Nhân viên
                </th>
                <th className="text-center px-2 py-2 font-semibold text-slate-500 dark:text-slate-400 min-w-[60px]">
                  TB
                </th>
                {sorted[0].days.map(d => {
                  const lbl = formatDayLabel(d.date);
                  return (
                    <th
                      key={d.date}
                      className={cn(
                        "text-center px-1 py-1 font-medium min-w-[36px]",
                        lbl.isToday ? "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300" : "text-slate-500",
                        lbl.isWeekend && "text-slate-300",
                      )}
                    >
                      <div className="text-[10px] leading-tight">{lbl.weekday}</div>
                      <div className="text-[11px] font-semibold leading-tight">{lbl.day}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sorted.map(emp => (
                <tr key={emp.employeeId}>
                  <td className="px-3 py-2 sticky left-0 bg-white dark:bg-slate-900">
                    <p className="font-medium text-slate-900 dark:text-slate-100 text-xs">{emp.fullName}</p>
                    <p className="text-[10px] text-slate-400">{emp.department ?? ""}</p>
                  </td>
                  <td className={cn(
                    "text-center font-mono font-bold text-xs",
                    emp.avgUtilization > 100 ? "text-red-600" :
                      emp.avgUtilization > 80 ? "text-orange-600" :
                        emp.avgUtilization > 50 ? "text-green-600" : "text-slate-500",
                  )}>
                    {emp.avgUtilization}%
                  </td>
                  {emp.days.map(d => {
                    const lbl = formatDayLabel(d.date);
                    return (
                      <td
                        key={d.date}
                        className={cn(
                          "text-center px-0.5 py-1 cursor-pointer relative",
                          utilColor(d.utilization, !lbl.isWeekend),
                          lbl.isToday && "ring-2 ring-blue-500 ring-inset",
                        )}
                        onMouseEnter={() => setHoverCell({ emp: emp.fullName, day: d })}
                        onMouseLeave={() => setHoverCell(null)}
                      >
                        {lbl.isWeekend ? null : (
                          <span className={cn("text-[10px]", utilTextColor(d.utilization))}>
                            {d.utilization > 0 ? `${d.utilization}` : ""}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend + hover tooltip */}
      <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span>Util %:</span>
          {[
            { label: "<50", cls: "bg-green-200" },
            { label: "50-80", cls: "bg-lime-300" },
            { label: "80-100", cls: "bg-yellow-300" },
            { label: "100-120", cls: "bg-orange-400" },
            { label: ">120", cls: "bg-red-500" },
          ].map(l => (
            <span key={l.label} className="flex items-center gap-1">
              <span className={cn("w-3 h-3 rounded", l.cls)} />
              {l.label}
            </span>
          ))}
        </div>
        {hoverCell && (
          <div className="text-[11px] text-slate-600 dark:text-slate-400">
            <strong>{hoverCell.emp}</strong> · {hoverCell.day.date} ·{" "}
            {Math.round(hoverCell.day.loadMinutes / 60 * 10) / 10}h ·{" "}
            {hoverCell.day.taskCount} task · <strong>{hoverCell.day.utilization}%</strong>
          </div>
        )}
      </div>
    </div>
  );
}
