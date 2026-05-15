"use client";

import { useEffect, useState } from "react";
import { TASK_TYPE_LABELS, isVideoRequired } from "@/lib/time-logs";

type Task = {
  id: number;
  code: string;
  title: string;
  taskType: string;
  estimatedTime: number | null;
  actualTimeTotal: number;
  requiresVideo: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  tasks: Task[];
  preselectedTaskId: number | null;
  defaultDate: string;
  onSaved: () => void;
};

export function TimeLogFormModal({ open, onClose, tasks, preselectedTaskId, defaultDate, onSaved }: Props) {
  const [form, setForm] = useState({
    taskId: "",
    date: defaultDate,
    durationMinutes: "",
    note: "",
    completionPctAfter: "",
    taskStatusAfter: "",
    videoLink: "",
    videoCount: "",
    videoDuration: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        taskId: preselectedTaskId ? String(preselectedTaskId) : "",
        date: defaultDate,
        durationMinutes: "",
        note: "",
        completionPctAfter: "",
        taskStatusAfter: "",
        videoLink: "",
        videoCount: "",
        videoDuration: "",
      });
      setError(null);
    }
  }, [open, preselectedTaskId, defaultDate]);

  if (!open) return null;

  const selectedTask = tasks.find((t) => String(t.id) === form.taskId);
  const needVideo = selectedTask ? isVideoRequired(selectedTask.taskType as any, selectedTask.requiresVideo) : false;
  const willExceed =
    selectedTask?.estimatedTime &&
    Number(form.durationMinutes) + selectedTask.actualTimeTotal > selectedTask.estimatedTime;
  const videoMandatory = needVideo || willExceed;

  async function submit() {
    setError(null);
    setSaving(true);
    try {
      const body = {
        taskId: Number(form.taskId),
        date: form.date,
        durationMinutes: Number(form.durationMinutes),
        note: form.note || undefined,
        completionPctAfter: form.completionPctAfter ? Number(form.completionPctAfter) : undefined,
        taskStatusAfter: form.taskStatusAfter || undefined,
        videoLink: form.videoLink || undefined,
        videoCount: form.videoCount ? Number(form.videoCount) : 0,
        videoDuration: form.videoDuration ? Number(form.videoDuration) : 0,
      };

      const res = await fetch("/api/time-logs", {
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl">
        <div className="px-5 py-3.5 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Log Time</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <div className="p-5 space-y-3.5">
          <div>
            <label className="text-xs text-slate-600 font-medium">Task <span className="text-red-500">*</span></label>
            <select
              value={form.taskId}
              onChange={(e) => setForm({ ...form, taskId: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded"
            >
              <option value="">— Chọn task —</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.code} · {t.title} ({TASK_TYPE_LABELS[t.taskType as keyof typeof TASK_TYPE_LABELS]})
                </option>
              ))}
            </select>
            {selectedTask && (
              <p className="text-xs text-slate-500 mt-1">
                Estimate: {selectedTask.estimatedTime ?? "—"} phút · Đã log: {selectedTask.actualTimeTotal} phút
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-600 font-medium">Ngày <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-medium">Duration (phút) <span className="text-red-500">*</span></label>
              <input
                type="number"
                min={1}
                value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-600 font-medium">Note</label>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              rows={2}
              placeholder="Mô tả ngắn lần log này..."
              className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-600 font-medium">% hoàn thành sau log này</label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.completionPctAfter}
                onChange={(e) => setForm({ ...form, completionPctAfter: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-medium">Đổi status task</label>
              <select
                value={form.taskStatusAfter}
                onChange={(e) => setForm({ ...form, taskStatusAfter: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded"
              >
                <option value="">— Giữ nguyên —</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="BLOCKED">Blocked</option>
                <option value="REVIEW">Chờ review</option>
                <option value="DONE">Done</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-600 font-medium">
              Video link {videoMandatory && <span className="text-red-500">* bắt buộc</span>}
            </label>
            <input
              type="url"
              value={form.videoLink}
              onChange={(e) => setForm({ ...form, videoLink: e.target.value })}
              placeholder="https://drive.google.com/..."
              className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded"
            />
            {videoMandatory && !form.videoLink && (
              <p className="text-xs text-amber-600 mt-1">
                {needVideo ? "Task type này yêu cầu video" : "Vượt estimate cần video để được full credit"}
              </p>
            )}
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</div>}
        </div>

        <div className="px-5 py-3 border-t bg-slate-50 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded">
            Hủy
          </button>
          <button
            onClick={submit}
            disabled={saving || !form.taskId || !form.durationMinutes}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Đang lưu..." : "Tạo log"}
          </button>
        </div>
      </div>
    </div>
  );
}
