"use client";

import { Fragment, useState } from "react";
import { format, addDays } from "date-fns";

interface Employee { id: number; fullName: string; department?: string | null }

interface DateEntry {
  date: string;
  shiftType: "FULL_DAY" | "MORNING" | "AFTERNOON";
}

interface Props {
  item: null; // edit not supported per PRD
  employees: Employee[];
  isManager: boolean;
  currentUserId: number;
  onClose: () => void;
  onSaved: (items: any[]) => void;
}

export const LEAVE_TYPES: Record<string, { label: string; color: string; hasBalance?: boolean; attendanceCode?: string }> = {
  PAID_LEAVE:         { label: "Nghỉ phép năm",              color: "#3B5BDB", hasBalance: true,  attendanceCode: "P" },
  SICK_LEAVE_PAID:    { label: "Nghỉ ốm (có lương)",         color: "#f59e0b", hasBalance: true,  attendanceCode: "P" },
  INSURANCE_LEAVE:    { label: "Nghỉ BHXH",                  color: "#fbbf24", hasBalance: false, attendanceCode: "U" },
  UNPAID_LEAVE:       { label: "Nghỉ không lương",           color: "#94a3b8", hasBalance: false, attendanceCode: "U" },
  PERSONAL_TIME_PAID: { label: "Đi muộn / Về sớm / Ra ngoài", color: "#f97316", hasBalance: true,  attendanceCode: "P/2" },
  HALF_DAY_PAID:      { label: "Nghỉ nửa ngày (có lương)",   color: "#818cf8", hasBalance: true,  attendanceCode: "P/2" },
  HALF_DAY_UNPAID:    { label: "Nghỉ nửa ngày (không lương)", color: "#64748b", hasBalance: false, attendanceCode: "U/2" },
  COMPENSATORY_LEAVE: { label: "Nghỉ bù OT",                 color: "#10b981", hasBalance: false, attendanceCode: "X" },
  SPECIAL_LEAVE:      { label: "Nghỉ chế độ (hiếu/hỷ)",     color: "#a78bfa", hasBalance: false, attendanceCode: "CĐ" },
  OUT_OF_OFFICE_WORK: { label: "Công tác ngoài văn phòng",   color: "#06b6d4", hasBalance: false, attendanceCode: "X" },
  MATERNITY_LEAVE:    { label: "Nghỉ thai sản",              color: "#ec4899", hasBalance: false, attendanceCode: "TS" },
  CHILD_CARE_LEAVE:   { label: "Nghỉ con nhỏ (BHXH)",       color: "#f472b6", hasBalance: false, attendanceCode: "TS" },
  RESIGNATION:        { label: "Nghỉ việc",                  color: "#ef4444", hasBalance: false, attendanceCode: "--" },
  // Legacy
  VACATION:  { label: "Nghỉ phép năm",  color: "#3B5BDB", hasBalance: true,  attendanceCode: "P" },
  ILLNESS:   { label: "Nghỉ ốm",        color: "#fbbf24", attendanceCode: "U" },
  HOLIDAY:   { label: "Nghỉ lễ",        color: "#a78bfa", attendanceCode: "L" },
  OTHER:     { label: "Khác",           color: "#94a3b8", attendanceCode: "--" },
};

const HALF_DAY_TYPES = new Set(["PERSONAL_TIME_PAID", "HALF_DAY_PAID", "HALF_DAY_UNPAID"]);
const LEAVE_TYPE_GROUPS = [
  {
    label: "Nghỉ có lương",
    types: ["PAID_LEAVE", "SICK_LEAVE_PAID", "HALF_DAY_PAID", "PERSONAL_TIME_PAID", "COMPENSATORY_LEAVE"],
  },
  {
    label: "Nghỉ không lương / BHXH",
    types: ["UNPAID_LEAVE", "INSURANCE_LEAVE", "HALF_DAY_UNPAID"],
  },
  {
    label: "Nghỉ chế độ",
    types: ["SPECIAL_LEAVE", "MATERNITY_LEAVE", "CHILD_CARE_LEAVE"],
  },
  {
    label: "Khác",
    types: ["OUT_OF_OFFICE_WORK", "RESIGNATION"],
  },
];

export function LeaveFormModal({ employees, isManager, currentUserId, onClose, onSaved }: Props) {
  const [type, setType] = useState("PAID_LEAVE");
  const [dateEntries, setDateEntries] = useState<DateEntry[]>([
    { date: format(new Date(), "yyyy-MM-dd"), shiftType: "FULL_DAY" },
  ]);
  const [reason, setReason] = useState("");
  const [evidenceLink, setEvidenceLink] = useState("");
  const [approverId, setApproverId] = useState<number | "">("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(currentUserId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isHalfDayType = HALF_DAY_TYPES.has(type);
  const totalDays = dateEntries.reduce((sum, e) => sum + (e.shiftType === "FULL_DAY" ? 1 : 0.5), 0);
  const totalHours = totalDays * 8;

  function addDate() {
    const last = dateEntries[dateEntries.length - 1];
    const next = last ? format(addDays(new Date(last.date), 1), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");
    setDateEntries(p => [...p, { date: next, shiftType: isHalfDayType ? "MORNING" : "FULL_DAY" }]);
  }

  function removeDate(i: number) {
    setDateEntries(p => p.filter((_, idx) => idx !== i));
  }

  function updateDate(i: number, patch: Partial<DateEntry>) {
    setDateEntries(p => p.map((e, idx) => idx === i ? { ...e, ...patch } : e));
  }

  function handleTypeChange(t: string) {
    setType(t);
    if (HALF_DAY_TYPES.has(t)) {
      setDateEntries(p => p.map(e => ({ ...e, shiftType: e.shiftType === "FULL_DAY" ? "MORNING" : e.shiftType })));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (dateEntries.length === 0) { setError("Vui lòng chọn ít nhất 1 ngày."); return; }
    setLoading(true);
    try {
      const body: any = {
        dates: dateEntries,
        type,
        reason: reason || undefined,
        evidenceLink: evidenceLink || undefined,
        approverId: approverId ? Number(approverId) : undefined,
      };
      if (isManager) body.employeeId = selectedEmployeeId;

      const res = await fetch("/api/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
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

  const infoType = LEAVE_TYPES[type] ?? LEAVE_TYPES.OTHER;

  return (
    <div className="modal-back" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .lm-modal{width:100%;max-width:580px;max-height:92vh;background:var(--elev);border:1px solid var(--border-2);border-radius:16px;box-shadow:0 30px 80px rgba(0,0,0,.6);display:flex;flex-direction:column;overflow:hidden}
        .lm-head{display:flex;align-items:center;gap:12px;padding:16px 20px;border-bottom:1px solid var(--border);flex-shrink:0}
        .lm-head .ico{width:32px;height:32px;border-radius:8px;background:var(--accent);display:grid;place-items:center;flex-shrink:0}
        .lm-head h3{font-size:.95rem;font-weight:700}
        .lm-head .x{margin-left:auto;width:28px;height:28px;border-radius:8px;display:grid;place-items:center;color:var(--text-3);cursor:pointer;border:none;background:none}
        .lm-head .x:hover{background:var(--content)}
        .lm-body{flex:1;overflow-y:auto;padding:18px 20px;display:flex;flex-direction:column;gap:14px}
        .lm-foot{flex-shrink:0;display:flex;justify-content:flex-end;gap:8px;padding:14px 20px;border-top:1px solid var(--border)}
        .lm-field{display:flex;flex-direction:column;gap:5px}
        .lm-field label{font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-3)}
        .lm-field input,.lm-field select,.lm-field textarea{font-family:inherit;font-size:.88rem;color:var(--text);background:var(--content);border:1.5px solid var(--border-2);border-radius:9px;padding:8px 11px;outline:none;transition:border-color .15s;width:100%}
        .lm-field input:focus,.lm-field select:focus,.lm-field textarea:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
        .lm-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .type-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
        .type-group-label{font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-3);grid-column:1/-1;margin-top:6px}
        .type-opt{display:flex;align-items:center;gap:7px;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);background:var(--content);cursor:pointer;font-size:.8rem;font-weight:500;color:var(--text-2);transition:all .15s;text-align:left}
        .type-opt:hover{border-color:var(--border-2);color:var(--text)}
        .type-opt.on{border-color:var(--accent);background:var(--accent-soft);color:var(--text);font-weight:600}
        .type-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
        .date-list{display:flex;flex-direction:column;gap:7px}
        .date-row{display:grid;grid-template-columns:1fr auto auto;align-items:center;gap:7px;background:var(--content);border:1.5px solid var(--border);border-radius:9px;padding:6px 9px}
        .date-row input,.date-row select{border:none;background:transparent;font-family:inherit;font-size:.85rem;color:var(--text);padding:2px 4px;outline:none}
        .date-row .rm-btn{width:26px;height:26px;border-radius:6px;border:none;background:var(--danger-soft);color:var(--danger);cursor:pointer;display:grid;place-items:center;flex-shrink:0}
        .date-row .rm-btn:hover{background:rgba(239,68,68,.2)}
        .add-date-btn{height:32px;padding:0 12px;border-radius:8px;border:1.5px dashed var(--border-2);background:transparent;color:var(--text-3);font-family:inherit;font-size:.8rem;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:all .15s}
        .add-date-btn:hover{border-color:var(--accent);color:var(--accent)}
        .summary-pill{display:inline-flex;align-items:center;gap:8px;font-family:var(--font-mono);font-size:.8rem;font-weight:700;padding:7px 14px;border-radius:8px;background:var(--accent-soft);color:var(--accent-ink)}
        .shift-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:4px}
        .shift-tab{padding:5px 0;border-radius:7px;border:1.5px solid var(--border);background:var(--content);color:var(--text-2);font-family:inherit;font-size:.74rem;font-weight:600;cursor:pointer;transition:all .15s;text-align:center}
        .shift-tab.on{border-color:var(--accent);background:var(--accent-soft);color:var(--accent-ink)}
        .lm-err{font-size:.78rem;color:var(--danger);background:var(--danger-soft);padding:8px 12px;border-radius:8px}
        .spin{animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
        .att-code{display:inline-block;font-family:var(--font-mono);font-size:.72rem;font-weight:800;padding:2px 6px;border-radius:5px;background:rgba(59,91,219,.15);color:#3B5BDB;margin-left:4px}
      ` }} />

      <form className="lm-modal" onSubmit={handleSubmit} onClick={e => e.stopPropagation()}>
        <div className="lm-head">
          <div className="ico">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 17, height: 17 }}>
              <rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </div>
          <h3>Tạo đơn nghỉ phép</h3>
          <button type="button" className="x" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 16, height: 16 }}><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        <div className="lm-body">
          {isManager && (
            <div className="lm-field">
              <label>Nhân viên</label>
              <select value={selectedEmployeeId} onChange={e => setSelectedEmployeeId(Number(e.target.value))}>
                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}
              </select>
            </div>
          )}

          {/* Leave Type */}
          <div className="lm-field">
            <label>Loại nghỉ <span className="att-code" style={{ background: `${infoType.color}20`, color: infoType.color }}>{infoType.attendanceCode}</span></label>
            <div className="type-grid">
              {LEAVE_TYPE_GROUPS.map(g => (
                <Fragment key={g.label}>
                  <span className="type-group-label">{g.label}</span>
                  {g.types.map(t => {
                    const info = LEAVE_TYPES[t];
                    return (
                      <button
                        key={t}
                        type="button"
                        className={`type-opt${type === t ? " on" : ""}`}
                        onClick={() => handleTypeChange(t)}
                      >
                        <span className="type-dot" style={{ background: info.color }}></span>
                        {info.label}
                      </button>
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="lm-field">
            <label>Ngày nghỉ ({dateEntries.length} ngày)</label>
            <div className="date-list">
              {dateEntries.map((entry, i) => (
                <div key={i} className="date-row">
                  <input
                    type="date"
                    value={entry.date}
                    onChange={e => updateDate(i, { date: e.target.value })}
                    required
                  />
                  <div className="shift-tabs">
                    {(["FULL_DAY", "MORNING", "AFTERNOON"] as const).map(s => {
                      const disabled = isHalfDayType && s === "FULL_DAY";
                      return (
                        <button
                          key={s}
                          type="button"
                          className={`shift-tab${entry.shiftType === s ? " on" : ""}`}
                          onClick={() => updateDate(i, { shiftType: s })}
                          disabled={disabled}
                          style={disabled ? { opacity: 0.35 } : {}}
                          title={s === "FULL_DAY" ? "Cả ngày" : s === "MORNING" ? "Sáng" : "Chiều"}
                        >
                          {s === "FULL_DAY" ? "Cả ngày" : s === "MORNING" ? "Sáng" : "Chiều"}
                        </button>
                      );
                    })}
                  </div>
                  {dateEntries.length > 1 && (
                    <button type="button" className="rm-btn" onClick={() => removeDate(i)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ width: 12, height: 12 }}><path d="M6 6l12 12M18 6L6 18" /></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" className="add-date-btn" onClick={addDate}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ width: 13, height: 13 }}><path d="M12 5v14M5 12h14" /></svg>
              Thêm ngày
            </button>
          </div>

          {/* Summary */}
          <div className="summary-pill">
            📋 Tổng: {totalDays} ngày · {totalHours}h
          </div>

          {/* Approver */}
          <div className="lm-field">
            <label>Người phê duyệt</label>
            <select value={approverId} onChange={e => setApproverId(e.target.value ? Number(e.target.value) : "")}>
              <option value="">-- Chọn người duyệt --</option>
              {employees
                .filter(e => e.id !== (isManager ? selectedEmployeeId : currentUserId))
                .map(e => <option key={e.id} value={e.id}>{e.fullName}{e.department ? ` · ${e.department}` : ""}</option>)
              }
            </select>
          </div>

          {/* Reason */}
          <div className="lm-field">
            <label>Lý do</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              placeholder="Mô tả lý do xin nghỉ…"
              style={{ minHeight: 64, resize: "vertical" }}
            />
          </div>

          {/* Evidence */}
          <div className="lm-field">
            <label>Minh chứng (link, nếu có)</label>
            <input
              type="url"
              value={evidenceLink}
              onChange={e => setEvidenceLink(e.target.value)}
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
            Gửi đơn
          </button>
        </div>
      </form>
    </div>
  );
}
