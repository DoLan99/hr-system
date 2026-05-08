"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Pencil, X, Loader2, Shield, Users, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN"];

// Danh sách quyền theo module
const PERMISSION_MODULES = [
  { key: "dashboard",     label: "Dashboard" },
  { key: "work_list",     label: "Work List" },
  { key: "work_report",   label: "Work Report" },
  { key: "office_time",   label: "Office Time" },
  { key: "task_library",  label: "Task Library" },
  { key: "missing_tasks", label: "Missing Tasks" },
  { key: "time_check",    label: "Time Check" },
  { key: "summary",       label: "Summary / Lương" },
  { key: "payments",      label: "Payments" },
  { key: "leave",         label: "Nghỉ phép" },
  { key: "customers",     label: "Customers" },
  { key: "messages",      label: "Messages" },
  { key: "employees",     label: "Nhân viên" },
  { key: "vault",         label: "Password Vault" },
  { key: "work_rules",    label: "Work Rules" },
  { key: "departments",   label: "Phòng ban & Nhóm" },
  { key: "roles",         label: "Quản lý vai trò" },
];

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-700 border-purple-200",
  ADMIN:       "bg-blue-100 text-blue-700 border-blue-200",
  MANAGER:     "bg-indigo-100 text-indigo-700 border-indigo-200",
  TEAM_LEAD:   "bg-cyan-100 text-cyan-700 border-cyan-200",
  ACCOUNTANT:  "bg-amber-100 text-amber-700 border-amber-200",
  HR:          "bg-pink-100 text-pink-700 border-pink-200",
  EMPLOYEE:    "bg-slate-100 text-slate-600 border-slate-200",
};

interface RoleItem {
  id: number;
  name: string;
  label: string;
  description?: string | null;
  color?: string | null;
  permissions: Record<string, any>;
  _count: { employees: number };
}

interface Props {
  initialRoles: RoleItem[];
}

function RoleEditModal({ role, onClose, onSaved }: { role: RoleItem; onClose: () => void; onSaved: (r: RoleItem) => void }) {
  const [label, setLabel] = useState(role.label);
  const [description, setDescription] = useState(role.description ?? "");
  const [perms, setPerms] = useState<Record<string, boolean>>(() => {
    const p: Record<string, boolean> = {};
    PERMISSION_MODULES.forEach(m => {
      p[m.key] = role.permissions?.[m.key] !== false; // default true
    });
    return p;
  });
  const [loading, setLoading] = useState(false);

  function togglePerm(key: string) {
    setPerms(prev => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/roles/${role.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, description: description || undefined, permissions: perms }),
      });
      const json = await res.json();
      if (res.ok) onSaved(json.data);
    } finally {
      setLoading(false);
    }
  }

  const allOn = PERMISSION_MODULES.every(m => perms[m.key]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <span className={cn("text-[12px] font-bold px-2.5 py-1 rounded-lg border", ROLE_COLORS[role.name] ?? "bg-slate-100 text-slate-600 border-slate-200")}>
              {role.name}
            </span>
            <h2 className="text-[15px] font-semibold text-slate-900">Chỉnh sửa vai trò</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-[12px] font-medium text-slate-700 mb-1.5">Tên hiển thị</label>
              <input value={label} onChange={e => setLabel(e.target.value)} required className="form-input" />
            </div>
            <div className="col-span-2">
              <label className="block text-[12px] font-medium text-slate-700 mb-1.5">Mô tả vai trò</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                rows={2} className="form-input resize-none" placeholder="Chức năng của vai trò này..." />
            </div>
          </div>

          {/* Permissions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[12px] font-semibold text-slate-700 uppercase tracking-wide">Quyền truy cập</label>
              <button type="button"
                onClick={() => {
                  const next: Record<string, boolean> = {};
                  PERMISSION_MODULES.forEach(m => { next[m.key] = !allOn; });
                  setPerms(next);
                }}
                className="text-[11.5px] text-blue-600 hover:underline">
                {allOn ? "Bỏ chọn tất cả" : "Chọn tất cả"}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {PERMISSION_MODULES.map(m => (
                <button key={m.key} type="button"
                  onClick={() => togglePerm(m.key)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-[12.5px] font-medium text-left transition border",
                    perms[m.key]
                      ? "bg-blue-50 border-blue-200 text-blue-700"
                      : "bg-slate-50 border-slate-200 text-slate-400"
                  )}>
                  <div className={cn(
                    "w-4 h-4 rounded flex items-center justify-center flex-shrink-0",
                    perms[m.key] ? "bg-blue-600" : "bg-slate-200"
                  )}>
                    {perms[m.key] && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </form>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100 flex-shrink-0">
          <button type="button" onClick={onClose} className="btn-secondary">Hủy</button>
          <button
            onClick={e => { e.preventDefault(); handleSubmit(e as any); }}
            disabled={loading} className="btn-primary">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />} Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}

export function RolesClient({ initialRoles }: Props) {
  const { data: session } = useSession();
  const currentRole = (session?.user as any)?.role ?? "";
  const isAdmin = ADMIN_ROLES.includes(currentRole);

  const [roles, setRoles] = useState<RoleItem[]>(initialRoles);
  const [editing, setEditing] = useState<RoleItem | null>(null);

  function updateRole(r: RoleItem) {
    setRoles(prev => prev.map(x => x.id === r.id ? r : x));
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight leading-tight">Quản lý vai trò</h1>
        <p className="text-sm text-slate-500 mt-0.5">Xem và phân quyền truy cập cho từng vai trò</p>
      </div>

      {/* Role cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {roles.map(r => {
          // count modules that are NOT explicitly false (default = has access)
          const permCount = PERMISSION_MODULES.filter(m => r.permissions?.[m.key] !== false).length;
          const totalPerms = PERMISSION_MODULES.length;
          const pct = totalPerms > 0 ? Math.round((permCount / totalPerms) * 100) : 0;
          const colorCls = ROLE_COLORS[r.name] ?? "bg-slate-100 text-slate-600 border-slate-200";

          return (
            <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-card group">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border", colorCls)}>
                    <Shield className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold text-slate-900">{r.label}</span>
                      <span className={cn("text-[10.5px] font-bold px-1.5 py-0.5 rounded border", colorCls)}>{r.name}</span>
                    </div>
                    {r.description && (
                      <p className="text-[12px] text-slate-500 mt-0.5 truncate">{r.description}</p>
                    )}
                  </div>
                </div>
                {isAdmin && (
                  <button onClick={() => setEditing(r)}
                    className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition opacity-0 group-hover:opacity-100">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-[12.5px] text-slate-500">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span><span className="font-semibold text-slate-700">{r._count.employees}</span> nhân viên</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-[11.5px] text-slate-400 mb-1">
                    <span>Quyền truy cập</span>
                    <span className="font-medium text-slate-600">{permCount}/{totalPerms}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>

              {/* Permission badges */}
              <div className="flex flex-wrap gap-1 mt-2.5">
                {PERMISSION_MODULES.map(m => {
                  const hasAccess = r.permissions?.[m.key] !== false;
                  return hasAccess ? (
                    <span key={m.key}
                      className="text-[10.5px] bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded font-medium">
                      {m.label}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <RoleEditModal
          role={editing}
          onClose={() => setEditing(null)}
          onSaved={r => { updateRole(r); setEditing(null); }}
        />
      )}
    </div>
  );
}
