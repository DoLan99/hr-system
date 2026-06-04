"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Employee { id: number; fullName: string }
interface PaymentItem {
  id: number;
  date: string;
  employeeId: number;
  type: string;
  amount: number | string;
  notes?: string | null;
  summaryMonth?: number | null;
  summaryYear?: number | null;
}

interface Props {
  item: PaymentItem | null;
  employees: Employee[];
  onClose: () => void;
  onSaved: (item: any) => void;
}

const PAYMENT_TYPES = [
  { value: "SALARY", label: "Lương", color: "border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700" },
  { value: "BONUS", label: "Thưởng", color: "border-green-500 bg-green-50 dark:bg-green-950/40 text-green-700" },
  { value: "ADVANCE", label: "Tạm ứng", color: "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/40 text-yellow-700" },
  { value: "DEDUCTION", label: "Khấu trừ", color: "border-red-500 bg-red-50 dark:bg-red-950/40 text-red-700" },
  { value: "OTHER", label: "Khác", color: "border-gray-500 bg-slate-50 dark:bg-slate-800/60 text-slate-700" },
];

export function PaymentFormModal({ item, employees, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    date: item ? String(item.date).slice(0, 10) : format(new Date(), "yyyy-MM-dd"),
    employeeId: String(item?.employeeId ?? employees[0]?.id ?? ""),
    type: item?.type ?? "SALARY",
    amount: item ? String(Number(item.amount)) : "",
    notes: item?.notes ?? "",
    summaryMonth: String(item?.summaryMonth ?? ""),
    summaryYear: String(item?.summaryYear ?? ""),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body: any = {
        date: form.date,
        employeeId: Number(form.employeeId),
        type: form.type,
        amount: Number(form.amount),
        notes: form.notes || undefined,
        summaryMonth: form.summaryMonth ? Number(form.summaryMonth) : undefined,
        summaryYear: form.summaryYear ? Number(form.summaryYear) : undefined,
      };
      const url = item ? `/api/payments/${item.id}` : "/api/payments";
      const method = item ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) { setError(typeof json.error === "string" ? json.error : "Có lỗi xảy ra"); return; }
      onSaved(json.data);
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">{item ? "Sửa thanh toán" : "Thêm thanh toán"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Ngày</label>
              <input type="date" value={form.date} onChange={e => set("date", e.target.value)} required className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Nhân viên</label>
              <select value={form.employeeId} onChange={e => set("employeeId", e.target.value)} className={inputCls}>
                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">Loại thanh toán</label>
            <div className="flex flex-wrap gap-1.5">
              {PAYMENT_TYPES.map(t => (
                <button key={t.value} type="button" onClick={() => set("type", t.value)}
                  className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition",
                    form.type === t.value ? t.color : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300")}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Số tiền (VNĐ)</label>
            <input type="number" min={0} step={1000} value={form.amount} onChange={e => set("amount", e.target.value)} required
              className={inputCls} placeholder="0" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Tháng lương (nếu có)</label>
              <input type="number" min={1} max={12} value={form.summaryMonth} onChange={e => set("summaryMonth", e.target.value)}
                className={inputCls} placeholder="1-12" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Năm</label>
              <input type="number" min={2020} value={form.summaryYear} onChange={e => set("summaryYear", e.target.value)}
                className={inputCls} placeholder={String(new Date().getFullYear())} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Ghi chú</label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2}
              className={cn(inputCls, "resize-none")} placeholder="Ghi chú..." />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50">Hủy</button>
            <button type="submit" disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg flex items-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {item ? "Cập nhật" : "Thêm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
