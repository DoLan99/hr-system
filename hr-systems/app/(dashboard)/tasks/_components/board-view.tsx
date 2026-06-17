"use client";

import { useState } from "react";
import { Plus, Clock, AlertCircle } from "lucide-react";
import { DEFAULT_LABEL_CONFIG, type LabelConfig } from "@/lib/system-labels";
import { useLocale } from "@/lib/i18n/context";
import { TimerButton } from "@/components/tracking/timer-button";

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
  sprint?: { id: number; name: string; status: string } | null;
  _count: { timeLogs: number; subTasks: number };
};

type Props = {
  items: TaskItem[];
  onEdit: (task: TaskItem) => void;
  onStatusChange: (taskId: number, newStatus: string) => Promise<void>;
  onCreateInColumn: (status: string) => void;
  labelConfig?: LabelConfig;
  currentUserId: number;
};

const COLUMN_STATUSES = ["BACKLOG", "IN_PROGRESS", "REVIEW", "DONE", "BLOCKED"];

const COLUMN_META: Record<string, { dot: string; borderTop: string; columnBg: string; dotRing: string }> = {
  BACKLOG:     { dot: "bg-slate-400",   borderTop: "border-t-slate-400",   columnBg: "bg-slate-50/70",   dotRing: "ring-slate-200" },
  IN_PROGRESS: { dot: "bg-blue-500",    borderTop: "border-t-blue-500",    columnBg: "bg-blue-50/40",    dotRing: "ring-blue-200" },
  BLOCKED:     { dot: "bg-red-500",     borderTop: "border-t-red-500",     columnBg: "bg-red-50/30",     dotRing: "ring-red-100" },
  REVIEW:      { dot: "bg-amber-400",   borderTop: "border-t-amber-400",   columnBg: "bg-amber-50/30",   dotRing: "ring-amber-100" },
  DONE:        { dot: "bg-emerald-500", borderTop: "border-t-emerald-500", columnBg: "bg-emerald-50/30", dotRing: "ring-emerald-100" },
};

const PRIORITY_BORDER: Record<string, string> = {
  CRITICAL: "border-l-red-500",
  HIGH:     "border-l-orange-400",
  NORMAL:   "border-l-blue-400",
  LOW:      "border-l-slate-300",
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

function formatMin(min: number | null) {
  if (min === null || min === undefined) return "—";
  if (min < 60) return `${min}'`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h${m}'`;
}

export function BoardView({ items, onEdit, onStatusChange, onCreateInColumn, labelConfig: lc, currentUserId }: Props) {
  const labelConfig = lc ?? DEFAULT_LABEL_CONFIG;
  const { t } = useLocale();
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [loading, setLoading] = useState<number | null>(null);

  async function handleDrop(toStatus: string) {
    if (!draggingId) return;
    const task = items.find((tk) => tk.id === draggingId);
    if (!task || task.status === toStatus) {
      setDraggingId(null);
      setDropTarget(null);
      return;
    }
    setLoading(draggingId);
    await onStatusChange(draggingId, toStatus);
    setLoading(null);
    setDraggingId(null);
    setDropTarget(null);
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2" style={{ height: "calc(100vh - 220px)" }}>
      {COLUMN_STATUSES.map((status) => {
        const meta = COLUMN_META[status] ?? { dot: "bg-slate-400", borderTop: "border-t-slate-400", columnBg: "bg-slate-50/70", dotRing: "ring-slate-200" };
        const label = t(`taskStatus.${status}`) || labelConfig.taskStatus[status]?.label || status;
        const colTasks = items.filter((tk) => tk.status === status);
        const isDropTarget = dropTarget === status;

        return (
          <div
            key={status}
            className={`flex-shrink-0 w-[280px] flex flex-col rounded-xl border border-slate-200/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-all h-full ${
              isDropTarget ? "ring-2 ring-blue-400 ring-offset-2 shadow-md" : ""
            }`}
            onDragOver={(e) => { e.preventDefault(); setDropTarget(status); }}
            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropTarget(null); }}
            onDrop={(e) => { e.preventDefault(); handleDrop(status); }}
          >
            {/* Column Header */}
            <div className={`border-t-[3px] ${meta.borderTop} px-3 py-2.5 flex items-center justify-between bg-white`}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ring-2 ${meta.dot} ${meta.dotRing}`} />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide">{label}</span>
                {colTasks.length > 0 && (
                  <span className="text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full px-1.5 py-0.5 min-w-[20px] text-center leading-tight">
                    {colTasks.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => onCreateInColumn(status)}
                className="w-6 h-6 flex items-center justify-center rounded-md text-slate-400 dark:text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                title={`${t("tasks.createTask")} — ${label}`}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Cards Area */}
            <div
              className={`flex-1 px-2 py-2 space-y-2 overflow-y-auto transition-colors ${
                isDropTarget ? "bg-blue-50/60" : meta.columnBg
              }`}
              style={{ minHeight: 0 }}
            >
              {colTasks.map((task) => {
                const priorityBorder = PRIORITY_BORDER[task.priority] ?? "border-l-slate-300";
                const priorityDot = PRIORITY_DOT[task.priority] ?? "bg-slate-300";
                const isDragging = draggingId === task.id;
                const isLoading = loading === task.id;
                const typeCfg = labelConfig.taskType[task.taskType];
                const avatarGrad = AVATAR_GRADIENTS[task.assignedTo.id % AVATAR_GRADIENTS.length];

                return (
                  <div
                    key={task.id}
                    draggable={!isLoading}
                    onDragStart={(e) => { setDraggingId(task.id); e.dataTransfer.effectAllowed = "move"; }}
                    onDragEnd={() => { setDraggingId(null); setDropTarget(null); }}
                    onClick={() => onEdit(task)}
                    className={`bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 border-l-4 ${priorityBorder} p-3 cursor-pointer select-none transition-all group ${
                      isDragging ? "opacity-40 rotate-1 shadow-xl scale-105" : "hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300"
                    } ${isLoading ? "opacity-60 pointer-events-none" : ""}`}
                  >
                    {/* Top row: type badge + overdue + priority dot */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold leading-tight ${typeCfg?.color ?? "bg-slate-100 dark:bg-slate-800 text-slate-600"}`}>
                        {t(`taskType.${task.taskType}`) || typeCfg?.label || task.taskType}
                      </span>
                      <div className="flex items-center gap-1">
                        {task.isOverdue && <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0" />}
                        <div
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityDot}`}
                          title={t(`taskPriority.${task.priority}`) || task.priority}
                        />
                      </div>
                    </div>

                    {/* Title */}
                    <p className="text-[13px] font-medium text-slate-800 dark:text-slate-200 leading-snug line-clamp-2 mb-1 group-hover:text-blue-700 transition-colors">
                      {task.title}
                    </p>

                    {/* Code */}
                    <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mb-2">{task.code}</p>

                    {/* Customer + Sprint chips */}
                    {(task.customer || task.sprint) && (
                      <div className="mb-2 flex flex-wrap gap-1">
                        {task.customer && (
                          <span className="inline-flex items-center text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md px-1.5 py-0.5 max-w-full truncate">
                            {task.customer.businessName ?? task.customer.customerName}
                          </span>
                        )}
                        {task.sprint && (
                          <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-md max-w-full truncate"
                            style={{ background: "var(--accent-soft, #ede9fe)", color: "var(--accent-ink, #6d28d9)" }}>
                            ⚡ {task.sprint.name}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Progress bar */}
                    {task.progressPct > 0 && (
                      <div className="mb-2.5">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] text-slate-400">{task.progressPct}%</span>
                        </div>
                        <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              task.progressPct >= 100 ? "bg-emerald-500" : task.progressPct >= 60 ? "bg-blue-500" : "bg-amber-400"
                            }`}
                            style={{ width: `${Math.min(task.progressPct, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Bottom row: time + due + flags + timer + avatar */}
                    <div className="flex items-center justify-between gap-1 mt-1">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        {task.estimatedTime && (
                          <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                            <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                            {formatMin(task.estimatedTime)}
                          </span>
                        )}
                        {task.dueDate && (
                          <span className={`text-[10px] font-medium ${task.isOverdue ? "text-red-500" : "text-slate-400"}`}>
                            {new Date(task.dueDate).toLocaleDateString(undefined, { day: "2-digit", month: "2-digit" })}
                          </span>
                        )}
                        {task.billable && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 rounded px-1 leading-tight">€</span>
                        )}
                        {task.requiresVideo && <span className="text-[10px]">📹</span>}
                        {task._count.subTasks > 0 && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 rounded px-1">⊞{task._count.subTasks}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <TimerButton
                          taskId={task.id}
                          assigneeId={task.assignedTo.id}
                          currentUserId={currentUserId}
                          variant="compact"
                        />
                        <div
                          className={`w-6 h-6 rounded-full bg-gradient-to-br ${avatarGrad} flex items-center justify-center shadow-sm ring-1 ring-white`}
                          title={task.assignedTo.fullName}
                        >
                          <span className="text-[9px] font-bold text-white">
                            {task.assignedTo.fullName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Empty column */}
              {colTasks.length === 0 && (
                <button
                  onClick={() => onCreateInColumn(status)}
                  className={`w-full border-2 border-dashed rounded-lg py-5 flex flex-col items-center gap-1.5 transition-colors ${
                    isDropTarget
                      ? "border-blue-400 bg-blue-50 dark:bg-blue-950/40 text-blue-500"
                      : "border-slate-200 dark:border-slate-700 hover:border-blue-300 text-slate-300 hover:text-blue-400"
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-xs">{t("tasks.dragHere")}</span>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
