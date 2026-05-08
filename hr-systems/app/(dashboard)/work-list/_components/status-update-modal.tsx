"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_OPTS = [
  { value: "NOT_STARTED", label: "Chưa bắt đầu" },
  { value: "IN_PROGRESS", label: "Đang làm" },
  { value: "BLOCKED", label: "Bị block" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "CANCELLED", label: "Đã huỷ" },
];

interface WorkItem {
  wlId: string;
  title: string;
  status: string;
  progressPct: number;
  reasonNextAction: string | null;
}

interface Props {
  item: WorkItem;
  onClose: () => void;
  onSaved: (item: any) => void;
}

export function StatusUpdateModal({ item, onClose, onSaved }: Props) {
  const [status, setStatus] = useState(item.status);
  const [progress, setProgress] = useState(item.progressPct);
  const [reason, setReason] = useState(item.reasonNextAction ?? "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/work-list/${item.wlId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          progressPct: progress,
          reasonNextAction: reason || undefined,
        }),
      });
      const json = await res.json();
      if (res.ok) onSaved(json.data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <p className="text-xs text-slate-400 font-mono">{item.wlId}</p>
            <h2 className="text-base font-semibold text-slate-900 line-clamp-1">{item.title}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Trạng thái</label>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={cn(
                    "text-sm px-3 py-2 rounded-lg border transition text-left",
                    status === opt.value
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-700 border-slate-300 hover:border-blue-400"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Progress */}
          {status === "IN_PROGRESS" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tiến độ — <span className="text-blue-600 font-bold">{progress}%</span>
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={progress}
                onChange={e => setProgress(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-0.5">
                <span>0%</span><span>50%</span><span>100%</span>
              </div>
            </div>
          )}

          {/* Reason / note */}
          {(status === "BLOCKED" || status === "IN_PROGRESS") && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {status === "BLOCKED" ? "Lý do bị block" : "Bước tiếp theo / ghi chú"}
              </label>
              <textarea
                rows={2}
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder={status === "BLOCKED" ? "Mô tả vấn đề đang block..." : "Kế hoạch tiếp theo..."}
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Cập nhật
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
