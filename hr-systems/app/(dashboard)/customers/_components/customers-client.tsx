"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Plus, Search, Pencil, Phone, Mail, Globe, UserCircle2, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomerFormModal } from "./customer-form-modal";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];

interface Employee { id: number; fullName: string }
interface CustomerItem {
  id: number;
  customerName?: string | null;
  businessName?: string | null;
  custId?: string | null;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  website?: string | null;
  status: string;
  responsibleStaffId?: number | null;
  notes?: string | null;
  responsibleStaff?: { id: number; fullName: string } | null;
  _count?: { workList: number; workReports: number };
}

interface Props {
  initialCustomers: CustomerItem[];
  employees: Employee[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "Đang hoạt động", color: "bg-green-100 text-green-700" },
  PROSPECT: { label: "Tiềm năng", color: "bg-blue-100 text-blue-700" },
  INACTIVE: { label: "Không hoạt động", color: "bg-slate-100 text-slate-500" },
};

export function CustomersClient({ initialCustomers, employees }: Props) {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role ?? "";
  const isManager = MANAGER_ROLES.includes(role);

  const [customers, setCustomers] = useState<CustomerItem[]>(initialCustomers);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ACTIVE");
  const [creating, setCreating] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerItem | null>(null);

  const filtered = useMemo(() => customers.filter(c => {
    if (filterStatus !== "ALL" && c.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return (c.customerName?.toLowerCase().includes(q) ?? false) ||
        (c.businessName?.toLowerCase().includes(q) ?? false) ||
        (c.custId?.toLowerCase().includes(q) ?? false) ||
        (c.contactPerson?.toLowerCase().includes(q) ?? false) ||
        (c.phone?.includes(q) ?? false);
    }
    return true;
  }), [customers, search, filterStatus]);

  function upsert(c: CustomerItem) {
    setCustomers(prev => {
      const idx = prev.findIndex(x => x.id === c.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = c; return next; }
      return [c, ...prev];
    });
  }

  const stats = {
    active: customers.filter(c => c.status === "ACTIVE").length,
    prospect: customers.filter(c => c.status === "PROSPECT").length,
    inactive: customers.filter(c => c.status === "INACTIVE").length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Khách hàng</h1>
          <p className="text-sm text-slate-500">Danh sách khách hàng & đối tác</p>
        </div>
        {isManager && (
          <button onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition">
            <Plus className="w-4 h-4" /> Thêm khách hàng
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Đang hoạt động", value: stats.active, color: "text-green-600" },
          { label: "Tiềm năng", value: stats.prospect, color: "text-blue-600" },
          { label: "Không hoạt động", value: stats.inactive, color: "text-slate-500" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-4">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm khách hàng..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-1.5">
          {["ALL", "ACTIVE", "PROSPECT", "INACTIVE"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition",
                filterStatus === s ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>
              {s === "ALL" ? "Tất cả" : (STATUS_CONFIG[s]?.label ?? s)}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(c => {
          const statusCfg = STATUS_CONFIG[c.status] ?? { label: c.status, color: "bg-slate-100 text-slate-500" };
          const displayName = c.customerName || c.businessName || c.custId || "—";
          return (
            <div key={c.id} className={cn(
              "bg-white rounded-xl border p-4 space-y-3 transition",
              c.status === "INACTIVE" ? "border-slate-100 opacity-60" : "border-slate-200 hover:border-blue-200"
            )}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-900 text-sm truncate">{displayName}</p>
                    <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-medium", statusCfg.color)}>
                      {statusCfg.label}
                    </span>
                  </div>
                  {c.businessName && c.customerName && (
                    <p className="text-xs text-slate-500 truncate"><Briefcase className="w-3 h-3 inline mr-1" />{c.businessName}</p>
                  )}
                  {c.custId && <p className="text-xs text-slate-400">{c.custId}</p>}
                </div>
                {isManager && (
                  <button onClick={() => setEditingCustomer(c)}
                    className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition shrink-0">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="space-y-1">
                {c.contactPerson && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <UserCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{c.contactPerson}</span>
                  </div>
                )}
                {c.phone && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{c.phone}</span>
                  </div>
                )}
                {c.email && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{c.email}</span>
                  </div>
                )}
                {c.website && (
                  <a href={c.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                    <Globe className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{c.website.replace(/^https?:\/\//, "")}</span>
                  </a>
                )}
              </div>

              {(c._count?.workList || c._count?.workReports || c.responsibleStaff) && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                  {c.responsibleStaff && <span>{c.responsibleStaff.fullName}</span>}
                  <div className="flex gap-2 ml-auto">
                    {(c._count?.workList ?? 0) > 0 && <span>{c._count!.workList} tasks</span>}
                    {(c._count?.workReports ?? 0) > 0 && <span>{c._count!.workReports} reports</span>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400 text-sm">Không tìm thấy khách hàng nào</div>
      )}

      {(creating || editingCustomer) && (
        <CustomerFormModal
          customer={editingCustomer}
          employees={employees}
          onClose={() => { setCreating(false); setEditingCustomer(null); }}
          onSaved={c => { upsert(c); setCreating(false); setEditingCustomer(null); }}
        />
      )}
    </div>
  );
}
