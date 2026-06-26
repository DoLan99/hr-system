"use client";

import { useState, useEffect, useRef } from "react";
import { useToast } from "@/lib/hooks/use-toast";

type Status = {
  checkedIn: boolean;
  checkedOut: boolean;
  checkInAt: string | null;
  checkOutAt: string | null;
  actualWorked: number | null;
};

function fmtTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function fmtWorked(minutes: number | null) {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h${m ? m + "p" : ""}` : `${m}p`;
}

export function CheckInButton() {
  const { toast } = useToast();
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/checkin")
      .then(r => r.json())
      .then(setStatus)
      .catch(() => null);
  }, []);

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function doAction(action: "in" | "out") {
    setLoading(true);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast({ title: json.error ?? "Có lỗi xảy ra", variant: "error" });
        return;
      }
      toast({ title: json.message, variant: "success" });
      // Refresh status
      const s = await fetch("/api/checkin").then(r => r.json());
      setStatus(s);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  // Trạng thái hiển thị trên nút
  const btnContent = () => {
    if (!status) return null;
    if (!status.checkedIn) {
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#94a3b8", display: "inline-block" }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--dash-text-2)" }}>Check-in</span>
        </div>
      );
    }
    if (!status.checkedOut) {
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", animation: "checkin-pulse 1.8s infinite" }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#22c55e" }}>{fmtTime(status.checkInAt)}</span>
        </div>
      );
    }
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#6582ff", display: "inline-block" }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--dash-text-2)" }}>{fmtWorked(status.actualWorked)}</span>
      </div>
    );
  };

  if (!status) return null;

  return (
    <>
      <style>{`
        @keyframes checkin-pulse {
          0%,100%{opacity:1;transform:scale(1)}
          50%{opacity:.5;transform:scale(1.3)}
        }
      `}</style>
      <div ref={dropRef} style={{ position: "relative" }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            display: "flex", alignItems: "center", height: 32, padding: "0 10px",
            borderRadius: 8, border: "1px solid var(--dash-border)",
            background: open ? "var(--dash-elev)" : "transparent",
            cursor: "pointer", gap: 4, transition: "background .15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "var(--dash-elev)")}
          onMouseLeave={e => !open && (e.currentTarget.style.background = "transparent")}
        >
          {btnContent()}
        </button>

        {open && (
          <div style={{
            position: "absolute", right: 0, top: "calc(100% + 8px)", zIndex: 50,
            background: "var(--dash-elev)", border: "1px solid var(--dash-border)",
            borderRadius: 14, padding: 16, width: 230,
            boxShadow: "0 8px 32px rgba(0,0,0,.2)",
          }}>
            {/* Header */}
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--dash-text)", marginBottom: 12 }}>
              Chấm công hôm nay
            </div>

            {/* Timeline */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
              <Row
                label="Check-in"
                value={status.checkInAt ? fmtTime(status.checkInAt) : "Chưa check-in"}
                done={!!status.checkInAt}
                color="#22c55e"
              />
              <Row
                label="Check-out"
                value={status.checkOutAt ? fmtTime(status.checkOutAt) : "Chưa check-out"}
                done={!!status.checkOutAt}
                color="#6582ff"
              />
              {status.checkedOut && status.actualWorked && (
                <Row
                  label="Thực làm"
                  value={fmtWorked(status.actualWorked)}
                  done={true}
                  color="#f59e0b"
                />
              )}
            </div>

            {/* Action buttons */}
            {!status.checkedIn && (
              <button
                onClick={() => doAction("in")}
                disabled={loading}
                style={{
                  width: "100%", padding: "9px 0", borderRadius: 10, border: "none",
                  background: "#22c55e", color: "#fff", fontSize: 13, fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer", opacity: loading ? .7 : 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                  fontFamily: "inherit",
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" width={14} height={14}>
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                {loading ? "Đang xử lý…" : "Check-in ngay"}
              </button>
            )}

            {status.checkedIn && !status.checkedOut && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 12, color: "var(--dash-text-3)", textAlign: "center" }}>
                  Đã làm việc {fmtWorked(Math.round((Date.now() - new Date(status.checkInAt!).getTime()) / 60_000))}
                </div>
                <button
                  onClick={() => doAction("out")}
                  disabled={loading}
                  style={{
                    width: "100%", padding: "9px 0", borderRadius: 10, border: "none",
                    background: "#ef4444", color: "#fff", fontSize: 13, fontWeight: 700,
                    cursor: loading ? "not-allowed" : "pointer", opacity: loading ? .7 : 1,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                    fontFamily: "inherit",
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" width={14} height={14}>
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  {loading ? "Đang xử lý…" : "Check-out"}
                </button>
              </div>
            )}

            {status.checkedIn && status.checkedOut && (
              <div style={{ textAlign: "center", fontSize: 13, color: "#22c55e", fontWeight: 600, padding: "6px 0" }}>
                ✓ Hoàn thành ca làm việc
              </div>
            )}

            <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--dash-border)", textAlign: "center" }}>
              <a href="/office-time" style={{ fontSize: 12, color: "var(--dash-accent)", textDecoration: "none" }}>
                Xem bảng chấm công →
              </a>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function Row({ label, value, done, color }: { label: string; value: string; done: boolean; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: done ? `${color}18` : "var(--dash-border)", display: "grid", placeItems: "center", flexShrink: 0 }}>
        {done
          ? <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" width={13} height={13}><polyline points="20 6 9 17 4 12"/></svg>
          : <svg viewBox="0 0 24 24" fill="none" stroke="var(--dash-text-3)" strokeWidth={2} strokeLinecap="round" width={13} height={13}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        }
      </div>
      <div>
        <div style={{ fontSize: 11, color: "var(--dash-text-3)" }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: done ? 700 : 400, color: done ? color : "var(--dash-text-3)" }}>{value}</div>
      </div>
    </div>
  );
}
