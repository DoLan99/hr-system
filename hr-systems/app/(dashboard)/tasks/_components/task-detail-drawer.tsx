"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/contexts/current-user-context";
import { useLocale } from "@/lib/i18n/context";
import { RichTextEditor } from "@/components/shared/rich-text-editor";
import { TimerButton } from "@/components/tracking/timer-button";
import { RecurrenceEditor } from "@/components/tasks/RecurrenceEditor";
import type { RecurrenceFrequency } from "@/lib/recurrence";

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
  sprintId?: number | null;
  sprint?: { id: number; name: string; status: string } | null;
  storyPoints?: number | null;
};

type Sprint = { id: number; name: string; status: string };
type Watcher = { employeeId: number; employee: { id: number; fullName: string; avatarUrl: string | null } };

type Props = {
  taskId: number | null;
  open: boolean;
  onClose: () => void;
  employees: { id: number; fullName: string; department: string | null }[];
  customers: { id: number; customerName: string | null; businessName: string | null }[];
  isManager: boolean;
  labelConfig?: unknown;
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

const STATUS_LABEL: Record<string, string> = {
  BACKLOG: "BACKLOG",
  IN_PROGRESS: "IN PROGRESS",
  BLOCKED: "BLOCKED",
  REVIEW: "TESTING",
  DONE: "DONE",
  CANCELLED: "CANCELLED",
};

const stLabel = (s: string) => STATUS_LABEL[s] ?? s.replace("_", " ");

const PRIO_LABEL: Record<string, string> = {
  CRITICAL: "Khẩn cấp",
  HIGH: "Cao",
  NORMAL: "Bình thường",
  LOW: "Thấp",
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
  const router = useRouter();
  const authUser = useCurrentUser();
  const currentUserId = authUser.employeeId;

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"desc" | "activity" | "comments">("desc");

  /* Comments */
  type CmtAuthor = { id: number; fullName: string; avatarUrl: string | null };
  type CmtReply = { id: number; content: string; author: CmtAuthor; createdAt: string };
  type Cmt = { id: number; content: string; author: CmtAuthor; createdAt: string; replies: CmtReply[] };
  const [comments, setComments] = useState<Cmt[]>([]);
  const [cmtLoaded, setCmtLoaded] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [cmtSaving, setCmtSaving] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  async function loadComments(taskId: number) {
    const res = await fetch(`/api/tasks/${taskId}/comments`);
    if (res.ok) { const j = await res.json(); setComments(j.data ?? []); }
    setCmtLoaded(true);
  }

  async function submitComment() {
    if (!task || !newComment.trim() || cmtSaving) return;
    setCmtSaving(true);
    const res = await fetch(`/api/tasks/${task.id}/comments`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newComment.trim() }),
    });
    setCmtSaving(false);
    if (res.ok) { const j = await res.json(); setComments((p) => [j.data, ...p]); setNewComment(""); }
  }

  async function submitReply(parentId: number) {
    if (!task || !replyText.trim()) return;
    const res = await fetch(`/api/tasks/${task.id}/comments`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: replyText.trim(), parentId }),
    });
    if (res.ok) {
      const j = await res.json();
      setComments((p) => p.map((c) => c.id === parentId ? { ...c, replies: [...c.replies, j.data] } : c));
      setReplyingTo(null); setReplyText("");
    }
  }

  async function deleteComment(commentId: number) {
    if (!task || !confirm("Xóa bình luận này?")) return;
    const res = await fetch(`/api/tasks/${task.id}/comments/${commentId}`, { method: "DELETE" });
    if (res.ok) setComments((p) => p.filter((c) => c.id !== commentId));
  }

  async function loadSprints() {
    if (sprintsLoaded) return;
    const res = await fetch("/api/sprints");
    if (res.ok) { const j = await res.json(); setSprints(j.data ?? []); }
    setSprintsLoaded(true);
  }

  async function loadWatchers(taskId: number) {
    if (watchersLoaded) return;
    const res = await fetch(`/api/tasks/${taskId}/watchers`);
    if (res.ok) { const j = await res.json(); setWatchers(j.data ?? []); setIsWatching(j.isWatching ?? false); }
    setWatchersLoaded(true);
  }

  async function toggleWatch() {
    if (!task || watchSaving) return;
    setWatchSaving(true);
    if (isWatching) {
      const empId = currentUserId;
      const res = await fetch(`/api/tasks/${task.id}/watchers/${empId}`, { method: "DELETE" });
      if (res.ok) { setIsWatching(false); setWatchers((p) => p.filter((w) => w.employeeId !== empId)); }
    } else {
      const res = await fetch(`/api/tasks/${task.id}/watchers`, { method: "POST" });
      if (res.ok) { const j = await res.json(); setIsWatching(true); setWatchers((p) => [...p, j.data]); }
    }
    setWatchSaving(false);
  }

  function handleCommentChange(value: string) {
    setNewComment(value);
    // Detect @mention
    const lastAt = value.lastIndexOf("@");
    if (lastAt !== -1) {
      const afterAt = value.slice(lastAt + 1);
      if (!afterAt.includes(" ") && !afterAt.includes("\n")) {
        setMentionQuery(afterAt.toLowerCase());
        setMentionAnchor(lastAt);
        setShowMentions(true);
        return;
      }
    }
    setShowMentions(false);
    setMentionAnchor(null);
  }

  function insertMention(emp: { id: number; fullName: string }) {
    if (mentionAnchor === null) return;
    const before = newComment.slice(0, mentionAnchor);
    const after = newComment.slice(mentionAnchor + 1 + mentionQuery.length);
    setNewComment(`${before}@${emp.fullName} ${after}`);
    setShowMentions(false);
    setMentionAnchor(null);
    setTimeout(() => cmtTextareaRef.current?.focus(), 10);
  }

  function renderCommentContent(content: string) {
    // Highlight @mentions
    const parts = content.split(/(@\S+)/g);
    return parts.map((part, i) =>
      part.startsWith("@") ? (
        <span key={i} style={{ color: "var(--accent)", fontWeight: 600 }}>{part}</span>
      ) : part
    );
  }

  /* Sprint */
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [sprintsLoaded, setSprintsLoaded] = useState(false);

  /* Watchers */
  const [watchers, setWatchers] = useState<Watcher[]>([]);
  const [isWatching, setIsWatching] = useState(false);
  const [watchersLoaded, setWatchersLoaded] = useState(false);
  const [watchSaving, setWatchSaving] = useState(false);

  /* Recurrence */
  type RecurrenceData = {
    id?: number; frequency: RecurrenceFrequency; interval: number; daysOfWeek: number[];
    dayOfMonth: number | null; endDate: string | null; maxOccurrences: number | null;
    nextRunAt: string; lastRunAt: string | null; isActive: boolean; occurrenceCount: number;
  };
  const [recurrence, setRecurrence] = useState<RecurrenceData | null>(null);

  /* Mentions */
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionAnchor, setMentionAnchor] = useState<number | null>(null);
  const [showMentions, setShowMentions] = useState(false);
  const cmtTextareaRef = useRef<HTMLTextAreaElement>(null);

  const [titleDraft, setTitleDraft] = useState<string | null>(null);
  const [descHtml, setDescHtml] = useState("");
  const [descSaved, setDescSaved] = useState("");
  const [descDirty, setDescDirty] = useState(false);
  const [descEditing, setDescEditing] = useState(false);
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
  const titleRef = useRef<HTMLTextAreaElement>(null);

  function autoResizeTitle() {
    requestAnimationFrame(() => {
      const el = titleRef.current;
      if (!el) return;
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    });
  }

  useEffect(() => {
    if (!open || !taskId) {
      setTask(null);
      setTab("desc");
      setWatchers([]);
      setWatchersLoaded(false);
      setIsWatching(false);
      setRecurrence(null);
      return;
    }
    setLoading(true);
    setComments([]);
    setCmtLoaded(false);
    setWatchers([]);
    setWatchersLoaded(false);
    setIsWatching(false);
    fetch(`/api/tasks/${taskId}`)
      .then((r) => r.json())
      .then((j) => {
        setTask(j.data ?? null);
        setTitleDraft(null);
        const desc = j.data?.description ?? "";
        setDescHtml(desc);
        setDescSaved(desc);
        setDescDirty(false);
        setDescEditing(false);
        setNewComment("");
        setTab("desc");
        setLoading(false);
        if (j.data) {
          loadWatchers(j.data.id);
          fetch(`/api/tasks/${j.data.id}/recurrence`).then(r => r.json()).then(rj => setRecurrence(rj.data ?? null));
        }
      })
      .catch(() => setLoading(false));
  }, [open, taskId]);

  useEffect(() => {
    if (task) autoResizeTitle();
  }, [task]);

  useEffect(() => {
    if (tab === "comments" && task && !cmtLoaded) loadComments(task.id);
  }, [tab, task]);

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
    if (!task || titleDraft === null) return;
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== task.title) await patch({ title: trimmed });
    setTitleDraft(null);
  }

  async function saveDesc() {
    if (!task) return;
    const normalized = descHtml === "<p></p>" ? "" : descHtml;
    setDescSaving(true);
    await patch({ description: normalized || null });
    setDescSaved(normalized);
    setDescDirty(false);
    setDescEditing(false);
    setDescSaving(false);
  }

  function cancelDesc() {
    setDescHtml(descSaved);
    setDescDirty(false);
    setDescEditing(false);
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

  const prioDotColor = prioCls(task?.priority ?? "NORMAL") === "hi" ? "var(--danger)" : prioCls(task?.priority ?? "NORMAL") === "md" ? "var(--warn)" : "var(--ok)";

  return (
    <div className="td-back open" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="td-drawer open">
        {task && !loading ? (
          <>
            {/* ── Header ── */}
            <div className="td-head">
              <span className="td-type" style={{ background: typeColor(task.taskType) }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </span>
              <span className="td-key">{task.code} · {task.taskType.replace("_", " ")}</span>
              {saving && <span style={{ fontSize: "0.72rem", color: "var(--text-3)", marginLeft: 4 }}>Đang lưu…</span>}
              <div className="td-head-right">
                {/* Watch */}
                <button className="td-icon-btn" title={isWatching ? "Đang theo dõi (click để bỏ)" : "Theo dõi task"}
                  onClick={toggleWatch} disabled={watchSaving}
                  style={isWatching ? { color: "var(--accent)", background: "var(--accent-soft)" } : undefined}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={isWatching ? "var(--accent)" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
                {/* Share / copy link */}
                <button className="td-icon-btn" title="Sao chép link"
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/tasks/${task.id}`).catch(() => {})}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                    <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/>
                  </svg>
                </button>
                {/* More options */}
                <button className="td-icon-btn" title="Thêm tùy chọn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>
                  </svg>
                </button>
                {/* Expand to full page */}
                <button className="td-icon-btn" title="Mở trang chi tiết"
                  onClick={() => { onClose(); router.refresh(); router.push(`/tasks/${task.id}`); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                  </svg>
                </button>
                {/* Close */}
                <button className="td-icon-btn td-close" onClick={onClose} aria-label="Đóng">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M6 6l12 12M18 6L6 18"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* ── Body ── */}
            <div className="td-body">
              {/* Left panel */}
              <div className="td-left">
                {/* Title */}
                <div className="td-title-wrap">
                  <textarea
                    ref={titleRef}
                    className="td-title-edit"
                    rows={1}
                    value={titleDraft ?? task.title}
                    onFocus={() => { setTitleDraft(task.title); autoResizeTitle(); }}
                    onChange={(e) => { setTitleDraft(e.target.value); autoResizeTitle(); }}
                    onBlur={saveTitle}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); (e.target as HTMLTextAreaElement).blur(); }
                      if (e.key === "Escape") { setTitleDraft(null); (e.target as HTMLTextAreaElement).blur(); }
                    }}
                  />
                  {task.status === "BLOCKED" && task.reasonNextAction && (
                    <div className="td-blocked-note">
                      <b>Lý do blocked:</b> {task.reasonNextAction}
                    </div>
                  )}
                </div>

                {/* Action bar */}
                <div className="td-action-bar2">
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
                  <Link href={`/time-logs?taskId=${task.id}`} onClick={onClose} className="abtn ghost" style={{ gap: 7 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
                    </svg>
                    Log Time
                  </Link>
                </div>

                {/* Tabs */}
                <div className="td-tabs">
                  <button className={`td-tab${tab === "desc" ? " on" : ""}`} onClick={() => setTab("desc")}>Mô tả</button>
                  <button className={`td-tab${tab === "comments" ? " on" : ""}`} onClick={() => setTab("comments")}>
                    Bình luận{task._count.timeLogs > 0 ? ` (${task._count.timeLogs})` : ""}
                  </button>
                  <button className={`td-tab${tab === "activity" ? " on" : ""}`} onClick={() => setTab("activity")}>Hoạt động</button>
                </div>

                {/* Panes */}
                <div className="td-pane-wrap">
                  {/* Mô tả */}
                  <div className={`td-pane${tab === "desc" ? " on" : ""}`}>
                    {descEditing ? (
                      <>
                        <RichTextEditor
                          value={descHtml}
                          onChange={(html) => {
                            setDescHtml(html);
                            const normalized = html === "<p></p>" ? "" : html;
                            setDescDirty(normalized !== descSaved);
                          }}
                          placeholder="Thêm mô tả chi tiết, acceptance criteria, ghi chú…"
                          minHeight={160}
                        />
                        <div className="td-desc-foot">
                          <button className="abtn ghost" onClick={cancelDesc} disabled={descSaving}>Hủy</button>
                          <button className="abtn primary" onClick={saveDesc} disabled={descSaving}>
                            {descSaving ? "Đang lưu…" : "Lưu mô tả"}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div onClick={() => setDescEditing(true)} className="td-desc-view" title="Click để chỉnh sửa">
                        {descSaved
                          ? <div className="prose prose-sm max-w-none" style={{ color: "var(--text-2)", lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: descSaved }} />
                          : <span style={{ color: "var(--text-3)", fontSize: "0.88rem" }}>Thêm mô tả chi tiết, acceptance criteria, ghi chú…</span>
                        }
                      </div>
                    )}
                  </div>

                  {/* Bình luận */}
                  <div className={`td-pane${tab === "comments" ? " on" : ""}`}>
                    <div className="td-cmt-input-wrap" style={{ position: "relative" }}>
                      <textarea
                        ref={cmtTextareaRef}
                        className="td-cmt-input"
                        rows={2}
                        placeholder="Thêm bình luận… (Ctrl+Enter để gửi, @ để mention)"
                        value={newComment}
                        onChange={(e) => handleCommentChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && e.ctrlKey) { e.preventDefault(); submitComment(); }
                          if (e.key === "Escape") setShowMentions(false);
                        }}
                        onBlur={() => setTimeout(() => setShowMentions(false), 150)}
                      />
                      {/* Mention dropdown */}
                      {showMentions && (
                        <div style={{ position: "absolute", top: "100%", left: 0, zIndex: 100, background: "var(--content)", border: "1px solid var(--border)", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", minWidth: 200, maxHeight: 180, overflowY: "auto" }}>
                          {employees
                            .filter((e) => e.fullName.toLowerCase().includes(mentionQuery))
                            .slice(0, 6)
                            .map((e) => (
                              <button key={e.id} onMouseDown={() => insertMention(e)}
                                style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 12px", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontSize: "0.84rem", color: "var(--text)" }}
                                onMouseEnter={(ev) => (ev.currentTarget.style.background = "var(--elev)")}
                                onMouseLeave={(ev) => (ev.currentTarget.style.background = "none")}>
                                <span style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center", fontSize: "0.72rem", fontWeight: 700, flexShrink: 0 }}>
                                  {e.fullName.charAt(0).toUpperCase()}
                                </span>
                                {e.fullName}
                              </button>
                            ))}
                          {employees.filter((e) => e.fullName.toLowerCase().includes(mentionQuery)).length === 0 && (
                            <div style={{ padding: "10px 14px", color: "var(--text-3)", fontSize: "0.82rem" }}>Không tìm thấy</div>
                          )}
                        </div>
                      )}
                      {newComment.trim() && (
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 6 }}>
                          <button className="abtn ghost" style={{ height: 28, fontSize: "0.78rem" }} onClick={() => setNewComment("")}>Hủy</button>
                          <button className="abtn primary" style={{ height: 28, fontSize: "0.78rem" }} onClick={submitComment} disabled={cmtSaving}>
                            {cmtSaving ? "Đang gửi…" : "Gửi"}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="td-activity" style={{ padding: "8px 22px 16px" }}>
                      {!cmtLoaded && <div style={{ color: "var(--text-3)", fontSize: "0.84rem" }}>Đang tải…</div>}
                      {cmtLoaded && comments.length === 0 && (
                        <div style={{ color: "var(--text-3)", fontSize: "0.84rem" }}>Chưa có bình luận nào.</div>
                      )}
                      {comments.map((c) => (
                        <div key={c.id} style={{ display: "flex", gap: 10, paddingTop: 12 }}>
                          <span className="cav" style={{ width: 30, height: 30, flexShrink: 0 }}>{initials(c.author.fullName)}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 3 }}>
                              <b style={{ fontSize: "0.84rem", color: "var(--text)" }}>{c.author.fullName}</b>
                              <span style={{ fontSize: "0.72rem", color: "var(--text-3)" }}>
                                {new Date(c.createdAt).toLocaleDateString("vi-VN")} {new Date(c.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <div style={{ fontSize: "0.85rem", color: "var(--text-2)", lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{renderCommentContent(c.content)}</div>
                            <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                              <button className="c-reply-btn" onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}>↩ Phản hồi</button>
                              {c.author.id === currentUserId && (
                                <button className="c-reply-btn" style={{ color: "var(--danger)" }} onClick={() => deleteComment(c.id)}>Xóa</button>
                              )}
                            </div>

                            {/* Replies */}
                            {c.replies.length > 0 && (
                              <div style={{ borderLeft: "1.5px solid var(--border-2)", paddingLeft: 12, marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                                {c.replies.map((r) => (
                                  <div key={r.id} style={{ display: "flex", gap: 8 }}>
                                    <span className="cav" style={{ width: 24, height: 24, fontSize: "0.6rem", flexShrink: 0 }}>{initials(r.author.fullName)}</span>
                                    <div>
                                      <div style={{ display: "flex", gap: 6, marginBottom: 2 }}>
                                        <b style={{ fontSize: "0.8rem", color: "var(--text)" }}>{r.author.fullName}</b>
                                        <span style={{ fontSize: "0.7rem", color: "var(--text-3)" }}>{new Date(r.createdAt).toLocaleDateString("vi-VN")}</span>
                                      </div>
                                      <div style={{ fontSize: "0.82rem", color: "var(--text-2)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{r.content}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Reply input */}
                            {replyingTo === c.id && (
                              <div style={{ marginTop: 8 }}>
                                <textarea
                                  className="td-cmt-input"
                                  rows={2}
                                  placeholder={`Phản hồi ${c.author.fullName}…`}
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) { e.preventDefault(); submitReply(c.id); } }}
                                  autoFocus
                                  style={{ fontSize: "0.83rem" }}
                                />
                                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginTop: 5 }}>
                                  <button className="abtn ghost" style={{ height: 26, fontSize: "0.76rem" }} onClick={() => { setReplyingTo(null); setReplyText(""); }}>Hủy</button>
                                  <button className="abtn primary" style={{ height: 26, fontSize: "0.76rem" }} onClick={() => submitReply(c.id)}>Gửi</button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Hoạt động */}
                  <div className={`td-pane${tab === "activity" ? " on" : ""}`}>
                    {task.timeLogs?.length > 0 ? (
                      <div className="td-activity">
                        {task.timeLogs.slice(0, 20).map((log) => (
                          <div key={log.id} className="td-act">
                            <span className="cav">{initials(log.employee.fullName)}</span>
                            <span className="atxt">
                              <b>{log.employee.fullName}</b> đã log <b>{formatMin(log.durationMinutes)}</b>
                              {log.note ? ` — ${log.note}` : ""}
                              <span className="at">{new Date(log.date).toLocaleDateString("vi-VN")} · {log.approvalStatus}</span>
                            </span>
                          </div>
                        ))}
                        {task._count.timeLogs > 20 && (
                          <Link href={`/time-logs?taskId=${task.id}`} onClick={onClose} style={{ fontSize: "0.8rem", color: "var(--accent-ink)", padding: "0 22px" }}>
                            Xem tất cả ({task._count.timeLogs})
                          </Link>
                        )}
                      </div>
                    ) : (
                      <div style={{ padding: "20px 22px", color: "var(--text-3)", fontSize: "0.84rem" }}>
                        Chưa có hoạt động nào. Dùng nút <b>Log Time</b> hoặc bấm timer để ghi nhận.
                      </div>
                    )}
                  </div>
                </div>

                {/* Sub Tasks — bottom */}
                <div className="td-sub-section">
                  <div className="td-st-wrap">
                    <div className="td-st-head">
                      <span>SUB TASKS{task.subTasks?.length > 0 ? ` (${task.subTasks.length})` : ""}</span>
                      {!addingSubtask && (
                        <button className="st-add-btn" onClick={openAddSubtask}>+ Add Subtask</button>
                      )}
                    </div>
                    <div className="td-st-list">
                      {task.subTasks?.map((sub) => (
                        <div key={sub.id} className="td-st-item" onClick={() => onOpenTask?.(sub.id)} style={{ cursor: onOpenTask ? "pointer" : "default" }}>
                          <span className={`st-cb${sub.status === "DONE" ? " done" : ""}`} />
                          <span className={`st-name${sub.status === "DONE" ? " done" : ""}`}>{sub.code} · {sub.title}</span>
                          <span className={`td-col-chip ${STATUS_CHIP_CLS[sub.status] ?? "backlogc"}`}>{stLabel(sub.status)}</span>
                        </div>
                      ))}
                      {!task.subTasks?.length && !addingSubtask && (
                        <div className="td-st-empty" onClick={openAddSubtask}>+ Add Subtask</div>
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
                          placeholder="Tiêu đề subtask..."
                        />
                        {!subTaskDescOpen ? (
                          <div className="stf-desc" onClick={() => setSubTaskDescOpen(true)}>+ Mô tả</div>
                        ) : (
                          <div style={{ marginTop: 8 }}>
                            <RichTextEditor value={subTaskDesc} onChange={setSubTaskDesc} placeholder="Mô tả subtask..." minHeight={90} />
                          </div>
                        )}
                        <div className="stf-foot">
                          <select value={subTaskStatus} onChange={(e) => setSubTaskStatus(e.target.value)}>
                            {["BACKLOG", "IN_PROGRESS", "REVIEW", "DONE"].map((s) => (
                              <option key={s} value={s}>{stLabel(s)}</option>
                            ))}
                          </select>
                          <button className="abtn ghost" onClick={() => setAddingSubtask(false)}>Hủy</button>
                          <button className="abtn primary" onClick={createSubTask} disabled={subTaskSaving || !subTaskTitle.trim()}>
                            {subTaskSaving ? "Đang tạo…" : "Tạo"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Right sidebar ── */}
              <div className="td-right">
                <div className="td-meta-sec">Chi tiết</div>

                {/* Trạng thái */}
                <div className="td-meta-row">
                  <span className="mrl">Trạng thái</span>
                  <span className="mrv" style={{ position: "relative" }}>
                    <span className={`td-col-chip ${STATUS_CHIP_CLS[task.status] ?? "backlogc"}`}>{stLabel(task.status)}</span>
                    <select value={task.status} onChange={(e) => patch({ status: e.target.value })} disabled={saving} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}>
                      {STATUSES.map((s) => <option key={s} value={s}>{stLabel(s)}</option>)}
                    </select>
                  </span>
                </div>

                {/* Ưu tiên */}
                <div className="td-meta-row">
                  <span className="mrl">Ưu tiên</span>
                  <span className="mrv" style={{ position: "relative" }}>
                    <span className="prio-dot" style={{ background: prioDotColor }} />
                    <span>{PRIO_LABEL[task.priority] ?? task.priority}</span>
                    {isManager && (
                      <select value={task.priority} onChange={(e) => patch({ priority: e.target.value })} disabled={saving} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}>
                        {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{PRIO_LABEL[p.value] ?? p.value}</option>)}
                      </select>
                    )}
                  </span>
                </div>

                {/* Phụ trách */}
                <div className="td-meta-row">
                  <span className="mrl">Phụ trách</span>
                  <span className="mrv">
                    <span className="td-av-sm">{initials(task.assignedTo.fullName)}</span>
                    {isManager ? (
                      <select value={String(task.assignedTo.id)} onChange={(e) => patch({ assignedToId: Number(e.target.value) })} disabled={saving} style={{ background: "transparent", border: "none", fontFamily: "inherit", fontSize: "0.84rem", color: "var(--text)", outline: "none", cursor: "pointer", flex: 1 }}>
                        {employees.map((e) => <option key={e.id} value={e.id}>{e.fullName}</option>)}
                      </select>
                    ) : (
                      <span>{task.assignedTo.fullName}</span>
                    )}
                  </span>
                </div>

                {/* Hỗ trợ */}
                <div className="td-meta-row">
                  <span className="mrl">Hỗ trợ</span>
                  <span className="mrv">
                    {isManager ? (
                      <select value={task.support ? String(task.support.id) : ""} onChange={(e) => patch({ supportId: e.target.value ? Number(e.target.value) : null })} disabled={saving} style={{ background: "transparent", border: "none", fontFamily: "inherit", fontSize: "0.84rem", color: "var(--text)", outline: "none", cursor: "pointer", width: "100%" }}>
                        <option value="">— Chưa chọn —</option>
                        {employees.map((e) => <option key={e.id} value={e.id}>{e.fullName}</option>)}
                      </select>
                    ) : (
                      <span>{task.support?.fullName ?? "—"}</span>
                    )}
                  </span>
                </div>

                {/* Ước tính */}
                <div className="td-meta-row">
                  <span className="mrl">Ước tính</span>
                  <span className="mrv">
                    {isManager ? (
                      <input
                        type="number" min={0}
                        value={estimatedDraft !== "" ? estimatedDraft : (task.estimatedTime ?? "")}
                        onChange={(e) => setEstimatedDraft(e.target.value)}
                        onFocus={() => setEstimatedDraft(task.estimatedTime?.toString() ?? "")}
                        onBlur={(e) => { patch({ estimatedTime: e.target.value ? Number(e.target.value) : null }); setEstimatedDraft(""); }}
                        disabled={saving} placeholder="phút"
                        style={{ width: 64, background: "var(--elev)", border: "1px solid var(--border-2)", borderRadius: 6, padding: "3px 6px", fontFamily: "inherit", fontSize: "0.82rem", color: "var(--text)", outline: "none" }}
                      />
                    ) : (
                      <span>{formatMin(task.estimatedTime)}</span>
                    )}
                    {task.actualTimeTotal > 0 && <span style={{ color: "var(--text-3)", fontSize: "0.8rem" }}>/ {formatMin(task.actualTimeTotal)} thực tế</span>}
                  </span>
                </div>

                {/* Story Points */}
                <div className="td-meta-row">
                  <span className="mrl">Story Points</span>
                  <span className="mrv">
                    {isManager ? (
                      <input
                        type="number" min={1} max={100}
                        value={task.storyPoints ?? ""}
                        onChange={(e) => patch({ storyPoints: e.target.value ? Number(e.target.value) : null })}
                        disabled={saving} placeholder="—"
                        style={{ width: 52, background: "var(--elev)", border: "1px solid var(--border-2)", borderRadius: 6, padding: "3px 6px", fontFamily: "inherit", fontSize: "0.82rem", color: "var(--text)", outline: "none" }}
                      />
                    ) : (
                      <span style={{ fontWeight: 600, color: task.storyPoints ? "var(--accent)" : "var(--text-3)" }}>
                        {task.storyPoints ? `${task.storyPoints} SP` : "—"}
                      </span>
                    )}
                  </span>
                </div>

                {/* Due date */}
                <div className="td-meta-row">
                  <span className="mrl">Hạn</span>
                  <span className="mrv">
                    {isManager ? (
                      <input type="date"
                        value={task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""}
                        onChange={(e) => patch({ dueDate: e.target.value || null })}
                        disabled={saving}
                        style={{ background: "transparent", border: "none", fontFamily: "inherit", fontSize: "0.84rem", color: "var(--text)", outline: "none", cursor: "pointer" }}
                      />
                    ) : (
                      <span style={task.isOverdue ? { color: "var(--danger)", fontWeight: 600 } : undefined}>
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString("vi-VN") : "—"}
                      </span>
                    )}
                  </span>
                </div>

                {/* Customer */}
                {(task.customer || isManager) && (
                  <div className="td-meta-row">
                    <span className="mrl">Khách hàng</span>
                    <span className="mrv">
                      {isManager ? (
                        <select value={String(task.customer?.id ?? "")} onChange={(e) => patch({ customerId: e.target.value ? Number(e.target.value) : null })} disabled={saving} style={{ background: "transparent", border: "none", fontFamily: "inherit", fontSize: "0.84rem", color: "var(--text)", outline: "none", cursor: "pointer", width: "100%" }}>
                          <option value="">— Không —</option>
                          {customers.map((c) => <option key={c.id} value={c.id}>{c.businessName ?? c.customerName}</option>)}
                        </select>
                      ) : (
                        <span>{task.customer ? (task.customer.businessName ?? task.customer.customerName) : "—"}</span>
                      )}
                    </span>
                  </div>
                )}

                {/* Billable / Video */}
                <div className="td-meta-row">
                  <span className="mrl">Billable</span>
                  <label className="mrv" style={{ cursor: isManager ? "pointer" : "default", gap: 6 }}>
                    <input type="checkbox" checked={task.billable} disabled={saving || !isManager}
                      onChange={(e) => isManager && patch({ billable: e.target.checked })}
                      style={{ accentColor: "var(--accent)" }} />
                    <span style={{ color: task.billable ? "var(--ok)" : "var(--text-3)" }}>{task.billable ? "Có" : "Không"}</span>
                  </label>
                </div>

                {/* Sprint */}
                <div className="td-meta-row">
                  <span className="mrl">Sprint</span>
                  <span className="mrv">
                    {isManager ? (
                      <select
                        value={task.sprintId ? String(task.sprintId) : ""}
                        onFocus={() => loadSprints()}
                        onChange={(e) => patch({ sprintId: e.target.value ? Number(e.target.value) : null })}
                        disabled={saving}
                        style={{ background: "transparent", border: "none", fontFamily: "inherit", fontSize: "0.84rem", color: "var(--text)", outline: "none", cursor: "pointer", width: "100%" }}
                      >
                        <option value="">— Không có —</option>
                        {sprints.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        {!sprintsLoaded && task.sprint && <option value={task.sprint.id}>{task.sprint.name}</option>}
                      </select>
                    ) : (
                      <span>{task.sprint?.name ?? "—"}</span>
                    )}
                  </span>
                </div>

                {task.parentTask && (
                  <div className="td-meta-row">
                    <span className="mrl">Parent</span>
                    <span className="mrv" style={{ fontFamily: "var(--font-mono)", color: "var(--accent-ink)", fontSize: "0.8rem" }}>{task.parentTask.code}</span>
                  </div>
                )}

                {/* Watchers */}
                {watchers.length > 0 && (
                  <div className="td-meta-row">
                    <span className="mrl">Theo dõi</span>
                    <span className="mrv" style={{ flexWrap: "wrap", gap: 4 }}>
                      {watchers.map((w) => (
                        <span key={w.employeeId} className="td-av-sm" title={w.employee.fullName} style={{ flexShrink: 0 }}>
                          {w.employee.fullName.charAt(0).toUpperCase()}
                        </span>
                      ))}
                    </span>
                  </div>
                )}

                {/* Recurrence */}
                {(recurrence || isManager) && (
                  <div className="td-meta-row" style={{ alignItems: "flex-start" }}>
                    <span className="mrl" style={{ paddingTop: 2 }}>Lặp lại</span>
                    <span className="mrv" style={{ flex: 1 }}>
                      <RecurrenceEditor
                        taskId={task.id}
                        recurrence={recurrence}
                        isManager={isManager}
                        onSaved={setRecurrence}
                      />
                    </span>
                  </div>
                )}

                {/* Người tạo */}
                <div className="td-meta-sec" style={{ marginTop: 8 }}>Người tạo</div>
                <div className="td-meta-row">
                  <span className="mrl">Reporter</span>
                  <span className="mrv">
                    <span className="td-av-sm">{initials(task.assignedBy.fullName)}</span>
                    {task.assignedBy.fullName}
                  </span>
                </div>
                <div className="td-meta-row">
                  <span className="mrl">Tạo lúc</span>
                  <span className="mrv" style={{ fontSize: "0.78rem", color: "var(--text-3)" }}>
                    {new Date(task.dateCreated).toLocaleDateString("vi-VN")} {new Date(task.dateCreated).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                {task.dateStarted && (
                  <div className="td-meta-row">
                    <span className="mrl">Bắt đầu</span>
                    <span className="mrv" style={{ fontSize: "0.78rem", color: "var(--text-3)" }}>{new Date(task.dateStarted).toLocaleDateString("vi-VN")}</span>
                  </div>
                )}
                {task.dateCompleted && (
                  <div className="td-meta-row">
                    <span className="mrl">Hoàn thành</span>
                    <span className="mrv" style={{ fontSize: "0.78rem", color: "var(--ok)", fontWeight: 600 }}>{new Date(task.dateCompleted).toLocaleDateString("vi-VN")}</span>
                  </div>
                )}

                {/* Delete */}
                <div style={{ marginTop: "auto", paddingTop: 16 }}>
                  <button
                    className="abtn"
                    style={{ width: "100%", background: "transparent", border: "1px solid rgba(239,68,68,0.35)", color: "var(--danger)", justifyContent: "center" }}
                    onClick={async () => {
                      if (!confirm(`Xóa task ${task.code}?`)) return;
                      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
                      if (res.ok) { onSaved(); onClose(); }
                    }}
                  >
                    🗑 Xóa task
                  </button>
                </div>
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
