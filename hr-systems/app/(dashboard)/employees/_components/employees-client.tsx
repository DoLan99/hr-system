"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Plus, Search, Pencil, UserX, UserCheck, ExternalLink, Mail, Phone } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/context";
import { EmployeeFormModal } from "./employee-form-modal";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];

interface Role { id: number; name: string; label: string }
interface DeptOption { id: number; name: string }
interface TeamOption { id: number; name: string }
interface EmployeeItem {
  id: number;
  fullName: string;
  emailCompany: string;
  employeeCode?: string | null;
  department?: string | null;
  company?: string | null;
  emailGoogle?: string | null;
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
  role: Role;
  manager?: { id: number; fullName: string } | null;
}

interface Props {
  initialEmployees: EmployeeItem[];
  roles: Role[];
  departments: DeptOption[];
  teams: TeamOption[];
}

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  PROBATION: "bg-yellow-100 text-yellow-700",
  INACTIVE: "bg-slate-100 text-slate-500",
};

const DEPARTMENTS = ["All", "Dev", "Design", "Admin", "HR", "Sales", "Support", "Management"];

export function EmployeesClient({ initialEmployees, roles, departments, teams }: Props) {
  const { data: session } = useSession();
  const { t } = useLocale();
  const role = (session?.user as any)?.role ?? "";
  const isManager = MANAGER_ROLES.includes(role);
  const currentUserId = Number((session?.user as any)?.id ?? 0);

  const [employees, setEmployees] = useState<EmployeeItem[]>(initialEmployees);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ACTIVE");
  const [filterDept, setFilterDept] = useState("All");
  const [creating, setCreating] = useState(false);
  const [editingEmp, setEditingEmp] = useState<EmployeeItem | null>(null);

  const managers = useMemo(() => employees.filter(e => MANAGER_ROLES.includes(e.role.name)), [employees]);

  const filtered = useMemo(() => {
    return employees.filter(emp => {
      if (filterStatus !== "ALL" && emp.status !== filterStatus) return false;
      if (filterDept !== "All" && emp.department !== filterDept) return false;
      if (search) {
        const q = search.toLowerCase();
        return emp.fullName.toLowerCase().includes(q) ||
          emp.emailCompany.toLowerCase().includes(q) ||
          (emp.employeeCode?.toLowerCase().includes(q) ?? false);
      }
      return true;
    });
  }, [employees, search, filterStatus, filterDept]);

  async function toggleStatus(emp: EmployeeItem) {
    const newStatus = emp.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const res = await fetch(`/api/employees/${emp.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const json = await res.json();
    if (res.ok) upsert(json.data);
  }

  function upsert(emp: EmployeeItem) {
    setEmployees(prev => {
      const idx = prev.findIndex(e => e.id === emp.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = emp; return next; }
      return [emp, ...prev];
    });
  }

  const stats = {
    active: employees.filter(e => e.status === "ACTIVE").length,
    probation: employees.filter(e => e.status === "PROBATION").length,
    inactive: employees.filter(e => e.status === "INACTIVE").length,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight leading-tight">{t("employees.title")}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{t("employees.subtitle")}</p>
        </div>
        {isManager && (
          <button onClick={() => setCreating(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> {t("employees.addEmployee")}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t("employees.working"), value: stats.active, color: "text-emerald-600" },
          { label: t("employees.probation"), value: stats.probation, color: "text-amber-600" },
          { label: t("employees.resigned"), value: stats.inactive, color: "text-slate-400" },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <p className="text-[11.5px] font-medium text-slate-500 uppercase tracking-wide">{s.label}</p>
            <p className={`text-[26px] font-bold mt-1 leading-none ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2.5 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t("employees.searchPlaceholder")}
            className="form-input pl-9" />
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {["ALL", "ACTIVE", "PROBATION", "INACTIVE"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={cn("px-3 py-1.5 rounded-lg text-[12px] font-medium transition",
                filterStatus === s ? "bg-blue-600 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50")}>
              {s === "ALL" ? t("common.all") : (
                s === "ACTIVE" ? t("employees.working") :
                s === "PROBATION" ? t("employees.probation") :
                t("employees.resigned")
              )}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {DEPARTMENTS.map(d => (
            <button key={d} onClick={() => setFilterDept(d)}
              className={cn("px-3 py-1.5 rounded-lg text-[12px] font-medium transition",
                filterDept === d ? "bg-slate-800 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50")}>
              {d === "All" ? t("employees.allDepts") : d}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filtered.map(emp => {
          const statusColor = STATUS_COLOR[emp.status] ?? "bg-slate-100 text-slate-500";
          const statusLabel = emp.status === "ACTIVE" ? t("employees.working") :
            emp.status === "PROBATION" ? t("employees.probation") :
            t("employees.resigned");
          const payTypeLabel = t(`payType.${emp.payType}`) || emp.payType;
          const salaryText = emp.payType === "HOURLY" && emp.hourlyRate
            ? `${formatCurrency(Number(emp.hourlyRate))}/h`
            : emp.payType === "MONTHLY" && emp.monthlySalary
              ? formatCurrency(Number(emp.monthlySalary))
              : "—";
          const totalBonus = Number(emp.bonusMPct ?? 0) + Number(emp.bonusAPct ?? 0) + Number(emp.bonusTPct ?? 0);

          return (
            <div key={emp.id} className={cn(
              "bg-white rounded-xl border p-4 space-y-3 transition shadow-card",
              emp.status === "INACTIVE" ? "border-slate-100 opacity-60" : "border-slate-200 hover:border-blue-300 hover:shadow-card-md"
            )}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-900 text-[13.5px] truncate">{emp.fullName}</p>
                    <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-medium", statusColor)}>
                      {statusLabel}
                    </span>
                  </div>
                  <p className="text-[12px] text-slate-500 truncate mt-0.5">{emp.role.label}{emp.department ? ` · ${emp.department}` : ""}</p>
                  {emp.employeeCode && <p className="text-[11px] text-slate-400 font-mono">{emp.employeeCode}</p>}
                </div>
                {(isManager || emp.id === currentUserId) && (
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => setEditingEmp(emp)}
                      className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {isManager && emp.id !== currentUserId && (
                      <button onClick={() => toggleStatus(emp)}
                        className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition"
                        title={emp.status === "ACTIVE" ? t("employees.disable") : t("employees.reactivate")}>
                        {emp.status === "ACTIVE" ? <UserX className="w-3.5 h-3.5 text-red-400" /> : <UserCheck className="w-3.5 h-3.5 text-emerald-500" />}
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[12px] text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{emp.emailCompany}</span>
                </div>
                {emp.mobileCompany && (
                  <div className="flex items-center gap-1.5 text-[12px] text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{emp.mobileCompany}</span>
                  </div>
                )}
              </div>

              {isManager && (
                <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-[12px]">
                  <span className="text-slate-500">{payTypeLabel}</span>
                  <span className="font-semibold text-slate-800">{salaryText}</span>
                  {totalBonus > 0 && <span className="text-blue-600 font-medium">+{totalBonus}%</span>}
                </div>
              )}

              {emp.driveLink1 && (
                <a href={emp.driveLink1} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[12px] text-blue-600 hover:text-blue-700 hover:underline">
                  <ExternalLink className="w-3 h-3" /> Drive
                </a>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400 text-sm">{t("employees.noEmployees")}</div>
      )}

      {(creating || editingEmp) && (
        <EmployeeFormModal
          employee={editingEmp}
          roles={roles}
          managers={managers}
          departments={departments}
          teams={teams}
          onClose={() => { setCreating(false); setEditingEmp(null); }}
          onSaved={emp => { upsert(emp); setCreating(false); setEditingEmp(null); }}
        />
      )}
    </div>
  );
}
