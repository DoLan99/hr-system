"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  Plus, Pencil, Trash2, CheckCircle2, XCircle, Clock,
  ArrowUp, ArrowDown, Video, ExternalLink, ChevronDown, Search, Eye,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn, formatMinutes } from "@/lib/utils";
import { TimeCheckFormModal } from "./time-check-form-modal";
import { TimeCheckReviewModal } from "./time-check-review-modal";
import { EmptyState } from "@/components/shared/empty-state";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];

type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

const STATUS_META: Record<ApprovalStatus, { label: string; color: string; icon: any }> = {
  PENDING: { label: "Chờ duyệt", color: "text-yellow-700 bg-yellow-50 border-yellow-200", icon: Clock },
  APPROVED: { label: "Đã duyệt", color: "text-green-700 bg-green-50 border-green-200", icon: CheckCircle2 },
  REJECTED: { label: "Từ chối", color: "text-red-700 bg-red-50 border-red-200", icon: XCircle },
};

interface TimeCheckItem {
  id: number;
  date: string | Date;
  employeeId: number;
  taskId: string | null;
  task?: { taskId: string; taskName: string; stdTime: number } | null;
  currentStdTime: number;
  actualTime: number;
  proposedStdTime: number;
  difference: number | null;
  timeCheckType: "INCREASE" | "DECREASE" | null;
  reason: string | null;
  videoLink: string;
  videoDuration?: number | null;
  status: ApprovalStatus;
  approvedTime?: number | null;
  decisionNote?: string | null;
  reviewedAt?: string | null;
  employee: { id: number; fullName: string; department: string | null };
  reviewedBy?: { id: number; fullName: string } | null;
}

interface Props {
  initialItems: TimeCheckItem[];
  employees?: { id: number; fullName: string }[];
}

const STATUS_ORDER: ApprovalStatus[] = ["PENDING", "APPROVED", "REJECTED"];

export function TimeCheckClient({ initialItems, employees }: Props) {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role ?? "";
  const isManager = MANAGER_ROLES.includes(role);
  const currentUserId = Number((session?.user as any)?.id);

  const [items, setItems] = useState<TimeCheckItem[]>(initialItems);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<ApprovalStatus | "ALL">("ALL");
  const [filterEmpId, setFilterEmpId] = useState<number | "ALL">("ALL");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TimeCheckItem | null>(null);
  const [reviewItem, setReviewItem] = useState<TimeCheckItem | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filtered = useMemo(() => items.filter(item => {
    if (filterStatus !== "ALL" && item.status !== filterStatus) return false;
    if (filterEmpId !== "ALL" && item.employeeId !== filterEmpId) return false;
    if (search && !(item.task?.taskName ?? item.taskId ?? "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [items, search, filterStatus, filterEmpId]);

  const grouped = useMemo(() => {
    const map = new Map<ApprovalStatus, TimeCheckItem[]>();
    STATUS_ORDER.forEach(s => map.set(s, []));
    filtered.forEach(item => map.get(item.status)?.push(item));
    return map;
  }, [filtered]);

  const stats = useMemo(() => ({
    pending: items.filter(i => i.status === "PENDING").length,
    approved: items.filter(i => i.status === "APPROVED").length,
    rejected: items.filter(i => i.status === "REJECTED").length,
  }), [items]);

  function handleSaved(item: TimeCheckItem) {
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === item.id);
      return idx >= 0 ? prev.map(i => i.id === item.id ? item : i) : [item, ...prev];
    });
    setFormOpen(false);
    setEditingItem(null);
    setReviewItem(null);
  }

  async function handleDelete(id: number) {
    if (!confirm("Xóa đề xuất này?")) return;
    setDeletingId(id);
    await fetch(`/api/time-check/${id}`, { method: "DELETE" });
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
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên task..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}
          className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="ALL">Tất cả trạng thái</option>
          {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
        </select>

        {isManager && employees && (
          <select value={filterEmpId} onChange={e => setFilterEmpId(e.target.value === "ALL" ? "ALL" : Number(e.target.value))}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="ALL">Tất cả nhân viên</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
          </select>
        )}

        <button onClick={() => { setEditingItem(null); setFormOpen(true); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
          <Plus className="w-4 h-4" />Đề xuất mới
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {([["Chờ duyệt", stats.pending, "text-yellow-600"],
           ["Đã duyệt", stats.approved, "text-green-600"],
           ["Từ chối", stats.rejected, "text-red-500"]] as const).map(([label, val, color]) => (
          <div key={label} className="bg-white border border-slate-200 rounded-xl px-4 py-3">
            <p className="text-xs text-slate-500">{label}</p>
            <p className={cn("text-2xl font-bold mt-0.5", color)}>{val}</p>
          </div>
        ))}
      </div>

      {/* Grouped list */}
      {filtered.length === 0 ? (
        <EmptyState icon={Clock} title="Không có đề xuất nào"
          description="Nhấn 'Đề xuất mới' để gửi yêu cầu điều chỉnh Std Time" />
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
                <button onClick={() => toggleCollapse(status)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition">
                  <div className="flex items-center gap-2">
                    <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border", meta.color)}>
                      <Icon className="w-3 h-3" />{meta.label}
                    </span>
                    <span className="text-xs text-slate-500">{group.length} đề xuất</span>
                  </div>
                  <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", isCollapsed && "-rotate-90")} />
                </button>

                {!isCollapsed && (
                  <div className="divide-y divide-slate-100">
                    {group.map(item => {
                      const isIncrease = (item.difference ?? 0) >= 0;
                      return (
                        <div key={item.id} className="px-4 py-3 hover:bg-slate-50 transition">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              {/* Header row */}
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="text-xs text-slate-400">
                                  {format(new Date(item.date), "dd/MM/yyyy", { locale: vi })}
                                </span>
                                {isManager && (
                                  <span className="text-xs font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                    {item.employee.fullName}
                                  </span>
                                )}
                                <span className={cn(
                                  "inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded border",
                                  isIncrease ? "text-orange-600 bg-orange-50 border-orange-200" : "text-green-600 bg-green-50 border-green-200"
                                )}>
                                  {isIncrease ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                  {isIncrease ? "Tăng" : "Giảm"}
                                </span>
                              </div>

                              {/* Task name */}
                              <p className="text-sm font-medium text-slate-900">
                                <span className="font-mono text-blue-600 text-xs mr-1">{item.taskId}</span>
                                {item.task?.taskName ?? ""}
                              </p>

                              {/* Time comparison */}
                              <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 flex-wrap">
                                <span>Hiện tại: <strong className="text-slate-700">{formatMinutes(item.currentStdTime)}</strong></span>
                                <span>Thực tế: <strong className="text-slate-700">{formatMinutes(item.actualTime)}</strong></span>
                                <span className={cn("font-medium", isIncrease ? "text-orange-600" : "text-green-600")}>
                                  Đề xuất: {formatMinutes(item.proposedStdTime)}
                                  {item.difference !== null && ` (${item.difference > 0 ? "+" : ""}${item.difference}p)`}
                                </span>
                                {item.status === "APPROVED" && item.approvedTime && (
                                  <span className="text-green-600 font-medium flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Duyệt: {formatMinutes(item.approvedTime)}
                                  </span>
                                )}
                              </div>

                              {item.reason && (
                                <p className="text-xs text-slate-500 mt-1 italic line-clamp-1">&ldquo;{item.reason}&rdquo;</p>
                              )}

                              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                <a href={item.videoLink} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-xs text-blue-500 hover:underline"
                                  onClick={e => e.stopPropagation()}>
                                  <Video className="w-3 h-3" />Video
                                  {item.videoDuration ? ` (${item.videoDuration}p)` : ""}
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                                {item.decisionNote && (
                                  <p className={cn("text-xs italic", item.status === "REJECTED" ? "text-red-500" : "text-slate-400")}>
                                    {item.decisionNote}
                                  </p>
                                )}
                              </div>

                              {item.reviewedBy && item.reviewedAt && (
                                <p className="text-xs text-slate-400 mt-0.5">
                                  {item.status === "APPROVED" ? "Duyệt" : "Từ chối"} bởi {item.reviewedBy.fullName}
                                  {" · "}{format(new Date(item.reviewedAt), "dd/MM HH:mm")}
                                </p>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {isManager && item.status === "PENDING" && (
                                <button onClick={() => setReviewItem(item)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-medium transition">
                                  <Eye className="w-3.5 h-3.5" />Xét duyệt
                                </button>
                              )}
                              {(isManager || (item.employeeId === currentUserId && item.status === "PENDING")) && (
                                <>
                                  <button onClick={() => { setEditingItem(item); setFormOpen(true); }}
                                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition">
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => handleDelete(item.id)} disabled={deletingId === item.id}
                                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <TimeCheckFormModal
        open={formOpen}
        item={editingItem ? { ...editingItem, date: String(editingItem.date).slice(0, 10) } : null}
        onClose={() => { setFormOpen(false); setEditingItem(null); }}
        onSaved={handleSaved}
      />

      {reviewItem && (
        <TimeCheckReviewModal
          item={reviewItem}
          onClose={() => setReviewItem(null)}
          onReviewed={handleSaved}
        />
      )}
    </div>
  );
}
