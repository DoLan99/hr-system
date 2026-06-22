"use client";

import { useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface LeaveItem {
  id: number;
  date: string;
  type: string;
  requestedHours: number | string;
  reason?: string | null;
  evidenceLink?: string | null;
  employee: { fullName: string; department?: string | null };
}

interface Props {
  item: LeaveItem;
  onClose: () => void;
  onSaved: (item: any) => void;
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  VACATION: { label: "Nghỉ phép năm", color: "#3B5BDB" },
  ILLNESS:  { label: "Nghỉ ốm",       color: "#fbbf24" },
  HOLIDAY:  { label: "Nghỉ lễ",       color: "#a78bfa" },
  OTHER:    { label: "Khác",          color: "#94a3b8" },
};

function initials(name: string) {
  return name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
}

export function LeaveReviewModal({ item, onClose, onSaved }: Props) {
  const [status, setStatus] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [approvedHours, setApprovedHours] = useState(String(Number(item.requestedHours)));
  const [approvalNote, setApprovalNote] = useState("");
  const [money, setMoney] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const typeInfo = TYPE_LABELS[item.type] ?? TYPE_LABELS.OTHER;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (status === "REJECTED" && !approvalNote.trim()) {
      setError("Vui lòng nhập lý do từ chối");
      return;
    }
    setLoading(true);
    try {
      const body: any = { status, approvalNote: approvalNote || undefined };
      if (status === "APPROVED") {
        body.approvedHours = Number(approvedHours);
        if (money) body.money = Number(money);
      }
      const res = await fetch(`/api/leave/${item.id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "Có lỗi xảy ra");
        return;
      }
      onSaved(json.data);
    } finally {
      setLoading(false);
    }
  }

  const isApprove = status === "APPROVED";

  return (
    <div className="modal-back" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .rv-modal{width:100%;max-width:520px;max-height:92vh;background:var(--elev);border:1px solid var(--border-2);border-radius:16px;box-shadow:0 30px 80px rgba(0,0,0,.6);display:flex;flex-direction:column;overflow:hidden}
        .rv-head{display:flex;align-items:center;gap:12px;padding:18px 22px;border-bottom:1px solid var(--border);flex-shrink:0}
        .rv-head .ico{width:34px;height:34px;border-radius:9px;background:var(--accent);display:grid;place-items:center;flex-shrink:0}
        .rv-head .ico svg{width:18px;height:18px;color:#fff}
        .rv-head .title{flex:1;min-width:0}
        .rv-head h3{font-size:1rem;font-weight:700;color:var(--text)}
        .rv-head .sub{font-size:.76rem;color:var(--text-3);margin-top:2px}
        .rv-head .x{width:30px;height:30px;border-radius:8px;display:grid;place-items:center;color:var(--text-3);cursor:pointer;border:none;background:none;font-family:inherit}
        .rv-head .x:hover{background:var(--content);color:var(--text)}
        .rv-head .x svg{width:17px;height:17px}
        .rv-body{flex:1;overflow-y:auto;padding:22px;display:flex;flex-direction:column;gap:18px}
        .rv-foot{flex-shrink:0;display:flex;justify-content:flex-end;gap:10px;padding:16px 22px;border-top:1px solid var(--border)}

        .rv-summary{background:var(--content);border:1px solid var(--border);border-radius:12px;overflow:hidden}
        .rv-summary-top{display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid var(--border)}
        .rv-av{width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#8b7bff,#4f7aff);display:grid;place-items:center;color:#fff;font-size:.88rem;font-weight:700;flex-shrink:0}
        .rv-who{flex:1;min-width:0}
        .rv-who .name{font-size:.92rem;font-weight:700;color:var(--text)}
        .rv-who .dept{font-size:.74rem;color:var(--text-3);margin-top:1px}
        .rv-type-pill{display:inline-flex;align-items:center;gap:6px;font-size:.72rem;font-weight:700;padding:4px 10px;border-radius:99px}
        .rv-type-pill .ld{width:7px;height:7px;border-radius:50%}
        .rv-rows{padding:4px 0}
        .rv-row{display:flex;align-items:flex-start;gap:12px;padding:9px 16px}
        .rv-row .lbl{font-size:.76rem;color:var(--text-3);min-width:90px;flex-shrink:0}
        .rv-row .val{font-size:.86rem;color:var(--text);flex:1;font-weight:500}
        .rv-row .val.mono{font-family:var(--font-mono);font-weight:700}
        .rv-row .val.quote{font-style:italic;color:var(--text-2)}
        .rv-row .val a{color:var(--accent-ink);text-decoration:none;display:inline-flex;align-items:center;gap:5px}
        .rv-row .val a:hover{text-decoration:underline}

        .rv-decision{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .rv-pick{display:flex;align-items:center;justify-content:center;gap:8px;padding:12px;border-radius:11px;border:2px solid var(--border);background:var(--content);cursor:pointer;font-family:inherit;font-size:.88rem;font-weight:600;color:var(--text-2);transition:all .15s}
        .rv-pick:hover{border-color:var(--border-2);color:var(--text)}
        .rv-pick svg{width:16px;height:16px}
        .rv-pick.on.approve{border-color:var(--ok);background:var(--ok-soft);color:var(--ok)}
        .rv-pick.on.reject{border-color:var(--danger);background:var(--danger-soft);color:var(--danger)}

        .rv-field{display:flex;flex-direction:column;gap:6px}
        .rv-field label{font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3)}
        .rv-field label .req{color:var(--danger);margin-left:2px}
        .rv-field input,.rv-field textarea{font-family:inherit;font-size:.9rem;color:var(--text);background:var(--content);border:1.5px solid var(--border-2);border-radius:9px;padding:9px 12px;outline:none;transition:border-color .15s,box-shadow .15s;width:100%}
        .rv-field input:focus,.rv-field textarea:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
        .rv-row2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        @media(max-width:500px){.rv-row2,.rv-decision{grid-template-columns:1fr}}

        .rv-err{font-size:.78rem;color:var(--danger);background:var(--danger-soft);padding:9px 12px;border-radius:8px;border-left:3px solid var(--danger)}
        .abtn.ok{background:var(--ok);color:#fff}
        .abtn.ok:hover{background:rgba(22,163,74,1);transform:translateY(-1px)}
        .abtn.danger{background:var(--danger);color:#fff}
        .abtn.danger:hover{transform:translateY(-1px)}
        .spin{animation:spin .8s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
      ` }} />

      <form className="rv-modal" onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
        <div className="rv-head">
          <div className="ico">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" />
            </svg>
          </div>
          <div className="title">
            <h3>Duyệt đơn nghỉ phép</h3>
            <div className="sub">#{item.id} · {item.employee.fullName}</div>
          </div>
          <button type="button" className="x" onClick={onClose} aria-label="Đóng">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="rv-body">
          {/* Summary card */}
          <div className="rv-summary">
            <div className="rv-summary-top">
              <div className="rv-av">{initials(item.employee.fullName)}</div>
              <div className="rv-who">
                <div className="name">{item.employee.fullName}</div>
                {item.employee.department && <div className="dept">{item.employee.department}</div>}
              </div>
              <span className="rv-type-pill" style={{ background: typeInfo.color + "22", color: typeInfo.color }}>
                <span className="ld" style={{ background: typeInfo.color }}></span>
                {typeInfo.label}
              </span>
            </div>
            <div className="rv-rows">
              <div className="rv-row">
                <span className="lbl">Ngày nghỉ</span>
                <span className="val">{format(new Date(item.date), "EEEE, dd/MM/yyyy", { locale: vi })}</span>
              </div>
              <div className="rv-row">
                <span className="lbl">Số giờ yêu cầu</span>
                <span className="val mono">{Number(item.requestedHours)}h</span>
              </div>
              {item.reason && (
                <div className="rv-row">
                  <span className="lbl">Lý do</span>
                  <span className="val quote">“{item.reason}”</span>
                </div>
              )}
              {item.evidenceLink && (
                <div className="rv-row">
                  <span className="lbl">Minh chứng</span>
                  <span className="val">
                    <a href={item.evidenceLink} target="_blank" rel="noopener noreferrer">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                      Xem minh chứng
                    </a>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Decision */}
          <div className="rv-decision">
            <button
              type="button"
              className={`rv-pick approve${isApprove ? " on" : ""}`}
              onClick={() => setStatus("APPROVED")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12l5 5L20 7" />
              </svg>
              Duyệt
            </button>
            <button
              type="button"
              className={`rv-pick reject${!isApprove ? " on" : ""}`}
              onClick={() => setStatus("REJECTED")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
              Từ chối
            </button>
          </div>

          {/* Approve fields */}
          {isApprove && (
            <div className="rv-row2">
              <div className="rv-field">
                <label>Số giờ duyệt<span className="req">*</span></label>
                <input
                  type="number" min={0} max={24} step={0.5}
                  value={approvedHours}
                  onChange={(e) => setApprovedHours(e.target.value)}
                  required
                />
              </div>
              <div className="rv-field">
                <label>Tiền hỗ trợ (nếu có)</label>
                <input
                  type="number" min={0}
                  value={money}
                  onChange={(e) => setMoney(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          )}

          <div className="rv-field">
            <label>
              {isApprove ? "Ghi chú" : <>Lý do từ chối<span className="req">*</span></>}
            </label>
            <textarea
              value={approvalNote}
              onChange={(e) => setApprovalNote(e.target.value)}
              rows={3}
              placeholder={isApprove ? "Ghi chú cho nhân viên…" : "Nhập lý do để thông báo cho nhân viên…"}
              style={{ minHeight: 80, resize: "vertical" }}
            />
          </div>

          {error && <div className="rv-err">{error}</div>}
        </div>

        <div className="rv-foot">
          <button type="button" className="abtn ghost" onClick={onClose}>Hủy</button>
          <button
            type="submit"
            className={`abtn ${isApprove ? "ok" : "danger"}`}
            disabled={loading}
          >
            {loading && (
              <svg className="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="14" height="14">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            )}
            {isApprove ? "Xác nhận duyệt" : "Xác nhận từ chối"}
          </button>
        </div>
      </form>
    </div>
  );
}
