"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCurrentUser } from "@/lib/contexts/current-user-context";
import { useLocale } from "@/lib/i18n/context";
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
  support: { id: number; fullName: string } | null;
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
  onSaved: () => void;
  onOpenTask?: (id: number) => void;
};

const STATUSES = ["BACKLOG", "IN_PROGRESS", "BLOCKED", "REVIEW", "DONE", "CANCELLED"];
const PRIORITIES: { value: string; cls: "hi" | "md" | "lo" }[] = [
  { value: "CRITICAL", cls: "hi" },
  { value: "HIGH", cls: "hi" },
  { value: "NORMAL", cls: "md" },
  { value: "LOW", cls: "lo" },
];
const TASK_TYPES: { value: string; color: string }[] = [
  { value: "NORMAL", color: "#3B5BDB" },
  { value: "LEARNING", color: "#8b5cf6" },
  { value: "NEW_RESEARCH", color: "#06b6d4" },
  { value: "MEETING", color: "#f59e0b" },
  { value: "ADMIN", color: "#94a3b8" },
  { value: "BILLABLE_CLIENT", color: "#22c55e" },
  { value: "INTERNAL", color: "#64748b" },
];

const STATUS_CHIP_CLS: Record<string, string> = {
  BACKLOG: "backlogc",
  IN_PROGRESS: "progressc",
  BLOCKED: "blockedc",
  REVIEW: "reviewc",
  DONE: "donec",
  CANCELLED: "backlogc",
};

function prioCls(p: string) {
  return PRIORITIES.find((x) => x.value === p)?.cls ?? "md";
}

function typeColor(tp: string) {
  return TASK_TYPES.find((x) => x.value === tp)?.color ?? "#3B5BDB";
}

function formatMin(min: number | null | undefined) {
  if (min === null || min === undefined || min === 0) return "—";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function initials(name: string) {
  return name.charAt(0).toUpperCase();
}

export function TaskDetailDrawer({ taskId, open, onClose, employees, customers, isManager, onSaved, onOpenTask }: Props) {
  const { t } = useLocale();
  const authUser = useCurrentUser();
  const currentUserId = authUser.employeeId;

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"desc" | "activity">("desc");

  const [titleDraft, setTitleDraft] = useState("");
  const [descHtml, setDescHtml] = useState("");
  const [descSaved, setDescSaved] = useState("");
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
      setTab("desc");
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
        setTab("desc");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [open, taskId]);

  async function patch(data: Record<string, unknown>) {
    if (!task) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const text = await res.text();
      let json: any = null;
      try { json = text ? JSON.parse(text) : null; } catch { /* not JSON */ }
      if (res.ok && json) {
        setTask((prev) => (prev ? { ...prev, ...json.data } : prev));
        onSaved();
      }
    } finally {
      setSaving(false);
    }
  }

  async function saveTitle() {
    if (!task) return;
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== task.title) await patch({ title: trimmed });
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
    <div className="td-back open" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="td-drawer open">
        {task && !loading ? (
          <>
            {/* Header */}
            <div className="td-head">
              <span className="td-type" style={{ background: typeColor(task.taskType) }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </span>
              <span className="td-key">{task.code} · {t(`taskType.${task.taskType}`) || task.taskType}</span>
              <div className="td-actions">
                {saving && <span style={{ fontSize: "0.78rem", color: "var(--text-3)" }}>{t("common.saving")}</span>}
                {currentUserId && (
                  <TimerButton
                    taskId={task.id}
                    assigneeId={task.assignedTo.id}
                    currentUserId={currentUserId}
                    onChange={() => {
                      fetch(`/api/tasks/${task.id}`)
                        .then((r) => r.json())
                        .then((j) => j.data && setTask(j.data))
                        .catch(() => {});
                    }}
                  />
                )}
                <Link href={`/time-logs?taskId=${task.id}`} onClick={onClose} className="abtn ghost">
                  {t("tasks.logTime")}
                </Link>
              </div>
              <button className="td-close" onClick={onClose} aria-label="Đóng">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="td-body">
              {/* Left */}
              <div className="td-left">
                <div className="td-desc-section">
                  <input
                    className="td-title-edit"
                    value={titleDraft || task.title}
                    onFocus={() => setTitleDraft(task.title)}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onBlur={() => { saveTitle(); setTitleDraft(""); }}
                    onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                  />

                  {task.status === "BLOCKED" && task.reasonNextAction && (
                    <div style={{ fontSize: "0.84rem", color: "var(--danger)", background: "var(--danger-soft)", border: "1px solid var(--danger)", padding: "8px 12px", borderRadius: 8, margin: "0 0 10px" }}>
                      <b>{t("tasks.reasonNextAction")}:</b> {task.reasonNextAction}
                    </div>
                  )}

                  <div className="td-tabs">
                    <button className={`td-tab${tab === "desc" ? " on" : ""}`} onClick={() => setTab("desc")}>{t("common.description")}</button>
                    <button className={`td-tab${tab === "activity" ? " on" : ""}`} onClick={() => setTab("activity")}>
                      {t("tasks.activity")}{task._count.timeLogs > 0 ? ` (${task._count.timeLogs})` : ""}
                    </button>
                  </div>

                  <div className="td-pane-wrap">
                    <div className={`td-pane${tab === "desc" ? " on" : ""}`}>
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
                        <div className="td-desc-foot">
                          <button className="abtn ghost" onClick={cancelDesc} disabled={descSaving}>{t("common.cancel")}</button>
                          <button className="abtn primary" onClick={saveDesc} disabled={descSaving}>
                            {descSaving ? t("common.saving") : t("common.save")}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className={`td-pane${tab === "activity" ? " on" : ""}`}>
                      <div className="td-activity">
                        {task.timeLogs?.length > 0 ? (
                          <>
                            {task.timeLogs.slice(0, 15).map((log) => (
                              <div key={log.id} className="td-act">
                                <span className="cav">{initials(log.employee.fullName)}</span>
                                <span className="atxt">
                                  <b>{log.employee.fullName}</b> đã log <b>{formatMin(log.durationMinutes)}</b>
                                  {log.note ? ` — ${log.note}` : ""}
                                  <span className="at">{new Date(log.date).toLocaleDateString()} · {t(`approvalStatus.${log.approvalStatus}`) || log.approvalStatus}</span>
                                </span>
                              </div>
                            ))}
                            {task._count.timeLogs > 15 && (
                              <Link href={`/time-logs?taskId=${task.id}`} onClick={onClose} style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--accent-ink)" }}>
                                {t("common.viewAll")} ({task._count.timeLogs})
                              </Link>
                            )}
                          </>
                        ) : (
                          <span style={{ color: "var(--text-3)", fontSize: "0.84rem" }}>{t("tasks.noActivity") || "Chưa có hoạt động"}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subtasks */}
                <div className="td-sub-section">
                  <div className="td-st-wrap">
                    <div className="td-st-head">
                      <span>{t("tasks.subTasks")}{task.subTasks?.length > 0 ? ` (${task.subTasks.length})` : ""}</span>
                      {!addingSubtask && (
                        <button className="st-add-btn" onClick={openAddSubtask}>+ {t("tasks.addSubtask")}</button>
                      )}
                    </div>

                    <div className="td-st-list">
                      {task.subTasks?.map((sub) => (
                        <div key={sub.id} className="td-st-item" onClick={() => onOpenTask?.(sub.id)} style={{ cursor: onOpenTask ? "pointer" : "default" }}>
                          <span className={`st-cb${sub.status === "DONE" ? " done" : ""}`} />
                          <span className={`st-name${sub.status === "DONE" ? " done" : ""}`}>{sub.code} · {sub.title}</span>
                          <span className={`td-col-chip ${STATUS_CHIP_CLS[sub.status] ?? "backlogc"}`}>{t(`taskStatus.${sub.status}`) || sub.status}</span>
                        </div>
                      ))}

                      {!task.subTasks?.length && !addingSubtask && (
                        <div className="td-st-empty" onClick={openAddSubtask}>{t("tasks.addSubtask")}</div>
                      )}
                    </div>

                    {addingSubtask && (
                      <div className="td-st-form">
                        <input
                          ref={subTaskInputRef}
                          className="stf-title"
                          type="text"
                          value={subTaskTitle}
                          onChange={(e) => setSubTaskTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !subTaskDescOpen) createSubTask();
                            if (e.key === "Escape") setAddingSubtask(false);
                          }}
                          placeholder={t("tasks.subTaskTitlePlaceholder")}
                        />
                        {!subTaskDescOpen ? (
                          <div className="stf-desc" onClick={() => setSubTaskDescOpen(true)}>+ {t("common.description")}</div>
                        ) : (
                          <div style={{ marginTop: 8 }}>
                            <RichTextEditor value={subTaskDesc} onChange={setSubTaskDesc} placeholder={t("tasks.addDescription")} minHeight={90} />
                          </div>
                        )}
                        <div className="stf-foot">
                          <select value={subTaskStatus} onChange={(e) => setSubTaskStatus(e.target.value)}>
                            {["BACKLOG", "IN_PROGRESS", "REVIEW", "DONE"].map((s) => (
                              <option key={s} value={s}>{t(`taskStatus.${s}`) || s}</option>
                            ))}
                          </select>
                          <button className="abtn ghost" onClick={() => setAddingSubtask(false)}>{t("common.cancel")}</button>
                          <button className="abtn primary" onClick={createSubTask} disabled={subTaskSaving || !subTaskTitle.trim()}>
                            {subTaskSaving ? t("common.saving") : t("common.create")}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right */}
              <div className="td-right">
                <div className="td-meta-sec">Chi tiết</div>

                <div className="td-meta-row">
                  <span className="mrl">{t("common.status")}</span>
                  <span className="mrv" style={{ position: "relative" }}>
                    <span className={`td-col-chip ${STATUS_CHIP_CLS[task.status] ?? "backlogc"}`}>{t(`taskStatus.${task.status}`) || task.status}</span>
                    <select value={task.status} onChange={(e) => patch({ status: e.target.value })} disabled={saving} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}>
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{t(`taskStatus.${s}`) || s}</option>
                      ))}
                    </select>
                  </span>
                </div>

                <div className="td-meta-row">
                  <span className="mrl">{t("common.priority")}</span>
                  <span className="mrv prio-sel" style={{ padding: 0 }}>
                    <span className={`prio-dot`} style={{ background: prioCls(task.priority) === "hi" ? "var(--danger)" : prioCls(task.priority) === "md" ? "var(--warn)" : "var(--ok)" }} />
                    <span>{t(`taskPriority.${task.priority}`) || task.priority}</span>
                    {isManager && (
                      <select value={task.priority} onChange={(e) => patch({ priority: e.target.value })} disabled={saving}>
                        {PRIORITIES.map((p) => (
                          <option key={p.value} value={p.value}>{t(`taskPriority.${p.value}`) || p.value}</option>
                        ))}
                      </select>
                    )}
                  </span>
                </div>

                <div className="td-meta-row">
                  <span className="mrl">{t("tasks.taskType")}</span>
                  <span className="mrv">
                    {isManager ? (
                      <select value={task.taskType} onChange={(e) => patch({ taskType: e.target.value })} disabled={saving}>
                        {TASK_TYPES.map((tp) => (
                          <option key={tp.value} value={tp.value}>{t(`taskType.${tp.value}`) || tp.value}</option>
                        ))}
                      </select>
                    ) : (
                      <span>{t(`taskType.${task.taskType}`) || task.taskType}</span>
                    )}
                  </span>
                </div>

                <div className="td-meta-row">
                  <span className="mrl">{t("common.assignedTo")}</span>
                  <span className="mrv">
                    {isManager ? (
                      <select value={String(task.assignedTo.id)} onChange={(e) => patch({ assignedToId: Number(e.target.value) })} disabled={saving}>
                        {employees.map((e) => (
                          <option key={e.id} value={e.id}>{e.fullName}</option>
                        ))}
                      </select>
                    ) : (
                      <span>{task.assignedTo.fullName}</span>
                    )}
                  </span>
                </div>

                <div className="td-meta-row">
                  <span className="mrl">{t("tasks.support") || "Hỗ trợ"}</span>
                  <span className="mrv">
                    {isManager ? (
                      <select value={task.support ? String(task.support.id) : ""} onChange={(e) => patch({ supportId: e.target.value ? Number(e.target.value) : null })} disabled={saving}>
                        <option value="">— Chưa chọn —</option>
                        {employees.map((e) => (
                          <option key={e.id} value={e.id}>{e.fullName}</option>
                        ))}
                      </select>
                    ) : (
                      <span>{task.support?.fullName ?? t("common.none")}</span>
                    )}
                  </span>
                </div>

                <div className="td-meta-row">
                  <span className="mrl">{t("common.customer")}</span>
                  <span className="mrv">
                    {isManager ? (
                      <select value={String(task.customer?.id ?? "")} onChange={(e) => patch({ customerId: e.target.value ? Number(e.target.value) : null })} disabled={saving}>
                        <option value="">{t("common.none")}</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>{c.businessName ?? c.customerName}</option>
                        ))}
                      </select>
                    ) : (
                      <span>{task.customer ? (task.customer.businessName ?? task.customer.customerName) : t("common.none")}</span>
                    )}
                  </span>
                </div>

                {task.parentTask && (
                  <div className="td-meta-row">
                    <span className="mrl">{t("tasks.parentTask")}</span>
                    <span className="mrv" style={{ fontFamily: "var(--font-mono)", color: "var(--accent-ink)" }}>{task.parentTask.code}</span>
                  </div>
                )}

                {task.template && (
                  <div className="td-meta-row">
                    <span className="mrl">{t("tasks.template")}</span>
                    <span className="mrv" style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem" }}>{task.template.code} · {task.template.title}</span>
                  </div>
                )}

                <div className="td-meta-row">
                  <span className="mrl">{t("tasks.progress")}</span>
                  <span className="mrv" style={{ gap: 8 }}>
                    <div style={{ flex: 1, height: 7, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(task.progressPct, 100)}%`, background: task.progressPct >= 100 ? "var(--ok)" : "linear-gradient(90deg,#22c55e,#4ade80)", borderRadius: 99 }} />
                    </div>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.74rem", color: "var(--text-3)" }}>{task.progressPct}%</span>
                  </span>
                </div>

                <div className="td-meta-row">
                  <span className="mrl">{t("tasks.estimatedTime")}</span>
                  <span className="mrv">
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
                        placeholder="phút"
                        style={{ width: 70, background: "var(--elev)", border: "1px solid var(--border-2)", borderRadius: 6, padding: "3px 6px", fontFamily: "inherit", fontSize: "0.82rem", color: "var(--text)", outline: "none" }}
                      />
                    ) : (
                      <span>{formatMin(task.estimatedTime)}</span>
                    )}
                    <span style={{ color: "var(--text-3)" }}>/</span>
                    <span style={task.estimatedTime && task.actualTimeTotal > task.estimatedTime ? { color: "var(--danger)", fontWeight: 600 } : undefined}>{formatMin(task.actualTimeTotal)}</span>
                  </span>
                </div>

                <div className="td-meta-row">
                  <span className="mrl">{t("tasks.dueDate")}</span>
                  <span className="mrv">
                    {isManager ? (
                      <input
                        type="date"
                        value={task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""}
                        onChange={(e) => patch({ dueDate: e.target.value || null })}
                        disabled={saving}
                        style={{ background: "transparent", border: "none", fontFamily: "inherit", fontSize: "0.84rem", color: "var(--text)", outline: "none", cursor: "pointer" }}
                      />
                    ) : (
                      <span style={task.isOverdue ? { color: "var(--danger)", fontWeight: 600 } : undefined}>
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : t("common.none")}
                      </span>
                    )}
                  </span>
                </div>

                <label className="td-meta-row" style={{ cursor: "pointer" }}>
                  <span className="mrl">{t("tasks.billable")}</span>
                  <span className="mrv">
                    <input
                      type="checkbox"
                      checked={task.billable}
                      disabled={saving || !isManager}
                      onChange={(e) => isManager && patch({ billable: e.target.checked })}
                      style={{ accentColor: "var(--accent)" }}
                    />
                    <span>{task.billable ? t("common.yes") : t("common.no")}</span>
                  </span>
                </label>

                <label className="td-meta-row" style={{ cursor: "pointer" }}>
                  <span className="mrl">{t("tasks.requiresVideo")}</span>
                  <span className="mrv">
                    <input
                      type="checkbox"
                      checked={task.requiresVideo}
                      disabled={saving || !isManager}
                      onChange={(e) => isManager && patch({ requiresVideo: e.target.checked })}
                      style={{ accentColor: "var(--accent)" }}
                    />
                    <span>{task.requiresVideo ? t("common.yes") : t("common.no")}</span>
                  </span>
                </label>

                <div className="td-meta-sec">{t("common.assignedBy")}</div>
                <div className="td-meta-row">
                  <span className="mrl">{t("common.assignedBy")}</span>
                  <span className="mrv">{task.assignedBy.fullName}</span>
                </div>
                <div className="td-meta-row">
                  <span className="mrl">{t("tasks.createdDate")}</span>
                  <span className="mrv">{new Date(task.dateCreated).toLocaleDateString()}</span>
                </div>
                {task.dateStarted && (
                  <div className="td-meta-row">
                    <span className="mrl">{t("tasks.startDate")}</span>
                    <span className="mrv">{new Date(task.dateStarted).toLocaleDateString()}</span>
                  </div>
                )}
                {task.dateCompleted && (
                  <div className="td-meta-row">
                    <span className="mrl">{t("tasks.completedDate")}</span>
                    <span className="mrv" style={{ color: "var(--ok)", fontWeight: 600 }}>{new Date(task.dateCompleted).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "grid", placeItems: "center" }}>
            <div className="animate-spin" style={{ width: 24, height: 24, border: "2px solid var(--accent)", borderTopColor: "transparent", borderRadius: "50%" }} />
          </div>
        )}
      </div>
    </div>
  );
}
