"use client";

import { useState } from "react";
import { X, Loader2, CheckCircle2, XCircle, Video, ExternalLink, ArrowUp, ArrowDown } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn, formatMinutes } from "@/lib/utils";

interface TimeCheckItem {
  id: number;
  date: string | Date;
  taskId: string | null;
  task?: { taskId: string; taskName: string; stdTime: number } | null;
  currentStdTime: number;
  actualTime: number;
  proposedStdTime: number;
  difference: number | null;
  reason: string | null;
  videoLink: string;
  videoDuration?: number | null;
  employee: { fullName: string; department: string | null };
}

interface Props {
  item: TimeCheckItem;
  onClose: () => void;
  onReviewed: (item: any) => void;
}

export function TimeCheckReviewModal({ item, onClose, onReviewed }: Props) {
  const [status, setStatus] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [approvedTime, setApprovedTime] = useState(item.proposedStdTime);
  const [updateTask, setUpdateTask] = useState(true);
  const [decisionNote, setDecisionNote] = useState("");
  const [loading, setLoading] = useState(false);

  const isIncrease = (item.difference ?? 0) >= 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/time-check/${item.id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          approvedTime: status === "APPROVED" ? approvedTime : undefined,
          updateTaskStdTime: status === "APPROVED" && updateTask,
          decisionNote: decisionNote || undefined,
        }),
      });
      const json = await res.json();
      if (res.ok) onReviewed(json.data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Xét duyệt Time Check</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Summary */}
        <div className="mx-6 mt-4 p-4 bg-slate-50 rounded-xl space-y-3 text-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-xs text-blue-600 font-bold">{item.taskId}</p>
              <p className="font-medium text-slate-900">{item.task?.taskName ?? item.taskId}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {item.employee.fullName}{item.employee.department ? ` · ${item.employee.department}` : ""}
                {" · "}{format(new Date(item.date), "dd/MM/yyyy", { locale: vi })}
              </p>
            </div>
            <span className={cn(
              "inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full",
              isIncrease ? "bg-orange-50 text-orange-700" : "bg-green-50 text-green-700"
            )}>
              {isIncrease ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              {isIncrease ? "Tăng" : "Giảm"}
            </span>
          </div>

          {/* Comparison */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white rounded-lg p-2 border border-slate-200">
              <p className="text-xs text-slate-400">Std Time hiện tại</p>
              <p className="text-sm font-bold text-slate-700">{formatMinutes(item.currentStdTime)}</p>
            </div>
            <div className="bg-white rounded-lg p-2 border border-slate-200">
              <p className="text-xs text-slate-400">Thực tế làm</p>
              <p className="text-sm font-bold text-slate-700">{formatMinutes(item.actualTime)}</p>
            </div>
            <div className={cn("rounded-lg p-2 border-2", isIncrease ? "bg-orange-50 border-orange-200" : "bg-green-50 border-green-200")}>
              <p className="text-xs text-slate-400">Đề xuất mới</p>
              <p className={cn("text-sm font-bold", isIncrease ? "text-orange-700" : "text-green-700")}>
                {formatMinutes(item.proposedStdTime)}
              </p>
            </div>
          </div>

          {item.reason && (
            <p className="text-xs text-slate-600 border-t border-slate-200 pt-2 italic">&ldquo;{item.reason}&rdquo;</p>
          )}

          <a href={item.videoLink} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
            <Video className="w-3.5 h-3.5" />
            Xem video bằng chứng
            {item.videoDuration ? ` (${item.videoDuration} phút)` : ""}
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Decision */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Quyết định</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setStatus("APPROVED")}
                className={cn("flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-medium transition",
                  status === "APPROVED" ? "border-green-500 bg-green-50 text-green-700" : "border-slate-200 text-slate-500 hover:border-green-300")}>
                <CheckCircle2 className="w-4 h-4" />Duyệt
              </button>
              <button type="button" onClick={() => setStatus("REJECTED")}
                className={cn("flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-medium transition",
                  status === "REJECTED" ? "border-red-500 bg-red-50 text-red-700" : "border-slate-200 text-slate-500 hover:border-red-300")}>
                <XCircle className="w-4 h-4" />Từ chối
              </button>
            </div>
          </div>

          {status === "APPROVED" && (
            <>
              {/* Approved std time — có thể điều chỉnh */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Std Time được phê duyệt (phút)
                </label>
                <input
                  type="number" min={1}
                  value={approvedTime}
                  onChange={e => setApprovedTime(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {approvedTime > 0 && (
                  <p className="text-xs text-slate-400 mt-0.5">≈ {formatMinutes(approvedTime)}</p>
                )}
              </div>

              {/* Update task library checkbox */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={updateTask}
                  onChange={e => setUpdateTask(e.target.checked)}
                  className="w-4 h-4 rounded accent-blue-600"
                />
                <span className="text-sm text-slate-700">
                  Cập nhật Std Time trong Task Library ({item.taskId})
                  {updateTask && approvedTime > 0 && (
                    <span className="text-blue-600 font-medium"> → {formatMinutes(approvedTime)}</span>
                  )}
                </span>
              </label>
            </>
          )}

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
            <textarea rows={2} value={decisionNote} onChange={e => setDecisionNote(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder={status === "APPROVED" ? "Lý do duyệt, điều chỉnh nếu có..." : "Lý do từ chối..."} />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition">
              Hủy
            </button>
            <button type="submit" disabled={loading}
              className={cn("px-4 py-2 text-sm font-medium text-white rounded-lg transition flex items-center gap-2",
                status === "APPROVED"
                  ? "bg-green-600 hover:bg-green-700 disabled:bg-green-400"
                  : "bg-red-600 hover:bg-red-700 disabled:bg-red-400")}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {status === "APPROVED" ? "Xác nhận duyệt" : "Xác nhận từ chối"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
