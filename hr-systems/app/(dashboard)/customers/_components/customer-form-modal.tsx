"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
  plz?: string | null;
  website?: string | null;
  vatTaxId?: string | null;
  preferredLanguage?: string | null;
  status: string;
  responsibleStaffId?: number | null;
  notes?: string | null;
}

interface Props {
  customer: CustomerItem | null;
  employees: Employee[];
  onClose: () => void;
  onSaved: (c: any) => void;
}

const STATUSES = [
  { value: "ACTIVE", label: "Đang hoạt động" },
  { value: "PROSPECT", label: "Tiềm năng" },
  { value: "INACTIVE", label: "Không hoạt động" },
];

const LANGUAGES = ["Vietnamese", "English", "German", "French", "Japanese", "Chinese"];

export function CustomerFormModal({ customer, employees, onClose, onSaved }: Props) {
  const [tab, setTab] = useState<"info" | "contact">("info");
  const [form, setForm] = useState({
    customerName: customer?.customerName ?? "",
    businessName: customer?.businessName ?? "",
    custId: customer?.custId ?? "",
    contactPerson: customer?.contactPerson ?? "",
    phone: customer?.phone ?? "",
    email: customer?.email ?? "",
    address: customer?.address ?? "",
    city: customer?.city ?? "",
    plz: customer?.plz ?? "",
    website: customer?.website ?? "",
    vatTaxId: customer?.vatTaxId ?? "",
    preferredLanguage: customer?.preferredLanguage ?? "",
    status: customer?.status ?? "ACTIVE",
    responsibleStaffId: String(customer?.responsibleStaffId ?? ""),
    notes: customer?.notes ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const inputCls = "w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body: any = {
        customerName: form.customerName || undefined,
        businessName: form.businessName || undefined,
        custId: form.custId || undefined,
        contactPerson: form.contactPerson || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        plz: form.plz || undefined,
        website: form.website || undefined,
        vatTaxId: form.vatTaxId || undefined,
        preferredLanguage: form.preferredLanguage || undefined,
        status: form.status,
        responsibleStaffId: form.responsibleStaffId ? Number(form.responsibleStaffId) : undefined,
        notes: form.notes || undefined,
      };
      const url = customer ? `/api/customers/${customer.id}` : "/api/customers";
      const method = customer ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) { setError(typeof json.error === "string" ? json.error : "Có lỗi xảy ra"); return; }
      onSaved(json.data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">{customer ? "Chỉnh sửa khách hàng" : "Thêm khách hàng"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex border-b border-slate-100 dark:border-slate-800 px-6">
          {(["info", "contact"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn("py-2.5 px-3 text-xs font-medium border-b-2 -mb-px transition",
                tab === t ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500")}>
              {t === "info" ? "Thông tin" : "Liên hệ & Địa chỉ"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-3">
          {tab === "info" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Tên khách hàng</label>
                  <input value={form.customerName} onChange={e => set("customerName", e.target.value)} className={inputCls} placeholder="Nguyễn Văn A" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Tên doanh nghiệp</label>
                  <input value={form.businessName} onChange={e => set("businessName", e.target.value)} className={inputCls} placeholder="ABC Co., Ltd" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Mã KH</label>
                  <input value={form.custId} onChange={e => set("custId", e.target.value)} className={inputCls} placeholder="KH001" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">MST</label>
                  <input value={form.vatTaxId} onChange={e => set("vatTaxId", e.target.value)} className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Trạng thái</label>
                  <select value={form.status} onChange={e => set("status", e.target.value)} className={inputCls}>
                    {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Nhân viên phụ trách</label>
                  <select value={form.responsibleStaffId} onChange={e => set("responsibleStaffId", e.target.value)} className={inputCls}>
                    <option value="">-- Không có --</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Ngôn ngữ ưu tiên</label>
                <select value={form.preferredLanguage} onChange={e => set("preferredLanguage", e.target.value)} className={inputCls}>
                  <option value="">-- Chọn --</option>
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Ghi chú</label>
                <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3}
                  className={cn(inputCls, "resize-none")} placeholder="Ghi chú về khách hàng..." />
              </div>
            </>
          )}

          {tab === "contact" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Người liên hệ</label>
                  <input value={form.contactPerson} onChange={e => set("contactPerson", e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Điện thoại</label>
                  <input value={form.phone} onChange={e => set("phone", e.target.value)} className={inputCls} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input type="email" value={form.email} onChange={e => set("email", e.target.value)} className={inputCls} />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Website</label>
                <input type="url" value={form.website} onChange={e => set("website", e.target.value)} className={inputCls} placeholder="https://..." />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Địa chỉ</label>
                <input value={form.address} onChange={e => set("address", e.target.value)} className={inputCls} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Thành phố</label>
                  <input value={form.city} onChange={e => set("city", e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">PLZ</label>
                  <input value={form.plz} onChange={e => set("plz", e.target.value)} className={inputCls} />
                </div>
              </div>
            </>
          )}

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50">Hủy</button>
            <button type="submit" disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg flex items-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {customer ? "Cập nhật" : "Thêm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
