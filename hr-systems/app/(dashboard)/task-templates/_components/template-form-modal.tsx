"use client";

import { useEffect, useState } from "react";
import { TASK_TYPE_LABELS } from "@/lib/time-logs";

type Props = {
  open: boolean;
  onClose: () => void;
  editing: any | null;
  onSaved: () => void;
};

export function TemplateFormModal({ open, onClose, editing, onSaved }: Props) {
  const [form, setForm] = useState({
    code: "",
    title: "",
    description: "",
    defaultTaskType: "NORMAL",
    defaultEstimatedTime: "",
    defaultPriority: "NORMAL",
    requiresVideo: "default",
    department: "",
    linkTemplate: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (editing) {
        setForm({
          code: editing.code,
          title: editing.title,
          description: editing.description ?? "",
          defaultTaskType: editing.defaultTaskType,
          defaultEstimatedTime: editing.defaultEstimatedTime?.toString() ?? "",
          defaultPriority: editing.defaultPriority ?? "NORMAL",
          requiresVideo: editing.requiresVideo === null ? "default" : editing.requiresVideo ? "true" : "false",
          department: editing.department ?? "",
          linkTemplate: editing.linkTemplate ?? "",
        });
      } else {
        setForm({
          code: "",
          title: "",
          description: "",
          defaultTaskType: "NORMAL",
          defaultEstimatedTime: "",
          defaultPriority: "NORMAL",
          requiresVideo: "default",
          department: "",
          linkTemplate: "",
        });
      }
      setError(null);
    }
  }, [open, editing]);

  if (!open) return null;

  async function submit() {
    setError(null);
    setSaving(true);
    try {
      const body: any = {
        title: form.title,
        description: form.description || undefined,
        defaultTaskType: form.defaultTaskType,
        defaultEstimatedTime: form.defaultEstimatedTime ? Number(form.defaultEstimatedTime) : null,
        defaultPriority: form.defaultPriority,
        requiresVideo: form.requiresVideo === "default" ? null : form.requiresVideo === "true",
        department: form.department || undefined,
        linkTemplate: form.linkTemplate || undefined,
      };
      if (!editing) body.code = form.code;

      const url = editing ? `/api/task-templates/${editing.id}` : "/api/task-templates";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
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
          <h2 className="text-lg font-semibold">{editing ? `Sửa template ${editing.code}` : "Tạo Template"}</h2>
          <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600">✕</button>
        </div>

        <div className="p-5 space-y-3.5">
          {!editing && (
            <div>
              <label className="text-xs text-slate-600 dark:text-slate-400 font-medium">Code (UPPER_SNAKE_CASE) <span className="text-red-500">*</span></label>
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="CODE_REVIEW, DAILY_STANDUP..."
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded font-mono"
              />
            </div>
          )}

          <div>
            <label className="text-xs text-slate-600 dark:text-slate-400 font-medium">Title <span className="text-red-500">*</span></label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded"
            />
          </div>

          <div>
            <label className="text-xs text-slate-600 dark:text-slate-400 font-medium">Mô tả</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-600 dark:text-slate-400 font-medium">Task type</label>
              <select
                value={form.defaultTaskType}
                onChange={(e) => setForm({ ...form, defaultTaskType: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded"
              >
                {Object.entries(TASK_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-600 dark:text-slate-400 font-medium">Priority</label>
              <select
                value={form.defaultPriority}
                onChange={(e) => setForm({ ...form, defaultPriority: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded"
              >
                {["CRITICAL", "HIGH", "NORMAL", "LOW"].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-600 dark:text-slate-400 font-medium">Estimate (phút)</label>
              <input
                type="number"
                value={form.defaultEstimatedTime}
                onChange={(e) => setForm({ ...form, defaultEstimatedTime: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 dark:text-slate-400 font-medium">Bắt buộc video</label>
              <select
                value={form.requiresVideo}
                onChange={(e) => setForm({ ...form, requiresVideo: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded"
              >
                <option value="default">Theo task type</option>
                <option value="true">Bắt buộc</option>
                <option value="false">Không bắt buộc</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-600 dark:text-slate-400 font-medium">Department</label>
              <input
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 dark:text-slate-400 font-medium">Link template</label>
              <input
                type="url"
                value={form.linkTemplate}
                onChange={(e) => setForm({ ...form, linkTemplate: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded"
              />
            </div>
          </div>

          {error && <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-3 py-2 rounded">{error}</div>}
        </div>

        <div className="px-5 py-3 border-t bg-slate-50 dark:bg-slate-800/60 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
            Hủy
          </button>
          <button
            onClick={submit}
            disabled={saving || !form.title || (!editing && !form.code)}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Đang lưu..." : editing ? "Cập nhật" : "Tạo"}
          </button>
        </div>
      </div>
    </div>
  );
}
