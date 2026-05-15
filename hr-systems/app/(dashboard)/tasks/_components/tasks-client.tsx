"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { TaskCreateDrawer } from "./task-create-drawer";
import { TaskDetailDrawer } from "./task-detail-drawer";
import { BoardView } from "./board-view";
import { SummaryView } from "./summary-view";
import { DEFAULT_LABEL_CONFIG, type LabelConfig } from "@/lib/system-labels";
import { useLocale } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

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
  currentUserId: number;
  isManager: boolean;
  labelConfig?: LabelConfig;
};

function formatMin(min: number | null) {
  if (min === null || min === undefined) return "—";
  if (min < 60) return `${min}'`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h${m}'`;
}

type View = "summary" | "board" | "list";

const PRIORITIES = ["CRITICAL", "HIGH", "NORMAL", "LOW"];
const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-700 border-red-200",
  HIGH: "bg-orange-100 text-orange-700 border-orange-200",
  NORMAL: "bg-slate-100 text-slate-600 border-slate-200",
  LOW: "bg-slate-50 text-slate-400 border-slate-200",
};

export function TasksClient({ initialItems, employees, customers, templates, currentUserId, isManager, labelConfig: lc }: Props) {
  const labelConfig = lc ?? DEFAULT_LABEL_CONFIG;
  const { t } = useLocale();
  const activeCount = useMemo(() => initialItems.filter(i => ["IN_PROGRESS", "BLOCKED", "REVIEW"].includes(i.status)).length, [initialItems]);

  const TABS: { id: View; label: string }[] = [
    { id: "summary", label: t("tasks.overview") },
    { id: "board", label: t("tasks.board") },
    { id: "list", label: t("tasks.list") },
  ];

  const [items, setItems] = useState(initialItems);
  const [activeView, setActiveView] = useState<View>("summary");
  const [filter, setFilter] = useState({ search: "", taskType: "", priority: "", assigneeId: "" });
  const [filterOpen, setFilterOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [initialStatus, setInitialStatus] = useState("IN_PROGRESS");
  const [drawerTaskId, setDrawerTaskId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (filter.taskType && item.taskType !== filter.taskType) return false;
      if (filter.priority && item.priority !== filter.priority) return false;
      if (filter.assigneeId && String(item.assignedTo.id) !== filter.assigneeId) return false;
      if (filter.search) {
        const q = filter.search.toLowerCase();
        const matchCode = item.code.toLowerCase().includes(q);
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchCustomer = (item.customer?.businessName ?? item.customer?.customerName ?? "").toLowerCase().includes(q);
        if (!matchCode && !matchTitle && !matchCustomer) return false;
      }
      return true;
    });
  }, [items, filter]);

  const activeFilterCount = [filter.taskType, filter.priority, filter.assigneeId, filter.search].filter(Boolean).length;

  function clearFilters() {
    setFilter({ search: "", taskType: "", priority: "", assigneeId: "" });
  }

  async function refresh() {
    const res = await fetch("/api/tasks").then((r) => r.json());
    setItems(res.data ?? []);
  }

  async function handleStatusChange(taskId: number, newStatus: string) {
    await fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    await refresh();
  }

  function openCreate(status = "IN_PROGRESS") {
    setInitialStatus(status);
    setCreateOpen(true);
  }

  function openEdit(task: TaskItem) {
    setDrawerTaskId(task.id);
    setDrawerOpen(true);
  }

  return (
    <div className="space-y-0">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t("tasks.title")}</h1>
          <p className="text-sm text-slate-500">{t("tasks.subtitle")} · {t("tasks.activeCount", { count: activeCount })}</p>
        </div>
        <button
          onClick={() => openCreate()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
        >
          <span className="text-base leading-none">+</span> {t("tasks.createTask")}
        </button>
      </div>

      {/* Tab Bar + Filter Toggle */}
      <div className="flex items-center border-b border-slate-200 mb-0">
        <div className="flex items-center gap-0.5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                activeView === tab.id ? "text-blue-700" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.label}
              {activeView === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
              )}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2 pb-1">
          <button
            onClick={() => setFilterOpen(v => !v)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors",
              filterOpen || activeFilterCount > 0
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {t("common.filter")}
            {activeFilterCount > 0 && (
              <span className="bg-blue-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      {filterOpen && (
        <div className="bg-white border border-slate-200 border-t-0 rounded-b-xl px-4 py-3 flex flex-wrap items-center gap-3 mb-0">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder={t("common.search")}
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          {/* Task Type */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs text-slate-500 font-medium shrink-0">{t("common.type")}:</span>
            {["", ...Object.keys(labelConfig.taskType)].map((k) => {
              const label = k === "" ? t("common.all") : t(`taskType.${k}`) || k;
              return (
                <button key={k} onClick={() => setFilter({ ...filter, taskType: k })}
                  className={cn("px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors",
                    filter.taskType === k
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                  )}>
                  {label}
                </button>
              );
            })}
          </div>

          {/* Priority */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs text-slate-500 font-medium shrink-0">{t("common.priority")}:</span>
            {["", ...PRIORITIES].map((p) => {
              const label = p === "" ? t("common.all") : t(`taskPriority.${p}`) || p;
              return (
                <button key={p} onClick={() => setFilter({ ...filter, priority: p })}
                  className={cn("px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors",
                    filter.priority === p
                      ? "bg-blue-600 text-white border-blue-600"
                      : cn("bg-white border", p ? PRIORITY_COLORS[p] : "text-slate-600 border-slate-200 hover:border-slate-300")
                  )}>
                  {label}
                </button>
              );
            })}
          </div>

          {/* Assignee (manager only) */}
          {isManager && employees.length > 0 && (
            <select
              value={filter.assigneeId}
              onChange={(e) => setFilter({ ...filter, assigneeId: e.target.value })}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-200 text-slate-600"
            >
              <option value="">{t("common.assignedTo")}: {t("common.all")}</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.fullName}</option>
              ))}
            </select>
          )}

          {/* Clear & count */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-slate-400">{filtered.length} / {items.length}</span>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 transition-colors">
                <X className="w-3 h-3" /> {t("common.reset")}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Views */}
      <div className="mt-4">
        {activeView === "summary" && <SummaryView items={filtered} labelConfig={labelConfig} />}

        {activeView === "board" && (
          <BoardView
            items={filtered}
            onEdit={openEdit}
            onStatusChange={handleStatusChange}
            onCreateInColumn={openCreate}
            labelConfig={labelConfig}
          />
        )}

        {activeView === "list" && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-left border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5 font-medium text-xs uppercase tracking-wide text-slate-500">Code</th>
                  <th className="px-3 py-2.5 font-medium text-xs uppercase tracking-wide text-slate-500">{t("common.title")}</th>
                  <th className="px-3 py-2.5 font-medium text-xs uppercase tracking-wide text-slate-500">{t("common.type")}</th>
                  <th className="px-3 py-2.5 font-medium text-xs uppercase tracking-wide text-slate-500">{t("common.priority")}</th>
                  <th className="px-3 py-2.5 font-medium text-xs uppercase tracking-wide text-slate-500">{t("common.status")}</th>
                  <th className="px-3 py-2.5 font-medium text-xs uppercase tracking-wide text-slate-500">Est / Actual</th>
                  <th className="px-3 py-2.5 font-medium text-xs uppercase tracking-wide text-slate-500">{t("common.assignedTo")}</th>
                  <th className="px-3 py-2.5 font-medium text-xs uppercase tracking-wide text-slate-500">{t("tasks.dueDate")}</th>
                  <th className="px-3 py-2.5 font-medium text-xs uppercase tracking-wide text-slate-500 text-right">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-3 py-12 text-center text-slate-400 text-sm">
                      {t("tasks.noTasks")}
                    </td>
                  </tr>
                )}
                {filtered.map((task) => (
                  <tr key={task.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2.5 font-mono text-xs text-slate-400">
                      <button onClick={() => openEdit(task)} className="hover:text-blue-600 hover:underline">
                        {task.code}
                      </button>
                    </td>
                    <td className="px-3 py-2.5 max-w-xs">
                      <div className="flex items-center gap-1.5">
                        {task.billable && <span className="text-[10px] text-emerald-600 font-bold border border-emerald-200 bg-emerald-50 rounded px-1">€</span>}
                        {task.requiresVideo && <span className="text-[10px]">📹</span>}
                        <button onClick={() => openEdit(task)} className="text-slate-800 hover:text-blue-600 text-left truncate font-medium">
                          {task.title}
                        </button>
                      </div>
                      {task.customer && (
                        <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                          {task.customer.businessName ?? task.customer.customerName}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      {(() => {
                        const cfg = labelConfig.taskType[task.taskType];
                        return (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${cfg?.color ?? "bg-slate-100 text-slate-700"}`}>
                            {t(`taskType.${task.taskType}`) || cfg?.label || task.taskType}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-3 py-2.5">
                      {(() => {
                        const cfg = labelConfig.taskPriority[task.priority];
                        return (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${cfg?.color ?? "bg-slate-100 text-slate-700"}`}>
                            {t(`taskPriority.${task.priority}`) || cfg?.label || task.priority}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-3 py-2.5">
                      {(() => {
                        const cfg = labelConfig.taskStatus[task.status];
                        return (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${cfg?.color ?? "bg-slate-100 text-slate-700"}`}>
                            {t(`taskStatus.${task.status}`) || cfg?.label || task.status}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-500">
                      {formatMin(task.estimatedTime)} /&nbsp;
                      <span className={task.estimatedTime && task.actualTimeTotal > task.estimatedTime ? "text-red-500 font-medium" : ""}>
                        {formatMin(task.actualTimeTotal)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0 text-[9px] font-bold text-white">
                          {task.assignedTo.fullName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-slate-600 text-xs">{task.assignedTo.fullName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-xs">
                      {task.dueDate ? (
                        <span className={task.isOverdue ? "text-red-500 font-medium" : "text-slate-500"}>
                          {task.isOverdue && "⚠ "}
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="inline-flex gap-1">
                        {task.status !== "DONE" && task.status !== "CANCELLED" && (
                          <Link href={`/time-logs?taskId=${task.id}`}
                            className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md hover:bg-emerald-100 font-medium">
                            Log
                          </Link>
                        )}
                        <button onClick={() => openEdit(task)}
                          className="text-xs px-2 py-1 text-slate-500 hover:bg-slate-100 rounded-md">
                          ✎
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create drawer (new tasks) */}
      <TaskCreateDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        employees={employees}
        customers={customers}
        templates={templates}
        currentUserId={currentUserId}
        isManager={isManager}
        initialStatus={initialStatus}
        onSaved={() => {
          setCreateOpen(false);
          refresh();
        }}
      />

      {/* Detail drawer (view/edit existing tasks) */}
      <TaskDetailDrawer
        taskId={drawerTaskId}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        employees={employees}
        customers={customers}
        isManager={isManager}
        labelConfig={labelConfig}
        onSaved={refresh}
        onOpenTask={(id) => setDrawerTaskId(id)}
      />
    </div>
  );
}
