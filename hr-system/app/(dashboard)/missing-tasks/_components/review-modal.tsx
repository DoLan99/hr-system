"use client";

import { useState } from "react";
import { X, Loader2, CheckCircle2, XCircle, Video, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn, formatMinutes } from "@/lib/utils";

interface MissingTask {
  id: number;
  date: string | Date;
  taskName: string;
  description?: string | null;
  quantity: number;
  timeAllotted: number | null;
  videoLink: string;
  videoDuration?: number | null;
  dateRecorded?: string | null;
  reasonNote?: string | null;
  employee: { fullName: string; department: string | null };
}

interface Props {
  task: MissingTask;
  onClose: () => void;
  onReviewed: (item: any) => void;
}

export function ReviewModal({ task, onClose, onReviewed }: Props) {
  const [status, setStatus] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [approvedTime, setApprovedTime] = useState(task.timeAllotted ?? 0);
  const [bonusTime, setBonusTime] = useState(0);
  const [decisionNote, setDecisionNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/missing-tasks/${task.id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          approvedTime: status === "APPROVED" ? approvedTime : undefined,
          bonusTime: status === "APPROVED" ? bonusTime : 0,
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
          <h2 className="text-base font-semibold text-slate-900">Xét duyệt Missing Task</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Task summary */}
        <div className="mx-6 mt-4 p-4 bg-slate-50 rounded-xl space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-900">{task.taskName}</span>
            <span className="text-xs text-slate-500">
              {format(new Date(task.date), "dd/MM/yyyy", { locale: vi })}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {task.employee.fullName}{task.employee.department ? ` · ${task.employee.department}` : ""}
          </p>
          {task.description && (
            <p className="text-xs text-slate-600 border-t border-slate-200 pt-2">{task.description}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-slate-500 border-t border-slate-200 pt-2 flex-wrap">
            <span>Số lượng: <strong className="text-slate-700">{task.quantity}</strong></span>
            <span>Thời gian khai: <strong className="text-slate-700">{task.timeAllotted ? formatMinutes(task.timeAllotted) : "—"}</strong></span>
            {task.videoDuration && (
              <span>Video: <strong className="text-slate-700">{task.videoDuration} phút</strong></span>
            )}
            {task.reasonNote && (
              <span className="w-full">Lý do: <em className="text-slate-600">{task.reasonNote}</em></span>
            )}
          </div>
          <a
            href={task.videoLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
          >
            <Video className="w-3.5 h-3.5" />
            Xem video bằng chứng
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Decision */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Quyết định</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus("APPROVED")}
                className={cn(
                  "flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-medium transition",
                  status === "APPROVED"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-slate-200 text-slate-500 hover:border-green-300"
                )}
              >
                <CheckCircle2 className="w-4 h-4" />
                Duyệt
              </button>
              <button
                type="button"
                onClick={() => setStatus("REJECTED")}
                className={cn(
                  "flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-medium transition",
                  status === "REJECTED"
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-slate-200 text-slate-500 hover:border-red-300"
                )}
              >
                <XCircle className="w-4 h-4" />
                Từ chối
              </button>
            </div>
          </div>

          {/* Approved time + bonus (chỉ khi APPROVED) */}
          {status === "APPROVED" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Giờ được tính (phút)
                </label>
                <input
                  type="number"
                  min={0}
                  value={approvedTime}
                  onChange={e => setApprovedTime(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {approvedTime > 0 && (
                  <p className="text-xs text-slate-400 mt-0.5">≈ {formatMinutes(approvedTime)}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Bonus thêm (phút)
                </label>
                <input
                  type="number"
                  min={0}
                  value={bonusTime}
                  onChange={e => setBonusTime(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Decision note */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Ghi chú quyết định
            </label>
            <textarea
              rows={2}
              value={decisionNote}
              onChange={e => setDecisionNote(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder={status === "APPROVED" ? "Lý do duyệt, điều chỉnh giờ..." : "Lý do từ chối..."}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition">
              Hủy
            </button>
            <button type="submit" disabled={loading}
              className={cn(
                "px-4 py-2 text-sm font-medium text-white rounded-lg transition flex items-center gap-2",
                status === "APPROVED"
                  ? "bg-green-600 hover:bg-green-700 disabled:bg-green-400"
                  : "bg-red-600 hover:bg-red-700 disabled:bg-red-400"
              )}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {status === "APPROVED" ? "Xác nhận duyệt" : "Xác nhận từ chối"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
