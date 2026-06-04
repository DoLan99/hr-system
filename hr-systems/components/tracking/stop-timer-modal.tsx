"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Video, CheckCircle2, AlertCircle, ExternalLink, Plus, Trash2 } from "lucide-react";
import { parseDriveFileId } from "@/lib/google-drive";

export interface StopTimerPayload {
  videoLink?: string | null;
  videoDuration?: number | null;
  videoCount?: number;
  proofLinks?: string[];
  note?: string;
  completionPctAfter?: number | null;
  taskStatusAfter?: "IN_PROGRESS" | "BLOCKED" | "REVIEW" | "DONE" | null;
}

interface Props {
  taskCode: string;
  taskTitle: string;
  taskType?: string;
  requiresVideo?: boolean;
  elapsedLabel: string;
  onConfirm: (payload: StopTimerPayload) => Promise<void>;
  onCancel: () => void;
}

type DriveState =
  | { status: "idle" }
  | { status: "fetching" }
  | { status: "ok"; durationMinutes: number; title: string }
  | { status: "error"; message: string };

interface VideoEntry {
  id: string;
  url: string;
  driveState: DriveState;
}

const VIDEO_REQUIRED_TYPES = ["LEARNING", "NEW_RESEARCH"];
const STATUS_OPTIONS = [
  { value: "", label: "— Giữ nguyên —" },
  { value: "IN_PROGRESS", label: "Đang làm" },
  { value: "BLOCKED", label: "Bị chặn" },
  { value: "REVIEW", label: "Chờ review" },
  { value: "DONE", label: "Hoàn thành" },
];

let idCounter = 0;
function newEntry(): VideoEntry {
  return { id: String(++idCounter), url: "", driveState: { status: "idle" } };
}

export function StopTimerModal({
  taskCode,
  taskTitle,
  taskType,
  requiresVideo,
  elapsedLabel,
  onConfirm,
  onCancel,
}: Props) {
  const [entries, setEntries] = useState<VideoEntry[]>([newEntry()]);
  const [note, setNote] = useState("");
  const [completionPct, setCompletionPct] = useState("");
  const [taskStatusAfter, setTaskStatusAfter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fetchTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const isVideoRequired = requiresVideo || VIDEO_REQUIRED_TYPES.includes(taskType ?? "");

  const validEntries = entries.filter((e) => e.driveState.status === "ok");
  const totalDuration = validEntries.reduce(
    (sum, e) => sum + (e.driveState.status === "ok" ? e.driveState.durationMinutes : 0),
    0,
  );
  const hasAnyVideo = entries.some((e) => e.url.trim() !== "");
  const hasValidVideo = validEntries.length > 0;
  const canSubmit = !submitting && (!isVideoRequired || hasValidVideo);

  function updateEntry(id: string, patch: Partial<VideoEntry>) {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  function handleUrlChange(id: string, url: string) {
    updateEntry(id, { url, driveState: { status: "idle" } });

    if (fetchTimers.current[id]) clearTimeout(fetchTimers.current[id]);

    const trimmed = url.trim();
    if (!trimmed) return;

    const fileId = parseDriveFileId(trimmed);
    if (!fileId) {
      updateEntry(id, { driveState: { status: "error", message: "Không nhận dạng được link Google Drive" } });
      return;
    }

    updateEntry(id, { driveState: { status: "fetching" } });
    fetchTimers.current[id] = setTimeout(async () => {
      try {
        const res = await fetch(`/api/drive/video-info?url=${encodeURIComponent(trimmed)}`);
        const json = await res.json();
        if (res.ok && json.data) {
          updateEntry(id, {
            driveState: { status: "ok", durationMinutes: json.data.durationMinutes, title: json.data.title },
          });
        } else {
          updateEntry(id, { driveState: { status: "error", message: json.error ?? "Lỗi không xác định" } });
        }
      } catch {
        updateEntry(id, { driveState: { status: "error", message: "Không kết nối được Drive API" } });
      }
    }, 600);
  }

  function addEntry() {
    setEntries((prev) => [...prev, newEntry()]);
  }

  function removeEntry(id: string) {
    if (fetchTimers.current[id]) clearTimeout(fetchTimers.current[id]);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  // Cleanup timers on unmount
  useEffect(() => {
    const timers = fetchTimers.current;
    return () => { Object.values(timers).forEach(clearTimeout); };
  }, []);

  async function handleConfirm() {
    setSubmitting(true);
    const proofLinks = entries.map((e) => e.url.trim()).filter(Boolean);
    const payload: StopTimerPayload = {
      proofLinks,
      videoLink: proofLinks[0] ?? null,
      videoDuration: totalDuration > 0 ? totalDuration : null,
      videoCount: proofLinks.length,
      note: note.trim() || undefined,
      completionPctAfter: completionPct !== "" ? Number(completionPct) : null,
      taskStatusAfter: (taskStatusAfter as StopTimerPayload["taskStatusAfter"]) || null,
    };
    await onConfirm(payload);
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">{taskCode}</p>
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[280px]">{taskTitle}</h2>
            </div>
            <span className="text-xs bg-red-50 text-red-700 font-mono px-2 py-1 rounded-md border border-red-200">
              {elapsedLabel}
            </span>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Video links */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5" />
                Link video Google Drive
                {isVideoRequired && <span className="text-red-500">*</span>}
                {!isVideoRequired && <span className="text-slate-400">(tuỳ chọn)</span>}
              </label>
              {totalDuration > 0 && (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Tổng: {totalDuration} phút
                </span>
              )}
            </div>

            <div className="space-y-2">
              {entries.map((entry, idx) => (
                <VideoEntryRow
                  key={entry.id}
                  entry={entry}
                  index={idx}
                  canRemove={entries.length > 1}
                  onUrlChange={(url) => handleUrlChange(entry.id, url)}
                  onRemove={() => removeEntry(entry.id)}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={addEntry}
              className="mt-2 flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm video khác
            </button>

            {isVideoRequired && !hasValidVideo && hasAnyVideo && (
              <p className="mt-1.5 text-xs text-amber-600">
                Cần ít nhất 1 link hợp lệ. Task type này yêu cầu video bằng chứng.
              </p>
            )}
            {isVideoRequired && !hasAnyVideo && (
              <p className="mt-1.5 text-xs text-amber-600">
                Task type này yêu cầu video bằng chứng để được tính giờ.
              </p>
            )}
          </div>

          {/* Ghi chú */}
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">
              Ghi chú <span className="text-slate-400">(tuỳ chọn)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Tóm tắt việc đã làm..."
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">% Hoàn thành</label>
              <input
                type="number"
                min={0}
                max={100}
                value={completionPct}
                onChange={(e) => setCompletionPct(e.target.value)}
                placeholder="0–100"
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">Trạng thái sau</label>
              <select
                value={taskStatusAfter}
                onChange={(e) => setTaskStatusAfter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t bg-slate-50 dark:bg-slate-800/60 flex justify-end gap-2 sticky bottom-0 rounded-b-xl">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg disabled:opacity-50"
          >
            Huỷ
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canSubmit}
            className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-lg font-medium transition flex items-center gap-1.5"
          >
            {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Dừng timer
          </button>
        </div>
      </div>
    </div>
  );
}

function VideoEntryRow({
  entry,
  index,
  canRemove,
  onUrlChange,
  onRemove,
}: {
  entry: VideoEntry;
  index: number;
  canRemove: boolean;
  onUrlChange: (url: string) => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex gap-1.5">
        <div className="flex-1">
          <input
            type="url"
            value={entry.url}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder={index === 0 ? "https://drive.google.com/file/d/..." : `Video ${index + 1}...`}
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="flex-shrink-0 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
            title="Xoá"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {entry.driveState.status === "fetching" && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 pl-1">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang đọc...
        </div>
      )}
      {entry.driveState.status === "ok" && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-md">
          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="font-medium">{entry.driveState.durationMinutes} phút</span>
          <span className="text-emerald-600 truncate">· {entry.driveState.title}</span>
          <a href={entry.url} target="_blank" rel="noopener noreferrer" className="ml-auto flex-shrink-0">
            <ExternalLink className="w-3 h-3 hover:text-emerald-900" />
          </a>
        </div>
      )}
      {entry.driveState.status === "error" && (
        <div className="flex items-center gap-1.5 text-xs text-red-700 bg-red-50 px-2.5 py-1.5 rounded-md">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {entry.driveState.message}
        </div>
      )}
    </div>
  );
}
