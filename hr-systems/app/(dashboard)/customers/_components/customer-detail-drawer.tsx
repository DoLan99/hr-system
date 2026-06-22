"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface Contact {
  id: number;
  name: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  isPrimary: boolean;
}

interface Activity {
  id: number;
  type: "NOTE" | "TASK" | "MESSAGE" | "PAYMENT" | "MEETING" | "CONTRACT" | "OTHER";
  content: string;
  createdAt: string;
  actor?: { id: number; fullName: string } | null;
}

interface CustomerDetail {
  id: number;
  custId?: string | null;
  customerName?: string | null;
  businessName?: string | null;
  status: string;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  notes?: string | null;
  customerSince?: string | null;
  contractRenewDate?: string | null;
  responsibleStaff?: { id: number; fullName: string } | null;
  contacts: Contact[];
  activities: Activity[];
  activeTaskCount: number;
  _count: { tasks: number; messages: number; contacts: number };
}

interface Props {
  customerId: number;
  gradient: string;
  isManager: boolean;
  onClose: () => void;
  onEdit: (c: any) => void;
  onChanged: () => void;
}

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  ACTIVE:   { label: "Đang dùng",  bg: "var(--ok-soft)",     color: "var(--ok)" },
  PROSPECT: { label: "Tiềm năng",  bg: "var(--accent-soft)", color: "var(--accent-ink)" },
  INACTIVE: { label: "Ngừng",      bg: "var(--border)",      color: "var(--text-3)" },
};

const ACTIVITY_META: Record<Activity["type"], { bg: string; color: string; icon: React.ReactNode }> = {
  NOTE:     { bg: "var(--accent-soft)", color: "var(--accent-ink)",
    icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></> },
  TASK:     { bg: "var(--accent-soft)", color: "var(--accent-ink)",
    icon: <><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></> },
  MESSAGE:  { bg: "var(--accent-soft)", color: "var(--accent-ink)",
    icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/> },
  PAYMENT:  { bg: "var(--ok-soft)",     color: "var(--ok)",
    icon: <><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></> },
  MEETING:  { bg: "var(--warn-soft)",   color: "var(--warn)",
    icon: <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></> },
  CONTRACT: { bg: "var(--accent-soft)", color: "var(--accent-ink)",
    icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M16 13H8M16 17H8M10 9H8"/></> },
  OTHER:    { bg: "var(--border)",      color: "var(--text-2)",
    icon: <circle cx="12" cy="12" r="3"/> },
};

function initials(name: string) {
  return name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
}

function fmtDate(d?: string | null) {
  if (!d) return "—";
  return format(new Date(d), "dd/MM/yyyy", { locale: vi });
}

function fmtRelative(iso: string) {
  const date = new Date(iso);
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return "vừa xong";
  if (diff < 3600) return Math.round(diff / 60) + " phút trước";
  if (diff < 86400) return Math.round(diff / 3600) + " giờ trước";
  if (diff < 86400 * 7) return Math.round(diff / 86400) + " ngày trước";
  return format(date, "dd/MM/yyyy", { locale: vi });
}

export function CustomerDetailDrawer({ customerId, gradient, isManager, onClose, onEdit, onChanged }: Props) {
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingActivity, setAddingActivity] = useState(false);
  const [newActivity, setNewActivity] = useState("");
  const [addingContact, setAddingContact] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", role: "", email: "", phone: "", isPrimary: false });

  async function refresh() {
    try {
      const res = await fetch(`/api/customers/${customerId}`);
      const text = await res.text();
      let json: any;
      try { json = JSON.parse(text); } catch { json = { error: text.slice(0, 200) }; }
      if (!res.ok) {
        const msg = typeof json?.error === "string" ? json.error : `HTTP ${res.status}`;
        console.error("[CustomerDetailDrawer] fetch failed:", res.status, json);
        setError(msg);
        return;
      }
      setCustomer(json.data);
    } catch (err: any) {
      console.error("[CustomerDetailDrawer] network error:", err);
      setError(err?.message || "Lỗi mạng");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submitActivity() {
    if (!newActivity.trim()) return;
    const res = await fetch(`/api/customers/${customerId}/activities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newActivity, type: "NOTE" }),
    });
    if (res.ok) {
      setNewActivity("");
      setAddingActivity(false);
      await refresh();
    }
  }

  async function submitContact() {
    if (!contactForm.name.trim()) return;
    const res = await fetch(`/api/customers/${customerId}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contactForm),
    });
    if (res.ok) {
      setContactForm({ name: "", role: "", email: "", phone: "", isPrimary: false });
      setAddingContact(false);
      await refresh();
      onChanged();
    }
  }

  async function deleteContact(contactId: number) {
    if (!confirm("Xóa liên hệ này?")) return;
    const res = await fetch(`/api/customers/${customerId}/contacts/${contactId}`, { method: "DELETE" });
    if (res.ok) { await refresh(); onChanged(); }
  }

  const statusMeta = customer ? (STATUS_META[customer.status] ?? STATUS_META.INACTIVE) : null;
  const displayName = customer?.customerName || customer?.businessName || customer?.custId || "—";
  const subInfo = [customer?.custId, customer?.city, customer?.address].filter(Boolean).join(" · ");

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .cd-back{position:fixed;inset:0;background:rgba(4,8,18,.6);backdrop-filter:blur(3px);z-index:100}
        .cd-drawer{position:fixed;top:0;right:0;height:100vh;width:560px;max-width:97vw;background:var(--elev);border-left:1px solid var(--border-2);box-shadow:-30px 0 60px rgba(0,0,0,.45);z-index:101;display:flex;flex-direction:column;overflow:hidden;animation:slideIn .28s var(--ease)}
        @keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
        .cd-head{display:flex;align-items:center;gap:14px;padding:20px 22px;border-bottom:1px solid var(--border);flex-shrink:0}
        .cd-logo{width:48px;height:48px;border-radius:12px;display:grid;place-items:center;font-weight:800;font-size:1.05rem;color:#fff;flex-shrink:0}
        .cd-head .cd-name{font-size:1.05rem;font-weight:700;color:var(--text)}
        .cd-head .cd-sub{font-size:.76rem;color:var(--text-3);font-family:var(--font-mono);margin-top:2px;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden}
        .cd-close{margin-left:auto;width:32px;height:32px;border-radius:8px;display:grid;place-items:center;color:var(--text-3);cursor:pointer;border:none;background:none;flex-shrink:0;font-family:inherit}
        .cd-close:hover{background:var(--content);color:var(--text)}
        .cd-close svg{width:17px;height:17px}
        .cd-body{flex:1;overflow-y:auto;padding:22px}
        .cd-foot{flex-shrink:0;border-top:1px solid var(--border);padding:16px 22px;display:flex;gap:10px}

        .dsec{font-family:var(--font-mono);font-size:.65rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--text-3);padding-bottom:10px;border-bottom:1px solid var(--border);margin-bottom:14px;margin-top:6px;display:flex;align-items:center;justify-content:space-between}
        .dsec-add{font-family:inherit;text-transform:none;letter-spacing:0;font-size:.72rem;color:var(--accent-ink);background:none;border:none;cursor:pointer;padding:2px 6px;border-radius:6px;font-weight:700}
        .dsec-add:hover{background:var(--accent-soft)}

        .metric-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px}
        .metric{background:var(--content);border:1px solid var(--border);border-radius:11px;padding:14px}
        .metric .ml{font-size:.7rem;color:var(--text-3);font-family:var(--font-mono);text-transform:uppercase;letter-spacing:.04em}
        .metric .mv{font-family:var(--font-mono);font-size:1.15rem;font-weight:800;margin-top:5px;line-height:1;color:var(--text)}
        .metric .mc{font-size:.7rem;margin-top:4px;font-weight:600;color:var(--text-3)}

        .dcard{background:var(--content);border:1px solid var(--border);border-radius:var(--r);overflow:hidden;margin-bottom:20px}
        .drow{display:flex;align-items:center;gap:12px;padding:11px 16px;border-bottom:1px solid var(--border)}
        .drow:last-child{border-bottom:none}
        .drow .dl{font-size:.8rem;color:var(--text-3);min-width:110px;flex-shrink:0}
        .drow .dv{font-size:.88rem;color:var(--text);flex:1;display:flex;align-items:center;gap:8px;font-weight:500}
        .status-badge{display:inline-flex;align-items:center;gap:5px;font-family:var(--font-mono);font-size:.64rem;font-weight:700;padding:3px 9px;border-radius:99px;white-space:nowrap;text-transform:uppercase;letter-spacing:.04em}

        .contact-item{display:flex;align-items:center;gap:11px;padding:11px 14px;background:var(--content);border:1px solid var(--border);border-radius:10px;margin-bottom:8px}
        .contact-av{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#8b7bff,#4f7aff);display:grid;place-items:center;color:#fff;font-size:.78rem;font-weight:700;flex-shrink:0}
        .contact-info{flex:1;min-width:0}
        .contact-name{font-size:.86rem;font-weight:600;color:var(--text);display:flex;align-items:center;gap:6px;flex-wrap:wrap}
        .contact-role{font-size:.74rem;color:var(--text-3);margin-top:2px}
        .contact-actions{display:flex;gap:6px;flex-shrink:0}
        .contact-actions a,.contact-actions button{width:30px;height:30px;border-radius:8px;display:grid;place-items:center;color:var(--text-3);background:var(--elev);border:1px solid var(--border);transition:color .15s,border-color .15s,background .15s;text-decoration:none;font-family:inherit;cursor:pointer}
        .contact-actions a:hover{color:var(--accent-ink);border-color:var(--accent)}
        .contact-actions button:hover{color:var(--danger);border-color:var(--danger)}
        .contact-actions svg{width:14px;height:14px}
        .primary-tag{font-size:.6rem;font-weight:700;padding:1px 6px;border-radius:99px;background:var(--accent-soft);color:var(--accent-ink)}

        .act-feed{display:flex;flex-direction:column;gap:0}
        .act-row{display:flex;gap:12px;padding:11px 0;border-bottom:1px solid var(--border)}
        .act-row:last-child{border-bottom:none}
        .act-ico{width:30px;height:30px;border-radius:8px;display:grid;place-items:center;flex-shrink:0}
        .act-ico svg{width:14px;height:14px}
        .act-txt{font-size:.84rem;color:var(--text-2);line-height:1.45}
        .act-txt b{color:var(--text);font-weight:600}
        .act-time{font-size:.72rem;color:var(--text-3);font-family:var(--font-mono);margin-top:2px}

        .quick-add{background:var(--content);border:1px solid var(--border);border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:8px;margin-bottom:14px}
        .quick-add input,.quick-add textarea{font-family:inherit;font-size:.86rem;color:var(--text);background:var(--elev);border:1.5px solid var(--border-2);border-radius:8px;padding:8px 10px;outline:none;width:100%}
        .quick-add input:focus,.quick-add textarea:focus{border-color:var(--accent)}
        .quick-add .row{display:grid;grid-template-columns:1fr 1fr;gap:8px}
        .quick-add .acts{display:flex;justify-content:flex-end;gap:8px;align-items:center}
        .quick-add label.chk{font-size:.76rem;color:var(--text-2);display:inline-flex;align-items:center;gap:6px;margin-right:auto;cursor:pointer}

        .cd-skel{height:14px;background:var(--border);border-radius:6px;animation:pulse 1.5s ease-in-out infinite}
        @keyframes pulse{0%,100%{opacity:.4}50%{opacity:.7}}
      ` }} />

      <div className="cd-back" onClick={onClose} />
      <div className="cd-drawer" role="dialog" aria-label="Chi tiết khách hàng">
        {loading ? (
          <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="cd-skel" style={{ width: "60%", height: 22 }} />
            <div className="cd-skel" style={{ width: "40%" }} />
            <div className="cd-skel" style={{ width: "100%", height: 100, marginTop: 12 }} />
          </div>
        ) : error || !customer ? (
          <div style={{ padding: 30, textAlign: "center", color: "var(--danger)" }}>{error || "Không tải được"}</div>
        ) : (
          <>
            <div className="cd-head">
              <div className="cd-logo" style={{ background: gradient }}>{initials(displayName)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="cd-name">{displayName}</div>
                {subInfo && <div className="cd-sub">{subInfo}</div>}
              </div>
              <button className="cd-close" onClick={onClose} aria-label="Đóng">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>

            <div className="cd-body">
              <div className="metric-grid">
                <div className="metric">
                  <div className="ml">Tổng task</div>
                  <div className="mv">{customer._count.tasks}</div>
                  <div className="mc">tất cả</div>
                </div>
                <div className="metric">
                  <div className="ml">Đang làm</div>
                  <div className="mv" style={{ color: customer.activeTaskCount > 0 ? "var(--accent-ink)" : "var(--text-3)" }}>{customer.activeTaskCount}</div>
                  <div className="mc">task active</div>
                </div>
                <div className="metric">
                  <div className="ml">Tin nhắn</div>
                  <div className="mv">{customer._count.messages}</div>
                  <div className="mc">đã trao đổi</div>
                </div>
              </div>

              <div className="dsec">Thông tin hợp đồng</div>
              <div className="dcard">
                <div className="drow">
                  <span className="dl">Trạng thái</span>
                  <span className="dv">
                    <span className="status-badge" style={{ background: statusMeta!.bg, color: statusMeta!.color }}>
                      {statusMeta!.label}
                    </span>
                  </span>
                </div>
                <div className="drow">
                  <span className="dl">NV phụ trách</span>
                  <span className="dv">
                    {customer.responsibleStaff ? (
                      <>
                        <span className="contact-av" style={{ width: 22, height: 22, fontSize: ".6rem" }}>
                          {initials(customer.responsibleStaff.fullName)}
                        </span>
                        {customer.responsibleStaff.fullName}
                      </>
                    ) : "—"}
                  </span>
                </div>
                <div className="drow">
                  <span className="dl">Khách từ</span>
                  <span className="dv">{fmtDate(customer.customerSince)}</span>
                </div>
                <div className="drow">
                  <span className="dl">Gia hạn</span>
                  <span className="dv">{fmtDate(customer.contractRenewDate)}</span>
                </div>
                {customer.website && (
                  <div className="drow">
                    <span className="dl">Website</span>
                    <span className="dv">
                      <a href={customer.website} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-ink)", textDecoration: "none" }}>
                        {customer.website.replace(/^https?:\/\//, "")}
                      </a>
                    </span>
                  </div>
                )}
              </div>

              <div className="dsec">
                Người liên hệ ({customer.contacts.length})
                {isManager && (
                  <button className="dsec-add" onClick={() => setAddingContact(v => !v)}>
                    {addingContact ? "Hủy" : "+ Thêm"}
                  </button>
                )}
              </div>

              {addingContact && (
                <div className="quick-add">
                  <div className="row">
                    <input placeholder="Họ tên *" value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))} />
                    <input placeholder="Vai trò" value={contactForm.role} onChange={e => setContactForm(p => ({ ...p, role: e.target.value }))} />
                  </div>
                  <div className="row">
                    <input placeholder="Email" type="email" value={contactForm.email} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))} />
                    <input placeholder="SĐT" value={contactForm.phone} onChange={e => setContactForm(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div className="acts">
                    <label className="chk">
                      <input type="checkbox" checked={contactForm.isPrimary} onChange={e => setContactForm(p => ({ ...p, isPrimary: e.target.checked }))} />
                      Liên hệ chính
                    </label>
                    <button className="abtn primary" type="button" onClick={submitContact} style={{ height: 30, padding: "0 14px", fontSize: ".82rem" }}>Lưu</button>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                {customer.contacts.length === 0 && !addingContact ? (
                  <div style={{ fontSize: ".82rem", color: "var(--text-3)", textAlign: "center", padding: "14px 0" }}>Chưa có liên hệ nào</div>
                ) : (
                  customer.contacts.map(ct => (
                    <div key={ct.id} className="contact-item">
                      <div className="contact-av">{initials(ct.name)}</div>
                      <div className="contact-info">
                        <div className="contact-name">
                          {ct.name}
                          {ct.isPrimary && <span className="primary-tag">Chính</span>}
                        </div>
                        {ct.role && <div className="contact-role">{ct.role}</div>}
                      </div>
                      <div className="contact-actions">
                        {ct.email && (
                          <a href={`mailto:${ct.email}`} title={ct.email}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 6l10 7L22 6" /></svg>
                          </a>
                        )}
                        {ct.phone && (
                          <a href={`tel:${ct.phone}`} title={ct.phone}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.4-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" /></svg>
                          </a>
                        )}
                        {isManager && (
                          <button onClick={() => deleteContact(ct.id)} title="Xóa" type="button">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="dsec">
                Hoạt động gần đây
                <button className="dsec-add" onClick={() => setAddingActivity(v => !v)}>
                  {addingActivity ? "Hủy" : "+ Ghi chú"}
                </button>
              </div>

              {addingActivity && (
                <div className="quick-add">
                  <textarea
                    placeholder="Nội dung ghi chú…"
                    value={newActivity}
                    onChange={e => setNewActivity(e.target.value)}
                    rows={2}
                    style={{ resize: "vertical", minHeight: 60 }}
                  />
                  <div className="acts">
                    <button className="abtn primary" type="button" onClick={submitActivity} style={{ height: 30, padding: "0 14px", fontSize: ".82rem" }}>Lưu</button>
                  </div>
                </div>
              )}

              {customer.activities.length === 0 ? (
                <div style={{ fontSize: ".82rem", color: "var(--text-3)", textAlign: "center", padding: "14px 0" }}>Chưa có hoạt động nào</div>
              ) : (
                <div className="act-feed">
                  {customer.activities.map(a => {
                    const meta = ACTIVITY_META[a.type] ?? ACTIVITY_META.OTHER;
                    return (
                      <div key={a.id} className="act-row">
                        <div className="act-ico" style={{ background: meta.bg, color: meta.color }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{meta.icon}</svg>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="act-txt">{a.content}</div>
                          <div className="act-time">
                            {fmtRelative(a.createdAt)}
                            {a.actor && <> · {a.actor.fullName}</>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="cd-foot">
              <button className="abtn ghost" onClick={onClose} style={{ flex: 1, gap: 7 }}>Đóng</button>
              {isManager && (
                <button className="abtn primary" onClick={() => onEdit(customer)} style={{ flex: 1, gap: 7 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z" />
                  </svg>
                  Chỉnh sửa
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
