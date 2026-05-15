"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Employee { id: number; fullName: string }

interface LeaveItem {
  id: number;
  date: string;
  type: string;
  requestedHours: number | string;
  reason?: string | null;
  evidenceLink?: string | null;
  employeeId: number;
}

interface Props {
  item: LeaveItem | null;
  employees: Employee[];
  isManager: boolean;
  currentUserId: number;
  onClose: () => void;
  onSaved: (item: any) => void;
}

const LEAVE_TYPES = [
  { value: "VACATION", label: "Nghỉ phép" },
  { value: "HOLIDAY", label: "Nghỉ lễ" },
  { value: "ILLNESS", label: "Nghỉ bệnh" },
  { value: "OTHER", label: "Khác" },
];

export function LeaveFormModal({ item, employees, isManager, currentUserId, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    date: item ? String(item.date).slice(0, 10) : format(new Date(), "yyyy-MM-dd"),
    type: item?.type ?? "VACATION",
    requestedHours: item ? String(Number(item.requestedHours)) : "8",
    reason: item?.reason ?? "",
    evidenceLink: item?.evidenceLink ?? "",
    employeeId: item?.employeeId ?? currentUserId,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body: any = {
        date: form.date,
        type: form.type,
        requestedHours: Number(form.requestedHours),
        reason: form.reason || undefined,
        evidenceLink: form.evidenceLink || undefined,
      };
      if (isManager) body.employeeId = Number(form.employeeId);

      const url = item ? `/api/leave/${item.id}` : "/api/leave";
      const method = item ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) { setError(JSON.stringify(json.error)); return; }
      onSaved(json.data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">{item ? "Sửa đơn nghỉ" : "Tạo đơn nghỉ"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {isManager && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Nhân viên</label>
              <select value={form.employeeId} onChange={e => setForm(p => ({ ...p, employeeId: Number(e.target.value) }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Ngày nghỉ</label>
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Số giờ nghỉ</label>
              <input type="number" min={0.5} max={24} step={0.5} value={form.requestedHours}
                onChange={e => setForm(p => ({ ...p, requestedHours: e.target.value }))} required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Loại nghỉ</label>
            <div className="flex flex-wrap gap-2">
              {LEAVE_TYPES.map(t => (
                <button key={t.value} type="button" onClick={() => setForm(p => ({ ...p, type: t.value }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition ${
                    form.type === t.value ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600 hover:border-blue-300"
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Lý do</label>
            <textarea value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} rows={2}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Lý do xin nghỉ..." />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Link minh chứng (nếu có)</label>
            <input type="url" value={form.evidenceLink} onChange={e => setForm(p => ({ ...p, evidenceLink: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://..." />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">Hủy</button>
            <button type="submit" disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg flex items-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {item ? "Cập nhật" : "Gửi đơn"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
