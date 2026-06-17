"use client";

import { useState } from "react";
import { FREQ_LABEL, DOW_LABEL, describeRecurrence, type RecurrenceFrequency } from "@/lib/recurrence";

type RecurrenceData = {
  id?: number;
  frequency: RecurrenceFrequency;
  interval: number;
  daysOfWeek: number[];
  dayOfMonth: number | null;
  endDate: string | null;
  maxOccurrences: number | null;
  nextRunAt: string;
  lastRunAt: string | null;
  isActive: boolean;
  occurrenceCount: number;
};

type Props = {
  taskId: number;
  recurrence: RecurrenceData | null;
  isManager: boolean;
  onSaved: (rec: RecurrenceData | null) => void;
};

const FREQ_OPTIONS: RecurrenceFrequency[] = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"];

export function RecurrenceEditor({ taskId, recurrence, isManager, onSaved }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [freq, setFreq] = useState<RecurrenceFrequency>(recurrence?.frequency ?? "WEEKLY");
  const [interval, setInterval] = useState(recurrence?.interval ?? 1);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(recurrence?.daysOfWeek ?? []);
  const [dayOfMonth, setDayOfMonth] = useState<number | null>(recurrence?.dayOfMonth ?? null);
  const [endDate, setEndDate] = useState(
    recurrence?.endDate ? new Date(recurrence.endDate).toISOString().split("T")[0] : ""
  );
  const [maxOcc, setMaxOcc] = useState<string>(recurrence?.maxOccurrences?.toString() ?? "");

  function toggleDow(d: number) {
    setDaysOfWeek((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  }

  function openEdit() {
    setFreq(recurrence?.frequency ?? "WEEKLY");
    setInterval(recurrence?.interval ?? 1);
    setDaysOfWeek(recurrence?.daysOfWeek ?? []);
    setDayOfMonth(recurrence?.dayOfMonth ?? null);
    setEndDate(recurrence?.endDate ? new Date(recurrence.endDate).toISOString().split("T")[0] : "");
    setMaxOcc(recurrence?.maxOccurrences?.toString() ?? "");
    setEditing(true);
  }

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/tasks/${taskId}/recurrence`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        frequency: freq,
        interval,
        daysOfWeek,
        dayOfMonth: freq === "MONTHLY" ? dayOfMonth : null,
        endDate: endDate || null,
        maxOccurrences: maxOcc ? Number(maxOcc) : null,
      }),
    });
    if (res.ok) {
      const j = await res.json();
      onSaved(j.data);
      setEditing(false);
    }
    setSaving(false);
  }

  async function deleteRec() {
    if (!confirm("Tắt lặp lại task này?")) return;
    setDeleting(true);
    const res = await fetch(`/api/tasks/${taskId}/recurrence`, { method: "DELETE" });
    if (res.ok) { onSaved(null); setEditing(false); }
    setDeleting(false);
  }

  if (!editing) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {recurrence ? (
          <>
            <span style={{ fontSize: "0.82rem", color: "var(--text-2)" }}>
              🔁 {describeRecurrence(recurrence.frequency, recurrence.interval, recurrence.daysOfWeek, recurrence.dayOfMonth)}
            </span>
            {recurrence.occurrenceCount > 0 && (
              <span style={{ fontSize: "0.72rem", color: "var(--text-3)" }}>
                · {recurrence.occurrenceCount} lần đã tạo
              </span>
            )}
            {recurrence.nextRunAt && (
              <span style={{ fontSize: "0.72rem", color: "var(--text-3)" }}>
                · Tiếp: {new Date(recurrence.nextRunAt).toLocaleDateString("vi-VN")}
              </span>
            )}
            {isManager && (
              <button onClick={openEdit}
                style={{ background: "none", border: "none", color: "var(--accent-ink)", fontSize: "0.75rem", cursor: "pointer", padding: "1px 4px" }}>
                Sửa
              </button>
            )}
          </>
        ) : (
          isManager ? (
            <button onClick={openEdit}
              style={{ background: "none", border: "none", color: "var(--text-3)", fontSize: "0.82rem", cursor: "pointer", padding: 0 }}>
              + Thiết lập lặp lại
            </button>
          ) : (
            <span style={{ fontSize: "0.82rem", color: "var(--text-3)" }}>Không lặp lại</span>
          )
        )}
      </div>
    );
  }

  return (
    <div style={{ background: "var(--elev)", border: "1px solid var(--border-2)", borderRadius: 8, padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Frequency */}
      <div>
        <label style={{ fontSize: "0.75rem", color: "var(--text-3)", display: "block", marginBottom: 5 }}>Tần suất</label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {FREQ_OPTIONS.map((f) => (
            <button key={f} onClick={() => setFreq(f)}
              style={{
                padding: "4px 12px", borderRadius: 20, fontSize: "0.8rem", cursor: "pointer",
                background: freq === f ? "var(--accent)" : "var(--content)",
                color: freq === f ? "var(--accent-ink)" : "var(--text-2)",
                border: `1px solid ${freq === f ? "var(--accent)" : "var(--border)"}`,
                fontWeight: freq === f ? 600 : 400,
              }}>
              {FREQ_LABEL[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Interval */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <label style={{ fontSize: "0.78rem", color: "var(--text-3)" }}>Mỗi</label>
        <input type="number" min={1} max={99} value={interval}
          onChange={(e) => setInterval(Number(e.target.value) || 1)}
          style={{ width: 52, background: "var(--content)", border: "1px solid var(--border-2)", borderRadius: 6, padding: "4px 8px", fontFamily: "inherit", fontSize: "0.84rem", color: "var(--text)", outline: "none" }} />
        <span style={{ fontSize: "0.78rem", color: "var(--text-3)" }}>
          {{ DAILY: "ngày", WEEKLY: "tuần", MONTHLY: "tháng", YEARLY: "năm" }[freq]}
        </span>
      </div>

      {/* Days of week (WEEKLY only) */}
      {freq === "WEEKLY" && (
        <div>
          <label style={{ fontSize: "0.75rem", color: "var(--text-3)", display: "block", marginBottom: 5 }}>Các ngày trong tuần</label>
          <div style={{ display: "flex", gap: 5 }}>
            {DOW_LABEL.map((label, i) => (
              <button key={i} onClick={() => toggleDow(i)}
                style={{
                  width: 34, height: 34, borderRadius: "50%", fontSize: "0.72rem", cursor: "pointer",
                  background: daysOfWeek.includes(i) ? "var(--accent)" : "var(--content)",
                  color: daysOfWeek.includes(i) ? "var(--accent-ink)" : "var(--text-3)",
                  border: `1px solid ${daysOfWeek.includes(i) ? "var(--accent)" : "var(--border)"}`,
                  fontWeight: daysOfWeek.includes(i) ? 700 : 400,
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Day of month (MONTHLY only) */}
      {freq === "MONTHLY" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: "0.78rem", color: "var(--text-3)" }}>Ngày trong tháng</label>
          <input type="number" min={1} max={31}
            value={dayOfMonth ?? ""}
            onChange={(e) => setDayOfMonth(e.target.value ? Number(e.target.value) : null)}
            placeholder="1–31"
            style={{ width: 60, background: "var(--content)", border: "1px solid var(--border-2)", borderRadius: 6, padding: "4px 8px", fontFamily: "inherit", fontSize: "0.84rem", color: "var(--text)", outline: "none" }} />
        </div>
      )}

      {/* End date */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: "0.78rem", color: "var(--text-3)", whiteSpace: "nowrap" }}>Kết thúc ngày</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            style={{ background: "var(--content)", border: "1px solid var(--border-2)", borderRadius: 6, padding: "4px 8px", fontFamily: "inherit", fontSize: "0.82rem", color: "var(--text)", outline: "none" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: "0.78rem", color: "var(--text-3)", whiteSpace: "nowrap" }}>Tối đa</label>
          <input type="number" min={1} value={maxOcc} onChange={(e) => setMaxOcc(e.target.value)}
            placeholder="∞"
            style={{ width: 60, background: "var(--content)", border: "1px solid var(--border-2)", borderRadius: 6, padding: "4px 8px", fontFamily: "inherit", fontSize: "0.82rem", color: "var(--text)", outline: "none" }} />
          <span style={{ fontSize: "0.78rem", color: "var(--text-3)" }}>lần</span>
        </div>
      </div>

      {/* Preview */}
      <div style={{ fontSize: "0.78rem", color: "var(--accent-ink)", background: "var(--accent-soft)", padding: "6px 10px", borderRadius: 6 }}>
        🔁 {describeRecurrence(freq, interval, daysOfWeek, dayOfMonth)}
        {endDate && ` · đến ${new Date(endDate).toLocaleDateString("vi-VN")}`}
        {maxOcc && ` · tối đa ${maxOcc} lần`}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8 }}>
        <button className="abtn primary" onClick={save} disabled={saving} style={{ padding: "6px 16px" }}>
          {saving ? "Đang lưu…" : "Lưu"}
        </button>
        <button className="abtn ghost" onClick={() => setEditing(false)} style={{ padding: "6px 12px" }}>Hủy</button>
        {recurrence && (
          <button className="abtn ghost" onClick={deleteRec} disabled={deleting}
            style={{ padding: "6px 12px", color: "var(--danger)", borderColor: "rgba(239,68,68,0.3)", marginLeft: "auto" }}>
            {deleting ? "Đang xóa…" : "Tắt lặp lại"}
          </button>
        )}
      </div>
    </div>
  );
}
