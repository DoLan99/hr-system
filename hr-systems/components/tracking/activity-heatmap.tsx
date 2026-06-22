"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

interface Cell {
  date: string; // YYYY-MM-DD
  hour: number; // 0..23
  count: number;
}

interface HeatmapData {
  employeeId: number;
  days: number;
  cells: Cell[];
  max: number;
}

interface Props {
  employeeId: number | "all";
  days?: number;
  /** Bắt đầu hiển thị từ giờ thứ X (mặc định 6 — bỏ giờ ngủ) */
  startHour?: number;
  /** Kết thúc tại giờ X (mặc định 22) */
  endHour?: number;
  className?: string;
}

// Tailwind dùng class động không được do JIT, nên dùng style backgroundColor.
function colorFor(intensity: number): string {
  if (intensity === 0) return "rgb(241, 245, 249)"; // slate-100
  // gradient emerald-100 → emerald-700
  const t = Math.min(1, intensity);
  // r: 209 → 4, g: 250 → 120, b: 229 → 87
  const r = Math.round(209 + (4 - 209) * t);
  const g = Math.round(250 + (120 - 250) * t);
  const b = Math.round(229 + (87 - 229) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function formatShortDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Heatmap hoạt động — trục Y: ngày (mới ở trên), trục X: giờ trong ngày.
 * Cường độ màu = số API request trong khung giờ đó (proxy cho mức độ
 * tích cực, vì heartbeat sinh ~1 req/phút khi user active).
 */
export function ActivityHeatmap({
  employeeId,
  days = 30,
  startHour = 6,
  endHour = 22,
  className = "",
}: Props) {
  const [data, setData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/activity/heatmap?employeeId=${employeeId}&days=${days}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.data) setData(j.data);
        else setError(j.error ?? "Lỗi tải heatmap");
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, [employeeId, days]);

  const grid = useMemo(() => {
    if (!data) return null;

    // Tạo dải ngày từ ngày cũ nhất → mới nhất
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dates: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().slice(0, 10));
    }

    const cellMap = new Map<string, number>();
    for (const c of data.cells) {
      cellMap.set(`${c.date}|${c.hour}`, c.count);
    }
    return { dates, cellMap };
  }, [data, days]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-48 text-slate-400 ${className}`}>
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  if (error || !data || !grid) {
    return <div className={`text-sm text-red-500 ${className}`}>{error ?? "Không có dữ liệu"}</div>;
  }

  const hours: number[] = [];
  for (let h = startHour; h <= endHour; h++) hours.push(h);

  return (
    <div className={`${className}`}>
      <div className="overflow-x-auto">
        <table className="text-[10px] border-separate border-spacing-[2px]">
          <thead>
            <tr>
              <th className="w-12" />
              {hours.map((h) => (
                <th key={h} className="font-normal text-slate-400 w-5 text-center">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.dates.map((date) => (
              <tr key={date}>
                <td className="text-slate-500 pr-2 text-right whitespace-nowrap">{formatShortDate(date)}</td>
                {hours.map((h) => {
                  const count = grid.cellMap.get(`${date}|${h}`) ?? 0;
                  const intensity = data.max > 0 ? count / data.max : 0;
                  return (
                    <td
                      key={h}
                      title={`${date} ${h}:00 — ${count} req`}
                      className="w-5 h-5 rounded-sm"
                      style={{ backgroundColor: colorFor(intensity) }}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-1.5 mt-2 text-[10px] text-slate-500">
        <span>Ít</span>
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
          <span
            key={i}
            className="w-3 h-3 rounded-sm inline-block"
            style={{ backgroundColor: colorFor(t) }}
          />
        ))}
        <span>Nhiều</span>
      </div>
    </div>
  );
}
