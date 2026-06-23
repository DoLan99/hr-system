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

export function UpgradeRequestsClient({ initialRequests }: Props) {
  const [requests, setRequests] = useState(initialRequests);
  const [actionId, setActionId] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState<number | null>(null);
  const { toast } = useToast();

  const pending = requests.filter(r => r.status === "PENDING");
  const processed = requests.filter(r => r.status !== "PENDING");

  async function handle(id: number, action: "APPROVED" | "REJECTED") {
    setLoading(id);
    try {
      const res = await fetch(`/api/admin/upgrade-requests/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note }),
      });
      const json = await res.json();
      if (res.ok) {
        setRequests(prev => prev.map(r => r.id === id ? { ...r, ...json.data } : r));
        setActionId(null);
        setNote("");
        toast({ title: action === "APPROVED" ? "✅ Đã duyệt và nâng cấp gói" : "Đã từ chối yêu cầu", variant: action === "APPROVED" ? "success" : "default" });
      } else {
        toast({ title: json.error ?? "Lỗi", variant: "error" });
      }
    } finally { setLoading(null); }
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
                        disabled={loading === r.id}
                        onClick={() => { setActionId(r.id); setNote(""); }}>
                        Duyệt
                      </button>
                      <button className="abtn ghost" style={{ height: 30, fontSize: ".78rem", padding: "0 12px", color: "#ef4444", borderColor: "rgba(239,68,68,.3)" }}
                        disabled={loading === r.id}
                        onClick={() => handle(r.id, "REJECTED")}>
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

      {/* Confirm approve modal */}
      {actionId !== null && (
        <div className="note-modal">
          <div className="nm-scrim" onClick={() => setActionId(null)} />
          <div className="nm-card">
            <h2>Xác nhận duyệt nâng cấp</h2>
            <p style={{ fontSize: ".86rem", color: "var(--text-2)", margin: 0 }}>
              Gói sẽ được nâng cấp ngay lập tức. Người dùng sẽ nhận email thông báo (nếu đã cấu hình Resend).
            </p>
            <div>
              <label style={{ fontSize: ".8rem", fontWeight: 600, color: "var(--text-2)", display: "block", marginBottom: 6 }}>Ghi chú (tuỳ chọn)</label>
              <textarea className="nm-ta" placeholder="VD: Đã xác nhận chuyển khoản..." value={note} onChange={e => setNote(e.target.value)} />
            </div>
            <div className="nm-foot">
              <button className="abtn ghost" onClick={() => setActionId(null)}>Hủy</button>
              <button className="abtn primary" disabled={loading === actionId} onClick={() => handle(actionId, "APPROVED")}>
                {loading === actionId ? "Đang xử lý…" : "✅ Duyệt & Nâng cấp"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
