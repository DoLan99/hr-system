"use client";

import { format } from "date-fns";
import { vi as viLocale } from "date-fns/locale";
import { TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { ForecastResponse } from "@/lib/capacity";
import { cn } from "@/lib/utils";

function fmtHours(min: number): string {
  return `${(min / 60).toFixed(1)}h`;
}

function confColor(c: "low" | "medium" | "high"): string {
  if (c === "high") return "bg-green-500";
  if (c === "medium") return "bg-blue-500";
  return "bg-slate-300";
}

function etaIcon(weeks: number | null): { icon: typeof CheckCircle2; color: string } {
  if (weeks == null) return { icon: AlertTriangle, color: "text-slate-400" };
  if (weeks <= 2) return { icon: CheckCircle2, color: "text-green-600" };
  if (weeks <= 4) return { icon: TrendingUp, color: "text-blue-600" };
  if (weeks <= 8) return { icon: TrendingUp, color: "text-orange-600" };
  return { icon: AlertTriangle, color: "text-red-600" };
}

export function ForecastTable({ data }: { data: ForecastResponse }) {
  const sorted = [...data.employees].sort((a, b) => (b.etaWeeks ?? -1) - (a.etaWeeks ?? -1));

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Forecast clear backlog
          </h3>
        </div>
        <span className="text-xs text-slate-400">
          Velocity = trung bình 4 tuần
        </span>
      </div>

      {/* Team summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 py-4 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
        <div>
          <p className="text-[11px] text-slate-500">Backlog team</p>
          <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
            {fmtHours(data.team.totalBacklogMinutes)}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-slate-500">Velocity/tuần</p>
          <p className="text-lg font-bold text-blue-600">
            {fmtHours(data.team.totalVelocityPerWeek)}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-slate-500">ETA team</p>
          <p className={cn(
            "text-lg font-bold",
            data.team.etaWeeks == null ? "text-slate-400" :
              data.team.etaWeeks <= 4 ? "text-green-600" :
                data.team.etaWeeks <= 8 ? "text-orange-600" : "text-red-600",
          )}>
            {data.team.etaWeeks == null ? "—" : `${data.team.etaWeeks} tuần`}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-slate-500">Ngày clear dự kiến</p>
          <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
            {data.team.etaDate ? format(new Date(data.team.etaDate), "dd/MM/yyyy", { locale: viLocale }) : "—"}
          </p>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-400">Không có nhân viên</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400">
                <th className="text-left px-4 py-2">Nhân viên</th>
                <th className="text-center px-3 py-2">Backlog</th>
                <th className="text-center px-3 py-2">Task chờ</th>
                <th className="text-center px-3 py-2">Velocity/tuần</th>
                <th className="text-center px-3 py-2">ETA</th>
                <th className="text-center px-3 py-2">Ngày clear</th>
                <th className="text-center px-3 py-2">Tin cậy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sorted.map(emp => {
                const { icon: Icon, color } = etaIcon(emp.etaWeeks);
                return (
                  <tr key={emp.employeeId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-2">
                      <p className="font-medium text-slate-900 dark:text-slate-100 text-xs">{emp.fullName}</p>
                      <p className="text-[10px] text-slate-400">{emp.department ?? ""}</p>
                    </td>
                    <td className="text-center font-mono">{fmtHours(emp.backlogMinutes)}</td>
                    <td className="text-center">{emp.backlogTasks}</td>
                    <td className="text-center font-mono text-blue-600">
                      {emp.velocityMinutesPerWeek > 0 ? fmtHours(emp.velocityMinutesPerWeek) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="text-center">
                      <span className={cn("inline-flex items-center gap-1 font-bold", color)}>
                        <Icon className="w-3 h-3" />
                        {emp.etaWeeks == null ? "—" : `${emp.etaWeeks}w`}
                      </span>
                    </td>
                    <td className="text-center text-slate-600 dark:text-slate-400">
                      {emp.etaDate ? format(new Date(emp.etaDate), "dd/MM/yyyy") : "—"}
                    </td>
                    <td className="text-center">
                      <span className={cn("inline-block w-2 h-2 rounded-full", confColor(emp.confidence))} title={emp.confidence} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
