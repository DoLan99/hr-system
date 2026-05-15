"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";
import { vi as viLocale } from "date-fns/locale";
import { cn, formatCurrency } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/context";
import { PaymentFormModal } from "./payment-form-modal";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];

interface Employee { id: number; fullName: string; department?: string | null }
interface PaymentItem {
  id: number;
  date: string;
  employeeId: number;
  type: string;
  amount: number | string;
  notes?: string | null;
  summaryMonth?: number | null;
  summaryYear?: number | null;
  employee: Employee;
  createdBy?: { fullName: string } | null;
}

interface Props {
  initialPayments: PaymentItem[];
  initialMonth: number;
  initialYear: number;
  employees: Employee[];
}

const TYPE_COLOR: Record<string, { color: string; sign: string }> = {
  SALARY: { color: "bg-blue-100 text-blue-700", sign: "+" },
  BONUS: { color: "bg-green-100 text-green-700", sign: "+" },
  ADVANCE: { color: "bg-yellow-100 text-yellow-700", sign: "-" },
  DEDUCTION: { color: "bg-red-100 text-red-700", sign: "-" },
  OTHER: { color: "bg-slate-100 text-slate-700", sign: "+" },
};

export function PaymentsClient({ initialPayments, initialMonth, initialYear, employees }: Props) {
  const { data: session } = useSession();
  const { t, locale } = useLocale();
  const role = (session?.user as any)?.role ?? "";
  const isManager = MANAGER_ROLES.includes(role);
  const dateFnsLocale = locale === "vi" ? viLocale : undefined;

  const [viewDate, setViewDate] = useState(new Date(initialYear, initialMonth - 1));
  const [payments, setPayments] = useState<PaymentItem[]>(initialPayments);
  const [filterType, setFilterType] = useState("ALL");
  const [filterEmpId, setFilterEmpId] = useState("ALL");
  const [creating, setCreating] = useState(false);
  const [editingItem, setEditingItem] = useState<PaymentItem | null>(null);

  async function fetchPayments(date: Date) {
    const m = date.getMonth() + 1;
    const y = date.getFullYear();
    const res = await fetch(`/api/payments?month=${m}&year=${y}`);
    const json = await res.json();
    if (res.ok) setPayments(json.data ?? []);
  }

  function navigate(dir: 1 | -1) {
    const next = new Date(viewDate.getFullYear(), viewDate.getMonth() + dir, 1);
    setViewDate(next);
    fetchPayments(next);
  }

  async function handleDelete(id: number) {
    if (!confirm(t("common.confirmDelete"))) return;
    await fetch(`/api/payments/${id}`, { method: "DELETE" });
    setPayments(prev => prev.filter(p => p.id !== id));
  }

  function upsert(item: PaymentItem) {
    setPayments(prev => {
      const idx = prev.findIndex(p => p.id === item.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = item; return next; }
      return [item, ...prev];
    });
  }

  const filtered = useMemo(() => payments.filter(p => {
    if (filterType !== "ALL" && p.type !== filterType) return false;
    if (filterEmpId !== "ALL" && String(p.employeeId) !== filterEmpId) return false;
    return true;
  }), [payments, filterType, filterEmpId]);

  const totalIn = filtered.filter(p => ["SALARY", "BONUS", "OTHER"].includes(p.type)).reduce((s, p) => s + Number(p.amount), 0);
  const totalOut = filtered.filter(p => ["ADVANCE", "DEDUCTION"].includes(p.type)).reduce((s, p) => s + Number(p.amount), 0);

  const byEmployee = useMemo(() => {
    const map = new Map<number, { emp: Employee; items: PaymentItem[] }>();
    for (const p of filtered) {
      if (!map.has(p.employeeId)) map.set(p.employeeId, { emp: p.employee, items: [] });
      map.get(p.employeeId)!.items.push(p);
    }
    return [...map.values()].sort((a, b) => a.emp.fullName.localeCompare(b.emp.fullName));
  }, [filtered]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t("payments.title")}</h1>
          <p className="text-sm text-slate-500">{t("payments.subtitle")}</p>
        </div>
        {isManager && (
          <button onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition">
            <Plus className="w-4 h-4" /> {t("payments.addPayment")}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <p className="text-xs text-slate-500">{t("payments.paidOut")}</p>
          <p className="text-xl font-bold text-blue-600 mt-1">{formatCurrency(totalIn)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <p className="text-xs text-slate-500">{t("payments.deductions")}</p>
          <p className="text-xl font-bold text-red-500 mt-1">{formatCurrency(totalOut)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <p className="text-xs text-slate-500">{t("payments.netPaid")}</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(totalIn - totalOut)}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-3 py-2">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-slate-100 rounded"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm font-medium w-28 text-center">{format(viewDate, "MMMM yyyy", { locale: dateFnsLocale })}</span>
          <button onClick={() => navigate(1)} className="p-1 hover:bg-slate-100 rounded"><ChevronRight className="w-4 h-4" /></button>
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {["ALL", "SALARY", "BONUS", "ADVANCE", "DEDUCTION", "OTHER"].map(typKey => (
            <button key={typKey} onClick={() => setFilterType(typKey)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition",
                filterType === typKey ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>
              {typKey === "ALL" ? t("common.all") : t(`paymentType.${typKey}`)}
            </button>
          ))}
        </div>

        {isManager && (
          <select value={filterEmpId} onChange={e => setFilterEmpId(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="ALL">{t("payments.allEmployees")}</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
          </select>
        )}
      </div>

      {/* List grouped by employee */}
      <div className="space-y-4">
        {byEmployee.map(({ emp, items }) => (
          <div key={emp.id} className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">{emp.fullName}</p>
              <p className="text-xs text-slate-500">{items.length} {t("payments.transactions")}</p>
            </div>
            <div className="divide-y divide-gray-50">
              {items.map(p => {
                const cfg = TYPE_COLOR[p.type] ?? TYPE_COLOR.OTHER;
                const typeLabel = t(`paymentType.${p.type}`) || p.type;
                return (
                  <div key={p.id} className="px-4 py-3 flex items-center gap-3">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium shrink-0", cfg.color)}>{typeLabel}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">
                        <span className={cfg.sign === "+" ? "text-green-600" : "text-red-500"}>{cfg.sign}</span>
                        {formatCurrency(Number(p.amount))}
                      </p>
                      <p className="text-xs text-slate-500">
                        {format(new Date(p.date), "dd/MM/yyyy", { locale: dateFnsLocale })}
                        {p.summaryMonth && p.summaryYear && ` · ${p.summaryMonth}/${p.summaryYear}`}
                        {p.notes && ` · ${p.notes}`}
                      </p>
                    </div>
                    {isManager && (
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => setEditingItem(p)}
                          className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(p.id)}
                          className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400 text-sm">{t("payments.noPayments")}</div>
        )}
      </div>

      {(creating || editingItem) && (
        <PaymentFormModal
          item={editingItem ? {
            id: editingItem.id,
            date: editingItem.date,
            employeeId: editingItem.employeeId,
            type: editingItem.type,
            amount: editingItem.amount,
            notes: editingItem.notes,
            summaryMonth: editingItem.summaryMonth,
            summaryYear: editingItem.summaryYear,
          } : null}
          employees={employees}
          onClose={() => { setCreating(false); setEditingItem(null); }}
          onSaved={item => { upsert(item); setCreating(false); setEditingItem(null); }}
        />
      )}
    </div>
  );
}
