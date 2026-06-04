"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";

interface Employee { id: number; fullName: string }

interface DeptFormValues {
  name: string;
  code: string;
  description: string;
  headId: number | null;
  isActive: boolean;
}

interface Props {
  dept?: { id: number; name: string; code?: string | null; description?: string | null; headId?: number | null; isActive: boolean } | null;
  employees: Employee[];
  onClose: () => void;
  onSaved: (d: any) => void;
}

export function DeptFormModal({ dept, employees, onClose, onSaved }: Props) {
  const [form, setForm] = useState<DeptFormValues>({
    name: dept?.name ?? "",
    code: dept?.code ?? "",
    description: dept?.description ?? "",
    headId: dept?.headId ?? null,
    isActive: dept?.isActive ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof DeptFormValues>(k: K, v: DeptFormValues[K]) {
    setForm(p => ({ ...p, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const url = dept ? `/api/departments/${dept.id}` : "/api/departments";
      const method = dept ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          code: form.code || undefined,
          description: form.description || undefined,
          headId: form.headId,
          isActive: form.isActive,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error?.message ?? "Lỗi lưu"); return; }
      onSaved(json.data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-[15px] font-semibold text-slate-900">
            {dept ? "Sửa phòng ban" : "Thêm phòng ban"}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 dark:text-slate-500 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3.5">
          {error && <p className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-950/40 px-3 py-2 rounded-lg">{error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tên phòng ban *</label>
              <input value={form.name} onChange={e => set("name", e.target.value)} required
                placeholder="VD: Phòng Phát triển" className="form-input" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">Mã (Code)</label>
              <input value={form.code} onChange={e => set("code", e.target.value.toUpperCase())}
                placeholder="VD: DEV" className="form-input" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">Trạng thái</label>
              <select value={form.isActive ? "1" : "0"} onChange={e => set("isActive", e.target.value === "1")}
                className="form-select w-full">
                <option value="1">Hoạt động</option>
                <option value="0">Tạm ngưng</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">Trưởng phòng</label>
            <select value={form.headId ?? ""} onChange={e => set("headId", e.target.value ? Number(e.target.value) : null)}
              className="form-select w-full">
              <option value="">— Chưa chọn —</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.fullName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">Mô tả</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)}
              rows={2} className="form-input resize-none" placeholder="Mô tả chức năng phòng ban..." />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary">Hủy</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
