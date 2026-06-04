"use client";

import { useEffect, useState } from "react";
import { TASK_TYPE_LABELS } from "@/lib/time-logs";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export function SuggestionFormModal({ open, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    proposedCode: "",
    proposedTitle: "",
    description: "",
    proposedTaskType: "NORMAL",
    proposedEstimate: "",
    evidenceVideoLink: "",
    reasonNote: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        proposedCode: "",
        proposedTitle: "",
        description: "",
        proposedTaskType: "NORMAL",
        proposedEstimate: "",
        evidenceVideoLink: "",
        reasonNote: "",
      });
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  async function submit() {
    setError(null);
    setSaving(true);
    try {
      const body = {
        proposedCode: form.proposedCode,
        proposedTitle: form.proposedTitle,
        description: form.description,
        proposedTaskType: form.proposedTaskType,
        proposedEstimate: Number(form.proposedEstimate),
        evidenceVideoLink: form.evidenceVideoLink,
        reasonNote: form.reasonNote,
      };
      const res = await fetch("/api/template-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : JSON.stringify(json.error));
        return;
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-xl">
        <div className="px-5 py-3.5 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Đề xuất Template mới</h2>
          <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600">✕</button>
        </div>

        <div className="p-5 space-y-3.5">
          <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 rounded">
            Đề xuất khi bạn phát hiện loại việc đang làm thường xuyên (ít nhất 3-5 lần) → tạo template để mọi người dùng nhanh.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-600 dark:text-slate-400 font-medium">Code (UPPER_SNAKE_CASE) <span className="text-red-500">*</span></label>
              <input
                value={form.proposedCode}
                onChange={(e) => setForm({ ...form, proposedCode: e.target.value.toUpperCase() })}
                placeholder="DEV_REPORT_DAILY..."
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 dark:text-slate-400 font-medium">Estimate (phút) <span className="text-red-500">*</span></label>
              <input
                type="number"
                min={1}
                value={form.proposedEstimate}
                onChange={(e) => setForm({ ...form, proposedEstimate: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-600 dark:text-slate-400 font-medium">Title <span className="text-red-500">*</span></label>
            <input
              value={form.proposedTitle}
              onChange={(e) => setForm({ ...form, proposedTitle: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded"
            />
          </div>

          <div>
            <label className="text-xs text-slate-600 dark:text-slate-400 font-medium">Mô tả công việc <span className="text-red-500">*</span></label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded"
            />
          </div>

          <div>
            <label className="text-xs text-slate-600 dark:text-slate-400 font-medium">Task type</label>
            <select
              value={form.proposedTaskType}
              onChange={(e) => setForm({ ...form, proposedTaskType: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded"
            >
              {Object.entries(TASK_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-600 dark:text-slate-400 font-medium">Video minh chứng (link) <span className="text-red-500">*</span></label>
            <input
              type="url"
              value={form.evidenceVideoLink}
              onChange={(e) => setForm({ ...form, evidenceVideoLink: e.target.value })}
              placeholder="https://drive.google.com/..."
              className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded"
            />
          </div>

          <div>
            <label className="text-xs text-slate-600 dark:text-slate-400 font-medium">Lý do đề xuất <span className="text-red-500">*</span></label>
            <textarea
              value={form.reasonNote}
              onChange={(e) => setForm({ ...form, reasonNote: e.target.value })}
              rows={2}
              placeholder="Lý do và tần suất gặp..."
              className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded"
            />
          </div>

          {error && <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-3 py-2 rounded">{error}</div>}
        </div>

        <div className="px-5 py-3 border-t bg-slate-50 dark:bg-slate-800/60 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
            Hủy
          </button>
          <button
            onClick={submit}
            disabled={
              saving ||
              !form.proposedCode ||
              !form.proposedTitle ||
              !form.description ||
              !form.proposedEstimate ||
              !form.evidenceVideoLink ||
              !form.reasonNote
            }
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Đang gửi..." : "Gửi đề xuất"}
          </button>
        </div>
      </div>
    </div>
  );
}
