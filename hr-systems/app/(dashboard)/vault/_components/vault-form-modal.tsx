"use client";

import { useState } from "react";
import { X, Loader2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomerOption { id: number; customerName?: string | null; businessName?: string | null }
interface Employee { id: number; fullName: string }
interface VaultItem {
  id: number;
  scope: string;
  entityName?: string | null;
  customerId?: number | null;
  serviceApp?: string | null;
  loginUrl?: string | null;
  username?: string | null;
  emailUsed?: string | null;
  twoFaMethod?: string | null;
  ownerId?: number | null;
  rotationDays?: number | null;
  notes?: string | null;
}

interface Props {
  vault: VaultItem | null;
  customers: CustomerOption[];
  employees: Employee[];
  onClose: () => void;
  onSaved: (v: any) => void;
}

export function VaultFormModal({ vault, customers, employees, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    scope: vault?.scope ?? "COMPANY",
    entityName: vault?.entityName ?? "",
    customerId: String(vault?.customerId ?? ""),
    serviceApp: vault?.serviceApp ?? "",
    loginUrl: vault?.loginUrl ?? "",
    username: vault?.username ?? "",
    emailUsed: vault?.emailUsed ?? "",
    password: "",
    twoFaMethod: vault?.twoFaMethod ?? "",
    twoFaBackup: "",
    ownerId: String(vault?.ownerId ?? ""),
    rotationDays: String(vault?.rotationDays ?? ""),
    notes: vault?.notes ?? "",
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const inputCls = "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!vault && !form.password) { setError("Mật khẩu không được để trống"); return; }
    setLoading(true);
    try {
      const body: any = {
        scope: form.scope,
        entityName: form.entityName || undefined,
        customerId: form.customerId ? Number(form.customerId) : undefined,
        serviceApp: form.serviceApp || undefined,
        loginUrl: form.loginUrl || undefined,
        username: form.username || undefined,
        emailUsed: form.emailUsed || undefined,
        twoFaMethod: form.twoFaMethod || undefined,
        twoFaBackup: form.twoFaBackup || undefined,
        ownerId: form.ownerId ? Number(form.ownerId) : undefined,
        rotationDays: form.rotationDays ? Number(form.rotationDays) : undefined,
        notes: form.notes || undefined,
      };
      if (form.password) body.password = form.password;

      const url = vault ? `/api/vault/${vault.id}` : "/api/vault";
      const method = vault ? "PUT" : "POST";
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">{vault ? "Sửa mật khẩu" : "Thêm mật khẩu"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Loại</label>
            <div className="flex gap-2">
              {["COMPANY", "CUSTOMER"].map(s => (
                <button key={s} type="button" onClick={() => set("scope", s)}
                  className={cn("flex-1 py-2 rounded-lg text-xs font-medium border-2 transition",
                    form.scope === s ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600")}>
                  {s === "COMPANY" ? "Công ty" : "Khách hàng"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Tên thực thể</label>
              <input value={form.entityName} onChange={e => set("entityName", e.target.value)} className={inputCls} placeholder="Google, GitHub..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Ứng dụng / Dịch vụ</label>
              <input value={form.serviceApp} onChange={e => set("serviceApp", e.target.value)} className={inputCls} placeholder="Gmail, VS Code..." />
            </div>
          </div>

          {form.scope === "CUSTOMER" && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Khách hàng</label>
              <select value={form.customerId} onChange={e => set("customerId", e.target.value)} className={inputCls}>
                <option value="">-- Chọn khách hàng --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.customerName || c.businessName || `#${c.id}`}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">URL đăng nhập</label>
            <input type="url" value={form.loginUrl} onChange={e => set("loginUrl", e.target.value)} className={inputCls} placeholder="https://..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Username</label>
              <input value={form.username} onChange={e => set("username", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email dùng</label>
              <input type="email" value={form.emailUsed} onChange={e => set("emailUsed", e.target.value)} className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Mật khẩu {vault && "(để trống = giữ nguyên)"}
            </label>
            <div className="relative">
              <input type={showPass ? "text" : "password"} value={form.password} onChange={e => set("password", e.target.value)}
                required={!vault} className={cn(inputCls, "pr-9")} placeholder="••••••••" />
              <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">2FA method</label>
              <input value={form.twoFaMethod} onChange={e => set("twoFaMethod", e.target.value)} className={inputCls} placeholder="TOTP, SMS..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Rotation (ngày)</label>
              <input type="number" min={0} value={form.rotationDays} onChange={e => set("rotationDays", e.target.value)} className={inputCls} placeholder="90" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Người phụ trách</label>
            <select value={form.ownerId} onChange={e => set("ownerId", e.target.value)} className={inputCls}>
              <option value="">-- Chọn --</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Ghi chú</label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2}
              className={cn(inputCls, "resize-none")} />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">Hủy</button>
            <button type="submit" disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg flex items-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {vault ? "Cập nhật" : "Thêm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
