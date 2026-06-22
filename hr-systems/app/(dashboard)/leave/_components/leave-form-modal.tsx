"use client";

import { useState } from "react";
import { format } from "date-fns";

interface Employee { id: number; fullName: string }

interface LeaveItem {
  id: number;
  date: string;
  type: string;
  requestedHours: number | string;
  reason?: string | null;
  evidenceLink?: string | null;
  employeeId: number;
}

interface Props {
  item: LeaveItem | null;
  employees: Employee[];
  isManager: boolean;
  currentUserId: number;
  onClose: () => void;
  onSaved: (item: any) => void;
}

const LEAVE_TYPES = [
  { value: "VACATION", label: "Nghỉ phép năm", cls: "lt-annual",   color: "#3B5BDB" },
  { value: "ILLNESS",  label: "Nghỉ ốm",       cls: "lt-sick",     color: "#fbbf24" },
  { value: "HOLIDAY",  label: "Nghỉ lễ",       cls: "lt-personal", color: "#a78bfa" },
  { value: "OTHER",    label: "Khác",          cls: "lt-unpaid",   color: "#94a3b8" },
];

export function LeaveFormModal({ item, employees, isManager, currentUserId, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    date: item ? String(item.date).slice(0, 10) : format(new Date(), "yyyy-MM-dd"),
    type: item?.type ?? "VACATION",
    requestedHours: item ? String(Number(item.requestedHours)) : "8",
    reason: item?.reason ?? "",
    evidenceLink: item?.evidenceLink ?? "",
    employeeId: item?.employeeId ?? currentUserId,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body: any = {
        date: form.date,
        type: form.type,
        requestedHours: Number(form.requestedHours),
        reason: form.reason || undefined,
        evidenceLink: form.evidenceLink || undefined,
      };
      if (isManager) body.employeeId = Number(form.employeeId);

      const url = item ? `/api/leave/${item.id}` : "/api/leave";
      const method = item ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : JSON.stringify(json.error));
        return;
      }
      onSaved(json.data);
    } finally {
      setLoading(false);
    }
  }

  const hours = Number(form.requestedHours) || 0;

  return (
    <div className="modal-back" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .lm-modal{width:100%;max-width:500px;max-height:92vh;background:var(--elev);border:1px solid var(--border-2);border-radius:16px;box-shadow:0 30px 80px rgba(0,0,0,.6);display:flex;flex-direction:column;overflow:hidden}
        .lm-head{display:flex;align-items:center;gap:12px;padding:18px 22px;border-bottom:1px solid var(--border);flex-shrink:0}
        .lm-head .ico{width:32px;height:32px;border-radius:8px;background:var(--accent);display:grid;place-items:center;flex-shrink:0}
        .lm-head .ico svg{width:17px;height:17px;color:#fff}
        .lm-head h3{font-size:1rem;font-weight:700;color:var(--text)}
        .lm-head .x{margin-left:auto;width:30px;height:30px;border-radius:8px;display:grid;place-items:center;color:var(--text-3);cursor:pointer;font-family:inherit;border:none;background:none}
        .lm-head .x:hover{background:var(--content);color:var(--text)}
        .lm-head .x svg{width:17px;height:17px}
        .lm-body{flex:1;overflow-y:auto;padding:22px;display:flex;flex-direction:column;gap:16px}
        .lm-foot{flex-shrink:0;display:flex;justify-content:flex-end;gap:10px;padding:16px 22px;border-top:1px solid var(--border)}
        .lm-field{display:flex;flex-direction:column;gap:6px}
        .lm-field label{font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3)}
        .lm-field input,.lm-field select,.lm-field textarea{font-family:inherit;font-size:.9rem;color:var(--text);background:var(--content);border:1.5px solid var(--border-2);border-radius:9px;padding:9px 12px;outline:none;transition:border-color .15s,box-shadow .15s;width:100%}
        .lm-field input:focus,.lm-field select:focus,.lm-field textarea:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
        .lm-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        @media(max-width:500px){.lm-row{grid-template-columns:1fr}}
        .lt-pick{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
        .lt-opt{display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:9px;border:2px solid var(--border);background:var(--content);cursor:pointer;font-family:inherit;font-size:.84rem;font-weight:500;color:var(--text-2);transition:all .15s}
        .lt-opt .ld{width:9px;height:9px;border-radius:50%;flex-shrink:0}
        .lt-opt:hover{border-color:var(--border-2);color:var(--text)}
        .lt-opt.on{border-color:var(--c);background:var(--cs);color:var(--text)}
        .dur-preview{font-family:var(--font-mono);font-size:.82rem;color:var(--accent-ink);padding:9px 12px;background:var(--accent-soft);border-radius:8px;text-align:center;font-weight:700}
        .lm-err{font-size:.78rem;color:var(--danger);background:var(--danger-soft);padding:8px 12px;border-radius:8px}
        .lt-annual{--c:#3B5BDB;--cs:rgba(59,91,219,.13)}
        .lt-sick{--c:#fbbf24;--cs:rgba(251,191,36,.13)}
        .lt-personal{--c:#a78bfa;--cs:rgba(167,139,250,.14)}
        .lt-unpaid{--c:#94a3b8;--cs:rgba(148,163,184,.14)}
        .spin{animation:spin .8s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
      ` }} />

      <form className="lm-modal" onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
        <div className="lm-head">
          <div className="ico">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="17" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18M12 14v3M10.5 15.5h3" />
            </svg>
          </div>
          <h3>{item ? "Sửa đơn nghỉ phép" : "Tạo đơn nghỉ phép"}</h3>
          <button type="button" className="x" onClick={onClose} aria-label="Đóng">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="lm-body">
          {isManager && (
            <div className="lm-field">
              <label>Nhân viên</label>
              <select
                value={form.employeeId}
                onChange={(e) => setForm((p) => ({ ...p, employeeId: Number(e.target.value) }))}
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                ))}
              </select>
            </div>
          )}

          <div className="lm-field">
            <label>Loại nghỉ</label>
            <div className="lt-pick">
              {LEAVE_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  className={`lt-opt ${t.cls}${form.type === t.value ? " on" : ""}`}
                  onClick={() => setForm((p) => ({ ...p, type: t.value }))}
                >
                  <span className="ld" style={{ background: t.color }}></span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="lm-row">
            <div className="lm-field">
              <label>Ngày nghỉ *</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                required
              />
            </div>
            <div className="lm-field">
              <label>Số giờ nghỉ *</label>
              <input
                type="number"
                min={0.5}
                max={24}
                step={0.5}
                value={form.requestedHours}
                onChange={(e) => setForm((p) => ({ ...p, requestedHours: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="dur-preview">⏱ {hours} giờ nghỉ phép</div>

          <div className="lm-field">
            <label>Lý do *</label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
              rows={3}
              placeholder="Mô tả lý do xin nghỉ…"
              style={{ minHeight: 70, resize: "vertical" }}
            />
          </div>

          <div className="lm-field">
            <label>Link minh chứng (nếu có)</label>
            <input
              type="url"
              value={form.evidenceLink}
              onChange={(e) => setForm((p) => ({ ...p, evidenceLink: e.target.value }))}
              placeholder="https://…"
            />
          </div>

          {error && <div className="lm-err">{error}</div>}
        </div>

        <div className="lm-foot">
          <button type="button" className="abtn ghost" onClick={onClose}>Hủy</button>
          <button type="submit" className="abtn primary" disabled={loading}>
            {loading && (
              <svg className="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="14" height="14">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            )}
            {item ? "Cập nhật" : "Gửi đơn"}
          </button>
        </div>
      </form>
    </div>
  );
}
