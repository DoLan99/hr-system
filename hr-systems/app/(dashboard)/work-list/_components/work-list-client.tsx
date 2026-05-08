"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  Plus, Pencil, Trash2, ChevronDown, Search,
  Clock, BarChart2, AlertCircle, CheckCircle2,
  ExternalLink, CalendarDays, User, Timer, Eye,
} from "lucide-react";
import { format, isAfter } from "date-fns";
import { cn, formatMinutes } from "@/lib/utils";
import { WorkListFormModal } from "./work-list-form-modal";
import { StatusUpdateModal } from "./status-update-modal";
import { TaskDetailDrawer } from "./task-detail-drawer";
import { EmptyState } from "@/components/shared/empty-state";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];

const PRIORITY_META = {
  CRITICAL: { label: "Critical", color: "text-red-600 bg-red-50 border-red-200" },
  HIGH: { label: "High", color: "text-orange-600 bg-orange-50 border-orange-200" },
  NORMAL: { label: "Normal", color: "text-blue-600 bg-blue-50 border-blue-200" },
  LOW: { label: "Low", color: "text-slate-500 bg-slate-50 border-slate-200" },
};

const STATUS_META = {
  NOT_STARTED: { label: "Chưa bắt đầu", color: "text-slate-600 bg-slate-50 border-slate-200" },
  IN_PROGRESS: { label: "Đang làm", color: "text-blue-700 bg-blue-50 border-blue-200" },
  BLOCKED: { label: "Bị block", color: "text-red-700 bg-red-50 border-red-200" },
  COMPLETED: { label: "Hoàn thành", color: "text-green-700 bg-green-50 border-green-200" },
  CANCELLED: { label: "Đã huỷ", color: "text-slate-400 bg-slate-50 border-slate-200" },
};

type WorkStatus = keyof typeof STATUS_META;
type Priority = keyof typeof PRIORITY_META;

interface WorkItem {
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
  priority: Priority;
  status: WorkStatus;
  progressPct: number;
  dueDate: string | null;
  dateAssigned: string;
  reasonNextAction: string | null;
  totalActualTime: number;
  completedDate: string | null;
  _count: { workReports: number };
}

interface Props {
  initialItems: WorkItem[];
  employees: { id: number; fullName: string; department: string | null }[];
  customers: { id: number; name: string }[];
}

const STATUS_ORDER: WorkStatus[] = ["IN_PROGRESS", "BLOCKED", "NOT_STARTED", "COMPLETED", "CANCELLED"];

export function WorkListClient({ initialItems, employees, customers }: Props) {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role ?? "";
  const isManager = MANAGER_ROLES.includes(role);
  const currentUserId = Number((session?.user as any)?.id);

  const [items, setItems] = useState<WorkItem[]>(initialItems);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<WorkStatus | "ALL">("ALL");
  const [filterPriority, setFilterPriority] = useState<Priority | "ALL">("ALL");
  const [collapsedStatus, setCollapsedStatus] = useState<Set<string>>(new Set(["COMPLETED", "CANCELLED"]));

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WorkItem | null>(null);
  const [statusItem, setStatusItem] = useState<WorkItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [detailWlId, setDetailWlId] = useState<string | null>(null);

  const detailItem = detailWlId ? items.find(i => i.wlId === detailWlId) ?? null : null;

  const filtered = useMemo(() => {
    return items.filter(item => {
      if (filterStatus !== "ALL" && item.status !== filterStatus) return false;
      if (filterPriority !== "ALL" && item.priority !== filterPriority) return false;
      if (search && !item.title.toLowerCase().includes(search.toLowerCase()) &&
          !item.wlId.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [items, search, filterStatus, filterPriority]);

  const grouped = useMemo(() => {
    const map = new Map<WorkStatus, WorkItem[]>();
    STATUS_ORDER.forEach(s => map.set(s, []));
    filtered.forEach(item => map.get(item.status)?.push(item));
    return map;
  }, [filtered]);

  function handleSaved(item: WorkItem) {
    setItems(prev => {
      const idx = prev.findIndex(i => i.wlId === item.wlId);
      return idx >= 0 ? prev.map(i => i.wlId === item.wlId ? item : i) : [item, ...prev];
    });
    setFormOpen(false);
    setEditingItem(null);
    setStatusItem(null);
  }

  async function handleDelete(wlId: string) {
    if (!confirm("Xóa work item này?")) return;
    setDeletingId(wlId);
    await fetch(`/api/work-list/${wlId}`, { method: "DELETE" });
    setItems(prev => prev.filter(i => i.wlId !== wlId));
    setDeletingId(null);
  }

  function toggleCollapse(status: string) {
    setCollapsedStatus(prev => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }

  const isOverdue = (item: WorkItem) =>
    item.dueDate && item.status !== "COMPLETED" && item.status !== "CANCELLED" &&
    isAfter(new Date(), new Date(item.dueDate));

  const canEdit = (item: WorkItem) => isManager || item.assignedToId === currentUserId;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc WL-ID..."
            className="form-input pl-9"
          />
        </div>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as any)}
          className="form-select"
        >
          <option value="ALL">Tất cả trạng thái</option>
          {Object.entries(STATUS_META).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value as any)}
          className="form-select"
        >
          <option value="ALL">Tất cả độ ưu tiên</option>
          {Object.entries(PRIORITY_META).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        {isManager && (
          <button
            onClick={() => { setEditingItem(null); setFormOpen(true); }}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            Tạo mới
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["IN_PROGRESS", "BLOCKED", "NOT_STARTED", "COMPLETED"] as WorkStatus[]).map(s => {
          const count = items.filter(i => i.status === s).length;
          const meta = STATUS_META[s];
          return (
            <div key={s} className="stat-card">
              <p className="text-[11.5px] font-medium text-slate-500 uppercase tracking-wide">{meta.label}</p>
              <p className="text-[26px] font-bold text-slate-900 mt-1 leading-none">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Grouped list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Không có task nào"
          description="Thử thay đổi bộ lọc hoặc tạo task mới"
        />
      ) : (
        <div className="space-y-2.5">
          {STATUS_ORDER.map(status => {
            const group = grouped.get(status) ?? [];
            if (group.length === 0) return null;
            const collapsed = collapsedStatus.has(status);
            const meta = STATUS_META[status];

            return (
              <div key={status} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-card">
                {/* Group header */}
                <button
                  onClick={() => toggleCollapse(status)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-slate-100 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={cn("text-[11.5px] font-semibold px-2 py-0.5 rounded-md border", meta.color)}>
                      {meta.label}
                    </span>
                    <span className="text-[12px] text-slate-400">{group.length} task</span>
                  </div>
                  <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", collapsed && "-rotate-90")} />
                </button>

                {!collapsed && (
                  <div className="divide-y divide-slate-100">
                    {group.map(item => (
                      <div key={item.wlId} className={cn(
                        "px-4 py-3 hover:bg-slate-50/70 transition",
                        isOverdue(item) && "bg-red-50/30",
                        detailWlId === item.wlId && "bg-blue-50/40",
                      )}>
                        <div className="flex items-start justify-between gap-3">
                          {/* Left — click to open detail */}
                          <div
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => setDetailWlId(item.wlId)}
                          >
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{item.wlId}</span>
                              {item.taskCode && (
                                <span className="text-[11px] font-mono text-indigo-600 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">{item.taskCode}</span>
                              )}
                              <span className={cn(
                                "text-[11px] font-medium px-1.5 py-0.5 rounded border",
                                PRIORITY_META[item.priority].color
                              )}>
                                {PRIORITY_META[item.priority].label}
                              </span>
                              {item.category && (
                                <span className="text-[11px] font-medium px-1.5 py-0.5 rounded border text-purple-600 bg-purple-50 border-purple-200">
                                  {item.category}
                                </span>
                              )}
                              {isOverdue(item) && (
                                <span className="text-[11px] font-medium text-red-600 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />Quá hạn
                                </span>
                              )}
                            </div>

                            <p className="text-[13.5px] font-semibold text-slate-900 truncate hover:text-blue-600 transition-colors">
                              {item.title}
                            </p>

                            {item.description && (
                              <p className="text-[12px] text-slate-500 mt-0.5 line-clamp-1">
                                {item.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}
                              </p>
                            )}

                            {/* Progress bar */}
                            {item.status === "IN_PROGRESS" && (
                              <div className="flex items-center gap-2 mt-2">
                                <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-blue-500 rounded-full transition-all"
                                    style={{ width: `${item.progressPct}%` }}
                                  />
                                </div>
                                <span className="text-[11px] text-slate-500 w-8 text-right">{item.progressPct}%</span>
                              </div>
                            )}

                            {item.reasonNextAction && (
                              <p className="text-[12px] text-amber-600 mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                {item.reasonNextAction}
                              </p>
                            )}

                            {/* Meta row */}
                            <div className="flex items-center gap-3 mt-2 text-[11.5px] text-slate-400 flex-wrap">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />{item.assignedTo.fullName}
                              </span>
                              {item.tester && (
                                <span className="flex items-center gap-1 text-emerald-600">
                                  <User className="w-3 h-3" />Tester: {item.tester.fullName}
                                </span>
                              )}
                              {item.dueDate && (
                                <span className={cn("flex items-center gap-1", isOverdue(item) && "text-red-500")}>
                                  <CalendarDays className="w-3 h-3" />
                                  {format(new Date(item.dueDate), "dd/MM/yyyy")}
                                </span>
                              )}
                              {item.totalActualTime > 0 && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />{formatMinutes(item.totalActualTime)}
                                </span>
                              )}
                              {item.stdTime != null && item.stdTime > 0 && (
                                <span className="flex items-center gap-1">
                                  <Timer className="w-3 h-3" />{item.stdTime} phút
                                </span>
                              )}
                              {item._count.workReports > 0 && (
                                <span className="flex items-center gap-1">
                                  <BarChart2 className="w-3 h-3" />{item._count.workReports} reports
                                </span>
                              )}
                              {item.customer && (
                                <span className="flex items-center gap-1">
                                  <ExternalLink className="w-3 h-3" />{item.customer.customerName}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => setDetailWlId(item.wlId)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          {canEdit(item) && (
                            <>
                              <button
                                onClick={() => setStatusItem(item)}
                                className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition"
                                title="Cập nhật tiến độ"
                              >
                                <BarChart2 className="w-4 h-4" />
                              </button>
                              {isManager && (
                                <>
                                  <button
                                    onClick={() => { setEditingItem(item); setFormOpen(true); }}
                                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                                    title="Sửa"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(item.wlId)}
                                    disabled={deletingId === item.wlId}
                                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition"
                                    title="Xóa"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </>
                          )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <WorkListFormModal
        open={formOpen}
        item={editingItem}
        employees={employees}
        customers={customers}
        onClose={() => { setFormOpen(false); setEditingItem(null); }}
        onSaved={handleSaved}
      />

      {statusItem && (
        <StatusUpdateModal
          item={statusItem}
          onClose={() => setStatusItem(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Task detail drawer */}
      {detailWlId && (
        <TaskDetailDrawer
          wlId={detailWlId}
          isManager={isManager}
          onClose={() => setDetailWlId(null)}
          onEdit={() => {
            if (detailItem) { setEditingItem(detailItem); setFormOpen(true); }
            setDetailWlId(null);
          }}
          onUpdateStatus={() => {
            if (detailItem) setStatusItem(detailItem);
            setDetailWlId(null);
          }}
        />
      )}
    </div>
  );
}
