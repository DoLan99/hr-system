"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TaskCreateDrawer } from "./_components/task-create-drawer";
import { TaskDetailDrawer } from "./_components/task-detail-drawer";
import { DEFAULT_LABEL_CONFIG, type LabelConfig } from "@/lib/system-labels";
import { useLocale } from "@/lib/i18n/context";

/* ── types ─────────────────────────────────────────────────── */
type TaskItem = {
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
  isOverdue: boolean;
  reasonNextAction: string | null;
  dateCreated: string;
  assignedTo: { id: number; fullName: string; avatarUrl: string | null };
  assignedBy: { id: number; fullName: string };
  customer: { id: number; customerName: string | null; businessName: string | null } | null;
  template: { id: number; code: string; title: string } | null;
  _count: { timeLogs: number; subTasks: number };
};

type Props = {
  initialItems: TaskItem[];
  employees: { id: number; fullName: string; department: string | null }[];
  customers: { id: number; customerName: string | null; businessName: string | null }[];
  templates: any[];
  sprints: { id: number; name: string; status: string }[];
  currentUserId: number;
  isManager: boolean;
  labelConfig?: LabelConfig;
};

/* ── helpers ────────────────────────────────────────────────── */
function formatMin(min: number | null) {
  if (min === null || min === undefined) return "—";
  if (min < 60) return `${min}'`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h${m}'`;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/* Status → board column mapping */
const STATUS_TO_COL: Record<string, string> = {
  BACKLOG: "Backlog",
  TODO: "Backlog",
  IN_PROGRESS: "In Progress",
  REVIEW: "Testing",
  DONE: "Done",
  BLOCKED: "Blocked",
};

const COL_TO_STATUS: Record<string, string[]> = {
  Backlog: ["BACKLOG", "TODO"],
  "In Progress": ["IN_PROGRESS"],
  Testing: ["REVIEW"],
  Done: ["DONE"],
  Blocked: ["BLOCKED"],
};

const COLS: { label: string; cls: string; createStatus: string }[] = [
  { label: "Backlog",     cls: "backlogc",   createStatus: "BACKLOG" },
  { label: "In Progress", cls: "progressc",  createStatus: "IN_PROGRESS" },
  { label: "Testing",     cls: "reviewc",    createStatus: "REVIEW" },
  { label: "Done",        cls: "donec",      createStatus: "DONE" },
  { label: "Blocked",     cls: "blockedc",   createStatus: "BLOCKED" },
];

/* Priority → template class and label */
const PRIO_MAP: Record<string, { cls: "hi" | "md" | "lo"; label: string }> = {
  CRITICAL: { cls: "hi", label: "Cao" },
  HIGH:     { cls: "hi", label: "Cao" },
  NORMAL:   { cls: "md", label: "Vừa" },
  LOW:      { cls: "lo", label: "Thấp" },
};

/* Task type → label */
const TASK_TYPE_LABEL: Record<string, string> = {
  NORMAL: "Thông thường",
  LEARNING: "Học tập",
  NEW_RESEARCH: "Nghiên cứu",
  MEETING: "Họp",
  ADMIN: "Hành chính",
  BILLABLE_CLIENT: "Khách hàng",
  INTERNAL: "Nội bộ",
};

/* Status chip colors for list view */
const STATUS_CHIP: Record<string, string> = {
  Backlog:      "status todo",
  "In Progress":"status doing",
  Testing:      "status pending",
  Done:         "status done",
  Blocked:      "status blocked",
};

/* SVG icons (inline, minimal) */
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/>
  </svg>
);
const BoardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="5" height="16" rx="1"/><rect x="10" y="4" width="5" height="11" rx="1"/><rect x="17" y="4" width="4" height="14" rx="1"/>
  </svg>
);
const ListIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
  </svg>
);
const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);
const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" strokeLinecap="round"/>
  </svg>
);
const AssigneeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeLinecap="round"/>
  </svg>
);
const FilterIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 5h18l-7 8v6l-4 2v-8z"/>
  </svg>
);

const PRIO_DOTS: Record<string, { count: number; color: string }> = {
  CRITICAL: { count: 4, color: "var(--danger)" },
  HIGH:     { count: 3, color: "#f97316" },
  NORMAL:   { count: 2, color: "var(--accent)" },
  LOW:      { count: 1, color: "var(--text-3)" },
};

const TYPE_COLOR: Record<string, string> = {
  NORMAL:        "#3B5BDB",
  LEARNING:      "#8b5cf6",
  NEW_RESEARCH:  "#06b6d4",
  MEETING:       "#f59e0b",
  ADMIN:         "#94a3b8",
  BILLABLE_CLIENT: "#22c55e",
  INTERNAL:      "#64748b",
};

const STATUSES_VI: { value: string; label: string }[] = [
  { value: "BACKLOG",     label: "Backlog" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "BLOCKED",     label: "Blocked" },
  { value: "REVIEW",      label: "Testing" },
  { value: "DONE",        label: "Done" },
  { value: "CANCELLED",   label: "Cancelled" },
];

/* ── Task Card ──────────────────────────────────────────────── */
function TaskCard({ task, onOpen, onDragStart, onStatusChange }: {
  task: TaskItem;
  onOpen: (t: TaskItem) => void;
  onDragStart: (id: number) => void;
  onStatusChange: (taskId: number, newStatus: string) => void;
}) {
  const router = useRouter();
  const dot = PRIO_DOTS[task.priority] ?? PRIO_DOTS.NORMAL;
  const due = task.dueDate ? new Date(task.dueDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }) : null;
  const customerLabel = task.customer ? (task.customer.businessName ?? task.customer.customerName) : null;
  const typeColor = TYPE_COLOR[task.taskType] ?? "#3B5BDB";

  const [menuOpen, setMenuOpen] = useState(false);
  const [statusSub, setStatusSub] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function close(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false); setStatusSub(false);
      }
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setMenuOpen(false);
  }

  return (
    <div
      className="tcard"
      draggable="true"
      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; onDragStart(task.id); }}
    >
      {/* Three-dot menu button */}
      <div className="tc-menu-wrap" ref={menuRef} onClick={(e) => e.stopPropagation()}>
        <button
          className="tc-more"
          title="Thêm tùy chọn"
          onMouseDown={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); setStatusSub(false); }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
          </svg>
        </button>

        {menuOpen && (
          <div className="tc-dropdown">
            <button className="tc-dd-item" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); router.refresh(); router.push(`/tasks/${task.id}`); }}>
              Xem chi tiết
            </button>
            <div className="tc-dd-sep" />
            <div
              className="tc-dd-item has-sub"
              onMouseEnter={() => setStatusSub(true)}
              onMouseLeave={() => setStatusSub(false)}
            >
              <span>Đổi trạng thái</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><path d="M9 18l6-6-6-6"/></svg>
              {statusSub && (
                <div className="tc-sub-menu">
                  {STATUSES_VI.filter((s) => s.value !== task.status).map((s) => (
                    <button
                      key={s.value}
                      className="tc-dd-item"
                      onClick={(e) => { e.stopPropagation(); onStatusChange(task.id, s.value); setMenuOpen(false); setStatusSub(false); }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="tc-dd-sep" />
            <button className="tc-dd-item" onClick={(e) => { e.stopPropagation(); copyToClipboard(task.code); }}>
              Sao chép key
            </button>
            <button className="tc-dd-item" onClick={(e) => { e.stopPropagation(); copyToClipboard(`${window.location.origin}/tasks?task=${task.id}`); }}>
              Sao chép link
            </button>
          </div>
        )}
      </div>

      {/* Title — click opens drawer */}
      <div className="tc-title" onClick={() => onOpen(task)} style={{ cursor: "pointer" }}>{task.title}</div>

      {/* Chips: customer + type */}
      <div className="tc-tags">
        {customerLabel && (
          <span className="ttag customer">{customerLabel}</span>
        )}
        <span className="ttag type" style={{ background: typeColor + "22", color: typeColor, borderColor: typeColor + "55" }}>
          {TASK_TYPE_LABEL[task.taskType] ?? task.taskType}
        </span>
        {task.billable && <span className="ttag alt">Billable</span>}
        {task.requiresVideo && <span className="ttag alt">Video</span>}
      </div>

      {/* Status */}
      <div className="tc-status">{task.status.replace("_", " ")}</div>

      {/* Progress bar */}
      {task.progressPct > 0 && (
        <div className="progress">
          <i style={{ width: `${task.progressPct}%` }} />
        </div>
      )}

      {/* Footer: priority dots + code + due + avatar */}
      <div className="tc-foot">
        <div className="tc-prio-dots">
          {Array.from({ length: dot.count }).map((_, i) => (
            <span key={i} className="pdot" style={{ background: dot.color }} />
          ))}
          {Array.from({ length: 4 - dot.count }).map((_, i) => (
            <span key={i} className="pdot empty" />
          ))}
        </div>
        <span className="tid">{task.code}</span>
        {due && (
          <span className={`meta-i${task.isOverdue ? " due-soon" : ""}`} style={{ marginLeft: "auto" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 11, height: 11 }}>
              <rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round"/>
            </svg>
            {due}
          </span>
        )}
        <span className="av-sm" title={task.assignedTo.fullName} style={due ? undefined : { marginLeft: "auto" }}>
          {initials(task.assignedTo.fullName)}
        </span>
      </div>
    </div>
  );
}

/* ── Board Column ───────────────────────────────────────────── */
function BoardColumn({
  col,
  tasks,
  onOpen,
  onAddTask,
  onCardDragStart,
  onDropTask,
  onStatusChange,
}: {
  col: typeof COLS[number];
  tasks: TaskItem[];
  onOpen: (t: TaskItem) => void;
  onAddTask: (status: string) => void;
  onCardDragStart: (id: number) => void;
  onDropTask: (status: string) => void;
  onStatusChange: (taskId: number, newStatus: string) => void;
}) {
  const [dragOver, setDragOver] = useState(false);

  return (
    <section
      className={`kcol ${col.cls}${dragOver ? " drag-over" : ""}`}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); onDropTask(col.createStatus); }}
    >
      <div className="kcol-head">
        <span className="cdot" />
        <span className="cname">{col.label}</span>
        <span className="ccount">{tasks.length}</span>
        <button
          className="cadd"
          aria-label="Thêm task"
          onClick={() => onAddTask(col.createStatus)}
        >
          <PlusIcon />
        </button>
      </div>
      <div className="kcol-body">
        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} onOpen={onOpen} onDragStart={onCardDragStart} onStatusChange={onStatusChange} />
        ))}
        <button
          className="col-add-task"
          onClick={() => onAddTask(col.createStatus)}
        >
          <PlusIcon />Thêm task
        </button>
      </div>
    </section>
  );
}

/* ── Main Client Component ──────────────────────────────────── */
export function TasksClient({
  initialItems,
  employees,
  customers,
  templates,
  sprints,
  currentUserId,
  isManager,
  labelConfig: lc,
}: Props) {
  const labelConfig = lc ?? DEFAULT_LABEL_CONFIG;
  const { t } = useLocale();

  const [items, setItems] = useState(initialItems);
  const [view, setView] = useState<"board" | "list">("board");
  const [search, setSearch] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterType, setFilterType] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [initialStatus, setInitialStatus] = useState("BACKLOG");
  const [drawerTaskId, setDrawerTaskId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const dragTaskId = useRef<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string, ok = true) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, ok });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }

  /* derived stats */
  const activeCount = useMemo(
    () => items.filter((i) => ["IN_PROGRESS", "BLOCKED", "REVIEW"].includes(i.status)).length,
    [items]
  );
  const todayDue = useMemo(() => {
    const today = new Date().toDateString();
    return items.filter((i) => i.dueDate && new Date(i.dueDate).toDateString() === today).length;
  }, [items]);

  /* filtered items */
  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (filterAssignee && String(item.assignedTo.id) !== filterAssignee) return false;
      if (filterType && item.taskType !== filterType) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !item.code.toLowerCase().includes(q) &&
          !item.title.toLowerCase().includes(q) &&
          !(item.customer?.businessName ?? item.customer?.customerName ?? "").toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [items, search, filterAssignee, filterType]);

  /* group by column */
  const grouped = useMemo(() => {
    const map: Record<string, TaskItem[]> = {};
    for (const col of COLS) map[col.label] = [];
    for (const t of filtered) {
      const col = STATUS_TO_COL[t.status] ?? "Backlog";
      map[col]?.push(t);
    }
    return map;
  }, [filtered]);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/tasks").then((r) => r.json());
    setItems(res.data ?? []);
  }, []);

  function openCreate(status = "BACKLOG") {
    setInitialStatus(status);
    setCreateOpen(true);
  }

  function openDetail(task: TaskItem) {
    setDrawerTaskId(task.id);
    setDrawerOpen(true);
  }

  async function changeStatus(taskId: number, newStatus: string) {
    const task = items.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;
    setItems((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatus } : t));
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const colLabel = COLS.find((c) => c.createStatus === newStatus)?.label ?? newStatus;
      showToast(`✓ ${task.code} → ${colLabel}`);
    } else {
      setItems((prev) => prev.map((t) => t.id === taskId ? { ...t, status: task.status } : t));
      showToast("Lỗi khi cập nhật trạng thái", false);
    }
  }

  async function dropToColumn(newStatus: string) {
    const id = dragTaskId.current;
    if (!id) return;
    dragTaskId.current = null;
    await changeStatus(id, newStatus);
  }

  /* ── render ──────────────────────────────────────────────── */
  return (
    <div className="tasks-page">
      {/* Toast notification */}
      {toast && (
        <div className={`tasks-toast${toast.ok ? " ok" : " err"}`} onClick={() => setToast(null)}>
          {toast.msg}
        </div>
      )}
      {/* ── Page Header ── */}
      <div className="page-head" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1>Công việc</h1>
          <p>
            {activeCount} task đang hoạt động
            {todayDue > 0 && <> · <b>{todayDue}</b> đến hạn hôm nay</>}
          </p>
        </div>
        <button className="abtn primary" onClick={() => openCreate()}>
          <PlusIcon />Tạo task
        </button>
      </div>

      {/* ── Toolbar ── */}
      <div className="tools">
        {/* Board / List toggle */}
        <div className="seg">
          <button
            className={view === "board" ? "on" : ""}
            onClick={() => setView("board")}
          >
            <BoardIcon />Board
          </button>
          <button
            className={view === "list" ? "on" : ""}
            onClick={() => setView("list")}
          >
            <ListIcon />List
          </button>
        </div>

        {/* Assignee filter chip (manager only) */}
        {isManager && employees.length > 0 && (
          <div className="fchip" style={{ padding: 0, overflow: "hidden" }}>
            <AssigneeIcon />
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              style={{ background: "transparent", border: "none", color: "inherit", fontFamily: "inherit", fontSize: "0.82rem", padding: "0 8px 0 2px", cursor: "pointer", outline: "none" }}
            >
              <option value="">Người phụ trách</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.fullName}</option>
              ))}
            </select>
          </div>
        )}

        {/* Task type filter chip */}
        <div className="fchip" style={{ padding: 0, overflow: "hidden" }}>
          <FilterIcon />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ background: "transparent", border: "none", color: "inherit", fontFamily: "inherit", fontSize: "0.82rem", padding: "0 8px 0 2px", cursor: "pointer", outline: "none" }}
          >
            <option value="">Loại task</option>
            {Object.entries(TASK_TYPE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="spacer" />

        {/* Quick search */}
        <div className="tsearch">
          <SearchIcon />
          <input
            type="text"
            placeholder="Lọc nhanh…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Board / List wrap ── */}
      <div className="tasks-board-wrap">

      {/* ── Board view ── */}
      {view === "board" && (
        <div className="board" id="board">
          {COLS.map((col) => (
            <BoardColumn
              key={col.label}
              col={col}
              tasks={grouped[col.label] ?? []}
              onOpen={openDetail}
              onAddTask={openCreate}
              onCardDragStart={(id) => { dragTaskId.current = id; }}
              onDropTask={dropToColumn}
              onStatusChange={changeStatus}
            />
          ))}
        </div>
      )}

      {/* ── List view ── */}
      {view === "list" && (
        <div id="listWrap">
          <table className="dtable">
            <thead>
              <tr>
                <th>Task</th>
                <th>Trạng thái</th>
                <th>Ưu tiên</th>
                <th>Người phụ trách</th>
                <th>Ước tính</th>
                <th>Hạn</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "48px 0", color: "var(--text-3)" }}>
                    Không có task nào
                  </td>
                </tr>
              )}
              {COLS.map((col) =>
                (grouped[col.label] ?? []).map((task) => {
                  const prio = PRIO_MAP[task.priority] ?? { cls: "md" as const, label: task.priority };
                  const due = task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString("vi-VN")
                    : "—";
                  return (
                    <tr key={task.id}>
                      <td>
                        <div className="lt-id">{task.code}</div>
                        <div className="lt-title">
                          <button
                            onClick={() => openDetail(task)}
                            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 0, textAlign: "left", fontFamily: "inherit", fontSize: "inherit" }}
                          >
                            {task.title}
                          </button>
                        </div>
                      </td>
                      <td>
                        <span className={STATUS_CHIP[col.label] ?? "status"}>
                          {col.label}
                        </span>
                      </td>
                      <td>
                        <span className={`lt-prio ${prio.cls}`}>
                          <i />{prio.label}
                        </span>
                      </td>
                      <td>
                        <span className="lt-who">
                          <span className="av-sm">{initials(task.assignedTo.fullName)}</span>
                          {task.assignedTo.fullName}
                        </span>
                      </td>
                      <td>{formatMin(task.estimatedTime)}</td>
                      <td className={task.isOverdue ? "due-soon" : ""}>{due}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      </div>{/* end tasks-board-wrap */}

      {/* ── Drawers ── */}
      <TaskCreateDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        employees={employees}
        customers={customers}
        templates={templates}
        sprints={sprints}
        currentUserId={currentUserId}
        isManager={isManager}
        initialStatus={initialStatus}
        onSaved={() => {
          setCreateOpen(false);
          refresh();
        }}
      />

      <TaskDetailDrawer
        taskId={drawerTaskId}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        employees={employees}
        customers={customers}
        isManager={isManager}
        onSaved={refresh}
        onOpenTask={(id) => setDrawerTaskId(id)}
      />
    </div>
  );
}
