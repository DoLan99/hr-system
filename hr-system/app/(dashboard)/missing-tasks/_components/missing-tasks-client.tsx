"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  Plus, Pencil, Trash2, CheckCircle2, XCircle, Clock,
  Video, ExternalLink, ChevronDown, Search, Eye,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn, formatMinutes } from "@/lib/utils";
import { MissingTaskFormModal } from "./missing-task-form-modal";
import { ReviewModal } from "./review-modal";
import { EmptyState } from "@/components/shared/empty-state";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];

type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

const STATUS_META: Record<ApprovalStatus, { label: string; color: string; icon: any }> = {
  PENDING: { label: "Chờ duyệt", color: "text-yellow-700 bg-yellow-50 border-yellow-200", icon: Clock },
  APPROVED: { label: "Đã duyệt", color: "text-green-700 bg-green-50 border-green-200", icon: CheckCircle2 },
  REJECTED: { label: "Từ chối", color: "text-red-700 bg-red-50 border-red-200", icon: XCircle },
};

interface MissingTaskItem {
  id: number;
  date: string | Date;
  employeeId: number;
  taskName: string;
  description?: string | null;
  quantity: number;
  timeAllotted: number | null;
  videoLink: string;
  videoDuration?: number | null;
  dateRecorded?: string | null;
  reasonNote?: string | null;
  status: ApprovalStatus;
  approvedTime?: number | null;
  bonusTime: number;
  decisionNote?: string | null;
  reviewedAt?: string | null;
  employee: { id: number; fullName: string; department: string | null };
  reviewedBy?: { id: number; fullName: string } | null;
}

interface Props {
  initialItems: MissingTaskItem[];
  employees?: { id: number; fullName: string }[];
}

const STATUS_ORDER: ApprovalStatus[] = ["PENDING", "APPROVED", "REJECTED"];

export function MissingTasksClient({ initialItems, employees }: Props) {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role ?? "";
  const isManager = MANAGER_ROLES.includes(role);
  const currentUserId = Number((session?.user as any)?.id);

  const [items, setItems] = useState<MissingTaskItem[]>(initialItems);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<ApprovalStatus | "ALL">("ALL");
  const [filterEmpId, setFilterEmpId] = useState<number | "ALL">("ALL");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<MissingTaskItem | null>(null);
  const [reviewTask, setReviewTask] = useState<MissingTaskItem | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    return items.filter(item => {
      if (filterStatus !== "ALL" && item.status !== filterStatus) return false;
      if (filterEmpId !== "ALL" && item.employeeId !== filterEmpId) return false;
      if (search && !item.taskName.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [items, search, filterStatus, filterEmpId]);

  const grouped = useMemo(() => {
    const map = new Map<ApprovalStatus, MissingTaskItem[]>();
    STATUS_ORDER.forEach(s => map.set(s, []));
    filtered.forEach(item => map.get(item.status)?.push(item));
    return map;
  }, [filtered]);

  const stats = useMemo(() => ({
    pending: items.filter(i => i.status === "PENDING").length,
    approved: items.filter(i => i.status === "APPROVED").length,
    rejected: items.filter(i => i.status === "REJECTED").length,
    totalApprovedTime: items
      .filter(i => i.status === "APPROVED")
      .reduce((s, i) => s + (i.approvedTime ?? 0) + i.bonusTime, 0),
  }), [items]);

  function handleSaved(item: MissingTaskItem) {
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === item.id);
      return idx >= 0 ? prev.map(i => i.id === item.id ? item : i) : [item, ...prev];
    });
    setFormOpen(false);
    setEditingTask(null);
    setReviewTask(null);
  }

  async function handleDelete(id: number) {
    if (!confirm("Xóa khai báo này?")) return;
    setDeletingId(id);
    await fetch(`/api/missing-tasks/${id}`, { method: "DELETE" });
    setItems(prev => prev.filter(i => i.id !== id));
    setDeletingId(null);
  }

  function toggleCollapse(status: string) {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên công việc..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as any)}
          className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="ALL">Tất cả trạng thái</option>
          {STATUS_ORDER.map(s => (
            <option key={s} value={s}>{STATUS_META[s].label}</option>
          ))}
        </select>

        {isManager && employees && (
          <select
            value={filterEmpId}
            onChange={e => setFilterEmpId(e.target.value === "ALL" ? "ALL" : Number(e.target.value))}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="ALL">Tất cả nhân viên</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>{e.fullName}</option>
            ))}
          </select>
        )}

        <button
          onClick={() => { setEditingTask(null); setFormOpen(true); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          Khai báo mới
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
          <p className="text-xs text-slate-500">Chờ duyệt</p>
          <p className="text-2xl font-bold text-yellow-600 mt-0.5">{stats.pending}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
          <p className="text-xs text-slate-500">Đã duyệt</p>
          <p className="text-2xl font-bold text-green-600 mt-0.5">{stats.approved}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
          <p className="text-xs text-slate-500">Từ chối</p>
          <p className="text-2xl font-bold text-red-500 mt-0.5">{stats.rejected}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
          <p className="text-xs text-slate-500">Tổng giờ được tính</p>
          <p className="text-2xl font-bold text-blue-600 mt-0.5">{formatMinutes(stats.totalApprovedTime)}</p>
        </div>
      </div>

      {/* Grouped list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Không có khai báo nào"
          description="Nhấn 'Khai báo mới' để thêm missing task"
        />
      ) : (
        <div className="space-y-3">
          {STATUS_ORDER.map(status => {
            const group = grouped.get(status) ?? [];
            if (group.length === 0) return null;
            const meta = STATUS_META[status];
            const Icon = meta.icon;
            const isCollapsed = collapsed.has(status);

            return (
              <div key={status} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                {/* Group header */}
                <button
                  onClick={() => toggleCollapse(status)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition"
                >
                  <div className="flex items-center gap-2">
                    <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border", meta.color)}>
                      <Icon className="w-3 h-3" />
                      {meta.label}
                    </span>
                    <span className="text-xs text-slate-500">{group.length} khai báo</span>
                    {status === "APPROVED" && (
                      <span className="text-xs text-green-600 font-medium">
                        · {formatMinutes(group.reduce((s, i) => s + (i.approvedTime ?? 0) + i.bonusTime, 0))}
                      </span>
                    )}
                  </div>
                  <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", isCollapsed && "-rotate-90")} />
                </button>

                {!isCollapsed && (
                  <div className="divide-y divide-slate-100">
                    {group.map(item => (
                      <div key={item.id} className="px-4 py-3 hover:bg-slate-50 transition">
                        <div className="flex items-start justify-between gap-3">
                          {/* Left: info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-xs text-slate-400">
                                {format(new Date(item.date), "dd/MM/yyyy", { locale: vi })}
                              </span>
                              {isManager && (
                                <span className="text-xs font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                  {item.employee.fullName}
                                </span>
                              )}
                              {item.quantity > 1 && (
                                <span className="text-xs text-slate-400">×{item.quantity}</span>
                              )}
                            </div>

                            <p className="text-sm font-medium text-slate-900">{item.taskName}</p>

                            {item.description && (
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.description}</p>
                            )}

                            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Khai: {item.timeAllotted ? formatMinutes(item.timeAllotted) : "—"}
                              </span>

                              {item.status === "APPROVED" && (
                                <>
                                  <span className="flex items-center gap-1 text-green-600 font-medium">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Duyệt: {formatMinutes(item.approvedTime ?? 0)}
                                  </span>
                                  {item.bonusTime > 0 && (
                                    <span className="text-green-500">+{formatMinutes(item.bonusTime)} bonus</span>
                                  )}
                                </>
                              )}

                              <a
                                href={item.videoLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-blue-500 hover:underline"
                                onClick={e => e.stopPropagation()}
                              >
                                <Video className="w-3 h-3" />
                                Video
                                {item.videoDuration ? ` (${item.videoDuration}p)` : ""}
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>

                            {(item.decisionNote || item.reasonNote) && (
                              <p className={cn(
                                "text-xs mt-1 italic",
                                item.status === "REJECTED" ? "text-red-500" : "text-slate-400"
                              )}>
                                {item.decisionNote || item.reasonNote}
                              </p>
                            )}

                            {item.reviewedBy && item.reviewedAt && (
                              <p className="text-xs text-slate-400 mt-0.5">
                                {item.status === "APPROVED" ? "Duyệt bởi" : "Từ chối bởi"}: {item.reviewedBy.fullName}
                                · {format(new Date(item.reviewedAt), "dd/MM HH:mm")}
                              </p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {/* Manager: review button for PENDING */}
                            {isManager && item.status === "PENDING" && (
                              <button
                                onClick={() => setReviewTask(item)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-medium transition"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Xét duyệt
                              </button>
                            )}

                            {/* Employee: edit/delete when PENDING */}
                            {!isManager && item.employeeId === currentUserId && item.status === "PENDING" && (
                              <>
                                <button
                                  onClick={() => { setEditingTask(item); setFormOpen(true); }}
                                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                                  title="Sửa"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  disabled={deletingId === item.id}
                                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition"
                                  title="Xóa"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            {/* Manager: edit/delete always */}
                            {isManager && (
                              <>
                                <button
                                  onClick={() => { setEditingTask(item); setFormOpen(true); }}
                                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                                  title="Sửa"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  disabled={deletingId === item.id}
                                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition"
                                  title="Xóa"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
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
      <MissingTaskFormModal
        open={formOpen}
        task={editingTask ? { ...editingTask, date: String(editingTask.date).slice(0, 10) } : null}
        onClose={() => { setFormOpen(false); setEditingTask(null); }}
        onSaved={handleSaved}
      />

      {reviewTask && (
        <ReviewModal
          task={reviewTask}
          onClose={() => setReviewTask(null)}
          onReviewed={handleSaved}
        />
      )}
    </div>
  );
}
