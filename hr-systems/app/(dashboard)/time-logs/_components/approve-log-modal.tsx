"use client";

import { useEffect, useState } from "react";

type Props = {
  log: {
    id: number;
    durationMinutes: number;
    note: string | null;
    videoLink: string | null;
    task: { code: string; title: string };
    employee: { fullName: string };
  } | null;
  onClose: () => void;
  onDone: () => void;
};

export function ApproveLogModal({ log, onClose, onDone }: Props) {
  const [mode, setMode] = useState<"approve" | "reject">("approve");
  const [approvedMinutes, setApprovedMinutes] = useState("");
  const [rating, setRating] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (log) {
      setMode("approve");
      setApprovedMinutes(String(log.durationMinutes));
      setRating("");
      setRejectionReason("");
      setError(null);
    }
  }, [log]);

  if (!log) return null;

  async function submit() {
    setError(null);
    setSaving(true);
    try {
      const url = `/api/time-logs/${log!.id}?action=${mode}`;
      const body =
        mode === "approve"
          ? { approvedMinutes: Number(approvedMinutes), rating: rating ? Number(rating) : undefined }
          : { rejectionReason };

      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : JSON.stringify(json.error));
        return;
      }
      onDone();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-md">
        <div className="px-5 py-3.5 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Duyệt Time Log</h2>
          <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600">✕</button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded p-3 text-sm">
            <div className="font-medium text-slate-800">
              <span className="font-mono text-xs text-slate-500 mr-2">{log.task.code}</span>
              {log.task.title}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {log.employee.fullName} · {log.durationMinutes} phút
            </div>
            {log.note && <div className="text-xs text-slate-700 dark:text-slate-300 mt-2 italic">&ldquo;{log.note}&rdquo;</div>}
            {log.videoLink && (
              <a href={log.videoLink} target="_blank" rel="noopener" className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block">
                ▶ Xem video
              </a>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setMode("approve")}
              className={`flex-1 py-2 text-sm rounded ${mode === "approve" ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600"}`}
            >
              Approve
            </button>
            <button
              onClick={() => setMode("reject")}
              className={`flex-1 py-2 text-sm rounded ${mode === "reject" ? "bg-red-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600"}`}
            >
              Reject
            </button>
          </div>

          {mode === "approve" ? (
            <>
              <div>
                <label className="text-xs text-slate-600 dark:text-slate-400 font-medium">Approved minutes</label>
                <input
                  type="number"
                  min={0}
                  max={log.durationMinutes}
                  value={approvedMinutes}
                  onChange={(e) => setApprovedMinutes(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded"
                />
                <p className="text-xs text-slate-500 mt-1">Max: {log.durationMinutes} phút</p>
              </div>
              <div>
                <label className="text-xs text-slate-600 dark:text-slate-400 font-medium">Rating (1–5)</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="text-xs text-slate-600 dark:text-slate-400 font-medium">Lý do từ chối <span className="text-red-500">*</span></label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded"
              />
            </div>
          )}

          {error && <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-3 py-2 rounded">{error}</div>}
        </div>

        <div className="px-5 py-3 border-t bg-slate-50 dark:bg-slate-800/60 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
            Hủy
          </button>
          <button
            onClick={submit}
            disabled={saving || (mode === "reject" && !rejectionReason)}
            className={`px-4 py-2 text-sm text-white rounded disabled:opacity-50 ${mode === "approve" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}`}
          >
            {saving ? "Đang xử lý..." : mode === "approve" ? "Duyệt" : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}
