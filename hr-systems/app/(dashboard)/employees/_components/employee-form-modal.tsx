"use client";

import { useState } from "react";
import { X, Loader2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface Role { id: number; name: string; label: string }
interface DeptOption { id: number; name: string }
interface TeamOption { id: number; name: string }
interface EmployeeItem {
  id: number;
  fullName: string;
  emailCompany: string;
  employeeCode?: string | null;
  department?: string | null;
  departmentId?: number | null;
  teamId?: number | null;
  company?: string | null;
  emailGoogle?: string | null;
  emailPrivate?: string | null;
  mobileCompany?: string | null;
  payType: string;
  hourlyRate?: any;
  monthlySalary?: any;
  maxHoursMonth: number;
  bonusMPct: any;
  bonusAPct: any;
  bonusTPct: any;
  startDate?: string | null;
  status: string;
  managerId?: number | null;
  driveLink1?: string | null;
  driveLink2?: string | null;
  role: Role;
}

interface Props {
  employee: EmployeeItem | null;
  roles: Role[];
  managers: { id: number; fullName: string }[];
  departments: DeptOption[];
  teams: TeamOption[];
  onClose: () => void;
  onSaved: (emp: any) => void;
}

const PAY_TYPES = [
  { value: "HOURLY", label: "Theo giờ" },
  { value: "MONTHLY", label: "Cố định tháng" },
  { value: "CONTRACT", label: "Hợp đồng" },
];

const STATUSES = [
  { value: "ACTIVE", label: "Đang làm" },
  { value: "PROBATION", label: "Thử việc" },
  { value: "INACTIVE", label: "Nghỉ việc" },
];

export function EmployeeFormModal({ employee, roles, managers, departments, teams, onClose, onSaved }: Props) {
  const isEdit = !!employee;
  const [tab, setTab] = useState<"basic" | "salary" | "links">("basic");
  const [form, setForm] = useState({
    fullName: employee?.fullName ?? "",
    emailCompany: employee?.emailCompany ?? "",
    password: "",
    roleId: employee?.role.id ?? roles[0]?.id ?? 1,
    employeeCode: employee?.employeeCode ?? "",
    departmentId: String(employee?.departmentId ?? ""),
    teamId: String(employee?.teamId ?? ""),
    company: employee?.company ?? "",
    emailGoogle: employee?.emailGoogle ?? "",
    emailPrivate: employee?.emailPrivate ?? "",
    mobileCompany: employee?.mobileCompany ?? "",
    payType: employee?.payType ?? "HOURLY",
    hourlyRate: employee?.hourlyRate ? String(Number(employee.hourlyRate)) : "",
    monthlySalary: employee?.monthlySalary ? String(Number(employee.monthlySalary)) : "",
    maxHoursMonth: String(employee?.maxHoursMonth ?? 160),
    bonusMPct: String(Number(employee?.bonusMPct ?? 0)),
    bonusAPct: String(Number(employee?.bonusAPct ?? 0)),
    bonusTPct: String(Number(employee?.bonusTPct ?? 0)),
    managerId: String(employee?.managerId ?? ""),
    startDate: employee?.startDate ? String(employee.startDate).slice(0, 10) : "",
    status: employee?.status ?? "ACTIVE",
    driveLink1: employee?.driveLink1 ?? "",
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body: any = {
        fullName: form.fullName,
        roleId: Number(form.roleId),
        employeeCode: form.employeeCode || undefined,
        departmentId: form.departmentId ? Number(form.departmentId) : undefined,
        teamId: form.teamId ? Number(form.teamId) : undefined,
        company: form.company || undefined,
        emailGoogle: form.emailGoogle || undefined,
        emailPrivate: form.emailPrivate || undefined,
        mobileCompany: form.mobileCompany || undefined,
        payType: form.payType,
        hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : undefined,
        monthlySalary: form.monthlySalary ? Number(form.monthlySalary) : undefined,
        maxHoursMonth: Number(form.maxHoursMonth),
        bonusMPct: Number(form.bonusMPct),
        bonusAPct: Number(form.bonusAPct),
        bonusTPct: Number(form.bonusTPct),
        managerId: form.managerId ? Number(form.managerId) : undefined,
        startDate: form.startDate || undefined,
        status: form.status,
        driveLink1: form.driveLink1 || undefined,
      };

      if (!isEdit) {
        body.emailCompany = form.emailCompany;
        body.password = form.password;
      } else if (form.password) {
        body.password = form.password;
      }

      const url = isEdit ? `/api/employees/${employee.id}` : "/api/employees";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) { setError(typeof json.error === "string" ? json.error : JSON.stringify(json.error)); return; }
      onSaved(json.data);
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">{isEdit ? "Chỉnh sửa nhân viên" : "Thêm nhân viên"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-4 h-4" /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-6">
          {(["basic", "salary", "links"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn("py-2.5 px-3 text-xs font-medium border-b-2 transition -mb-px",
                tab === t ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700")}>
              {t === "basic" ? "Thông tin" : t === "salary" ? "Lương & KPI" : "Drive Links"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-3">
          {tab === "basic" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Họ tên *</label>
                  <input value={form.fullName} onChange={e => set("fullName", e.target.value)} required className={inputCls} placeholder="Nguyễn Văn A" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Mã NV</label>
                  <input value={form.employeeCode} onChange={e => set("employeeCode", e.target.value)} className={inputCls} placeholder="NV001" />
                </div>
              </div>

              {!isEdit && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email công ty *</label>
                  <input type="email" value={form.emailCompany} onChange={e => set("emailCompany", e.target.value)} required className={inputCls} />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">{isEdit ? "Đổi mật khẩu (để trống = giữ nguyên)" : "Mật khẩu *"}</label>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} value={form.password} onChange={e => set("password", e.target.value)}
                    required={!isEdit} className={cn(inputCls, "pr-9")} placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Vai trò *</label>
                  <select value={form.roleId} onChange={e => set("roleId", e.target.value)} className={inputCls}>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Trạng thái</label>
                  <select value={form.status} onChange={e => set("status", e.target.value)} className={inputCls}>
                    {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Phòng ban</label>
                  <select value={form.departmentId} onChange={e => set("departmentId", e.target.value)} className={inputCls}>
                    <option value="">-- Chọn phòng ban --</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Nhóm</label>
                  <select value={form.teamId} onChange={e => set("teamId", e.target.value)} className={inputCls}>
                    <option value="">-- Chọn nhóm --</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Quản lý</label>
                <select value={form.managerId} onChange={e => set("managerId", e.target.value)} className={inputCls}>
                  <option value="">-- Không có --</option>
                  {managers.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email Google</label>
                  <input type="email" value={form.emailGoogle} onChange={e => set("emailGoogle", e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">SĐT công ty</label>
                  <input value={form.mobileCompany} onChange={e => set("mobileCompany", e.target.value)} className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Ngày vào làm</label>
                  <input type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Công ty</label>
                  <input value={form.company} onChange={e => set("company", e.target.value)} className={inputCls} placeholder="Hung IT" />
                </div>
              </div>
            </>
          )}

          {tab === "salary" && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Loại lương</label>
                <div className="flex gap-2">
                  {PAY_TYPES.map(p => (
                    <button key={p.value} type="button" onClick={() => set("payType", p.value)}
                      className={cn("flex-1 py-2 rounded-lg text-xs font-medium border-2 transition",
                        form.payType === p.value ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600")}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {form.payType === "HOURLY" && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Giá giờ (USD)</label>
                    <input type="number" min={0} step="0.01" value={form.hourlyRate} onChange={e => set("hourlyRate", e.target.value)} className={inputCls} placeholder="10.00" />
                  </div>
                )}
                {form.payType === "MONTHLY" && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Lương cố định (USD)</label>
                    <input type="number" min={0} step="0.01" value={form.monthlySalary} onChange={e => set("monthlySalary", e.target.value)} className={inputCls} placeholder="2000.00" />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Giờ tối đa/tháng</label>
                  <input type="number" min={1} value={form.maxHoursMonth} onChange={e => set("maxHoursMonth", e.target.value)} className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Bonus M (%)</label>
                  <input type="number" min={0} max={100} step={0.5} value={form.bonusMPct} onChange={e => set("bonusMPct", e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Bonus A (%)</label>
                  <input type="number" min={0} max={100} step={0.5} value={form.bonusAPct} onChange={e => set("bonusAPct", e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Bonus T (%)</label>
                  <input type="number" min={0} max={100} step={0.5} value={form.bonusTPct} onChange={e => set("bonusTPct", e.target.value)} className={inputCls} />
                </div>
              </div>
            </>
          )}

          {tab === "links" && (
            <div className="space-y-3">
              {["driveLink1", "driveLink2", "driveLink3", "driveLink4"].map((k, i) => (
                <div key={k}>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Drive Link {i + 1}</label>
                  <input type="url" value={(form as any)[k]} onChange={e => set(k, e.target.value)} className={inputCls} placeholder="https://drive.google.com/..." />
                </div>
              ))}
            </div>
          )}

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">Hủy</button>
            <button type="submit" disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg flex items-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? "Cập nhật" : "Thêm nhân viên"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
