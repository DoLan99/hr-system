"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Employee { id: number; fullName: string }
interface CustomerOption { id: number; customerName?: string | null; businessName?: string | null }
interface MessageItem {
  id: number;
  date: string;
  channel?: string | null;
  customerId?: number | null;
  subject?: string | null;
  messageSummary?: string | null;
  actionRequired?: string | null;
  assignedToId?: number | null;
  dueDate?: string | null;
  status: string;
  linkFile?: string | null;
  tags?: string | null;
  valueType?: string | null;
  supportTime?: number | null;
  benefitTime?: number | null;
  followUpNote?: string | null;
  companyAnswer?: string | null;
}

interface Props {
  message: MessageItem | null;
  employees: Employee[];
  customers: CustomerOption[];
  currentUserId: number;
  onClose: () => void;
  onSaved: (m: any) => void;
}

const CHANNELS = ["EMAIL", "SLACK", "PHONE", "ZALO", "CHAT", "OTHER"];
const CHANNEL_LABELS: Record<string, string> = {
  EMAIL: "Email", SLACK: "Slack", PHONE: "Phone", ZALO: "Zalo", CHAT: "Chat", OTHER: "Khác",
};
const VALUE_TYPES = [
  { value: "A", label: "A — Quan trọng", color: "border-red-500 bg-red-50 text-red-700" },
  { value: "B", label: "B — Trung bình", color: "border-yellow-500 bg-yellow-50 text-yellow-700" },
  { value: "C", label: "C — Thấp", color: "border-gray-400 bg-slate-50 text-slate-600" },
];

export function MessageFormModal({ message, employees, customers, currentUserId, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    date: message ? String(message.date).slice(0, 10) : format(new Date(), "yyyy-MM-dd"),
    channel: message?.channel ?? "",
    customerId: String(message?.customerId ?? ""),
    subject: message?.subject ?? "",
    messageSummary: message?.messageSummary ?? "",
    actionRequired: message?.actionRequired ?? "",
    assignedToId: String(message?.assignedToId ?? currentUserId),
    dueDate: message?.dueDate ? String(message.dueDate).slice(0, 10) : "",
    status: message?.status ?? "OPEN",
    linkFile: message?.linkFile ?? "",
    tags: message?.tags ?? "",
    valueType: message?.valueType ?? "",
    supportTime: String(message?.supportTime ?? ""),
    benefitTime: String(message?.benefitTime ?? ""),
    followUpNote: message?.followUpNote ?? "",
    companyAnswer: message?.companyAnswer ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const inputCls = "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body: any = {
        date: form.date,
        channel: form.channel || undefined,
        customerId: form.customerId ? Number(form.customerId) : undefined,
        subject: form.subject || undefined,
        messageSummary: form.messageSummary || undefined,
        actionRequired: form.actionRequired || undefined,
        assignedToId: form.assignedToId ? Number(form.assignedToId) : undefined,
        dueDate: form.dueDate || undefined,
        status: form.status,
        linkFile: form.linkFile || undefined,
        tags: form.tags || undefined,
        valueType: form.valueType || undefined,
        supportTime: form.supportTime ? Number(form.supportTime) : undefined,
        benefitTime: form.benefitTime ? Number(form.benefitTime) : undefined,
        followUpNote: form.followUpNote || undefined,
        companyAnswer: form.companyAnswer || undefined,
      };
      const url = message ? `/api/messages/${message.id}` : "/api/messages";
      const method = message ? "PUT" : "POST";
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">{message ? "Sửa tin nhắn" : "Thêm tin nhắn"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Ngày</label>
              <input type="date" value={form.date} onChange={e => set("date", e.target.value)} required className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Kênh</label>
              <div className="flex flex-wrap gap-1">
                {CHANNELS.map(c => (
                  <button key={c} type="button" onClick={() => set("channel", form.channel === c ? "" : c)}
                    className={cn("px-2 py-1 rounded text-xs font-medium border transition",
                      form.channel === c ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-500")}>
                    {CHANNEL_LABELS[c]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Chủ đề</label>
            <input value={form.subject} onChange={e => set("subject", e.target.value)} className={inputCls} placeholder="Subject / Tiêu đề..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Khách hàng</label>
              <select value={form.customerId} onChange={e => set("customerId", e.target.value)} className={inputCls}>
                <option value="">-- Không có --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.customerName || c.businessName || `#${c.id}`}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Giao cho</label>
              <select value={form.assignedToId} onChange={e => set("assignedToId", e.target.value)} className={inputCls}>
                {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Tóm tắt nội dung</label>
            <textarea value={form.messageSummary} onChange={e => set("messageSummary", e.target.value)} rows={2}
              className={cn(inputCls, "resize-none")} placeholder="Nội dung tin nhắn..." />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Hành động cần làm</label>
            <textarea value={form.actionRequired} onChange={e => set("actionRequired", e.target.value)} rows={2}
              className={cn(inputCls, "resize-none")} placeholder="Cần làm gì?" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Hạn xử lý</label>
              <input type="date" value={form.dueDate} onChange={e => set("dueDate", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Trạng thái</label>
              <select value={form.status} onChange={e => set("status", e.target.value)} className={inputCls}>
                <option value="OPEN">Mở</option>
                <option value="IN_PROGRESS">Đang xử lý</option>
                <option value="CLOSED">Đóng</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">Mức độ giá trị</label>
            <div className="flex gap-2">
              {VALUE_TYPES.map(v => (
                <button key={v.value} type="button" onClick={() => set("valueType", form.valueType === v.value ? "" : v.value)}
                  className={cn("flex-1 py-1.5 rounded-lg text-xs font-medium border-2 transition",
                    form.valueType === v.value ? v.color : "border-slate-200 text-slate-500")}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Thời gian hỗ trợ (phút)</label>
              <input type="number" min={0} value={form.supportTime} onChange={e => set("supportTime", e.target.value)} className={inputCls} placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Thời gian có lợi (phút)</label>
              <input type="number" min={0} value={form.benefitTime} onChange={e => set("benefitTime", e.target.value)} className={inputCls} placeholder="0" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Link file</label>
            <input type="url" value={form.linkFile} onChange={e => set("linkFile", e.target.value)} className={inputCls} placeholder="https://..." />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Tags</label>
            <input value={form.tags} onChange={e => set("tags", e.target.value)} className={inputCls} placeholder="tag1, tag2, ..." />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">Hủy</button>
            <button type="submit" disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg flex items-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {message ? "Cập nhật" : "Thêm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
