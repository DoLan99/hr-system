"use client";

import { useEffect, useState } from "react";
import {
  X, User, CalendarDays, Clock, Timer, ExternalLink,
  AlertCircle, BarChart2, Pencil, Loader2, FileText,
  Link2, StickyNote, CheckCircle2, Tag,
} from "lucide-react";
import { format, isAfter } from "date-fns";
import { cn, formatMinutes } from "@/lib/utils";

/* ─── Types ──────────────────────────────────────────────── */
interface WorkReport {
  id: number;
  date: string;
  taskName: string | null;
  actualTime: number;
  creditedTime: number;
}

interface TaskDetail {
  id: number;
  wlId: string;
  title: string;
  description: string | null;
  category: string | null;
  taskCode: string | null;
  stdTime: number | null;
  linkTemplate: string | null;
  note1: string | null;
  note2: string | null;
  assignedToId: number;
  assignedTo: { id: number; fullName: string; department: string | null };
  assignedBy: { id: number; fullName: string };
  testerId: number | null;
  tester: { id: number; fullName: string } | null;
  customer: { id: number; customerName: string | null } | null;
  priority: string;
  status: string;
  progressPct: number;
  dueDate: string | null;
  dateAssigned: string;
  completedDate: string | null;
  reasonNextAction: string | null;
  totalActualTime: number;
  _count: { workReports: number };
  workReports: WorkReport[];
}

interface Props {
  wlId: string;
  isManager: boolean;
  onClose: () => void;
  onEdit: () => void;
  onUpdateStatus: () => void;
}

/* ─── Meta maps ─────────────────────────────────────────── */
const PRIORITY_META: Record<string, { label: string; color: string }> = {
  CRITICAL: { label: "Critical", color: "text-red-600 bg-red-50 border-red-200" },
  HIGH:     { label: "High",     color: "text-orange-600 bg-orange-50 border-orange-200" },
  NORMAL:   { label: "Normal",   color: "text-blue-600 bg-blue-50 border-blue-200" },
  LOW:      { label: "Low",      color: "text-slate-500 bg-slate-50 border-slate-200" },
};

const STATUS_META: Record<string, { label: string; color: string; dot: string }> = {
  NOT_STARTED: { label: "Chưa bắt đầu", color: "text-slate-600 bg-slate-100 border-slate-200", dot: "bg-slate-400" },
  IN_PROGRESS: { label: "Đang làm",      color: "text-blue-700 bg-blue-50 border-blue-200",    dot: "bg-blue-500" },
  BLOCKED:     { label: "Bị block",      color: "text-red-700 bg-red-50 border-red-200",        dot: "bg-red-500" },
  COMPLETED:   { label: "Hoàn thành",    color: "text-green-700 bg-green-50 border-green-200",  dot: "bg-green-500" },
  CANCELLED:   { label: "Đã huỷ",        color: "text-slate-400 bg-slate-50 border-slate-200",  dot: "bg-slate-300" },
};

/* ─── Section wrapper ────────────────────────────────────── */
function Section({ title, icon: Icon, children }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
      </div>
      {children}
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────── */
export function TaskDetailDrawer({ wlId, isManager, onClose, onEdit, onUpdateStatus }: Props) {
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/work-list/${wlId}`)
      .then(r => r.json())
      .then(j => setTask(j.data))
      .finally(() => setLoading(false));
  }, [wlId]);

  const isOverdue = task?.dueDate &&
    task.status !== "COMPLETED" && task.status !== "CANCELLED" &&
    isAfter(new Date(), new Date(task.dueDate));

  const statusMeta = task ? (STATUS_META[task.status] ?? { label: task.status, color: "", dot: "bg-slate-400" }) : null;
  const priorityMeta = task ? (PRIORITY_META[task.priority] ?? { label: task.priority, color: "" }) : null;
  const canEdit = isManager;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-[520px] bg-white shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex-1 min-w-0 pr-3">
            {task && (
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                  {task.wlId}
                </span>
                {statusMeta && (
                  <span className={cn("text-[11px] font-medium px-1.5 py-0.5 rounded border flex items-center gap-1", statusMeta.color)}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", statusMeta.dot)} />
                    {statusMeta.label}
                  </span>
                )}
                {priorityMeta && (
                  <span className={cn("text-[11px] font-medium px-1.5 py-0.5 rounded border", priorityMeta.color)}>
                    {priorityMeta.label}
                  </span>
                )}
              </div>
            )}
            <h2 className="text-[15px] font-semibold text-slate-900 leading-snug">
              {loading ? <span className="block h-5 w-48 bg-slate-200 rounded animate-pulse" /> : task?.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {loading && (
            <div className="space-y-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: `${60 + i * 10}%` }} />
              ))}
            </div>
          )}

          {task && (
            <>
              {/* Progress */}
              {task.status === "IN_PROGRESS" && (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[12px] font-medium text-slate-600">Tiến độ</span>
                    <span className="text-[12px] font-bold text-blue-600">{task.progressPct}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${task.progressPct}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Reason / block note */}
              {task.reasonNextAction && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[12.5px] text-amber-700">{task.reasonNextAction}</p>
                </div>
              )}

              {/* Info grid */}
              <Section title="Thông tin" icon={User}>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                  <InfoRow label="Người xử lý" value={task.assignedTo.fullName} />
                  <InfoRow label="Người giao" value={task.assignedBy.fullName} />
                  {task.tester && <InfoRow label="Tester" value={task.tester.fullName} highlight />}
                  {task.customer && <InfoRow label="Khách hàng" value={task.customer.customerName ?? "—"} />}
                  {task.category && <InfoRow label="Loại" value={task.category} />}
                  {task.taskCode && <InfoRow label="Task code" value={task.taskCode} mono />}
                </div>
              </Section>

              {/* Dates & time */}
              <Section title="Thời gian" icon={CalendarDays}>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                  <InfoRow label="Ngày giao" value={format(new Date(task.dateAssigned), "dd/MM/yyyy")} />
                  {task.dueDate && (
                    <InfoRow
                      label="Deadline"
                      value={format(new Date(task.dueDate), "dd/MM/yyyy")}
                      danger={!!isOverdue}
                      suffix={isOverdue ? "Quá hạn" : undefined}
                    />
                  )}
                  {task.completedDate && (
                    <InfoRow label="Hoàn thành" value={format(new Date(task.completedDate), "dd/MM/yyyy HH:mm")} />
                  )}
                  {task.stdTime != null && task.stdTime > 0 && (
                    <InfoRow label="Giờ chuẩn" value={`${task.stdTime} phút`} />
                  )}
                  {task.totalActualTime > 0 && (
                    <InfoRow label="Thực tế" value={formatMinutes(task.totalActualTime)} />
                  )}
                </div>
              </Section>

              {/* Description */}
              {task.description && (
                <Section title="Mô tả" icon={FileText}>
                  <div
                    className="prose prose-sm max-w-none text-slate-700 text-[13px] leading-relaxed bg-slate-50 rounded-lg p-3 border border-slate-100"
                    dangerouslySetInnerHTML={{ __html: task.description }}
                  />
                </Section>
              )}

              {/* Link */}
              {task.linkTemplate && (
                <Section title="Link" icon={Link2}>
                  <a
                    href={task.linkTemplate}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[12.5px] text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1.5 break-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                    {task.linkTemplate}
                  </a>
                </Section>
              )}

              {/* Notes */}
              {(task.note1 || task.note2) && (
                <Section title="Ghi chú" icon={StickyNote}>
                  <div className="space-y-2">
                    {task.note1 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                        <p className="text-[11px] text-yellow-600 font-medium mb-0.5">Ghi chú 1</p>
                        <p className="text-[12.5px] text-slate-700">{task.note1}</p>
                      </div>
                    )}
                    {task.note2 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                        <p className="text-[11px] text-yellow-600 font-medium mb-0.5">Ghi chú 2</p>
                        <p className="text-[12.5px] text-slate-700">{task.note2}</p>
                      </div>
                    )}
                  </div>
                </Section>
              )}

              {/* Work Reports */}
              {task.workReports.length > 0 && (
                <Section title={`Work Reports (${task._count.workReports})`} icon={BarChart2}>
                  <div className="space-y-1.5">
                    {task.workReports.map(r => (
                      <div key={r.id} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                        <div className="flex-1 min-w-0">
                          <span className="text-[11px] text-slate-400 font-mono mr-2">
                            {format(new Date(r.date), "dd/MM")}
                          </span>
                          <span className="text-[12.5px] text-slate-700 truncate">
                            {r.taskName ?? "—"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                          <span className="flex items-center gap-1 text-[11px] text-slate-500">
                            <Clock className="w-3 h-3" />
                            {formatMinutes(r.actualTime)}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-green-600">
                            <CheckCircle2 className="w-3 h-3" />
                            {formatMinutes(r.creditedTime)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </>
          )}
        </div>

        {/* Footer actions */}
        {task && (
          <div className="flex items-center gap-2 px-5 py-3.5 border-t border-slate-100 flex-shrink-0 bg-white">
            <button
              onClick={onUpdateStatus}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-[13px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition"
            >
              <BarChart2 className="w-4 h-4" />
              Cập nhật tiến độ
            </button>
            {canEdit && (
              <button
                onClick={onEdit}
                className="flex items-center justify-center gap-2 px-4 py-2 text-[13px] font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition"
              >
                <Pencil className="w-4 h-4" />
                Sửa
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

/* ─── Helper ─────────────────────────────────────────────── */
function InfoRow({ label, value, highlight, mono, danger, suffix }: {
  label: string;
  value: string;
  highlight?: boolean;
  mono?: boolean;
  danger?: boolean;
  suffix?: string;
}) {
  return (
    <div>
      <p className="text-[11px] text-slate-400 mb-0.5">{label}</p>
      <p className={cn(
        "text-[13px] font-medium",
        highlight ? "text-emerald-600" : danger ? "text-red-600" : "text-slate-800",
        mono && "font-mono",
      )}>
        {value}
        {suffix && (
          <span className="ml-1.5 text-[11px] font-semibold text-red-500 bg-red-50 px-1 py-0.5 rounded">
            {suffix}
          </span>
        )}
      </p>
    </div>
  );
}
