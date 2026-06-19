"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Loader2, X, ChevronDown } from "lucide-react";
import { useCurrentUser } from "@/lib/contexts/current-user-context";

// ── Permission groups matching the template ────────────────
const PERM_GROUPS = [
  {
    id: "tasks", label: "Tasks & Time",
    color: "#3B5BDB", bg: "rgba(59,91,219,.12)",
    ico: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
    perms: [
      { id: "tasks",        name: "Xem / tạo task",       desc: "Xem danh sách, tạo và chỉnh sửa task" },
      { id: "task_reviews", name: "Duyệt task",            desc: "Duyệt task REVIEW của thành viên" },
      { id: "time_logs",    name: "Time logs",             desc: "Xem và ghi nhận thời gian làm việc" },
      { id: "task_templates", name: "Task templates",      desc: "Quản lý thư viện task template" },
    ],
  },
  {
    id: "hr", label: "Nhân sự",
    color: "#059669", bg: "rgba(5,150,105,.12)",
    ico: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.9M16 3a4 4 0 0 1 0 7.7',
    perms: [
      { id: "employees",   name: "Quản lý nhân viên",     desc: "Xem, tạo, sửa hồ sơ nhân viên" },
      { id: "departments", name: "Phòng ban & Teams",      desc: "Tạo và quản lý phòng ban" },
      { id: "customers",   name: "Khách hàng",             desc: "Quản lý danh sách khách hàng" },
    ],
  },
  {
    id: "attendance", label: "Chấm công",
    color: "#0891b2", bg: "rgba(8,145,178,.12)",
    ico: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    perms: [
      { id: "office_time", name: "Chấm công",              desc: "Xem và quản lý bảng chấm công" },
      { id: "work_rules",  name: "Cấu hình work rules",    desc: "Thiết lập quy tắc giờ làm việc" },
    ],
  },
  {
    id: "finance", label: "Tài chính",
    color: "#d97706", bg: "rgba(217,119,6,.12)",
    ico: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
    perms: [
      { id: "payments",    name: "Thanh toán",             desc: "Xem và tạo lệnh thanh toán" },
      { id: "summary",     name: "Báo cáo / Summary",      desc: "Xem dashboard tổng hợp dữ liệu" },
    ],
  },
  {
    id: "leave", label: "Nghỉ phép",
    color: "#be185d", bg: "rgba(190,24,93,.12)",
    ico: 'M3 4h18v17a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4zM16 2v4M8 2v4M3 10h18',
    perms: [
      { id: "leave",       name: "Nghỉ phép",              desc: "Xin và duyệt đơn nghỉ phép" },
    ],
  },
  {
    id: "system", label: "Quản trị hệ thống",
    color: "#64748b", bg: "rgba(100,116,139,.12)",
    ico: 'M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z',
    perms: [
      { id: "vault",       name: "Password Vault",         desc: "Truy cập credentials khách hàng" },
      { id: "roles",       name: "Phân quyền",             desc: "Tạo, sửa, xóa vai trò hệ thống" },
      { id: "messages",    name: "Hộp thư / Kênh",         desc: "Xem và gửi tin nhắn nội bộ" },
    ],
  },
];

const RM_COLORS = ["#3B5BDB","#7c3aed","#0891b2","#059669","#d97706","#dc2626","#0f766e","#be185d","#64748b","#1d4ed8"];
const AV_COLORS = ["#3B5BDB","#2196f3","#7c3aed","#0891b2","#059669","#d97706","#dc2626","#0f766e","#be185d","#b45309","#1d4ed8","#6d28d9"];

function avColor(name: string) {
  const c = (name.charCodeAt(0) || 0) + (name.charCodeAt(1) || 0);
  return AV_COLORS[c % AV_COLORS.length];
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

interface RoleItem {
  id: number;
  name: string;
  label: string;
  description?: string | null;
  color?: string | null;
  permissions: Record<string, boolean>;
  _count: { employees: number };
}

interface AssignedEmployee {
  id: number;
  fullName: string;
  department: string | null;
  role: { label: string } | null;
}

// ── Toggle switch ─────────────────────────────────────────
function PmToggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className={`pm-toggle${disabled ? " disabled" : ""}`} title={disabled ? "Vai trò hệ thống" : ""}>
      <input type="checkbox" checked={checked} disabled={disabled}
        onChange={e => !disabled && onChange(e.target.checked)} />
      <span className="track" />
      <span className="thumb" />
    </label>
  );
}

// ── Add/Edit role modal ────────────────────────────────────
function RoleModal({ role, onClose, onSaved }: {
  role: Partial<RoleItem & { seniority: number }> | null;
  onClose: () => void;
  onSaved: (r: RoleItem) => void;
}) {
  const [name,      setName]      = useState(role?.label ?? "");
  const [desc,      setDesc]      = useState(role?.description ?? "");
  const [color,     setColor]     = useState(role?.color ?? RM_COLORS[0]);
  const [seniority, setSeniority] = useState(role?.seniority ?? 1);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true); setError(null);
    try {
      const isEdit = role?.id != null;
      const url = isEdit ? `/api/roles/${role!.id}` : "/api/roles";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: name.trim(), description: desc || undefined, color, seniority }),
      });
      const json = await res.json();
      if (res.ok) onSaved(json.data);
      else setError(json.error?.message ?? json.error ?? "Lỗi lưu vai trò");
    } finally { setSaving(false); }
  }

  const inpStyle: React.CSSProperties = {
    width: "100%", fontFamily: "inherit", fontSize: ".88rem",
    background: "var(--content)", border: "1px solid var(--border-2)",
    borderRadius: 8, padding: "7px 10px", color: "var(--text)", outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div className="rm-modal open">
      <div className="rm-scrim" onClick={onClose} />
      <div className="rm-card">
        <h2>{role?.id ? "Chỉnh sửa vai trò" : "Tạo vai trò mới"}</h2>
        <button className="rm-close" onClick={onClose}><X size={16} /></button>

        <div className="rm-f">
          <label>Tên hiển thị *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="vd. Senior Developer, Lead Designer…" style={inpStyle} />
        </div>

        <div className="rm-f">
          <label>Mô tả</label>
          <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Mô tả ngắn về vai trò này…" style={inpStyle} />
        </div>

        <div className="rm-f">
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            Cấp độ Career (Seniority)
            <span style={{ fontSize: ".74rem", color: "var(--text-3)", fontWeight: 400 }}>— dùng để sắp xếp lộ trình thăng tiến</span>
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              type="number" min={0} max={20} value={seniority}
              onChange={e => setSeniority(Number(e.target.value))}
              style={{ ...inpStyle, width: 80 }}
            />
            <span style={{ fontSize: ".8rem", color: "var(--text-3)" }}>
              {seniority === 0 ? "0 = không nằm trong career track" :
               seniority === 1 ? "Cấp thấp nhất (vd: Intern, Fresher)" :
               seniority <= 3 ? "Cấp cơ bản (vd: Junior, Mid)" :
               seniority <= 5 ? "Cấp cao (vd: Senior, Lead)" :
               "Cấp rất cao (vd: Principal, Director)"}
            </span>
          </div>
        </div>

        <div className="rm-f">
          <label>Màu nhận diện</label>
          <div className="rm-color-row">
            {RM_COLORS.map(c => (
              <span key={c} className={`rm-cpick${color === c ? " on" : ""}`}
                style={{ background: c }} onClick={() => setColor(c)} />
            ))}
          </div>
        </div>

        {error && <p style={{ fontSize: ".82rem", color: "var(--danger)", margin: "0 0 8px" }}>{error}</p>}

        <div className="rm-foot">
          <button className="abtn ghost" onClick={onClose}>Hủy</button>
          <button className="abtn primary" onClick={handleSave} disabled={saving || !name.trim()} style={{ gap: 6 }}>
            {saving ? <Loader2 size={13} className="animate-spin" /> : null}
            Lưu vai trò
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Right panel ────────────────────────────────────────────
function RolePanel({ role, isAdmin, onEdit, onDelete, onChange }: {
  role: RoleItem;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onChange: (perms: Record<string, boolean>) => void;
}) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(PERM_GROUPS.map(g => [g.id, true]))
  );
  const [perms, setPerms] = useState<Record<string, boolean>>(role.permissions ?? {});
  const [members, setMembers] = useState<AssignedEmployee[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // re-sync when role changes
  useEffect(() => { setPerms(role.permissions ?? {}); }, [role.id]);

  useEffect(() => {
    fetch(`/api/employees?roleId=${role.id}&status=ACTIVE`)
      .then(r => r.json())
      .then(d => setMembers((d.data ?? []).slice(0, 20)))
      .catch(() => {});
  }, [role.id]);

  function toggleGroup(id: string) {
    setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function togglePerm(key: string, val: boolean) {
    const next = { ...perms, [key]: val };
    setPerms(next);
  }

  async function savePerms() {
    setSaving(true);
    try {
      const res = await fetch(`/api/roles/${role.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: perms }),
      });
      if (res.ok) {
        onChange(perms);
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      }
    } finally { setSaving(false); }
  }

  const totalPerms = PERM_GROUPS.reduce((a, g) => a + g.perms.length, 0);
  const grantedCount = PERM_GROUPS.reduce((a, g) => a + g.perms.filter(p => perms[p.id] !== false).length, 0);
  const isSystem = ["SUPER_ADMIN", "ADMIN", "MANAGER", "HR", "ACCOUNTANT", "EMPLOYEE"].includes(role.name);
  // Only SUPER_ADMIN is truly immutable; other system roles can be edited by admins
  const isReadOnly = role.name === "SUPER_ADMIN" || !isAdmin;
  const roleColor = role.color ?? "#3B5BDB";

  return (
    <div className="role-panel">
      {/* Header */}
      <div className="rp-head">
        <span className="rp-ico" style={{ background: roleColor + "22", color: roleColor }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" />
          </svg>
        </span>
        <div>
          <div className="rp-name">{role.label}</div>
          <div className="rp-desc">{role.description ?? role.name}</div>
          <div className="rp-badges">
            {isSystem && <span className="sys-badge">⚙ Vai trò hệ thống</span>}
            <span style={{ fontFamily: "var(--font-mono)", fontSize: ".72rem", color: "var(--text-3)", background: "var(--content)", border: "1px solid var(--border)", borderRadius: 99, padding: "3px 9px" }}>
              {grantedCount} quyền
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: ".72rem", color: "var(--text-3)", background: "var(--content)", border: "1px solid var(--border)", borderRadius: 99, padding: "3px 9px" }}>
              {role._count.employees} thành viên
            </span>
          </div>
        </div>
        {isAdmin && (
          <div className="rp-head-actions">
            {!isSystem && (
              <button className="abtn ghost" style={{ height: 32, fontSize: ".8rem", gap: 6 }} onClick={onDelete}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                  <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M8 6V4h8v2" />
                </svg>Xóa
              </button>
            )}
            <button className="abtn ghost" style={{ height: 32, fontSize: ".8rem", gap: 6 }} onClick={onEdit}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z" />
              </svg>Chỉnh sửa
            </button>
          </div>
        )}
      </div>

      {/* Permission matrix */}
      <div className="perm-matrix">
        <div className="pm-head">
          <h3>
            Ma trận quyền hạn&nbsp;
            <span style={{ fontFamily: "var(--font-mono)", fontSize: ".72rem", color: "var(--text-3)" }}>
              ({grantedCount}/{totalPerms} được cấp)
            </span>
          </h3>
          {isReadOnly
            ? <span style={{ fontSize: ".76rem", color: "var(--text-3)" }}>{role.name === "SUPER_ADMIN" ? "Không thể sửa" : "Không có quyền"}</span>
            : <button className="abtn primary" style={{ height: 30, fontSize: ".8rem" }} onClick={savePerms} disabled={saving}>
                {saving ? <Loader2 size={12} className="animate-spin" /> : null}
                {saved ? "✓ Đã lưu" : "Lưu thay đổi"}
              </button>
          }
        </div>

        {PERM_GROUPS.map(g => {
          const grantedInGroup = g.perms.filter(p => perms[p.id] !== false).length;
          const isOpen = openGroups[g.id] !== false;
          return (
            <div key={g.id} className={`pm-group${isOpen ? "" : " collapsed"}`}>
              <div className="pm-group-head" onClick={() => toggleGroup(g.id)}>
                <span className="gico" style={{ background: g.bg, color: g.color }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d={g.ico} />
                  </svg>
                </span>
                <span className="glabel">{g.label}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: ".7rem", color: "var(--text-3)", marginLeft: 8 }}>
                  {grantedInGroup}/{g.perms.length}
                </span>
                <span className="gchev">
                  <ChevronDown size={14} />
                </span>
              </div>
              {isOpen && (
                <div className="pm-items">
                  {g.perms.map(p => (
                    <div key={p.id} className="pm-row">
                      <span className="pr-name">{p.name}</span>
                      <span className="pr-desc">{p.desc}</span>
                      <PmToggle
                        checked={perms[p.id] !== false}
                        disabled={isReadOnly}
                        onChange={v => togglePerm(p.id, v)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Assigned members */}
      <div className="assigned-list">
        <div className="al-head">
          <h3>
            Thành viên được gán&nbsp;
            <span style={{ fontFamily: "var(--font-mono)", fontSize: ".72rem", color: "var(--text-3)" }}>
              ({role._count.employees})
            </span>
          </h3>
        </div>
        {members.length === 0
          ? <div style={{ padding: "20px", textAlign: "center", color: "var(--text-3)", fontSize: ".84rem" }}>Chưa có thành viên nào</div>
          : members.map(e => (
            <div key={e.id} className="al-row">
              <span className="al-av" style={{ background: avColor(e.fullName) }}>
                {initials(e.fullName)}
              </span>
              <div>
                <div className="al-name">{e.fullName}</div>
                <div className="al-dept">{e.role?.label ?? "—"} · {e.department ?? "—"}</div>
              </div>
              <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: ".7rem", padding: "2px 8px", borderRadius: 99, background: (role.color ?? "#3B5BDB") + "22", color: role.color ?? "#3B5BDB" }}>
                {role.label}
              </span>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────
export function RolesClient({ initialRoles }: { initialRoles: RoleItem[] }) {
  const user = useCurrentUser();
  const isAdmin = ["SUPER_ADMIN", "ADMIN"].includes(user.role.name);

  const [roles, setRoles] = useState<RoleItem[]>(initialRoles);
  const [activeId, setActiveId] = useState(initialRoles[0]?.id ?? null);
  const [showModal, setShowModal] = useState(false);
  const [editRole, setEditRole] = useState<RoleItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const activeRole = roles.find(r => r.id === activeId) ?? roles[0] ?? null;

  function handleSaved(r: RoleItem) {
    setRoles(prev => {
      const idx = prev.findIndex(x => x.id === r.id);
      if (idx >= 0) return prev.map(x => x.id === r.id ? { ...x, ...r } : x);
      return [...prev, { ...r, _count: { employees: 0 } }];
    });
    setActiveId(r.id);
    setShowModal(false);
    setEditRole(null);
  }

  async function handleDelete(r: RoleItem) {
    if (!confirm(`Xóa vai trò "${r.label}"?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/roles/${r.id}`, { method: "DELETE" });
      if (res.ok) {
        const next = roles.filter(x => x.id !== r.id);
        setRoles(next);
        setActiveId(next[0]?.id ?? null);
      }
    } finally { setDeleting(false); }
  }

  return (
    <div>
      {/* Page head */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--text)", margin: 0 }}>Phân quyền</h1>
          <p style={{ fontSize: ".8rem", color: "var(--text-3)", marginTop: 4, marginBottom: 0 }}>
            Quản lý vai trò và quyền hạn cho từng thành viên trong workspace.
          </p>
        </div>
        {isAdmin && (
          <button className="abtn primary" style={{ gap: 7 }} onClick={() => { setEditRole(null); setShowModal(true); }}>
            <Plus size={15} /> Tạo vai trò
          </button>
        )}
      </div>

      <div className="roles-layout">
        {/* Left: role list */}
        <div>
          <div className="role-list">
            <div className="role-list-head">
              <h3>Vai trò <span style={{ fontFamily: "var(--font-mono)", fontSize: ".72rem", color: "var(--text-3)" }}>({roles.length})</span></h3>
            </div>
            {roles.map(r => {
              const grantedCount = PERM_GROUPS.reduce((a, g) => a + g.perms.filter(p => (r.permissions ?? {})[p.id] !== false).length, 0);
              const roleColor = r.color ?? "#3B5BDB";
              return (
                <div key={r.id}
                  className={`role-item${activeId === r.id ? " active" : ""}`}
                  onClick={() => setActiveId(r.id)}
                >
                  <span className="ri-ico" style={{ background: roleColor + "22", color: roleColor }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" />
                    </svg>
                  </span>
                  <div>
                    <div className="ri-name">{r.label}</div>
                    <div className="ri-sub">{r._count.employees} người dùng</div>
                  </div>
                  <span className="ri-ct">{grantedCount} quyền</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: role panel */}
        <div>
          {activeRole ? (
            <RolePanel
              key={activeRole.id}
              role={activeRole}
              isAdmin={isAdmin}
              onEdit={() => { setEditRole(activeRole); setShowModal(true); }}
              onDelete={() => handleDelete(activeRole)}
              onChange={perms => setRoles(prev => prev.map(r => r.id === activeRole.id ? { ...r, permissions: perms } : r))}
            />
          ) : (
            <div style={{ background: "var(--elev)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "48px 0", textAlign: "center", color: "var(--text-3)", fontSize: ".88rem" }}>
              Chọn vai trò để xem chi tiết
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <RoleModal
          role={editRole}
          onClose={() => { setShowModal(false); setEditRole(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
