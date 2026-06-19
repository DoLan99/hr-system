"use client";

import { useState } from "react";
import { useToast } from "@/lib/hooks/use-toast";

const COLORS = ["#3B5BDB","#2196f3","#7c3aed","#0891b2","#059669","#d97706","#dc2626","#be185d","#0f766e","#9333ea"];

interface Employee { id: number; fullName: string }

interface DeptFormValues {
  name: string;
  code: string;
  description: string;
  headId: number | null;
  isActive: boolean;
  color: string;
}

interface Props {
  dept?: { id: number; name: string; code?: string | null; description?: string | null; headId?: number | null; isActive: boolean; color?: string | null } | null;
  employees: Employee[];
  onClose: () => void;
  onSaved: (d: any) => void;
}

export function DeptFormModal({ dept, employees, onClose, onSaved }: Props) {
  const { toast } = useToast();
  const [form, setForm] = useState<DeptFormValues>({
    name: dept?.name ?? "",
    code: dept?.code ?? "",
    description: dept?.description ?? "",
    headId: dept?.headId ?? null,
    isActive: dept?.isActive ?? true,
    color: dept?.color ?? COLORS[0],
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
          color: form.color,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error?.message ?? json.error ?? "Lỗi lưu"); return; }
      toast({ title: dept ? "Đã cập nhật phòng ban" : "Đã thêm phòng ban", description: form.name, variant: "default" });
      onSaved(json.data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dm-modal open">
      <div className="dm-scrim" onClick={onClose} />
      <div className="dm-card">
        <h2>{dept ? "Sửa phòng ban" : "Thêm phòng ban"}</h2>
        <button className="dm-close" type="button" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" width={16} height={16}>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {error && (
            <div style={{ background:"var(--danger-soft)", color:"var(--danger)", borderRadius:9, padding:"10px 14px", fontSize:".85rem" }}>
              {error}
            </div>
          )}

          <div className="dm-grid">
            <div className="dm-f" style={{ gridColumn:"1 / -1" }}>
              <label>Tên phòng ban *</label>
              <input value={form.name} onChange={e => set("name", e.target.value)} required placeholder="VD: Phòng Phát triển" />
            </div>
            <div className="dm-f">
              <label>Mã (Code)</label>
              <input value={form.code} onChange={e => set("code", e.target.value.toUpperCase())} placeholder="VD: DEV" />
            </div>
            <div className="dm-f">
              <label>Trạng thái</label>
              <select value={form.isActive ? "1" : "0"} onChange={e => set("isActive", e.target.value === "1")}>
                <option value="1">Hoạt động</option>
                <option value="0">Tạm ngưng</option>
              </select>
            </div>
          </div>

          <div className="dm-f">
            <label>Trưởng phòng</label>
            <select value={form.headId ?? ""} onChange={e => set("headId", e.target.value ? Number(e.target.value) : null)}>
              <option value="">— Chưa chọn —</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.fullName}</option>
              ))}
            </select>
          </div>

          <div className="dm-f">
            <label>Mô tả</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)}
              rows={2} style={{ height:"auto", padding:"10px 12px", resize:"none" }} placeholder="Mô tả chức năng phòng ban..." />
          </div>

          <div className="dm-f">
            <label>Màu đại diện</label>
            <div className="color-row">
              {COLORS.map(c => (
                <span key={c} className={`cpick${form.color === c ? " on" : ""}`}
                  style={{ background: c }}
                  onClick={() => set("color", c)} />
              ))}
            </div>
          </div>

          <div className="dm-foot">
            <button type="button" className="abtn ghost" onClick={onClose}>Hủy</button>
            <button type="submit" className="abtn primary" disabled={loading}>
              {loading && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={14} height={14} style={{ animation:"spin 1s linear infinite" }}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              )}
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
