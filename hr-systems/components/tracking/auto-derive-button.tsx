"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";

interface Suggestion {
  startWork1: string | null;
  endWorkday: string | null;
  actualWorked: number;
}

interface Stats {
  sessionCount: number;
  activeSeconds: number;
  idleSeconds: number;
}

interface AutoDeriveResponse {
  data: {
    suggestion: { startWork1: string | null; endWorkday: string | null; actualWorked: number };
    stats: Stats;
  };
}

interface Props {
  /** YYYY-MM-DD */
  date: string;
  employeeId: number;
  /**
   * Callback nhận thời gian gợi ý dạng HH:MM (đã convert sang local time).
   * Component cha có thể fill vào form/edit state.
   */
  onApply: (s: { startWork1: string; endWorkday: string }) => void;
  className?: string;
}

function toHHMM(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/**
 * Nút "Gợi ý từ activity": gọi /api/office-time/auto-derive, hiển thị
 * gợi ý startWork1 / endWorkday / số phút active và cho user áp dụng.
 */
export function AutoDeriveButton({ date, employeeId, onApply, className = "" }: Props) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchSuggestion() {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/office-time/auto-derive?date=${date}&employeeId=${employeeId}`;
      const res = await fetch(url);
      const json = (await res.json()) as AutoDeriveResponse | { error: string };
      if (!res.ok || !("data" in json)) {
        setError(("error" in json && (json as any).error) || "Không lấy được gợi ý");
        return;
      }
      setSuggestion(json.data.suggestion);
      setStats(json.data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function apply() {
    if (!suggestion) return;
    onApply({
      startWork1: toHHMM(suggestion.startWork1),
      endWorkday: toHHMM(suggestion.endWorkday),
    });
    // reset UI sau khi áp dụng
    setSuggestion(null);
    setStats(null);
  }

  if (suggestion) {
    const active = Math.floor((stats?.activeSeconds ?? 0) / 60);
    return (
      <div className={`inline-flex items-center gap-2 px-2.5 py-1.5 bg-violet-50 border border-violet-200 rounded-lg ${className}`}>
        <Sparkles className="w-3.5 h-3.5 text-violet-600" />
        <span className="text-[12px] text-violet-800">
          {toHHMM(suggestion.startWork1) || "—"} → {toHHMM(suggestion.endWorkday) || "—"}
          {" · "}
          <span className="font-semibold">{active}p</span> active
        </span>
        <button
          onClick={apply}
          className="text-[12px] font-semibold text-white bg-violet-600 hover:bg-violet-700 px-2 py-0.5 rounded transition"
        >
          Áp dụng
        </button>
        <button
          onClick={() => { setSuggestion(null); setStats(null); }}
          className="text-[12px] text-violet-700 hover:text-violet-900 px-1"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={fetchSuggestion}
      disabled={loading}
      title="Lấy gợi ý từ session + activity của ngày này"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 text-[12px] font-medium transition disabled:opacity-50 ${className}`}
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
      {error ?? "Gợi ý từ activity"}
    </button>
  );
}
