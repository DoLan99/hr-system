"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TASK_TYPE_COLORS, approvalStatusLabel } from "@/lib/time-logs";
import { useLocale } from "@/lib/i18n/context";
import { TimeLogFormModal } from "./time-log-form-modal";
import { ApproveLogModal } from "./approve-log-modal";

type Task = {
  id: number;
  code: string;
  title: string;
  taskType: string;
  estimatedTime: number | null;
  actualTimeTotal: number;
  requiresVideo: boolean;
  status: string;
  assignedTo: { id: number; fullName: string };
};

type TimeLogItem = {
  id: number;
  date: string;
  durationMinutes: number;
  creditedMinutes: number | null;
  approvalStatus: "AUTO_APPROVED" | "PENDING" | "APPROVED" | "REJECTED";
  note: string | null;
  videoLink: string | null;
  rating: number | null;
  rejectionReason: string | null;
  employee: { id: number; fullName: string; avatarUrl: string | null };
  task: {
    id: number;
    code: string;
    title: string;
    taskType: string;
    billable: boolean;
    customer: { id: number; customerName: string | null; businessName: string | null } | null;
  };
  approvedBy: { id: number; fullName: string } | null;
};

type Props = {
  initialItems: TimeLogItem[];
  tasks: Task[];
  initialDate: string;
  initialTaskId: number | null;
  currentUserId: number;
  isManager: boolean;
};

function formatMin(min: number | null) {
  if (min === null || min === undefined) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? (m === 0 ? `${h}h` : `${h}h${m}'`) : `${m}'`;
}

export function TimeLogsClient({ initialItems, tasks, initialDate, initialTaskId, currentUserId, isManager }: Props) {
  const router = useRouter();
  const { t } = useLocale();
  const [items, setItems] = useState(initialItems);
  const [date, setDate] = useState(initialDate);
  const [createOpen, setCreateOpen] = useState(false);
  const [preselectedTaskId, setPreselectedTaskId] = useState<number | null>(initialTaskId);
  const [approving, setApproving] = useState<TimeLogItem | null>(null);

  function changeDate(d: string) {
    setDate(d);
    router.push(`/time-logs?date=${d}`);
  }

  async function refresh() {
    const res = await fetch(`/api/time-logs?date=${date}`).then((r) => r.json());
    setItems(res.data ?? []);
  }

  async function deleteLog(id: number) {
    if (!confirm(t("timeLogs.deleteLog"))) return;
    await fetch(`/api/time-logs/${id}`, { method: "DELETE" });
    refresh();
  }

  const totalDuration = items.reduce((s, l) => s + l.durationMinutes, 0);
  const totalCredited = items.reduce((s, l) => s + (l.creditedMinutes ?? 0), 0);

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">{t("timeLogs.title")}</h1>
        <p className="text-sm text-slate-500">{t("timeLogs.subtitle")}</p>
      </div>
      {/* Date + summary + create */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="date"
          value={date}
          onChange={(e) => changeDate(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-md"
        />
        <div className="text-sm text-slate-600">
          {t("timeLogs.total")}: <strong>{formatMin(totalDuration)}</strong> · {t("timeLogs.credited")}: <strong>{formatMin(totalCredited)}</strong>
        </div>
        <button
          onClick={() => {
            setPreselectedTaskId(null);
            setCreateOpen(true);
          }}
          className="ml-auto px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {t("timeLogs.logTime")}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 text-left">
            <tr>
              <th className="px-3 py-2.5 font-medium">{t("timeLogs.task")}</th>
              <th className="px-3 py-2.5 font-medium">{t("timeLogs.type")}</th>
              <th className="px-3 py-2.5 font-medium">{t("timeLogs.note")}</th>
              <th className="px-3 py-2.5 font-medium">{t("timeLogs.duration")}</th>
              <th className="px-3 py-2.5 font-medium">{t("timeLogs.credited")}</th>
              <th className="px-3 py-2.5 font-medium">{t("timeLogs.status")}</th>
              <th className="px-3 py-2.5 font-medium">{t("timeLogs.video")}</th>
              <th className="px-3 py-2.5 font-medium">{t("timeLogs.employee")}</th>
              <th className="px-3 py-2.5 font-medium text-right">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-slate-400">
                  {t("timeLogs.noLogs")}
                </td>
              </tr>
            )}
            {items.map((l) => {
              const lbl = approvalStatusLabel(l.approvalStatus);
              const typeLabel = t(`taskType.${l.task.taskType}`) || l.task.taskType;
              return (
                <tr key={l.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50">
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-slate-800">
                      <span className="font-mono text-xs text-slate-500 dark:text-slate-400 mr-1.5">{l.task.code}</span>
                      {l.task.title}
                    </div>
                    {l.task.customer && (
                      <div className="text-xs text-slate-400">
                        {l.task.customer.businessName ?? l.task.customer.customerName}
                        {l.task.billable && <span className="ml-1 text-emerald-600">€</span>}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${TASK_TYPE_COLORS[l.task.taskType as keyof typeof TASK_TYPE_COLORS]}`}>
                      {typeLabel}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300 text-xs max-w-xs truncate">{l.note ?? "—"}</td>
                  <td className="px-3 py-2.5 text-slate-700">{formatMin(l.durationMinutes)}</td>
                  <td className="px-3 py-2.5">
                    <span className={l.creditedMinutes && l.creditedMinutes < l.durationMinutes ? "text-amber-600 dark:text-amber-400 font-medium" : "text-slate-700"}>
                      {l.creditedMinutes !== null ? formatMin(l.creditedMinutes) : "?"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${lbl.color}`}>{lbl.label}</span>
                    {l.rating && <span className="ml-1 text-amber-500 text-xs">★{l.rating}</span>}
                  </td>
                  <td className="px-3 py-2.5">
                    {l.videoLink ? (
                      <a href={l.videoLink} target="_blank" rel="noopener" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                        ▶
                      </a>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-600">{l.employee.fullName}</td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="inline-flex gap-1">
                      {isManager && l.approvalStatus === "PENDING" && (
                        <button
                          onClick={() => setApproving(l)}
                          className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-100"
                        >
                          {t("timeLogs.approve")}
                        </button>
                      )}
                      {(l.employee.id === currentUserId || isManager) && (
                        <button
                          onClick={() => deleteLog(l.id)}
                          className="text-xs px-2 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 rounded"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <TimeLogFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        tasks={tasks}
        preselectedTaskId={preselectedTaskId}
        defaultDate={date}
        onSaved={() => {
          setCreateOpen(false);
          refresh();
        }}
      />

      <ApproveLogModal
        log={approving}
        onClose={() => setApproving(null)}
        onDone={() => {
          setApproving(null);
          refresh();
        }}
      />
    </div>
  );
}
