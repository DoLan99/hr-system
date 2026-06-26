"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";

interface DayRecord {
  id?: number;
  startWork1: string | null;
  startLunch: string | null;
  startWork2: string | null;
  endWorkday: string | null;
  actualWorked: number | null;
  approvalStatus?: string;
}

function fmtTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try { return format(new Date(iso), "HH:mm"); } catch { return "—"; }
}

function fmtMins(m: number | null): string {
  if (!m) return "—";
  const h = Math.floor(m / 60), min = m % 60;
  return h + "h" + (min ? min + "p" : "");
}

function lateMinutes(startWork1: string | null): number {
  if (!startWork1) return 0;
  const d = new Date(startWork1);
  return Math.max(0, d.getHours() * 60 + d.getMinutes() - 9 * 60);
}

export function TodayPanel() {
  const [record, setRecord] = useState<DayRecord | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const todayStr = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    fetch(`/api/office-time?month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`)
      .then(r => r.json())
      .then(json => {
        const today = (json.data ?? []).find((r: DayRecord & { date: string }) =>
          r.date?.slice(0, 10) === todayStr
        );
        setRecord(today ?? { startWork1: null, startLunch: null, startWork2: null, endWorkday: null, actualWorked: null });
      })
      .catch(() => null);
  }, []);

  async function punch(checkpoint: "startWork1" | "startLunch" | "startWork2" | "endWorkday") {
    if (loading) return;
    setLoading(checkpoint);
    try {
      const res = await fetch("/api/office-time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: todayStr, checkpoint }),
      });
      const json = await res.json();
      if (json.data) setRecord(json.data);
    } finally { setLoading(null); }
  }

  if (!record) return null;

  const lateMin = lateMinutes(record.startWork1);
  const isWorking = record.startWork1 && !record.endWorkday;

  const checkpoints = [
    { key: "startWork1", label: "CHECK-IN", value: record.startWork1 },
    { key: "startLunch", label: "NGHỈ TRƯA", value: record.startLunch },
    { key: "startWork2", label: "BUỔI CHIỀU", value: record.startWork2 },
    { key: "endWorkday", label: "CHECK-OUT", value: record.endWorkday },
  ] as const;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 0,
      background: "var(--dash-side)", border: "1px solid var(--dash-border)",
      borderRadius: 14, padding: "10px 20px",
      marginBottom: 20, overflow: "hidden",
    }}>
      {/* Left: Hôm nay badge + timeline */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1, minWidth: 0, flexWrap: "wrap" }}>
        {/* Badge */}
        <span style={{
          fontSize: 12, fontWeight: 800, padding: "5px 12px", borderRadius: 20,
          background: "var(--dash-accent)", color: "#fff", flexShrink: 0,
        }}>Hôm nay</span>

        {/* Checkpoints */}
        {checkpoints.map((cp, i) => (
          <div key={cp.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {i > 0 && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width={14} height={14} style={{ color: "var(--dash-text-3)", flexShrink: 0 }}>
                <path d="M5 12h14M13 6l6 6-6 6"/>
              </svg>
            )}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--dash-text-3)", letterSpacing: ".06em", marginBottom: 2 }}>
                {cp.label}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                {cp.key === "endWorkday" && !cp.value && isWorking ? (
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#22c55e", display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 10 }}>▶</span> đang làm
                  </span>
                ) : cp.value ? (
                  <span style={{ fontSize: 15, fontWeight: 800, color: cp.key === "startWork1" ? "#f59e0b" : cp.key === "endWorkday" ? "var(--dash-text)" : "var(--dash-text)", fontFamily: "var(--font-mono, monospace)" }}>
                    {fmtTime(cp.value)}
                  </span>
                ) : (
                  <span style={{ fontSize: 14, fontWeight: 500, color: "var(--dash-text-3)" }}>—</span>
                )}

                {cp.key === "startWork1" && lateMin > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", background: "rgba(239,68,68,.12)", padding: "1px 6px", borderRadius: 5 }}>
                    +{lateMin}ph
                  </span>
                )}
                {cp.key === "endWorkday" && record.actualWorked && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--dash-accent)" }}>
                    {fmtMins(record.actualWorked)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Right: action buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: 24 }}>
        {!record.startWork1 && (
          <PunchBtn
            label="☀ Check-in"
            color="#22c55e" bg="rgba(34,197,94,.15)" border="rgba(34,197,94,.3)"
            loading={loading === "startWork1"}
            onClick={() => punch("startWork1")}
          />
        )}
        {record.startWork1 && !record.startLunch && (
          <PunchBtn
            label="☕ Nghỉ trưa"
            color="#f59e0b" bg="rgba(245,158,11,.15)" border="rgba(245,158,11,.3)"
            loading={loading === "startLunch"}
            onClick={() => punch("startLunch")}
          />
        )}
        {record.startLunch && !record.startWork2 && (
          <PunchBtn
            label="▶ Làm chiều"
            color="#22c55e" bg="rgba(34,197,94,.15)" border="rgba(34,197,94,.3)"
            loading={loading === "startWork2"}
            onClick={() => punch("startWork2")}
          />
        )}
        {record.startWork1 && !record.endWorkday && (
          <PunchBtn
            label="🌙 Check-out"
            color="#6582ff" bg="rgba(101,130,255,.15)" border="rgba(101,130,255,.3)"
            loading={loading === "endWorkday"}
            onClick={() => punch("endWorkday")}
          />
        )}
        {record.endWorkday && (
          <span style={{ fontSize: 13, fontWeight: 600, color: "#22c55e", padding: "0 4px" }}>
            ✓ Hoàn thành · {fmtMins(record.actualWorked)}
          </span>
        )}
      </div>
    </div>
  );
}

function PunchBtn({ label, color, bg, border, loading, onClick }: {
  label: string; color: string; bg: string; border: string; loading: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        height: 34, padding: "0 16px", borderRadius: 20,
        border: `1px solid ${border}`, background: bg,
        color, fontSize: 13, fontWeight: 700,
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1,
        fontFamily: "inherit", whiteSpace: "nowrap",
        transition: "opacity .15s",
      }}
    >
      {loading ? "…" : label}
    </button>
  );
}
