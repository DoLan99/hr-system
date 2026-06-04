"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, Loader2 } from "lucide-react";

interface TrendPoint {
  month: number;
  year: number;
  label: string;
  scoreWorkSpeed: number | null;
  scoreQuality: number | null;
  scoreLearning: number | null;
  scoreDeadlines: number | null;
  scoreInitiative: number | null;
  totalScore: number | null;
  completionRate: number | null;
  creditedHours: number | null;
}

const SERIES = [
  { key: "totalScore", label: "Tổng", color: "#2563eb", strokeWidth: 2.5 },
  { key: "scoreWorkSpeed", label: "Tốc độ", color: "#22c55e" },
  { key: "scoreQuality", label: "Chất lượng", color: "#f59e0b" },
  { key: "scoreDeadlines", label: "Đúng hạn", color: "#ef4444" },
  { key: "scoreLearning", label: "Học hỏi", color: "#8b5cf6" },
  { key: "scoreInitiative", label: "Chủ động", color: "#ec4899" },
] as const;

export function TrendChart({
  employeeId,
  employeeName,
  endMonth,
  endYear,
  months = 6,
}: {
  employeeId: number;
  employeeName?: string;
  endMonth: number;
  endYear: number;
  months?: number;
}) {
  const [data, setData] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/summary/trend?employeeId=${employeeId}&months=${months}&endMonth=${endMonth}&endYear=${endYear}`)
      .then(r => r.json())
      .then(json => { if (!cancelled) setData(json.data ?? []); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [employeeId, endMonth, endYear, months]);

  const hasAnyData = data.some(d => d.totalScore != null);

  function toggleSeries(key: string) {
    setHiddenSeries(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Xu hướng hiệu suất {months} tháng
          </h3>
        </div>
        {employeeName && <span className="text-xs text-slate-500">{employeeName}</span>}
      </div>

      {loading ? (
        <div className="h-[240px] flex items-center justify-center text-slate-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin mr-2" /> Đang tải…
        </div>
      ) : !hasAnyData ? (
        <div className="h-[240px] flex items-center justify-center text-slate-400 text-sm text-center px-6">
          Chưa có lịch sử điểm. Khi quản lý chấm điểm các tháng tiếp theo, biểu đồ sẽ hiển thị tại đây.
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} ticks={[0, 2, 4, 6, 8, 10]} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                formatter={(v: any) => v == null ? "—" : Number(v).toFixed(1)}
              />
              {SERIES.map(s => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  stroke={s.color}
                  strokeWidth={(s as any).strokeWidth ?? 1.5}
                  dot={{ r: 3, fill: s.color }}
                  activeDot={{ r: 5 }}
                  connectNulls
                  hide={hiddenSeries.has(s.key)}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3 px-1">
            {SERIES.map(s => {
              const hidden = hiddenSeries.has(s.key);
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => toggleSeries(s.key)}
                  className={`flex items-center gap-1.5 text-[11px] transition ${hidden ? "opacity-40" : "opacity-100"} hover:opacity-100`}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                  <span className="text-slate-600 dark:text-slate-400">{s.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
