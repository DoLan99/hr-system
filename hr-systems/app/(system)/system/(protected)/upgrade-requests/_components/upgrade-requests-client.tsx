"use client";

import { useState } from "react";
import { useToast } from "@/lib/hooks/use-toast";

interface UpgradeRequest {
  id: number;
  orgName: string;
  orgSlug: string;
  requesterName: string;
  requesterEmail: string;
  currentPlan: string;
  targetPlan: string;
  priceVnd: number;
  transferNote: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  note: string | null;
  approvedAt: string | null;
  createdAt: string;
}

interface Props { initialRequests: UpgradeRequest[] }

function fmt(d: string) {
  return new Date(d).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function fmtVnd(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}

const STATUS_LABEL: Record<string, string> = { PENDING: "Chờ duyệt", APPROVED: "Đã duyệt", REJECTED: "Từ chối" };
const STATUS_COLOR: Record<string, string> = {
  PENDING: "rgba(251,191,36,.15)",
  APPROVED: "rgba(34,197,94,.15)",
  REJECTED: "rgba(239,68,68,.15)",
};
const STATUS_TEXT: Record<string, string> = { PENDING: "#f59e0b", APPROVED: "#22c55e", REJECTED: "#ef4444" };

type DialogState = { id: number; action: "APPROVED" | "REJECTED" } | null;

export function UpgradeRequestsClient({ initialRequests }: Props) {
  const [requests, setRequests] = useState(initialRequests);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const pending = requests.filter(r => r.status === "PENDING");
  const processed = requests.filter(r => r.status !== "PENDING");

  function openDialog(id: number, action: "APPROVED" | "REJECTED") {
    setNote("");
    setDialog({ id, action });
  }

  function closeDialog() { setDialog(null); setNote(""); }

  async function handle() {
    if (!dialog) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/upgrade-requests/${dialog.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: dialog.action, note: note.trim() || undefined }),
      });
      const json = await res.json();
      if (res.ok) {
        setRequests(prev => prev.map(r => r.id === dialog.id ? { ...r, ...json.data } : r));
        closeDialog();
        toast({ title: dialog.action === "APPROVED" ? "✅ Đã duyệt và nâng cấp gói" : "Đã từ chối yêu cầu", variant: dialog.action === "APPROVED" ? "success" : "default" });
      } else {
        toast({ title: json.error ?? "Lỗi", variant: "error" });
      }
    } finally { setLoading(false); }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .ur-table{width:100%;border-collapse:collapse}
        .ur-table th{font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--text-3);padding:8px 14px;text-align:left;border-bottom:1px solid var(--border)}
        .ur-table td{font-size:.86rem;padding:12px 14px;border-bottom:1px solid var(--border);vertical-align:middle;color:var(--text)}
        .ur-table tr:last-child td{border-bottom:none}
        .ur-table tr:hover td{background:var(--content)}
        .status-chip{display:inline-flex;align-items:center;gap:5px;font-size:.72rem;font-weight:700;padding:3px 10px;border-radius:99px}
        .note-modal{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;padding:20px}
        .nm-scrim{position:absolute;inset:0;background:rgba(0,0,0,.55)}
        .nm-card{position:relative;z-index:1;background:var(--elev);border:1px solid var(--border-2);border-radius:var(--r-lg);width:100%;max-width:420px;padding:24px;display:flex;flex-direction:column;gap:14px;box-shadow:0 20px 60px rgba(0,0,0,.4)}
        .nm-card h2{font-size:1rem;font-weight:800;color:var(--text)}
        .nm-foot{display:flex;justify-content:flex-end;gap:8px;padding-top:8px;border-top:1px solid var(--border)}
        .nm-ta{width:100%;background:var(--content);border:1.5px solid var(--border-2);border-radius:9px;padding:10px 12px;font-family:inherit;font-size:.87rem;color:var(--text);resize:vertical;outline:none;min-height:72px}
        .nm-ta:focus{border-color:var(--accent)}
      ` }} />

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: "1.45rem", fontWeight: 800, color: "var(--text)", letterSpacing: "-.02em" }}>Upgrade Requests</h1>
          <p style={{ fontSize: ".86rem", color: "var(--text-3)", marginTop: 4 }}>Xét duyệt yêu cầu nâng cấp gói từ các workspace.</p>
        </div>
        {pending.length > 0 && (
          <span style={{ background: "rgba(239,68,68,.15)", color: "#ef4444", fontFamily: "var(--font-mono)", fontSize: ".78rem", fontWeight: 700, padding: "4px 12px", borderRadius: 99 }}>
            {pending.length} chờ duyệt
          </span>
        )}
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div style={{ background: "var(--elev)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden", marginBottom: 20 }}>
          <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
            <span style={{ fontSize: ".88rem", fontWeight: 700, color: "var(--text)" }}>Chờ duyệt ({pending.length})</span>
          </div>
          <table className="ur-table">
            <thead>
              <tr>
                <th>Workspace</th>
                <th>Người yêu cầu</th>
                <th>Nâng cấp</th>
                <th>Số tiền</th>
                <th>Nội dung CK</th>
                <th>Thời gian</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {pending.map(r => (
                <tr key={r.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{r.orgName}</div>
                    <div style={{ fontSize: ".75rem", color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>{r.orgSlug}</div>
                  </td>
                  <td>
                    <div>{r.requesterName}</div>
                    <div style={{ fontSize: ".75rem", color: "var(--text-3)" }}>{r.requesterEmail}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: ".78rem", color: "var(--text-3)" }}>{r.currentPlan}</span>
                    {" → "}
                    <span style={{ fontWeight: 700, color: "var(--accent-ink)" }}>{r.targetPlan}</span>
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{fmtVnd(r.priceVnd)}</td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: ".8rem" }}>{r.transferNote}</td>
                  <td style={{ fontSize: ".78rem", color: "var(--text-3)", whiteSpace: "nowrap" }}>{fmt(r.createdAt)}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="abtn primary" style={{ height: 30, fontSize: ".78rem", padding: "0 12px" }}
                        onClick={() => openDialog(r.id, "APPROVED")}>
                        Duyệt
                      </button>
                      <button className="abtn ghost" style={{ height: 30, fontSize: ".78rem", padding: "0 12px", color: "#ef4444", borderColor: "rgba(239,68,68,.3)" }}
                        onClick={() => openDialog(r.id, "REJECTED")}>
                        Từ chối
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pending.length === 0 && (
        <div style={{ background: "var(--elev)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "40px 20px", textAlign: "center", color: "var(--text-3)", marginBottom: 20 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} width={40} height={40} style={{ display: "block", margin: "0 auto 12px", opacity: .3 }}><path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
          <p style={{ fontSize: ".9rem" }}>Không có yêu cầu nào đang chờ duyệt</p>
        </div>
      )}

      {/* Processed */}
      {processed.length > 0 && (
        <div style={{ background: "var(--elev)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
          <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: ".88rem", fontWeight: 700, color: "var(--text)" }}>Lịch sử ({processed.length})</span>
          </div>
          <table className="ur-table">
            <thead>
              <tr>
                <th>Workspace</th>
                <th>Người yêu cầu</th>
                <th>Nâng cấp</th>
                <th>Số tiền</th>
                <th>Trạng thái</th>
                <th>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {processed.map(r => (
                <tr key={r.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.orgName}</div>
                    <div style={{ fontSize: ".75rem", color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>{r.orgSlug}</div>
                  </td>
                  <td>
                    <div>{r.requesterName}</div>
                    <div style={{ fontSize: ".75rem", color: "var(--text-3)" }}>{r.requesterEmail}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: ".78rem", color: "var(--text-3)" }}>{r.currentPlan}</span>
                    {" → "}
                    <span style={{ fontWeight: 600 }}>{r.targetPlan}</span>
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: ".84rem" }}>{fmtVnd(r.priceVnd)}</td>
                  <td>
                    <span className="status-chip" style={{ background: STATUS_COLOR[r.status], color: STATUS_TEXT[r.status] }}>
                      {STATUS_LABEL[r.status]}
                    </span>
                    {r.note && <div style={{ fontSize: ".74rem", color: "var(--text-3)", marginTop: 3 }}>{r.note}</div>}
                  </td>
                  <td style={{ fontSize: ".78rem", color: "var(--text-3)", whiteSpace: "nowrap" }}>{fmt(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Action dialog — dùng chung cho Duyệt và Từ chối */}
      {dialog !== null && (() => {
        const isApprove = dialog.action === "APPROVED";
        const req = requests.find(r => r.id === dialog.id);
        return (
          <div className="note-modal">
            <div className="nm-scrim" onClick={closeDialog} />
            <div className="nm-card">
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  background: isApprove ? "rgba(16,185,129,.15)" : "rgba(239,68,68,.12)",
                }}>
                  {isApprove ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth={2.2} strokeLinecap="round" width={18} height={18}><polyline points="20 6 9 17 4 12"/></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2.2} strokeLinecap="round" width={18} height={18}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  )}
                </div>
                <h2 style={{ margin: 0 }}>{isApprove ? "Xác nhận duyệt nâng cấp" : "Từ chối yêu cầu"}</h2>
              </div>

              {/* Info row */}
              {req && (
                <div style={{ background: "var(--content)", borderRadius: 8, padding: "10px 14px", fontSize: ".84rem", color: "var(--text-2)", display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <span><b style={{ color: "var(--text)" }}>{req.orgName}</b></span>
                  <span>{req.currentPlan} → <b style={{ color: isApprove ? "#10b981" : "var(--text)" }}>{req.targetPlan}</b></span>
                  <span style={{ fontFamily: "var(--font-mono)" }}>{req.priceVnd.toLocaleString("vi-VN")}đ</span>
                </div>
              )}

              {/* Description */}
              <p style={{ fontSize: ".86rem", color: "var(--text-2)", margin: 0 }}>
                {isApprove
                  ? "Gói sẽ được nâng cấp ngay lập tức. Người dùng sẽ nhận email thông báo (nếu đã cấu hình Resend)."
                  : "Yêu cầu sẽ bị từ chối. Vui lòng nhập lý do để khách hàng biết cách xử lý."}
              </p>

              {/* Note textarea */}
              <div>
                <label style={{ fontSize: ".8rem", fontWeight: 600, color: "var(--text-2)", display: "block", marginBottom: 6 }}>
                  {isApprove ? "Ghi chú (tuỳ chọn)" : "Lý do từ chối *"}
                </label>
                <textarea
                  className="nm-ta"
                  placeholder={isApprove ? "VD: Đã xác nhận chuyển khoản..." : "VD: Chưa nhận được chuyển khoản, vui lòng liên hệ lại..."}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  autoFocus={!isApprove}
                />
              </div>

              <div className="nm-foot">
                <button className="abtn ghost" onClick={closeDialog} disabled={loading}>Hủy</button>
                <button
                  disabled={loading || (!isApprove && !note.trim())}
                  onClick={handle}
                  style={{
                    height: 36, padding: "0 18px", borderRadius: 9, border: "none", cursor: "pointer",
                    fontWeight: 700, fontSize: ".88rem", fontFamily: "inherit",
                    background: isApprove ? "#10b981" : "#ef4444", color: "#fff",
                    opacity: (loading || (!isApprove && !note.trim())) ? .5 : 1,
                  }}
                >
                  {loading ? "Đang xử lý…" : isApprove ? "✅ Duyệt & Nâng cấp" : "Từ chối"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
