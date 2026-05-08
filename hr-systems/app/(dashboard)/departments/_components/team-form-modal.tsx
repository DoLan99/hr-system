"use client";

import { useState } from "react";
import { X, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Employee { id: number; fullName: string }
interface DeptOption { id: number; name: string }

interface Props {
  team?: {
    id: number; name: string; code?: string | null;
    departments: { department: { id: number; name: string } }[];
    leadId?: number | null; description?: string | null; isActive: boolean;
  } | null;
  departments: DeptOption[];
  employees: Employee[];
  onClose: () => void;
  onSaved: (t: any) => void;
}

export function TeamFormModal({ team, departments, employees, onClose, onSaved }: Props) {
  const [name, setName] = useState(team?.name ?? "");
  const [code, setCode] = useState(team?.code ?? "");
  const [selectedDeptIds, setSelectedDeptIds] = useState<Set<number>>(
    new Set(team?.departments.map(d => d.department.id) ?? [])
  );
  const [leadId, setLeadId] = useState<number | null>(team?.leadId ?? null);
  const [description, setDescription] = useState(team?.description ?? "");
  const [isActive, setIsActive] = useState(team?.isActive ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggleDept(id: number) {
    setSelectedDeptIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const url = team ? `/api/teams/${team.id}` : "/api/teams";
      const method = team ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          code: code || undefined,
          departmentIds: Array.from(selectedDeptIds),
          leadId,
          description: description || undefined,
          isActive,
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-[15px] font-semibold text-slate-900">
            {team ? "Sửa nhóm" : "Thêm nhóm"}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3.5">
          {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-[12px] font-medium text-slate-700 mb-1.5">Tên nhóm *</label>
              <input value={name} onChange={e => setName(e.target.value)} required
                placeholder="VD: Backend Team" className="form-input" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-1.5">Mã nhóm</label>
              <input value={code} onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="VD: BE" className="form-input" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-1.5">Trạng thái</label>
              <select value={isActive ? "1" : "0"} onChange={e => setIsActive(e.target.value === "1")}
                className="form-select w-full">
                <option value="1">Hoạt động</option>
                <option value="0">Tạm ngưng</option>
              </select>
            </div>
          </div>

          {/* Multi-select departments */}
          <div>
            <label className="block text-[12px] font-medium text-slate-700 mb-1.5">
              Phòng ban liên kết
              <span className="ml-1.5 text-slate-400 font-normal">(có thể chọn nhiều)</span>
            </label>
            {departments.length === 0 ? (
              <p className="text-[12px] text-slate-400 italic">Chưa có phòng ban nào</p>
            ) : (
              <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                {departments.map(d => {
                  const checked = selectedDeptIds.has(d.id);
                  return (
                    <button key={d.id} type="button" onClick={() => toggleDept(d.id)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-[12.5px] font-medium text-left border transition",
                        checked
                          ? "bg-blue-50 border-blue-200 text-blue-700"
                          : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                      )}>
                      <div className={cn(
                        "w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border",
                        checked ? "bg-blue-600 border-blue-600" : "bg-white border-slate-300"
                      )}>
                        {checked && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <span className="truncate">{d.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="block text-[12px] font-medium text-slate-700 mb-1.5">Trưởng nhóm</label>
            <select value={leadId ?? ""} onChange={e => setLeadId(e.target.value ? Number(e.target.value) : null)}
              className="form-select w-full">
              <option value="">— Chưa chọn —</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.fullName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-slate-700 mb-1.5">Mô tả</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              rows={2} className="form-input resize-none" placeholder="Mô tả nhiệm vụ nhóm..." />
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
