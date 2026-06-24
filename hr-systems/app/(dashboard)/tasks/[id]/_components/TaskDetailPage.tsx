"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RecurrenceEditor } from "@/components/tasks/RecurrenceEditor";
import type { RecurrenceFrequency } from "@/lib/recurrence";

/* ── Types ──────────────────────────────────────────────────── */
type SubTask = {
  id: number;
  code: string;
  title: string;
  status: string;
  progressPct: number;
  priority: string;
  assignedTo: { id: number; fullName: string } | null;
};

type TimeLogEntry = {
  id: number;
  date: string;
  durationMinutes: number;
  approvalStatus: string;
  note: string | null;
  employee: { id: number; fullName: string };
};

type Task = {
  id: number;
  code: string;
  title: string;
  description: string | null;
  taskType: string;
  priority: string;
  status: string;
  progressPct: number;
  billable: boolean;
  isOverdue: boolean;
  requiresVideo: boolean;
  estimatedTime: number | null;
  actualTimeTotal: number;
  dueDate: string | null;
  dateCreated: string;
  dateStarted: string | null;
  dateCompleted: string | null;
  reasonNextAction: string | null;
  assignedTo: { id: number; fullName: string; avatarUrl: string | null };
  assignedBy: { id: number; fullName: string };
  support: { id: number; fullName: string } | null;
  customer: { id: number; customerName: string | null; businessName: string | null } | null;
  parentTask: { id: number; code: string; title: string } | null;
  subTasks: SubTask[];
  timeLogs: TimeLogEntry[];
  _count: { timeLogs: number; subTasks: number };
  sprintId?: number | null;
  sprint?: { id: number; name: string; status: string } | null;
  storyPoints?: number | null;
};

type AttachmentItem = { id: number; fileName: string; fileUrl: string; fileSize: number | null; mimeType: string | null; uploadedBy: { id: number; fullName: string }; createdAt: string };

type Sprint = { id: number; name: string; status: string };
type ChecklistItem = { id: number; content: string; checked: boolean; order: number };
type Watcher = { employeeId: number; employee: { id: number; fullName: string; avatarUrl: string | null } };

type Props = {
  task: Task;
  employees: { id: number; fullName: string }[];
  currentEmployeeId: number;
  isManager?: boolean;
};

/* ── Constants ──────────────────────────────────────────────── */
const TASK_TYPE_LABEL: Record<string, string> = {
  NORMAL: "Thông thường", LEARNING: "Học tập", NEW_RESEARCH: "Nghiên cứu",
  MEETING: "Họp", ADMIN: "Hành chính", BILLABLE_CLIENT: "Khách hàng", INTERNAL: "Nội bộ",
};

const TYPE_COLOR: Record<string, string> = {
  NORMAL: "#3B5BDB", LEARNING: "#8b5cf6", NEW_RESEARCH: "#06b6d4",
  MEETING: "#f59e0b", ADMIN: "#94a3b8", BILLABLE_CLIENT: "#22c55e", INTERNAL: "#64748b",
};

const PRIO_COLORS: Record<string, string> = {
  CRITICAL: "var(--danger)", HIGH: "#f97316", NORMAL: "var(--accent)", LOW: "var(--text-3)",
};

const PRIO_LABEL: Record<string, string> = {
  CRITICAL: "Cao", HIGH: "Cao", NORMAL: "Vừa", LOW: "Thấp",
};

const STATUSES = [
  { value: "BACKLOG", label: "Backlog" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "BLOCKED", label: "Blocked" },
  { value: "REVIEW", label: "Testing" },
  { value: "DONE", label: "Done" },
  { value: "CANCELLED", label: "Cancelled" },
];

const ST_CHIP: Record<string, string> = {
  BACKLOG: "todo", IN_PROGRESS: "doing", REVIEW: "review",
  DONE: "done", BLOCKED: "blocked", CANCELLED: "cancelled",
};

function initials(name: string) {
  return name.split(" ").filter(Boolean).map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function fmtMin(min: number) {
  if (!min) return "0m";
  const h = Math.floor(min / 60), m = min % 60;
  return m === 0 ? `${h}h` : h === 0 ? `${m}m` : `${h}h${m}m`;
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/* ── Comment types ──────────────────────────────────────────── */
type CommentAuthor = { id: number; fullName: string; avatarUrl: string | null };
type CommentReply = { id: number; content: string; author: CommentAuthor; createdAt: string };
type Comment = {
  id: number;
  content: string;
  author: CommentAuthor;
  createdAt: string;
  replies: CommentReply[];
};

/* ── Main Component ─────────────────────────────────────────── */
export function TaskDetailPage({ task: initialTask, employees, currentEmployeeId, isManager = false }: Props) {
  const router = useRouter();
  const [task, setTask] = useState(initialTask);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Activity tabs */
  const [actTab, setActTab] = useState<"comments" | "history" | "worklog">("comments");
  const [subtasksCollapsed, setSubtasksCollapsed] = useState(false);
  const [actCollapsed, setActCollapsed] = useState(false);

  /* Add subtask */
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [subTitle, setSubTitle] = useState("");
  const [subStatus, setSubStatus] = useState("IN_PROGRESS");
  const [subSaving, setSubSaving] = useState(false);
  const subTitleRef = useRef<HTMLInputElement>(null);

  async function createSubtask() {
    if (!subTitle.trim() || subSaving) return;
    setSubSaving(true);
    const res = await fetch(`/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: subTitle.trim(),
        status: subStatus,
        parentTaskId: task.id,
        assignedToId: task.assignedTo.id,
        taskType: task.taskType,
        priority: task.priority,
      }),
    });
    setSubSaving(false);
    if (res.ok) {
      const j = await res.json();
      setTask((prev: any) => prev ? { ...prev, subTasks: [...prev.subTasks, j.data], _count: { ...prev._count, subTasks: prev._count.subTasks + 1 } } : prev);
      setSubTitle("");
      setAddingSubtask(false);
    }
  }

  /* Comments */
  const [comments, setComments] = useState<Comment[]>([]);
  const [cmtLoading, setCmtLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [cmtSaving, setCmtSaving] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replySaving, setReplySaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  async function loadComments() {
    setCmtLoading(true);
    const res = await fetch(`/api/tasks/${task.id}/comments`);
    if (res.ok) { const j = await res.json(); setComments(j.data ?? []); }
    setCmtLoading(false);
  }

  async function submitComment() {
    if (!newComment.trim() || cmtSaving) return;
    setCmtSaving(true);
    const res = await fetch(`/api/tasks/${task.id}/comments`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newComment.trim() }),
    });
    setCmtSaving(false);
    if (res.ok) { const j = await res.json(); setComments((p) => [j.data, ...p]); setNewComment(""); }
  }

  async function submitReply(parentId: number) {
    if (!replyText.trim() || replySaving) return;
    setReplySaving(true);
    const res = await fetch(`/api/tasks/${task.id}/comments`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: replyText.trim(), parentId }),
    });
    setReplySaving(false);
    if (res.ok) {
      const j = await res.json();
      setComments((p) => p.map((c) => c.id === parentId ? { ...c, replies: [...c.replies, j.data] } : c));
      setReplyingTo(null); setReplyText("");
    }
  }

  async function deleteComment(commentId: number) {
    if (!confirm("Xóa bình luận này?")) return;
    const res = await fetch(`/api/tasks/${task.id}/comments/${commentId}`, { method: "DELETE" });
    if (res.ok) setComments((p) => p.filter((c) => c.id !== commentId));
  }

  async function saveEdit(commentId: number) {
    if (!editText.trim()) return;
    const res = await fetch(`/api/tasks/${task.id}/comments/${commentId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editText.trim() }),
    });
    if (res.ok) {
      const j = await res.json();
      setComments((p) => p.map((c) => c.id === commentId ? { ...c, content: j.data.content } : c));
      setEditingId(null); setEditText("");
    }
  }

  useEffect(() => { if (actTab === "comments") loadComments(); }, [actTab]);

  /* Sprint */
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [sprintsLoaded, setSprintsLoaded] = useState(false);

  async function loadSprints() {
    if (sprintsLoaded) return;
    const res = await fetch("/api/sprints");
    if (res.ok) { const j = await res.json(); setSprints(j.data ?? []); }
    setSprintsLoaded(true);
  }

  /* Checklist */
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [checklistLoaded, setChecklistLoaded] = useState(false);
  const [newCheckItem, setNewCheckItem] = useState("");
  const [checkItemSaving, setCheckItemSaving] = useState(false);
  const [addingCheckItem, setAddingCheckItem] = useState(false);
  const checkItemInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/tasks/${task.id}/checklist`)
      .then((r) => r.json())
      .then((j) => { setChecklist(j.data ?? []); setChecklistLoaded(true); });
  }, [task.id]);

  async function addCheckItem() {
    if (!newCheckItem.trim() || checkItemSaving) return;
    setCheckItemSaving(true);
    const res = await fetch(`/api/tasks/${task.id}/checklist`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newCheckItem.trim() }),
    });
    if (res.ok) { const j = await res.json(); setChecklist((p) => [...p, j.data]); setNewCheckItem(""); }
    setCheckItemSaving(false);
  }

  async function toggleCheckItem(itemId: number, checked: boolean) {
    const res = await fetch(`/api/tasks/${task.id}/checklist/${itemId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checked }),
    });
    if (res.ok) setChecklist((p) => p.map((i) => i.id === itemId ? { ...i, checked } : i));
  }

  async function deleteCheckItem(itemId: number) {
    const res = await fetch(`/api/tasks/${task.id}/checklist/${itemId}`, { method: "DELETE" });
    if (res.ok) setChecklist((p) => p.filter((i) => i.id !== itemId));
  }

  /* Watchers */
  const [watchers, setWatchers] = useState<Watcher[]>([]);
  const [isWatching, setIsWatching] = useState(false);
  const [watchSaving, setWatchSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/tasks/${task.id}/watchers`)
      .then((r) => r.json())
      .then((j) => { setWatchers(j.data ?? []); setIsWatching(j.isWatching ?? false); });
  }, [task.id]);

  async function toggleWatch() {
    if (watchSaving) return;
    setWatchSaving(true);
    if (isWatching) {
      const res = await fetch(`/api/tasks/${task.id}/watchers/${currentEmployeeId}`, { method: "DELETE" });
      if (res.ok) { setIsWatching(false); setWatchers((p) => p.filter((w) => w.employeeId !== currentEmployeeId)); }
    } else {
      const res = await fetch(`/api/tasks/${task.id}/watchers`, { method: "POST" });
      if (res.ok) { const j = await res.json(); setIsWatching(true); setWatchers((p) => [...p, j.data]); }
    }
    setWatchSaving(false);
  }

  /* Attachments */
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const attachInputRef = useRef<HTMLInputElement>(null);
  const [attachUploading, setAttachUploading] = useState(false);

  useEffect(() => {
    fetch(`/api/tasks/${task.id}/attachments`)
      .then((r) => r.json())
      .then((j) => setAttachments(j.data ?? []));
  }, [task.id]);

  async function uploadAttachment(file: File) {
    setAttachUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      const res = await fetch(`/api/tasks/${task.id}/attachments`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, fileUrl: dataUrl, fileSize: file.size, mimeType: file.type }),
      });
      if (res.ok) { const j = await res.json(); setAttachments((p) => [j.data, ...p]); }
      setAttachUploading(false);
    };
    reader.readAsDataURL(file);
  }

  async function deleteAttachment(id: number) {
    if (!confirm("Xóa file đính kèm này?")) return;
    const res = await fetch(`/api/tasks/${task.id}/attachments/${id}`, { method: "DELETE" });
    if (res.ok) setAttachments((p) => p.filter((a) => a.id !== id));
  }

  /* Recurrence */
  type RecurrenceData = {
    id?: number; frequency: RecurrenceFrequency; interval: number; daysOfWeek: number[];
    dayOfMonth: number | null; endDate: string | null; maxOccurrences: number | null;
    nextRunAt: string; lastRunAt: string | null; isActive: boolean; occurrenceCount: number;
  };
  const [recurrence, setRecurrence] = useState<RecurrenceData | null>(null);
  useEffect(() => {
    fetch(`/api/tasks/${task.id}/recurrence`).then(r => r.json()).then(j => setRecurrence(j.data ?? null));
  }, [task.id]);

  function fmtFileSize(bytes: number | null) {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  }

  function fileIcon(mime: string | null) {
    if (!mime) return "📎";
    if (mime.startsWith("image/")) return "🖼️";
    if (mime.includes("pdf")) return "📄";
    return "📎";
  }

  /* Mentions */
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionAnchor, setMentionAnchor] = useState<number | null>(null);
  const [showMentions, setShowMentions] = useState(false);
  const cmtInputRef = useRef<HTMLTextAreaElement>(null);

  function handleCmtChange(value: string) {
    setNewComment(value);
    const lastAt = value.lastIndexOf("@");
    if (lastAt !== -1) {
      const after = value.slice(lastAt + 1);
      if (!after.includes(" ") && !after.includes("\n")) {
        setMentionQuery(after.toLowerCase()); setMentionAnchor(lastAt); setShowMentions(true); return;
      }
    }
    setShowMentions(false); setMentionAnchor(null);
  }

  function insertMention(emp: { id: number; fullName: string }) {
    if (mentionAnchor === null) return;
    const before = newComment.slice(0, mentionAnchor);
    const after = newComment.slice(mentionAnchor + 1 + mentionQuery.length);
    setNewComment(`${before}@${emp.fullName} ${after}`);
    setShowMentions(false); setMentionAnchor(null);
    setTimeout(() => cmtInputRef.current?.focus(), 10);
  }

  function renderCmt(content: string) {
    return content.split(/(@\S+)/g).map((p, i) =>
      p.startsWith("@") ? <span key={i} style={{ color: "var(--accent)", fontWeight: 600 }}>{p}</span> : p
    );
  }

  /* Timer */
  const [timerSec, setTimerSec] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function showToast(msg: string, ok = true) {
    if (toastRef.current) clearTimeout(toastRef.current);
    setToast({ msg, ok });
    toastRef.current = setTimeout(() => setToast(null), 3000);
  }

  function fmtTimer(s: number) {
    return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60]
      .map((v) => String(v).padStart(2, "0")).join(":");
  }

  function toggleTimer() {
    if (timerRunning) {
      clearInterval(timerRef.current!);
      setTimerRunning(false);
    } else {
      setTimerRunning(true);
      timerRef.current = setInterval(() => setTimerSec((s) => s + 1), 1000);
    }
  }

  useEffect(() => { return () => { if (timerRef.current) clearInterval(timerRef.current); }; }, []);

  async function patchTask(data: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const j = await res.json();
        setTask((prev) => ({ ...prev, ...j.data }));
        showToast("Đã lưu");
      } else {
        showToast("Lỗi khi lưu", false);
      }
    } finally {
      setSaving(false);
    }
  }

  const customerLabel = task.customer
    ? (task.customer.businessName ?? task.customer.customerName ?? "—")
    : null;
  const typeColor = TYPE_COLOR[task.taskType] ?? "#3B5BDB";
  const doneCount = task.subTasks.filter((s) => s.status === "DONE").length;
  const stPct = task.subTasks.length > 0 ? Math.round((doneCount / task.subTasks.length) * 100) : 0;

  return (
    <div className="content-inner tdp-page">
      {/* Head */}
      <div className="tdp-head">
        <span
          className="tdp-type"
          style={{ background: typeColor }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
        </span>

        <div className="tdp-crumb">
          <button
            className="tdp-back"
            onClick={() => { router.refresh(); router.push("/tasks"); }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M11 6l-6 6 6 6"/>
            </svg>
            Công việc
          </button>
          <span style={{ color: "var(--border-2)" }}>/</span>
          <span className="tdp-key">{task.code}</span>
        </div>

        <div className="tdp-actions">
          <button
            className={`abtn primary${timerRunning ? " running" : ""}`}
            style={{ gap: 8 }}
            onClick={toggleTimer}
          >
            {timerRunning ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                </svg>
                Tạm dừng
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                {timerSec > 0 ? "Tiếp tục" : "Bắt đầu"}
              </>
            )}
          </button>

          {timerSec > 0 && (
            <span className={`tdp-timer-live${timerRunning ? " on" : ""}`} style={{ display: "inline-block" }}>
              {fmtTimer(timerSec)}
            </span>
          )}

          <button
            className="abtn ghost"
            style={{ gap: 7, color: isWatching ? "var(--accent)" : undefined, borderColor: isWatching ? "var(--accent)" : undefined }}
            onClick={toggleWatch}
            disabled={watchSaving}
            title={isWatching ? "Đang theo dõi — click để bỏ theo dõi" : "Theo dõi task"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill={isWatching ? "var(--accent)" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            {isWatching ? "Đang theo dõi" : "Theo dõi"}
          </button>

          <button
            className="abtn ghost"
            style={{ gap: 7 }}
            onClick={() => { router.refresh(); router.push("/tasks"); }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
            </svg>
            Xem board
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="tdp-body">
        {/* LEFT */}
        <div className="tdp-left">
          {/* Title */}
          <textarea
            className="tdp-title"
            rows={2}
            defaultValue={task.title}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v && v !== task.title) patchTask({ title: v });
            }}
          />

          {/* Description */}
          <div className="tdp-section">
            <div className="tdp-sec-head">
              <h3>Mô tả</h3>
            </div>
            <div className="tdp-sec-body">
              {task.description ? (
                <div
                  className="prose prose-sm max-w-none"
                  style={{ color: "var(--text-2)", lineHeight: 1.6 }}
                  dangerouslySetInnerHTML={{ __html: task.description }}
                />
              ) : (
                <p style={{ color: "var(--text-3)", fontSize: "0.88rem" }}>Chưa có mô tả.</p>
              )}
            </div>
          </div>

          {/* Checklist */}
          <div className="tdp-section">
            <div className="tdp-sec-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3>
                Checklist
                {checklist.length > 0 && (
                  <span style={{ marginLeft: 8, fontSize: "0.78rem", color: "var(--text-3)", fontWeight: 400 }}>
                    {checklist.filter((i) => i.checked).length}/{checklist.length}
                  </span>
                )}
              </h3>
              {!addingCheckItem && (
                <button className="abtn ghost" style={{ padding: "4px 10px", fontSize: "0.78rem" }}
                  onClick={() => { setAddingCheckItem(true); setTimeout(() => checkItemInputRef.current?.focus(), 50); }}>
                  + Thêm
                </button>
              )}
            </div>
            <div className="tdp-sec-body">
              {checklist.length > 0 && (
                <div style={{ width: "100%", height: 4, background: "var(--border)", borderRadius: 4, marginBottom: 10 }}>
                  <div style={{ height: "100%", background: "var(--ok)", borderRadius: 4, width: `${Math.round((checklist.filter((i) => i.checked).length / checklist.length) * 100)}%`, transition: "width 0.3s" }} />
                </div>
              )}
              {checklist.map((item) => (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
                  <input type="checkbox" checked={item.checked} onChange={(e) => toggleCheckItem(item.id, e.target.checked)}
                    style={{ accentColor: "var(--accent)", flexShrink: 0, cursor: "pointer" }} />
                  <span style={{ flex: 1, fontSize: "0.88rem", color: item.checked ? "var(--text-3)" : "var(--text)", textDecoration: item.checked ? "line-through" : undefined }}>
                    {item.content}
                  </span>
                  <button onClick={() => deleteCheckItem(item.id)}
                    style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", fontSize: "0.75rem", padding: "2px 4px", opacity: 0.6 }}>✕</button>
                </div>
              ))}
              {addingCheckItem && (
                <div style={{ display: "flex", gap: 6, padding: "8px 0", alignItems: "center" }}>
                  <input ref={checkItemInputRef} value={newCheckItem} onChange={(e) => setNewCheckItem(e.target.value)}
                    placeholder="Nội dung checklist item…"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); addCheckItem(); }
                      if (e.key === "Escape") { setAddingCheckItem(false); setNewCheckItem(""); }
                    }}
                    style={{ flex: 1, background: "var(--elev)", border: "1px solid var(--border-2)", borderRadius: 6, padding: "6px 10px", fontFamily: "inherit", fontSize: "0.88rem", color: "var(--text)", outline: "none" }}
                  />
                  <button className="abtn" onClick={addCheckItem} disabled={checkItemSaving || !newCheckItem.trim()} style={{ padding: "6px 14px" }}>Thêm</button>
                  <button className="abtn ghost" onClick={() => { setAddingCheckItem(false); setNewCheckItem(""); }} style={{ padding: "6px 10px" }}>Hủy</button>
                </div>
              )}
              {!checklist.length && !addingCheckItem && checklistLoaded && (
                <p style={{ color: "var(--text-3)", fontSize: "0.88rem" }}>Chưa có mục nào. <button style={{ background: "none", border: "none", color: "var(--accent-ink)", cursor: "pointer", padding: 0, fontSize: "inherit" }}
                  onClick={() => { setAddingCheckItem(true); setTimeout(() => checkItemInputRef.current?.focus(), 50); }}>+ Thêm mục đầu tiên</button></p>
              )}
            </div>
          </div>

          {/* Attachments */}
          <div className="tdp-section">
            <div className="tdp-sec-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3>Đính kèm{attachments.length > 0 ? ` (${attachments.length})` : ""}</h3>
              <button className="abtn ghost" style={{ padding: "4px 10px", fontSize: "0.78rem" }}
                onClick={() => attachInputRef.current?.click()} disabled={attachUploading}>
                {attachUploading ? "Đang tải…" : "+ Tải lên"}
              </button>
              <input ref={attachInputRef} type="file" style={{ display: "none" }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAttachment(f); e.target.value = ""; }} />
            </div>
            <div className="tdp-sec-body">
              {attachments.map((att) => (
                <div key={att.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>{fileIcon(att.mimeType)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <a href={att.fileUrl} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: "0.88rem", color: "var(--accent-ink)", textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {att.fileName}
                    </a>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>
                      {att.uploadedBy.fullName} · {fmtFileSize(att.fileSize)}
                    </span>
                  </div>
                  <button onClick={() => deleteAttachment(att.id)}
                    style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", fontSize: "0.78rem", padding: "4px 6px" }}>✕</button>
                </div>
              ))}
              {!attachments.length && !attachUploading && (
                <p style={{ color: "var(--text-3)", fontSize: "0.88rem" }}>
                  Chưa có file đính kèm.{" "}
                  <button style={{ background: "none", border: "none", color: "var(--accent-ink)", cursor: "pointer", padding: 0, fontSize: "inherit" }}
                    onClick={() => attachInputRef.current?.click()}>Tải lên file đầu tiên →</button>
                </p>
              )}
            </div>
          </div>

          {/* Subtasks */}
          <div className="tdp-section" id="stSection">
            <div className="tdp-sec-head" style={{ display: "flex", alignItems: "center" }}>
              <button
                style={{ background: "none", border: "none", color: "var(--text)", display: "flex", alignItems: "center", gap: 8, fontSize: "0.88rem", fontWeight: 700, cursor: "pointer" }}
                onClick={() => setSubtasksCollapsed((c) => !c)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"
                  style={{ transition: "transform 0.2s", transform: subtasksCollapsed ? "rotate(-90deg)" : "" }}>
                  <path d="M6 9l6 6 6-6"/>
                </svg>
                Subtasks
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-3)" }}>
                  ({task.subTasks.length})
                </span>
              </button>
              {!addingSubtask && (
                <button
                  onClick={() => { setAddingSubtask(true); setTimeout(() => subTitleRef.current?.focus(), 50); }}
                  style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--accent-ink)", fontSize: "0.83rem", fontWeight: 600, cursor: "pointer" }}
                >
                  + Add Subtask
                </button>
              )}
            </div>

            {!subtasksCollapsed && (
              <div>
                {task.subTasks.length > 0 && (
                  <div style={{ padding: "12px 18px 4px" }}>
                    <div className="st-prog-row">
                      <div className="st-prog-bar"><i style={{ width: stPct + "%" }}></i></div>
                      <span className="st-prog-label">{stPct}% Done</span>
                    </div>
                  </div>
                )}

                {task.subTasks.length === 0 && !addingSubtask && (
                  <div
                    onClick={() => { setAddingSubtask(true); setTimeout(() => subTitleRef.current?.focus(), 50); }}
                    style={{ padding: "16px 18px", color: "var(--text-3)", fontSize: "0.85rem", cursor: "pointer", border: "1.5px dashed var(--border-2)", borderRadius: 9, margin: "8px 18px", textAlign: "center", transition: "border-color 0.15s, color 0.15s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--accent)"; (e.currentTarget as HTMLDivElement).style.color = "var(--accent-ink)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-2)"; (e.currentTarget as HTMLDivElement).style.color = "var(--text-3)"; }}
                  >
                    + Thêm subtask đầu tiên
                  </div>
                )}

                {task.subTasks.length > 0 && (
                  <div className="st-table-wrap">
                    <table className="sttable">
                      <thead>
                        <tr>
                          <th style={{ width: "99%" }}>Work</th>
                          <th style={{ minWidth: 80 }}>Ưu tiên</th>
                          <th style={{ minWidth: 52 }}>Người làm</th>
                          <th style={{ minWidth: 110 }}>Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {task.subTasks.map((st) => (
                          <tr key={st.id}>
                            <td>
                              <div className="st-row-work">
                                <span className="st-type-ico" style={{ background: TYPE_COLOR[st.status] ?? "#3B5BDB" }}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </span>
                                <span className={`st-id${st.status === "DONE" ? " done" : ""}`} style={{ cursor: "pointer" }} onClick={() => router.push(`/tasks/${st.id}`)}>
                                  {st.code}
                                </span>
                                <span className="st-t" title={st.title}>{st.title}</span>
                              </div>
                            </td>
                            <td>
                              <div className="st-prio-cell">
                                <div className={`st-prio-bar ${st.priority === "CRITICAL" || st.priority === "HIGH" ? "hi" : st.priority === "LOW" ? "lo" : "md"}`}></div>
                                <span style={{ fontSize: "0.78rem", color: "var(--text-3)" }}>{PRIO_LABEL[st.priority] ?? "Vừa"}</span>
                              </div>
                            </td>
                            <td>
                              {st.assignedTo ? (
                                <span className="st-av-sm" title={st.assignedTo.fullName}>{initials(st.assignedTo.fullName)}</span>
                              ) : (
                                <span style={{ fontSize: "0.78rem", color: "var(--text-3)" }}>—</span>
                              )}
                            </td>
                            <td>
                              <span className={`st-chip ${ST_CHIP[st.status] ?? "todo"}`}>
                                {STATUSES.find((s) => s.value === st.status)?.label ?? st.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Add subtask form */}
                {addingSubtask && (
                  <div style={{ margin: "10px 18px 6px", background: "var(--content)", border: "1px solid var(--border-2)", borderRadius: 10, padding: "14px 16px" }}>
                    <input
                      ref={subTitleRef}
                      type="text"
                      value={subTitle}
                      onChange={(e) => setSubTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") createSubtask();
                        if (e.key === "Escape") { setAddingSubtask(false); setSubTitle(""); }
                      }}
                      placeholder="Tiêu đề subtask…"
                      style={{ width: "100%", background: "var(--elev)", border: "1.5px solid var(--border-2)", borderRadius: 7, padding: "8px 12px", fontFamily: "inherit", fontSize: "0.88rem", color: "var(--text)", outline: "none" }}
                      onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                      onBlur={e => (e.target.style.borderColor = "var(--border-2)")}
                    />
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                      <select
                        value={subStatus}
                        onChange={(e) => setSubStatus(e.target.value)}
                        style={{ background: "var(--elev)", border: "1px solid var(--border-2)", borderRadius: 7, padding: "6px 10px", fontFamily: "inherit", fontSize: "0.83rem", color: "var(--text)", outline: "none", cursor: "pointer" }}
                      >
                        {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                      <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                        <button
                          onClick={() => { setAddingSubtask(false); setSubTitle(""); }}
                          style={{ height: 34, padding: "0 14px", borderRadius: 8, border: "1px solid var(--border-2)", background: "transparent", color: "var(--text-2)", fontFamily: "inherit", fontSize: "0.84rem", cursor: "pointer" }}
                        >
                          Hủy
                        </button>
                        <button
                          onClick={createSubtask}
                          disabled={subSaving || !subTitle.trim()}
                          style={{ height: 34, padding: "0 16px", borderRadius: 8, border: "none", background: "var(--accent)", color: "#fff", fontFamily: "inherit", fontSize: "0.84rem", fontWeight: 600, cursor: "pointer", opacity: (!subTitle.trim() || subSaving) ? 0.5 : 1 }}
                        >
                          {subSaving ? "Đang tạo…" : "Tạo"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Activity / Comments */}
          <div className="tdp-section act-wrap">
            <div className="act-head">
              <button className="act-toggle" onClick={() => setActCollapsed((c) => !c)}>
                <svg
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transition: "transform 0.2s", transform: actCollapsed ? "rotate(-90deg)" : "" }}
                >
                  <path d="M6 9l6 6 6-6"/>
                </svg>
                Activity
              </button>
            </div>

            {!actCollapsed && (
              <div id="actBody">
                <div className="act-tabs">
                  {(["comments", "history", "worklog"] as const).map((tab) => (
                    <button
                      key={tab}
                      className={`act-tab${actTab === tab ? " on" : ""}`}
                      onClick={() => setActTab(tab)}
                    >
                      {tab === "comments" ? "Comments" : tab === "history" ? "History" : "Work log"}
                    </button>
                  ))}
                </div>

                <div className="act-body">
                  {/* Comment input */}
                  {actTab === "comments" && (
                    <>
                      {/* Input */}
                      <div className="act-input-row">
                        <span className="act-av">{initials(employees.find((e) => e.id === currentEmployeeId)?.fullName ?? "U")}</span>
                        <div className="act-input-card" style={{ position: "relative" }}>
                          <textarea
                            ref={cmtInputRef}
                            rows={2}
                            placeholder="Thêm bình luận… (Ctrl+Enter để gửi, @ để mention)"
                            value={newComment}
                            onChange={(e) => handleCmtChange(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && e.ctrlKey) { e.preventDefault(); submitComment(); }
                              if (e.key === "Escape") setShowMentions(false);
                            }}
                            onBlur={() => setTimeout(() => setShowMentions(false), 150)}
                          />
                          {showMentions && (
                            <div style={{ position: "absolute", top: "100%", left: 0, zIndex: 100, background: "var(--content)", border: "1px solid var(--border)", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", minWidth: 220, maxHeight: 200, overflowY: "auto" }}>
                              {employees
                                .filter((e) => e.fullName.toLowerCase().includes(mentionQuery))
                                .slice(0, 6)
                                .map((e) => (
                                  <button key={e.id} onMouseDown={() => insertMention(e)}
                                    style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 14px", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontSize: "0.88rem", color: "var(--text)" }}
                                    onMouseEnter={(ev) => (ev.currentTarget.style.background = "var(--elev)")}
                                    onMouseLeave={(ev) => (ev.currentTarget.style.background = "none")}>
                                    <span style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center", fontSize: "0.75rem", fontWeight: 700, flexShrink: 0 }}>
                                      {e.fullName.charAt(0).toUpperCase()}
                                    </span>
                                    {e.fullName}
                                  </button>
                                ))}
                              {employees.filter((e) => e.fullName.toLowerCase().includes(mentionQuery)).length === 0 && (
                                <div style={{ padding: "10px 14px", color: "var(--text-3)", fontSize: "0.84rem" }}>Không tìm thấy</div>
                              )}
                            </div>
                          )}
                          {newComment.trim() && (
                            <div className="act-quick-row">
                              <button className="abtn primary act-send" style={{ height: 32, fontSize: "0.82rem" }} onClick={submitComment} disabled={cmtSaving}>
                                {cmtSaving ? "Đang gửi…" : "Gửi"}
                              </button>
                              <button className="abtn ghost" style={{ height: 32, fontSize: "0.82rem" }} onClick={() => setNewComment("")}>Hủy</button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* List */}
                      <div id="cmtList">
                        {cmtLoading && <p style={{ color: "var(--text-3)", fontSize: "0.85rem", padding: "12px 0" }}>Đang tải…</p>}
                        {!cmtLoading && comments.length === 0 && (
                          <p style={{ color: "var(--text-3)", fontSize: "0.85rem", padding: "12px 0" }}>Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                        )}
                        {comments.map((c) => (
                          <div key={c.id} className="act-comment">
                            <span className="cav-lg">{initials(c.author.fullName)}</span>
                            <div className="cbody">
                              <div className="cname-row">
                                <span className="cname">{c.author.fullName}</span>
                                <span className="crole">· Internal</span>
                                <span className="cdate" style={{ marginLeft: "auto" }}>
                                  {new Date(c.createdAt).toLocaleDateString("vi-VN")} {new Date(c.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>

                              {editingId === c.id ? (
                                <div style={{ marginTop: 6 }}>
                                  <textarea
                                    rows={3}
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    autoFocus
                                    style={{ width: "100%", background: "var(--elev)", border: "1.5px solid var(--accent)", borderRadius: 8, padding: "8px 11px", fontFamily: "inherit", fontSize: "0.87rem", color: "var(--text)", resize: "none", outline: "none" }}
                                  />
                                  <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                                    <button className="abtn primary" style={{ height: 30, fontSize: "0.8rem" }} onClick={() => saveEdit(c.id)}>Lưu</button>
                                    <button className="abtn ghost" style={{ height: 30, fontSize: "0.8rem" }} onClick={() => { setEditingId(null); setEditText(""); }}>Hủy</button>
                                  </div>
                                </div>
                              ) : (
                                <div className="ctext" style={{ whiteSpace: "pre-wrap" }}>{renderCmt(c.content)}</div>
                              )}

                              <div className="cbar">
                                <button className="c-reply-btn" onClick={() => { setReplyingTo(replyingTo === c.id ? null : c.id); setReplyText(""); }}>
                                  ↩ Phản hồi
                                </button>
                                {c.author.id === currentEmployeeId && editingId !== c.id && (
                                  <>
                                    <button className="c-reply-btn" onClick={() => { setEditingId(c.id); setEditText(c.content); }}>Sửa</button>
                                    <button className="c-reply-btn" style={{ color: "var(--danger)" }} onClick={() => deleteComment(c.id)}>Xóa</button>
                                  </>
                                )}
                              </div>

                              {/* Replies — inside cbody so they stack vertically */}
                              {c.replies.length > 0 && (
                                <div className="act-replies">
                                  {c.replies.map((r) => (
                                    <div key={r.id} className="act-reply">
                                      <span className="cav-sm">{initials(r.author.fullName)}</span>
                                      <div className="cbody">
                                        <div className="cname-row">
                                          <span className="cname">{r.author.fullName}</span>
                                          <span className="cdate" style={{ marginLeft: "auto", fontSize: "0.74rem", color: "var(--text-3)" }}>
                                            {new Date(r.createdAt).toLocaleDateString("vi-VN")} {new Date(r.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                                          </span>
                                        </div>
                                        <div className="ctext" style={{ whiteSpace: "pre-wrap" }}>{r.content}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Reply input */}
                              {replyingTo === c.id && (
                                <div className="tdp-reply-input">
                                  <textarea
                                    rows={2}
                                    placeholder={`Phản hồi ${c.author.fullName}…`}
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) { e.preventDefault(); submitReply(c.id); } }}
                                    autoFocus
                                  />
                                  <div className="ri-foot">
                                    <button className="abtn ghost" style={{ height: 28, fontSize: "0.78rem" }} onClick={() => { setReplyingTo(null); setReplyText(""); }}>Hủy</button>
                                    <button className="abtn primary" style={{ height: 28, fontSize: "0.78rem" }} onClick={() => submitReply(c.id)} disabled={replySaving}>
                                      {replySaving ? "Đang gửi…" : "Gửi"}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Work log tab */}
                  {actTab === "worklog" && (
                    <div id="worklogList">
                      {task.timeLogs.length === 0 ? (
                        <p style={{ color: "var(--text-3)", fontSize: "0.85rem", padding: "12px 0" }}>Chưa có work log.</p>
                      ) : (
                        task.timeLogs.map((log) => (
                          <div key={log.id} className="act-hist-row">
                            <span className="hav">{initials(log.employee.fullName)}</span>
                            <div className="htxt">
                              <b>{log.employee.fullName}</b> ghi nhận <b>{fmtMin(log.durationMinutes)}</b>
                              {log.note ? ` — ${log.note}` : ""}
                              <span className="htime">{fmtDate(log.date)}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* History tab */}
                  {actTab === "history" && (
                    <div id="histList">
                      <div className="act-hist-row">
                        <span className="hav">{initials(task.assignedBy.fullName)}</span>
                        <div className="htxt">
                          <b>{task.assignedBy.fullName}</b> tạo task này
                          <span className="htime">{fmtDate(task.dateCreated)}</span>
                        </div>
                      </div>
                      {task.dateStarted && (
                        <div className="act-hist-row">
                          <span className="hav">{initials(task.assignedTo.fullName)}</span>
                          <div className="htxt">
                            <b>{task.assignedTo.fullName}</b> bắt đầu task
                            <span className="htime">{fmtDate(task.dateStarted)}</span>
                          </div>
                        </div>
                      )}
                      {task.dateCompleted && (
                        <div className="act-hist-row">
                          <span className="hav">{initials(task.assignedTo.fullName)}</span>
                          <div className="htxt">
                            <b>{task.assignedTo.fullName}</b> hoàn thành task
                            <span className="htime">{fmtDate(task.dateCompleted)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — meta sidebar */}
        <div className="tdp-right">
          <div className="tdp-meta-sec">Chi tiết</div>

          <div className="tdp-meta-row">
            <span className="ml">Trạng thái</span>
            <span className="mv">
              <select
                value={task.status}
                onChange={(e) => patchTask({ status: e.target.value })}
                disabled={saving}
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </span>
          </div>

          <div className="tdp-meta-row">
            <span className="ml">Ưu tiên</span>
            <span className="mv">
              <span className="prio-dot" style={{ background: PRIO_COLORS[task.priority] ?? "var(--text-3)" }}></span>
              {PRIO_LABEL[task.priority] ?? task.priority}
            </span>
          </div>

          <div className="tdp-meta-row">
            <span className="ml">Loại</span>
            <span className="mv">
              <span
                style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, background: typeColor, marginRight: 4 }}
              />
              {TASK_TYPE_LABEL[task.taskType] ?? task.taskType}
            </span>
          </div>

          <div className="tdp-meta-row">
            <span className="ml">Phụ trách</span>
            <span className="mv">
              <span className="av-sm" style={{ width: 22, height: 22, fontSize: "0.62rem" }}>
                {initials(task.assignedTo.fullName)}
              </span>
              {task.assignedTo.fullName}
            </span>
          </div>

          {task.support && (
            <div className="tdp-meta-row">
              <span className="ml">Hỗ trợ</span>
              <span className="mv">
                <span className="av-sm" style={{ width: 22, height: 22, fontSize: "0.62rem" }}>
                  {initials(task.support.fullName)}
                </span>
                {task.support.fullName}
              </span>
            </div>
          )}

          {customerLabel && (
            <div className="tdp-meta-row">
              <span className="ml">Khách hàng</span>
              <span className="mv">{customerLabel}</span>
            </div>
          )}

          {task.progressPct > 0 && (
            <div className="tdp-meta-row">
              <span className="ml">Tiến độ</span>
              <span className="mv">
                <div style={{ flex: 1, height: 6, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ width: task.progressPct + "%", height: "100%", background: "linear-gradient(90deg,var(--accent),var(--accent-2,#6366f1))", borderRadius: 99 }} />
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem" }}>{task.progressPct}%</span>
              </span>
            </div>
          )}

          {task.storyPoints && (
            <div className="tdp-meta-row">
              <span className="ml">Story Points</span>
              <span className="mv" style={{ fontWeight: 600, color: "var(--accent)" }}>{task.storyPoints} SP</span>
            </div>
          )}

          {task.estimatedTime && (
            <div className="tdp-meta-row">
              <span className="ml">Ước tính</span>
              <span className="mv">{fmtMin(task.estimatedTime)}</span>
            </div>
          )}

          {task.actualTimeTotal > 0 && (
            <div className="tdp-meta-row">
              <span className="ml">Thực tế</span>
              <span className="mv">{fmtMin(task.actualTimeTotal)}</span>
            </div>
          )}

          {task.dueDate && (
            <div className="tdp-meta-row">
              <span className="ml">Hạn</span>
              <span
                className="mv"
                style={task.isOverdue ? { color: "var(--warn)", fontWeight: 600 } : undefined}
              >
                {fmtDate(task.dueDate)}
              </span>
            </div>
          )}

          {task.billable && (
            <div className="tdp-meta-row">
              <span className="ml">Billable</span>
              <span className="mv" style={{ color: "var(--ok)", fontWeight: 600 }}>✓ Có tính phí</span>
            </div>
          )}

          {task.parentTask && (
            <div className="tdp-meta-row">
              <span className="ml">Parent</span>
              <span className="mv">
                <button
                  style={{ background: "none", border: "none", color: "var(--accent-ink)", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: "0.8rem", padding: 0 }}
                  onClick={() => router.push(`/tasks/${task.parentTask!.id}`)}
                >
                  {task.parentTask.code}
                </button>
              </span>
            </div>
          )}

          <div className="tdp-meta-row">
            <span className="ml">Sprint</span>
            <span className="mv">
              {task.sprint?.name ?? "—"}
              {isManager && (
                <button
                  style={{ marginLeft: 6, background: "none", border: "none", color: "var(--accent-ink)", fontSize: "0.75rem", cursor: "pointer", padding: 0 }}
                  onClick={async () => {
                    await loadSprints();
                    const names = sprints.map((s, i) => `${i + 1}. ${s.name}`).join("\n");
                    const input = prompt(`Chọn sprint (nhập số thứ tự):\n0. Không có sprint\n${names}`);
                    if (input === null) return;
                    const idx = Number(input);
                    const sprintId = idx === 0 ? null : sprints[idx - 1]?.id ?? undefined;
                    if (sprintId !== undefined || idx === 0) patchTask({ sprintId: sprintId ?? null });
                  }}
                >✎</button>
              )}
            </span>
          </div>

          {watchers.length > 0 && (
            <div className="tdp-meta-row">
              <span className="ml">Theo dõi</span>
              <span className="mv" style={{ flexWrap: "wrap", gap: 4 }}>
                {watchers.map((w) => (
                  <span key={w.employeeId} className="av-sm" title={w.employee.fullName}
                    style={{ width: 22, height: 22, fontSize: "0.62rem", flexShrink: 0 }}>
                    {w.employee.fullName.charAt(0).toUpperCase()}
                  </span>
                ))}
              </span>
            </div>
          )}

          {/* Recurrence */}
          {(recurrence || isManager) && (
            <div className="tdp-meta-row" style={{ alignItems: "flex-start" }}>
              <span className="ml" style={{ paddingTop: 2 }}>Lặp lại</span>
              <span className="mv" style={{ flex: 1 }}>
                <RecurrenceEditor
                  taskId={task.id}
                  recurrence={recurrence}
                  isManager={isManager}
                  onSaved={setRecurrence}
                />
              </span>
            </div>
          )}

          <div className="tdp-meta-sec" style={{ borderTop: "1px solid var(--border)" }}>Người tạo</div>

          <div className="tdp-meta-row">
            <span className="ml">Reporter</span>
            <span className="mv">
              <span className="av-sm" style={{ width: 22, height: 22, fontSize: "0.62rem" }}>
                {initials(task.assignedBy.fullName)}
              </span>
              {task.assignedBy.fullName}
            </span>
          </div>

          <div className="tdp-meta-row">
            <span className="ml">Tạo lúc</span>
            <span className="mv" style={{ fontSize: "0.78rem", color: "var(--text-3)" }}>
              {fmtDate(task.dateCreated)}
            </span>
          </div>

          <div style={{ padding: "14px 16px", borderTop: "1px solid var(--border)" }}>
            <button
              className="abtn ghost"
              style={{ width: "100%", color: "var(--danger)", borderColor: "rgba(239,68,68,0.3)" }}
              onClick={async () => {
                if (!confirm(`Xóa task ${task.code}?`)) return;
                const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
                if (res.ok) { router.refresh(); router.push("/tasks"); }
                else showToast("Lỗi khi xóa", false);
              }}
            >
              🗑 Xóa task
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`tasks-toast${toast.ok ? " ok" : " err"}`}
          onClick={() => setToast(null)}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
