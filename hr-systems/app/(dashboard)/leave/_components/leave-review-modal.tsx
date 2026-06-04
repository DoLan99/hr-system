"use client";

import { useState } from "react";
import { X, Loader2, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface LeaveItem {
  id: number;
  date: string;
  type: string;
  requestedHours: number | string;
  reason?: string | null;
  evidenceLink?: string | null;
  employee: { fullName: string; department?: string | null };
}

interface Props {
  item: LeaveItem;
  onClose: () => void;
  onSaved: (item: any) => void;
}

const TYPE_LABELS: Record<string, string> = {
  VACATION: "Nghỉ phép",
  HOLIDAY: "Nghỉ lễ",
  ILLNESS: "Nghỉ bệnh",
  OTHER: "Khác",
};

export function LeaveReviewModal({ item, onClose, onSaved }: Props) {
  const [status, setStatus] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [approvedHours, setApprovedHours] = useState(String(Number(item.requestedHours)));
  const [approvalNote, setApprovalNote] = useState("");
  const [money, setMoney] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const body: any = { status, approvalNote: approvalNote || undefined };
      if (status === "APPROVED") {
        body.approvedHours = Number(approvedHours);
        if (money) body.money = Number(money);
      }
      const res = await fetch(`/api/leave/${item.id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (res.ok) onSaved(json.data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Duyệt đơn nghỉ</h2>
            <p className="text-xs text-slate-500">{item.employee.fullName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Summary */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Ngày nghỉ</span>
              <span className="font-medium">{format(new Date(item.date), "dd/MM/yyyy", { locale: vi })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Loại</span>
              <span className="font-medium">{TYPE_LABELS[item.type] ?? item.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Yêu cầu</span>
              <span className="font-medium">{Number(item.requestedHours)}h</span>
            </div>
            {item.reason && (
              <div className="pt-1 text-slate-700 dark:text-slate-300 text-xs italic">&ldquo;{item.reason}&rdquo;</div>
            )}
            {item.evidenceLink && (
              <a href={item.evidenceLink} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-xs hover:underline pt-1">
                <ExternalLink className="w-3 h-3" /> Xem minh chứng
              </a>
            )}
          </div>

          {/* Decision */}
          <div className="flex gap-2">
            {(["APPROVED", "REJECTED"] as const).map(s => (
              <button key={s} type="button" onClick={() => setStatus(s)}
                className={cn(
                  "flex-1 py-2 rounded-xl text-sm font-medium border-2 transition flex items-center justify-center gap-1.5",
                  status === s
                    ? s === "APPROVED" ? "border-green-500 bg-green-50 dark:bg-green-950/40 text-green-700" : "border-red-500 bg-red-50 dark:bg-red-950/40 text-red-700"
                    : "border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-slate-300"
                )}>
                {s === "APPROVED" ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {s === "APPROVED" ? "Duyệt" : "Từ chối"}
              </button>
            ))}
          </div>

          {status === "APPROVED" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Số giờ duyệt</label>
                <input type="number" min={0} max={24} step={0.5} value={approvedHours}
                  onChange={e => setApprovedHours(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Tiền hỗ trợ (nếu có)</label>
                <input type="number" min={0} value={money} onChange={e => setMoney(e.target.value)}
                  placeholder="0"
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Ghi chú</label>
            <textarea value={approvalNote} onChange={e => setApprovalNote(e.target.value)} rows={2}
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Ghi chú cho nhân viên..." />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50">Hủy</button>
            <button type="submit" disabled={loading}
              className={cn(
                "px-4 py-2 text-sm font-medium text-white rounded-lg flex items-center gap-2 transition disabled:opacity-60",
                status === "APPROVED" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
              )}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Xác nhận
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
