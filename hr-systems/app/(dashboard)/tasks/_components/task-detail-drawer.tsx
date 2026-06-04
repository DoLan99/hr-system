"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCurrentUser } from "@/lib/contexts/current-user-context";
import { X, Clock, AlertCircle, Plus, Check } from "lucide-react";
import { useLocale } from "@/lib/i18n/context";
import { DEFAULT_LABEL_CONFIG, type LabelConfig } from "@/lib/system-labels";
import { RichTextEditor } from "@/components/shared/rich-text-editor";
import { TimerButton } from "@/components/tracking/timer-button";

type SubTask = { id: number; code: string; title: string; status: string; progressPct: number };
type TimeLogEntry = {
  id: number;
  date: string;
  durationMinutes: number;
  approvalStatus: string;
  note: string | null;
  employee: { id: number; fullName: string };
};

type TaskDetail = {
  id: number;
  code: string;
  title: string;
  description: string | null;
  taskType: string;
  priority: string;
  status: string;
  estimatedTime: number | null;
  actualTimeTotal: number;
  progressPct: number;
  billable: boolean;
  requiresVideo: boolean;
  dueDate: string | null;
  dateCreated: string;
  dateStarted: string | null;
  dateCompleted: string | null;
  isOverdue: boolean;
  reasonNextAction: string | null;
  assignedTo: { id: number; fullName: string; avatarUrl: string | null };
  assignedBy: { id: number; fullName: string };
  customer: { id: number; customerName: string | null; businessName: string | null } | null;
  template: { id: number; code: string; title: string } | null;
  parentTask: { id: number; code: string; title: string } | null;
  subTasks: SubTask[];
  timeLogs: TimeLogEntry[];
  _count: { timeLogs: number; subTasks: number };
};

type Props = {
  taskId: number | null;
  open: boolean;
  onClose: () => void;
  employees: { id: number; fullName: string; department: string | null }[];
  customers: { id: number; customerName: string | null; businessName: string | null }[];
  isManager: boolean;
  labelConfig?: LabelConfig;
  onSaved: () => void;
  onOpenTask?: (id: number) => void;
};

const STATUSES = ["BACKLOG", "IN_PROGRESS", "BLOCKED", "REVIEW", "DONE", "CANCELLED"];
const PRIORITIES = ["CRITICAL", "HIGH", "NORMAL", "LOW"];
const TASK_TYPES = ["NORMAL", "LEARNING", "NEW_RESEARCH", "MEETING", "ADMIN", "BILLABLE_CLIENT", "INTERNAL"];

const STATUS_STYLE: Record<string, string> = {
  BACKLOG:     "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200",
  IN_PROGRESS: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200",
  BLOCKED:     "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200",
  REVIEW:      "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200",
  DONE:        "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200",
  CANCELLED:   "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200",
};

const PRIORITY_DOT: Record<string, string> = {
  CRITICAL: "bg-red-500",
  HIGH:     "bg-orange-400",
  NORMAL:   "bg-blue-400",
  LOW:      "bg-slate-300",
};

const AVATAR_GRADIENTS = [
  "from-blue-400 to-blue-600",
  "from-violet-400 to-violet-600",
  "from-emerald-400 to-emerald-600",
  "from-rose-400 to-rose-600",
  "from-amber-400 to-amber-600",
  "from-cyan-400 to-cyan-600",
];

function formatMin(min: number | null | undefined) {
  if (min === null || min === undefined || min === 0) return "—";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-[11px] text-slate-400 dark:text-slate-500 w-24 flex-shrink-0 pt-0.5 font-medium uppercase tracking-wide">{label}</span>
      <div className="flex-1 min-w-0 text-xs text-slate-700">{children}</div>
    </div>
  );
}

export function TaskDetailDrawer({ taskId, open, onClose, employees, customers, isManager, labelConfig: lc, onSaved, onOpenTask }: Props) {
  const labelConfig = lc ?? DEFAULT_LABEL_CONFIG;
  const { t } = useLocale();
  const authUser = useCurrentUser();
  const currentUserId = authUser.employeeId;

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [descHtml, setDescHtml] = useState("");
  const [descSaved, setDescSaved] = useState(""); // last saved value for cancel
  const [descDirty, setDescDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [descSaving, setDescSaving] = useState(false);
  const [estimatedDraft, setEstimatedDraft] = useState("");
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [subTaskTitle, setSubTaskTitle] = useState("");
  const [subTaskStatus, setSubTaskStatus] = useState("IN_PROGRESS");
  const [subTaskDesc, setSubTaskDesc] = useState("");
  const [subTaskDescOpen, setSubTaskDescOpen] = useState(false);
  const [subTaskSaving, setSubTaskSaving] = useState(false);
  const subTaskInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || !taskId) {
      setTask(null);
      setEditingTitle(false);
      return;
    }
    setLoading(true);
    fetch(`/api/tasks/${taskId}`)
      .then((r) => r.json())
      .then((j) => {
        setTask(j.data ?? null);
        const desc = j.data?.description ?? "";
        setDescHtml(desc);
        setDescSaved(desc);
        setDescDirty(false);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [open, taskId]);

  async function patch(data: Record<string, unknown>) {
    if (!task) return;
    setSaving(true);
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (res.ok) {
      setTask((prev) => (prev ? { ...prev, ...json.data } : prev));
      onSaved();
    }
    setSaving(false);
  }

  async function saveTitle() {
    if (!task) { setEditingTitle(false); return; }
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== task.title) await patch({ title: trimmed });
    setEditingTitle(false);
  }

  async function saveDesc() {
    if (!task) return;
    const normalized = descHtml === "<p></p>" ? "" : descHtml;
    setDescSaving(true);
    await patch({ description: normalized || null });
    setDescSaved(normalized);
    setDescDirty(false);
    setDescSaving(false);
  }

  function cancelDesc() {
    setDescHtml(descSaved);
    setDescDirty(false);
  }

  function openAddSubtask() {
    setSubTaskTitle("");
    setSubTaskStatus("IN_PROGRESS");
    setSubTaskDesc("");
    setSubTaskDescOpen(false);
    setAddingSubtask(true);
    setTimeout(() => subTaskInputRef.current?.focus(), 50);
  }

  async function createSubTask() {
    if (!task || !subTaskTitle.trim()) return;
    setSubTaskSaving(true);
    const normalized = subTaskDesc === "<p></p>" ? "" : subTaskDesc;
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: subTaskTitle.trim(),
        description: normalized || undefined,
        parentTaskId: task.id,
        assignedToId: task.assignedTo.id,
        status: subTaskStatus,
      }),
    });
    if (res.ok) {
      const json = await res.json();
      const newSub = json.data;
      setTask((prev) =>
        prev
          ? {
              ...prev,
              subTasks: [
                ...(prev.subTasks ?? []),
                { id: newSub.id, code: newSub.code, title: newSub.title, status: newSub.status, progressPct: 0 },
              ],
              _count: { ...prev._count, subTasks: (prev._count?.subTasks ?? 0) + 1 },
            }
          : prev
      );
      onSaved();
    }
    setSubTaskSaving(false);
    setAddingSubtask(false);
    setSubTaskTitle("");
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Drawer panel */}
      <div className="relative z-10 w-full max-w-4xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 bg-white">
          <div className="flex items-center gap-3 text-xs">
            <span className="font-mono text-slate-400 dark:text-slate-500 font-medium select-all">{task?.code ?? "..."}</span>
            {task && (
              <span className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold ${STATUS_STYLE[task.status] ?? "bg-slate-100 dark:bg-slate-800 text-slate-600"}`}>
                {t(`taskStatus.${task.status}`) || task.status}
              </span>
            )}
            {task?.isOverdue && (
              <span className="flex items-center gap-1 text-red-500 text-[11px] font-medium">
                <AlertCircle className="w-3 h-3" />
                {t("tasks.overdue")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {saving && <span className="text-xs text-slate-400 dark:text-slate-500 animate-pulse">{t("common.saving")}</span>}
            {task && currentUserId && (
              <TimerButton
                taskId={task.id}
                assigneeId={task.assignedTo.id}
                currentUserId={currentUserId}
                onChange={() => {
                  // refetch task để cập nhật actualTimeTotal/status
                  fetch(`/api/tasks/${task.id}`)
                    .then((r) => r.json())
                    .then((j) => j.data && setTask(j.data))
                    .catch(() => {});
                }}
              />
            )}
            {task && (
              <Link
                href={`/time-logs?taskId=${task.id}`}
                onClick={onClose}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 font-medium transition-colors"
              >
                <Clock className="w-3.5 h-3.5" />
                {t("tasks.logTime")}
              </Link>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Body */}
        {task && !loading && (
          <div className="flex flex-1 overflow-hidden">
            {/* ── Main content ── */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 min-w-0">
              {/* Title */}
              <div>
                {editingTitle ? (
                  <textarea
                    autoFocus
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onBlur={saveTitle}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveTitle(); }
                      if (e.key === "Escape") setEditingTitle(false);
                    }}
                    rows={2}
                    className="w-full text-2xl font-bold text-slate-900 dark:text-slate-100 leading-tight resize-none border border-blue-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-200"
                  />
                ) : (
                  <h1
                    className="text-2xl font-bold text-slate-900 dark:text-slate-100 leading-tight cursor-text hover:text-blue-700 transition-colors rounded-lg p-1 -m-1"
                    onClick={() => { setTitleDraft(task.title); setEditingTitle(true); }}
                  >
                    {task.title}
                  </h1>
                )}
              </div>

              {/* Description */}
              <div>
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">{t("common.description")}</h3>
                <RichTextEditor
                  value={descHtml}
                  onChange={(html) => {
                    setDescHtml(html);
                    const normalized = html === "<p></p>" ? "" : html;
                    setDescDirty(normalized !== descSaved);
                  }}
                  placeholder={t("tasks.addDescription")}
                  minHeight={140}
                />
                {descDirty && (
                  <div className="flex items-center justify-end gap-2 mt-2">
                    <button
                      onClick={cancelDesc}
                      disabled={descSaving}
                      className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
                    >
                      {t("common.cancel")}
                    </button>
                    <button
                      onClick={saveDesc}
                      disabled={descSaving}
                      className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                    >
                      {descSaving ? t("common.saving") : t("common.save")}
                    </button>
                  </div>
                )}
              </div>

              {/* Blocked reason */}
              {task.status === "BLOCKED" && task.reasonNextAction && (
                <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1">{t("tasks.reasonNextAction")}</p>
                  <p className="text-sm text-red-700">{task.reasonNextAction}</p>
                </div>
              )}

              {/* Subtasks */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {t("tasks.subTasks")}
                    {task.subTasks?.length > 0 && (
                      <span className="ml-1.5 font-normal text-slate-400">({task.subTasks.length})</span>
                    )}
                  </h3>
                  {!addingSubtask && (
                    <button
                      onClick={openAddSubtask}
                      className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 font-medium transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {t("tasks.addSubtask")}
                    </button>
                  )}
                </div>

                {/* Existing subtasks */}
                {task.subTasks?.length > 0 && (
                  <div className="space-y-1.5 mb-2">
                    {task.subTasks.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => onOpenTask?.(sub.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors text-left ${onOpenTask ? "hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer" : "cursor-default"}`}
                      >
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          sub.status === "DONE"        ? "bg-emerald-500" :
                          sub.status === "IN_PROGRESS" ? "bg-blue-500" :
                          sub.status === "BLOCKED"     ? "bg-red-500" :
                          sub.status === "REVIEW"      ? "bg-amber-400" : "bg-slate-400"
                        }`} />
                        <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 flex-shrink-0">{sub.code}</span>
                        <span className="text-xs text-slate-700 dark:text-slate-300 flex-1 min-w-0 truncate">{sub.title}</span>
                        {sub.progressPct > 0 && sub.status !== "DONE" && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 flex-shrink-0">{sub.progressPct}%</span>
                        )}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium flex-shrink-0 ${
                          labelConfig.taskStatus[sub.status]?.color ?? "bg-slate-100 dark:bg-slate-800 text-slate-600"
                        }`}>
                          {t(`taskStatus.${sub.status}`) || sub.status}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Inline add form */}
                {addingSubtask ? (
                  <div className="border border-blue-200 dark:border-blue-800 bg-blue-50/30 rounded-lg p-3 space-y-2.5">
                    {/* Title */}
                    <input
                      ref={subTaskInputRef}
                      type="text"
                      value={subTaskTitle}
                      onChange={(e) => setSubTaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !subTaskDescOpen) createSubTask();
                        if (e.key === "Escape") setAddingSubtask(false);
                      }}
                      placeholder={t("tasks.subTaskTitlePlaceholder")}
                      className="w-full text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-200 placeholder:text-slate-400"
                    />

                    {/* Description toggle */}
                    {!subTaskDescOpen ? (
                      <button
                        onClick={() => setSubTaskDescOpen(true)}
                        className="text-xs text-slate-400 dark:text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        {t("common.description")}
                      </button>
                    ) : (
                      <RichTextEditor
                        value={subTaskDesc}
                        onChange={setSubTaskDesc}
                        placeholder={t("tasks.addDescription")}
                        minHeight={100}
                      />
                    )}

                    {/* Status + actions */}
                    <div className="flex items-center gap-2">
                      <select
                        value={subTaskStatus}
                        onChange={(e) => setSubTaskStatus(e.target.value)}
                        className="text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-md px-2 py-1 outline-none flex-1"
                      >
                        {["BACKLOG", "IN_PROGRESS", "REVIEW", "DONE"].map((s) => (
                          <option key={s} value={s}>{t(`taskStatus.${s}`) || s}</option>
                        ))}
                      </select>
                      <button
                        onClick={createSubTask}
                        disabled={subTaskSaving || !subTaskTitle.trim()}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-40 font-medium transition-colors"
                      >
                        {subTaskSaving ? (
                          <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                        {t("common.create")}
                      </button>
                      <button
                        onClick={() => setAddingSubtask(false)}
                        className="px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
                      >
                        {t("common.cancel")}
                      </button>
                    </div>
                  </div>
                ) : (
                  !task.subTasks?.length && (
                    <button
                      onClick={openAddSubtask}
                      className="w-full flex items-center gap-2 px-3 py-2.5 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-300 hover:bg-blue-50/30 rounded-lg text-slate-400 dark:text-slate-500 hover:text-blue-500 transition-colors text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {t("tasks.addSubtask")}
                    </button>
                  )
                )}
              </div>

              {/* Time log activity */}
              {task.timeLogs?.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      {t("tasks.activity")}
                    </h3>
                    <span className="text-xs text-slate-400">
                      {t("tasks.totalLogged")}: <span className="font-semibold text-slate-600">{formatMin(task.actualTimeTotal)}</span>
                    </span>
                  </div>
                  <div className="space-y-2">
                    {task.timeLogs.slice(0, 15).map((log) => {
                      const grad = AVATAR_GRADIENTS[log.employee.id % AVATAR_GRADIENTS.length];
                      return (
                        <div key={log.id} className="flex items-start gap-3 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100">
                          <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white shadow-sm`}>
                            {log.employee.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-semibold text-slate-700">{log.employee.fullName}</span>
                              <span className="text-xs font-bold text-blue-600">{formatMin(log.durationMinutes)}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                                log.approvalStatus === "APPROVED" ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200" :
                                log.approvalStatus === "REJECTED" ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200" :
                                "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200"
                              }`}>
                                {t(`approvalStatus.${log.approvalStatus}`) || log.approvalStatus}
                              </span>
                            </div>
                            {log.note && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{log.note}</p>}
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{new Date(log.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      );
                    })}
                    {task._count.timeLogs > 15 && (
                      <Link
                        href={`/time-logs?taskId=${task.id}`}
                        onClick={onClose}
                        className="block text-center text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 py-1"
                      >
                        {t("common.viewAll")} ({task._count.timeLogs})
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── Sidebar ── */}
            <div className="w-[264px] flex-shrink-0 border-l border-slate-200 dark:border-slate-700 bg-slate-50/40 overflow-y-auto">
              {/* Status selector */}
              <div className="px-4 pt-4 pb-3 border-b border-slate-200">
                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1.5">{t("common.status")}</p>
                <select
                  value={task.status}
                  onChange={(e) => patch({ status: e.target.value })}
                  disabled={saving}
                  className={`w-full text-sm font-semibold px-3 py-2 rounded-lg border cursor-pointer outline-none transition-colors ${STATUS_STYLE[task.status] ?? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200"}`}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{t(`taskStatus.${s}`) || s}</option>
                  ))}
                </select>
              </div>

              {/* Progress bar */}
              <div className="px-4 py-3 border-b border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">{t("tasks.progress")}</p>
                  <span className="text-xs font-semibold text-slate-600">{task.progressPct}%</span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      task.progressPct >= 100 ? "bg-emerald-500" : task.progressPct >= 60 ? "bg-blue-500" : "bg-amber-400"
                    }`}
                    style={{ width: `${Math.min(task.progressPct, 100)}%` }}
                  />
                </div>
              </div>

              {/* Detail rows */}
              <div className="px-4 py-2">
                {/* Assignee */}
                <DetailRow label={t("common.assignedTo")}>
                  {isManager ? (
                    <select
                      value={String(task.assignedTo.id)}
                      onChange={(e) => patch({ assignedToId: Number(e.target.value) })}
                      disabled={saving}
                      className="w-full bg-transparent text-xs outline-none cursor-pointer -ml-0.5"
                    >
                      {employees.map((e) => (
                        <option key={e.id} value={e.id}>{e.fullName}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[task.assignedTo.id % AVATAR_GRADIENTS.length]} flex items-center justify-center text-[9px] font-bold text-white`}>
                        {task.assignedTo.fullName.charAt(0).toUpperCase()}
                      </div>
                      <span>{task.assignedTo.fullName}</span>
                    </div>
                  )}
                </DetailRow>

                {/* Priority */}
                <DetailRow label={t("common.priority")}>
                  {isManager ? (
                    <select
                      value={task.priority}
                      onChange={(e) => patch({ priority: e.target.value })}
                      disabled={saving}
                      className="w-full bg-transparent text-xs outline-none cursor-pointer -ml-0.5"
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>{t(`taskPriority.${p}`) || p}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${PRIORITY_DOT[task.priority] ?? "bg-slate-300"}`} />
                      <span>{t(`taskPriority.${task.priority}`) || task.priority}</span>
                    </div>
                  )}
                </DetailRow>

                {/* Task Type */}
                <DetailRow label={t("tasks.taskType")}>
                  {isManager ? (
                    <select
                      value={task.taskType}
                      onChange={(e) => patch({ taskType: e.target.value })}
                      disabled={saving}
                      className="w-full bg-transparent text-xs outline-none cursor-pointer -ml-0.5"
                    >
                      {TASK_TYPES.map((tp) => (
                        <option key={tp} value={tp}>{t(`taskType.${tp}`) || tp}</option>
                      ))}
                    </select>
                  ) : (
                    <span>{t(`taskType.${task.taskType}`) || task.taskType}</span>
                  )}
                </DetailRow>

                {/* Parent task */}
                <DetailRow label={t("tasks.parentTask")}>
                  {task.parentTask ? (
                    <span className="font-mono text-blue-600 dark:text-blue-400 text-[11px]">{task.parentTask.code}</span>
                  ) : (
                    <span className="text-slate-400">{t("common.none")}</span>
                  )}
                </DetailRow>

                {/* Customer */}
                <DetailRow label={t("common.customer")}>
                  {isManager ? (
                    <select
                      value={String(task.customer?.id ?? "")}
                      onChange={(e) => patch({ customerId: e.target.value ? Number(e.target.value) : null })}
                      disabled={saving}
                      className="w-full bg-transparent text-xs outline-none cursor-pointer -ml-0.5"
                    >
                      <option value="">{t("common.none")}</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>{c.businessName ?? c.customerName}</option>
                      ))}
                    </select>
                  ) : (
                    <span>
                      {task.customer
                        ? (task.customer.businessName ?? task.customer.customerName)
                        : <span className="text-slate-400">{t("common.none")}</span>}
                    </span>
                  )}
                </DetailRow>

                {/* Template */}
                {task.template && (
                  <DetailRow label={t("tasks.template")}>
                    <span className="font-mono text-[11px]">{task.template.code} · {task.template.title}</span>
                  </DetailRow>
                )}

                {/* Due date */}
                <DetailRow label={t("tasks.dueDate")}>
                  {isManager ? (
                    <input
                      type="date"
                      value={task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""}
                      onChange={(e) => patch({ dueDate: e.target.value || null })}
                      disabled={saving}
                      className="w-full bg-transparent text-xs outline-none cursor-pointer -ml-0.5"
                    />
                  ) : (
                    <span className={task.isOverdue ? "text-red-500 font-semibold" : ""}>
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString()
                        : <span className="text-slate-400">{t("common.none")}</span>}
                    </span>
                  )}
                </DetailRow>

                {/* Estimated / actual time */}
                <DetailRow label={t("tasks.estimatedTime")}>
                  <div className="flex items-center gap-1.5">
                    {isManager ? (
                      <input
                        type="number"
                        min={0}
                        value={estimatedDraft !== "" ? estimatedDraft : (task.estimatedTime ?? "")}
                        onChange={(e) => setEstimatedDraft(e.target.value)}
                        onFocus={() => setEstimatedDraft(task.estimatedTime?.toString() ?? "")}
                        onBlur={(e) => {
                          const val = e.target.value;
                          patch({ estimatedTime: val ? Number(val) : null });
                          setEstimatedDraft("");
                        }}
                        disabled={saving}
                        placeholder="min"
                        className="w-16 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-blue-200"
                      />
                    ) : (
                      <span>{formatMin(task.estimatedTime)}</span>
                    )}
                    <span className="text-slate-300">/</span>
                    <span className={task.estimatedTime && task.actualTimeTotal > task.estimatedTime ? "text-red-500 font-semibold" : "text-slate-500"}>
                      {formatMin(task.actualTimeTotal)}
                    </span>
                  </div>
                </DetailRow>

                {/* Billable */}
                <DetailRow label={t("tasks.billable")}>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={task.billable}
                      disabled={saving || !isManager}
                      onChange={(e) => isManager && patch({ billable: e.target.checked })}
                      className="w-3.5 h-3.5 rounded"
                    />
                    <span className={task.billable ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-slate-400"}>
                      {task.billable ? t("common.yes") : t("common.no")}
                    </span>
                  </label>
                </DetailRow>

                {/* Requires video */}
                <DetailRow label={t("tasks.requiresVideo")}>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={task.requiresVideo}
                      disabled={saving || !isManager}
                      onChange={(e) => isManager && patch({ requiresVideo: e.target.checked })}
                      className="w-3.5 h-3.5 rounded"
                    />
                    <span className={task.requiresVideo ? "text-blue-600 dark:text-blue-400 font-semibold" : "text-slate-400"}>
                      {task.requiresVideo ? t("common.yes") : t("common.no")}
                    </span>
                  </label>
                </DetailRow>

                <div className="pt-1" />

                {/* Dates */}
                {task.dateStarted && (
                  <DetailRow label={t("tasks.startDate")}>
                    <span>{new Date(task.dateStarted).toLocaleDateString()}</span>
                  </DetailRow>
                )}
                {task.dateCompleted && (
                  <DetailRow label={t("tasks.completedDate")}>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{new Date(task.dateCompleted).toLocaleDateString()}</span>
                  </DetailRow>
                )}
                <DetailRow label={t("tasks.createdDate")}>
                  <span className="text-slate-500">{new Date(task.dateCreated).toLocaleDateString()}</span>
                </DetailRow>
                <DetailRow label={t("common.assignedBy")}>
                  <span className="text-slate-500">{task.assignedBy.fullName}</span>
                </DetailRow>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
