"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, RefreshCw, AlertTriangle, CheckCircle2, Users, Clock } from "lucide-react";
import type { WorkloadResponse, ForecastResponse, SkillLoadResponse } from "@/lib/capacity";
import { WorkloadHeatmap } from "./workload-heatmap";
import { ForecastTable } from "./forecast-table";
import { SkillLoadMatrix } from "./skill-load-matrix";
import { cn } from "@/lib/utils";

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function CapacityClient() {
  const [workload, setWorkload] = useState<WorkloadResponse | null>(null);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [skillLoad, setSkillLoad] = useState<SkillLoadResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [startDate, setStartDate] = useState<Date>(() => new Date());

  const fetchAll = useCallback(async (sd: Date) => {
    const startParam = ymd(sd);
    const [wl, fc, sk] = await Promise.all([
      fetch(`/api/capacity/workload?startDate=${startParam}&days=14`).then(r => r.json()),
      fetch(`/api/capacity/forecast`).then(r => r.json()),
      fetch(`/api/capacity/skill-load`).then(r => r.json()),
    ]);
    setWorkload(wl.data ?? null);
    setForecast(fc.data ?? null);
    setSkillLoad(sk.data ?? null);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchAll(startDate).finally(() => setLoading(false));
  }, [fetchAll, startDate]);

  async function refresh() {
    setRefreshing(true);
    try { await fetchAll(startDate); } finally { setRefreshing(false); }
  }

  function shiftStart(deltaDays: number) {
    if (deltaDays === 0) setStartDate(new Date());
    else {
      const next = new Date(startDate);
      next.setDate(next.getDate() + deltaDays);
      setStartDate(next);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải capacity…
      </div>
    );
  }

  const overloaded = workload?.employees.filter(e => e.avgUtilization > 100).length ?? 0;
  const free = workload?.employees.filter(e => e.avgUtilization < 50).length ?? 0;
  const totalBacklogH = forecast ? Math.round(forecast.team.totalBacklogMinutes / 60) : 0;
  const teamEtaW = forecast?.team.etaWeeks;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Capacity & Workload</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Heatmap tải · Forecast clear backlog · Gợi ý assignee theo skill + tải
          </p>
        </div>
        <button onClick={refresh} disabled={refreshing}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
          {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Quá tải (>100%)", value: overloaded, color: overloaded > 0 ? "text-red-600" : "text-slate-700", icon: AlertTriangle, iconColor: "text-red-500" },
          { label: "Rảnh (<50%)", value: free, color: "text-green-600", icon: CheckCircle2, iconColor: "text-green-500" },
          { label: "Backlog team", value: `${totalBacklogH}h`, color: "text-slate-700", icon: Clock, iconColor: "text-blue-500" },
          { label: "ETA team", value: teamEtaW == null ? "—" : `${teamEtaW}w`, color: teamEtaW == null ? "text-slate-400" : teamEtaW <= 4 ? "text-green-600" : teamEtaW <= 8 ? "text-orange-600" : "text-red-600", icon: Users, iconColor: "text-violet-500" },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">{s.label}</p>
              <s.icon className={cn("w-4 h-4", s.iconColor)} />
            </div>
            <p className={cn("text-2xl font-bold mt-1", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {workload && <WorkloadHeatmap data={workload} onShiftStart={shiftStart} />}
      {forecast && <ForecastTable data={forecast} />}
      {skillLoad && <SkillLoadMatrix data={skillLoad} />}
    </div>
  );
}
