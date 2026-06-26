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
const TYPE_COLOR: Record<string, string> = { SUPER_ADMIN: "var(--accent)", SUPPORT: "#22c55e", FINANCE: "#f59e0b" };
const TYPE_BG: Record<string, string>    = { SUPER_ADMIN: "var(--accent-soft)", SUPPORT: "rgba(34,197,94,.12)", FINANCE: "rgba(245,158,11,.12)" };

function fmt(d: string | null) {
  if (!d) return "Chưa đăng nhập";
  return new Date(d).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

type AdminUserType = "SUPER_ADMIN" | "SUPPORT" | "FINANCE";
const BLANK = { username: "", password: "", fullName: "", email: "", type: "SUPPORT" as AdminUserType };

export function AdminUsersClient({ initialUsers, currentId }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<{ username: string; password: string; fullName: string; email: string; type: AdminUserType }>({ ...BLANK });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function openCreate() { setEditUser(null); setForm({ ...BLANK }); setError(""); setShowModal(true); }
  function openEdit(u: AdminUser) {
    setEditUser(u); setForm({ username: u.username, password: "", fullName: u.fullName, email: u.email ?? "", type: u.type });
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
      } else { setError(typeof json.error === "string" ? json.error : JSON.stringify(json.error)); }
    } finally { setSaving(false); }
  }

  async function toggleActive(u: AdminUser) {
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !u.isActive }),
    });
    if (res.ok) { const json = await res.json(); setUsers(prev => prev.map(x => x.id === u.id ? json.data : x)); }
  }

  return (
    <>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: 0 }}>Admin Users</h1>
          <p style={{ fontSize: 13, color: "var(--text-3)", marginTop: 5 }}>Quản lý tài khoản truy cập system admin panel.</p>
        </div>
        <button onClick={openCreate} style={{
          display: "flex", alignItems: "center", gap: 6, height: 36, padding: "0 16px",
          background: "var(--accent)", color: "var(--accent-ink)", border: "none",
          borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" width={14} height={14}><path d="M12 5v14M5 12h14"/></svg>
          Thêm admin
        </button>
      </div>

      {/* Table */}
      <div style={{ background: "var(--elev)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--content)" }}>
              {["Tài khoản","Loại","Email","Đăng nhập lần cuối","Trạng thái","Thao tác"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "9px 16px", fontSize: 11, color: "var(--text-3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", borderBottom: "1px solid var(--border)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ fontWeight: 700, color: "var(--text)" }}>{u.fullName}</div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "monospace" }}>@{u.username}</div>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: TYPE_BG[u.type], color: TYPE_COLOR[u.type] }}>
                    {TYPE_OPTS.find(t => t.value === u.type)?.label}
                  </span>
                </td>
                <td style={{ padding: "12px 16px", color: "var(--text-2)", fontSize: 13 }}>{u.email ?? "—"}</td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-3)" }}>{fmt(u.lastLoginAt)}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: u.isActive ? "rgba(34,197,94,.12)" : "rgba(239,68,68,.12)", color: u.isActive ? "#22c55e" : "#ef4444" }}>
                    {u.isActive ? "Hoạt động" : "Vô hiệu"}
                  </span>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <GhostBtn onClick={() => openEdit(u)}>Sửa</GhostBtn>
                    {u.id !== currentId && (
                      <GhostBtn onClick={() => toggleActive(u)} danger={u.isActive}>
                        {u.isActive ? "Vô hiệu" : "Kích hoạt"}
                      </GhostBtn>
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
        <div style={{ position: "fixed", inset: 0, zIndex: 80, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)" }}
          onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={{ background: "var(--elev)", border: "1px solid var(--border)", borderRadius: 16, width: "100%", maxWidth: 440, padding: 24, display: "flex", flexDirection: "column", gap: 14, boxShadow: "var(--shadow-lg)" }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", margin: 0 }}>
              {editUser ? `Sửa — ${editUser.username}` : "Thêm admin mới"}
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {!editUser && <FField label="Username *"><FInput placeholder="vd: support1" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value.toLowerCase() }))}/></FField>}
              <FField label="Họ tên *"><FInput placeholder="Nguyễn Văn A" value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}/></FField>
            </div>

            <FField label="Loại tài khoản">
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as typeof form.type }))} style={{ background: "var(--content)", border: "1.5px solid var(--border)", borderRadius: 9, padding: "9px 12px", fontFamily: "inherit", fontSize: 13, color: "var(--text)", outline: "none", width: "100%" }}>
                {TYPE_OPTS.map(t => <option key={t.value} value={t.value}>{t.label} — {t.desc}</option>)}
              </select>
            </FField>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FField label={editUser ? "Mật khẩu mới (để trống = không đổi)" : "Mật khẩu *"}>
                <FInput type="password" placeholder="Tối thiểu 8 ký tự" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}/>
              </FField>
              <FField label="Email">
                <FInput type="email" placeholder="admin@jobihome.vn" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}/>
              </FField>
            </div>

            {error && <div style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#ef4444" }}>{error}</div>}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
              <GhostBtn onClick={() => setShowModal(false)}>Hủy</GhostBtn>
              <button onClick={handleSave} disabled={saving} style={{
                height: 36, padding: "0 18px", borderRadius: 9, border: "none",
                background: "var(--accent)", color: "var(--accent-ink)",
                fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
                fontFamily: "inherit", opacity: saving ? .5 : 1,
              }}>
                {saving ? "Đang lưu…" : editUser ? "Cập nhật" : "Tạo tài khoản"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function FField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)" }}>{label}</label>
      {children}
    </div>
  );
}
function FInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ background: "var(--content)", border: "1.5px solid var(--border)", borderRadius: 9, padding: "9px 12px", fontFamily: "inherit", fontSize: 13, color: "var(--text)", outline: "none", width: "100%", boxSizing: "border-box" as const }} />;
}
function GhostBtn({ onClick, children, danger }: { onClick: () => void; children: React.ReactNode; danger?: boolean }) {
  return (
    <button onClick={onClick} style={{
      height: 30, padding: "0 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
      cursor: "pointer", fontFamily: "inherit",
      background: "transparent", border: "1px solid var(--border)",
      color: danger ? "#ef4444" : "var(--text-2)", transition: "all .15s",
    }}>{children}</button>
  );
}
