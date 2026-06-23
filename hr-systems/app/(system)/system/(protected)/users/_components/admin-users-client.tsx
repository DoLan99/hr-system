"use client";

import { useState } from "react";

interface AdminUser {
  id: number; username: string; fullName: string; email: string | null;
  type: "SUPER_ADMIN" | "SUPPORT" | "FINANCE"; isActive: boolean;
  lastLoginAt: string | null; createdAt: string;
}
interface Props { initialUsers: AdminUser[]; currentId: number }

const TYPE_OPTS = [
  { value: "SUPER_ADMIN", label: "Super Admin", desc: "Toàn quyền, quản lý admin khác" },
  { value: "SUPPORT",     label: "Support",     desc: "Duyệt upgrade, xem thông tin org" },
  { value: "FINANCE",     label: "Finance",     desc: "Xem báo cáo tài chính" },
];
const TYPE_COLOR: Record<string, string> = { SUPER_ADMIN: "#6366f1", SUPPORT: "#22c55e", FINANCE: "#f59e0b" };

function fmt(d: string | null) {
  if (!d) return "Chưa đăng nhập";
  return new Date(d).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const BLANK = { username: "", password: "", fullName: "", email: "", type: "SUPPORT" as const };

export function AdminUsersClient({ initialUsers, currentId }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [form, setForm] = useState({ ...BLANK });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function openCreate() { setEditUser(null); setForm({ ...BLANK }); setError(""); setShowModal(true); }
  function openEdit(u: AdminUser) {
    setEditUser(u);
    setForm({ username: u.username, password: "", fullName: u.fullName, email: u.email ?? "", type: u.type });
    setError(""); setShowModal(true);
  }

  async function handleSave() {
    if (!form.fullName || !form.username) return;
    if (!editUser && !form.password) return;
    setSaving(true); setError("");
    try {
      const body: Record<string, unknown> = { fullName: form.fullName, email: form.email, type: form.type };
      if (!editUser) { body.username = form.username; body.password = form.password; }
      if (editUser && form.password) body.password = form.password;

      const url = editUser ? `/api/admin/users/${editUser.id}` : "/api/admin/users";
      const method = editUser ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (res.ok) {
        const u = json.data;
        setUsers(prev => editUser ? prev.map(x => x.id === u.id ? u : x) : [u, ...prev]);
        setShowModal(false);
      } else {
        setError(typeof json.error === "string" ? json.error : JSON.stringify(json.error));
      }
    } finally { setSaving(false); }
  }

  async function toggleActive(u: AdminUser) {
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !u.isActive }),
    });
    if (res.ok) {
      const json = await res.json();
      setUsers(prev => prev.map(x => x.id === u.id ? json.data : x));
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .au-table{width:100%;border-collapse:collapse}
        .au-table th{font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:rgba(180,200,255,.4);padding:8px 14px;text-align:left;border-bottom:1px solid rgba(255,255,255,.08)}
        .au-table td{font-size:.86rem;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.06);vertical-align:middle;color:#e8eeff}
        .au-table tr:last-child td{border-bottom:none}
        .au-table tr:hover td{background:rgba(255,255,255,.03)}
        .au-modal{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;padding:20px}
        .au-scrim{position:absolute;inset:0;background:rgba(0,0,0,.7)}
        .au-card{position:relative;z-index:1;background:#111827;border:1px solid rgba(255,255,255,.12);border-radius:16px;width:100%;max-width:440px;padding:24px;display:flex;flex-direction:column;gap:14px;box-shadow:0 25px 60px rgba(0,0,0,.7)}
        .au-card h2{font-size:1rem;font-weight:800;color:#e8eeff;margin:0}
        .au-sf{display:flex;flex-direction:column;gap:5px}
        .au-sf label{font-size:.78rem;font-weight:600;color:rgba(180,200,255,.5)}
        .au-sf input,.au-sf select{background:rgba(255,255,255,.05);border:1.5px solid rgba(255,255,255,.12);border-radius:9px;padding:9px 12px;font-family:inherit;font-size:.88rem;color:#e8eeff;outline:none;width:100%;box-sizing:border-box}
        .au-sf input:focus,.au-sf select:focus{border-color:rgba(99,130,255,.6)}
        .au-sf select option{background:#111827}
        .au-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .au-foot{display:flex;justify-content:flex-end;gap:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,.08)}
        .au-btn{border:none;border-radius:9px;padding:8px 18px;font-family:inherit;font-size:.86rem;font-weight:700;cursor:pointer;transition:background .15s}
        .au-btn.primary{background:#3B5BDB;color:#fff}
        .au-btn.primary:hover{background:#4a6aec}
        .au-btn.primary:disabled{background:rgba(59,91,219,.4);cursor:not-allowed}
        .au-btn.ghost{background:rgba(255,255,255,.06);color:rgba(180,200,255,.7);border:1px solid rgba(255,255,255,.1)}
        .au-btn.ghost:hover{background:rgba(255,255,255,.1)}
        .au-err{background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.25);border-radius:8px;padding:9px 12px;font-size:.82rem;color:#f87171}
      ` }} />

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#e8eeff", letterSpacing: "-.02em", margin: 0 }}>Admin Users</h1>
          <p style={{ fontSize: ".84rem", color: "rgba(180,200,255,.4)", marginTop: 5 }}>Quản lý tài khoản truy cập system admin panel.</p>
        </div>
        <button className="au-btn primary" onClick={openCreate}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" width={13} height={13} style={{ display: "inline", marginRight: 6 }}><path d="M12 5v14M5 12h14"/></svg>
          Thêm admin
        </button>
      </div>

      <div style={{ background: "#111827", border: "1px solid rgba(255,255,255,.08)", borderRadius: 14, overflow: "hidden" }}>
        <table className="au-table">
          <thead>
            <tr>
              <th>Tài khoản</th><th>Loại</th><th>Email</th><th>Đăng nhập lần cuối</th><th>Trạng thái</th><th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{ fontWeight: 700 }}>{u.fullName}</div>
                  <div style={{ fontSize: ".76rem", color: "rgba(180,200,255,.4)", fontFamily: "monospace" }}>@{u.username}</div>
                </td>
                <td>
                  <span style={{ fontSize: ".74rem", fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: `${TYPE_COLOR[u.type]}22`, color: TYPE_COLOR[u.type] }}>
                    {TYPE_OPTS.find(t => t.value === u.type)?.label}
                  </span>
                </td>
                <td style={{ color: "rgba(180,200,255,.6)", fontSize: ".84rem" }}>{u.email ?? "—"}</td>
                <td style={{ fontSize: ".8rem", color: "rgba(180,200,255,.4)" }}>{fmt(u.lastLoginAt)}</td>
                <td>
                  <span style={{ fontSize: ".74rem", fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: u.isActive ? "rgba(34,197,94,.12)" : "rgba(239,68,68,.12)", color: u.isActive ? "#22c55e" : "#f87171" }}>
                    {u.isActive ? "Hoạt động" : "Vô hiệu"}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="au-btn ghost" style={{ padding: "5px 12px", fontSize: ".78rem" }} onClick={() => openEdit(u)}>Sửa</button>
                    {u.id !== currentId && (
                      <button className="au-btn ghost" style={{ padding: "5px 12px", fontSize: ".78rem", color: u.isActive ? "#f87171" : "#22c55e" }}
                        onClick={() => toggleActive(u)}>
                        {u.isActive ? "Vô hiệu" : "Kích hoạt"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="au-modal">
          <div className="au-scrim" onClick={() => setShowModal(false)} />
          <div className="au-card">
            <h2>{editUser ? `Sửa — ${editUser.username}` : "Thêm admin mới"}</h2>
            <div className="au-grid">
              {!editUser && <div className="au-sf"><label>Username *</label><input placeholder="vd: support1" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value.toLowerCase() }))}/></div>}
              <div className="au-sf"><label>Họ tên *</label><input placeholder="Nguyễn Văn A" value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}/></div>
            </div>
            <div className="au-sf"><label>Loại tài khoản</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as typeof form.type }))}>
                {TYPE_OPTS.map(t => <option key={t.value} value={t.value}>{t.label} — {t.desc}</option>)}
              </select>
            </div>
            <div className="au-grid">
              <div className="au-sf"><label>{editUser ? "Mật khẩu mới (để trống = không đổi)" : "Mật khẩu *"}</label><input type="password" placeholder="Tối thiểu 8 ký tự" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}/></div>
              <div className="au-sf"><label>Email</label><input type="email" placeholder="admin@jobihome.vn" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}/></div>
            </div>
            {error && <div className="au-err">{error}</div>}
            <div className="au-foot">
              <button className="au-btn ghost" onClick={() => setShowModal(false)}>Hủy</button>
              <button className="au-btn primary" disabled={saving} onClick={handleSave}>
                {saving ? "Đang lưu…" : editUser ? "Cập nhật" : "Tạo tài khoản"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
