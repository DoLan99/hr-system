"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { DEFAULT_LABEL_CONFIG, type LabelConfig } from "@/lib/system-labels";
import { useLocale } from "@/lib/i18n/context";

type TaskItem = {
  id: number;
  code: string;
  title: string;
  taskType: string;
  priority: string;
  status: string;
  isOverdue: boolean;
  dateCreated: string;
  dueDate: string | null;
  assignedTo: { id: number; fullName: string; avatarUrl: string | null };
};

const STATUS_DOT_COLOR: Record<string, string> = {
  BACKLOG: "#94a3b8",
  IN_PROGRESS: "#3b82f6",
  BLOCKED: "#ef4444",
  REVIEW: "#f59e0b",
  DONE: "#10b981",
  CANCELLED: "#6b7280",
};

const PRIORITY_DOT_COLOR: Record<string, string> = {
  CRITICAL: "#ef4444",
  HIGH: "#f97316",
  NORMAL: "#3b82f6",
  LOW: "#94a3b8",
};

export function SummaryView({ items, labelConfig: lc }: { items: TaskItem[]; labelConfig?: LabelConfig }) {
  const labelConfig = lc ?? DEFAULT_LABEL_CONFIG;
  const { t } = useLocale();

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t("tasks.justNow");
    if (mins < 60) return t("tasks.minutesAgo", { n: mins });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return t("tasks.hoursAgo", { n: hours });
    const days = Math.floor(hours / 24);
    return t("tasks.daysAgo", { n: days });
  }

  const stats = useMemo(() => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const now = new Date();

    const total = items.length;
    const done = items.filter((t) => t.status === "DONE").length;
    const active = items.filter((t) => ["IN_PROGRESS", "BLOCKED", "REVIEW"].includes(t.status)).length;
    const overdue = items.filter((t) => t.isOverdue).length;
    const createdThisWeek = items.filter((t) => new Date(t.dateCreated) >= sevenDaysAgo).length;
    const dueSoon = items.filter((t) => {
      if (!t.dueDate || ["DONE", "CANCELLED"].includes(t.status)) return false;
      const due = new Date(t.dueDate);
      return due >= now && due <= sevenDaysLater;
    }).length;

    const statusData = Object.keys(labelConfig.taskStatus)
      .map((status) => ({
        status,
        label: t(`taskStatus.${status}`) || labelConfig.taskStatus[status]?.label || status,
        color: STATUS_DOT_COLOR[status] ?? "#94a3b8",
        count: items.filter((item) => item.status === status).length,
      }))
      .filter((d) => d.count > 0);

    const priorityData = Object.keys(labelConfig.taskPriority).map((priority) => ({
      priority,
      label: t(`taskPriority.${priority}`) || labelConfig.taskPriority[priority]?.label || priority,
      color: PRIORITY_DOT_COLOR[priority] ?? "#94a3b8",
      count: items.filter((item) => item.priority === priority).length,
    }));
    const maxPriority = Math.max(...priorityData.map((d) => d.count), 1);

    const typeData = Object.keys(labelConfig.taskType)
      .map((type) => ({
        type,
        label: t(`taskType.${type}`) || labelConfig.taskType[type]?.label || type,
        count: items.filter((item) => item.taskType === type).length,
      }))
      .filter((d) => d.count > 0)
      .sort((a, b) => b.count - a.count);
    const maxType = Math.max(...typeData.map((d) => d.count), 1);

    const recent = [...items]
      .sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime())
      .slice(0, 8);

    return { total, done, active, overdue, createdThisWeek, dueSoon, statusData, priorityData, maxPriority, typeData, maxType, recent };
  }, [items, labelConfig]);

  return (
    <div className="space-y-5">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard value={stats.done} label={t("tasks.done")} sub={t("tasks.doneSub")} color="text-emerald-600" />
        <StatCard value={stats.active} label={t("tasks.active")} sub={t("tasks.activeSub")} color="text-blue-600" />
        <StatCard value={stats.createdThisWeek} label={t("tasks.createdThisWeek")} sub={t("tasks.createdThisWeekSub")} color="text-slate-700" />
        <StatCard
          value={stats.dueSoon}
          label={t("tasks.dueSoon")}
          sub={t("tasks.dueSoonSub")}
          color={stats.dueSoon > 0 ? "text-amber-600" : "text-slate-700"}
        />
      </div>

      {/* Status Overview + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700">{t("tasks.statusOverview")}</h3>
          <p className="text-xs text-slate-400 mt-0.5 mb-4">{t("tasks.statusOverviewSub")}</p>
          {stats.total === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">{t("tasks.noTasks")}</p>
          ) : (
            <div className="flex items-center gap-6">
              <div className="relative w-36 h-36 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={66} dataKey="count" strokeWidth={2}>
                      {stats.statusData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, _n, p) => [v, p.payload.label]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold text-slate-800">{stats.total}</span>
                  <span className="text-[10px] text-slate-500">{t("tasks.total")}</span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                {stats.statusData.map((d) => (
                  <div key={d.status} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-xs text-slate-600 flex-1">{d.label}</span>
                    <span className="text-xs font-semibold text-slate-800">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700">{t("tasks.recentActivity")}</h3>
          <p className="text-xs text-slate-400 mt-0.5 mb-4">{t("tasks.recentActivitySub")}</p>
          <div className="space-y-3">
            {stats.recent.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">{t("tasks.noActivity")}</p>
            ) : (
              stats.recent.map((task) => (
                <div key={task.id} className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[10px] font-semibold text-blue-700">
                      {task.assignedTo.fullName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      <span className="font-medium text-slate-800">{task.assignedTo.fullName}</span>
                      {` ${t("tasks.createdBy")} `}
                      <span className="font-mono font-medium text-blue-700">{task.code}</span>
                      {": "}
                      <span className="text-slate-500">{task.title}</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{timeAgo(task.dateCreated)}</p>
                  </div>
                  {(() => {
                    const cfg = labelConfig.taskStatus[task.status];
                    return (
                      <span className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded font-medium ${cfg?.color ?? "bg-slate-100 text-slate-600"}`}>
                        {t(`taskStatus.${task.status}`) || cfg?.label || task.status}
                      </span>
                    );
                  })()}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Priority + Type Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700">{t("tasks.priorityBreakdown")}</h3>
          <p className="text-xs text-slate-400 mt-0.5 mb-4">{t("tasks.priorityBreakdownSub")}</p>
          <div className="space-y-3">
            {stats.priorityData.map((d) => (
              <div key={d.priority} className="flex items-center gap-3">
                <span className="text-xs text-slate-600 w-16 flex-shrink-0">{d.label}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(d.count / stats.maxPriority) * 100}%`, backgroundColor: d.color }}
                  />
                </div>
                <span className="text-xs font-medium text-slate-700 w-4 text-right">{d.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700">{t("tasks.taskTypeBreakdown")}</h3>
          <p className="text-xs text-slate-400 mt-0.5 mb-4">{t("tasks.taskTypeBreakdownSub")}</p>
          <div className="space-y-3">
            {stats.typeData.length === 0 ? (
              <p className="text-sm text-slate-400">{t("common.noData")}</p>
            ) : (
              stats.typeData.map((d) => (
                <div key={d.type} className="flex items-center gap-3">
                  <span className="text-xs text-slate-600 w-24 flex-shrink-0 truncate">{d.label}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${(d.count / stats.maxType) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-700 w-4 text-right">{d.count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ value, label, sub, color }: { value: number; label: string; sub: string; color: string }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-sm transition-shadow">
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-sm font-medium text-slate-700 mt-1">{label}</div>
      <div className="text-xs text-slate-400 mt-0.5">{sub}</div>
    </div>
  );
}
