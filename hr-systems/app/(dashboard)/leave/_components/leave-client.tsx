"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { vi as viLocale } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, CheckCircle2, Clock, XCircle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/context";
import { LeaveFormModal } from "./leave-form-modal";
import { LeaveReviewModal } from "./leave-review-modal";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];

interface Employee { id: number; fullName: string; department?: string | null }

interface LeaveItem {
  id: number;
  date: string;
  type: string;
  requestedHours: number | string;
  reason?: string | null;
  evidenceLink?: string | null;
  status: string;
  approvedHours?: number | string | null;
  approvalNote?: string | null;
  money?: number | string | null;
  approvedAt?: string | null;
  employee: Employee;
  approvedBy?: { fullName: string } | null;
}

interface Props {
  initialLeaves: LeaveItem[];
  initialMonth: number;
  initialYear: number;
  employees: Employee[];
  currentUserId: number;
}

const TYPE_COLORS: Record<string, string> = {
  VACATION: "bg-blue-100 text-blue-700",
  HOLIDAY: "bg-purple-100 text-purple-700",
  ILLNESS: "bg-red-100 text-red-700",
  OTHER: "bg-slate-100 text-slate-700",
};

const STATUS_ORDER = ["PENDING", "APPROVED", "REJECTED"];

export function LeaveClient({ initialLeaves, initialMonth, initialYear, employees, currentUserId }: Props) {
  const { data: session } = useSession();
  const { t, locale } = useLocale();
  const role = (session?.user as any)?.role ?? "";
  const isManager = MANAGER_ROLES.includes(role);
  const dateFnsLocale = locale === "vi" ? viLocale : undefined;

  const [viewDate, setViewDate] = useState(new Date(initialYear, initialMonth - 1));
  const [leaves, setLeaves] = useState<LeaveItem[]>(initialLeaves);
  const [creating, setCreating] = useState(false);
  const [editingItem, setEditingItem] = useState<LeaveItem | null>(null);
  const [reviewingItem, setReviewingItem] = useState<LeaveItem | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  async function fetchLeaves(date: Date) {
    const m = date.getMonth() + 1;
    const y = date.getFullYear();
    const res = await fetch(`/api/leave?month=${m}&year=${y}`);
    const json = await res.json();
    if (res.ok) setLeaves(json.data ?? []);
  }

  function navigate(dir: 1 | -1) {
    const next = new Date(viewDate.getFullYear(), viewDate.getMonth() + dir, 1);
    setViewDate(next);
    fetchLeaves(next);
  }

  async function handleDelete(id: number) {
    if (!confirm(t("leave.deleteConfirm"))) return;
    await fetch(`/api/leave/${id}`, { method: "DELETE" });
    setLeaves(prev => prev.filter(l => l.id !== id));
  }

  function upsert(item: LeaveItem) {
    setLeaves(prev => {
      const idx = prev.findIndex(l => l.id === item.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = item; return next; }
      return [item, ...prev];
    });
  }

  const filtered = useMemo(() =>
    leaves.filter(l => filterStatus === "ALL" || l.status === filterStatus),
    [leaves, filterStatus]
  );

  const grouped = useMemo(() => {
    const map: Record<string, LeaveItem[]> = {};
    for (const s of STATUS_ORDER) map[s] = [];
    for (const l of filtered) (map[l.status] ??= []).push(l);
    return map;
  }, [filtered]);

  const stats = {
    total: leaves.length,
    pending: leaves.filter(l => l.status === "PENDING").length,
    approved: leaves.filter(l => l.status === "APPROVED").length,
    totalHours: leaves.filter(l => l.status === "APPROVED").reduce((s, l) => s + Number(l.approvedHours ?? 0), 0),
  };

  const statusConfig = {
    PENDING: { label: t("leaveStatus.PENDING"), color: "bg-yellow-100 text-yellow-700", icon: <Clock className="w-3.5 h-3.5" /> },
    APPROVED: { label: t("leaveStatus.APPROVED"), color: "bg-green-100 text-green-700", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    REJECTED: { label: t("leaveStatus.REJECTED"), color: "bg-red-100 text-red-700", icon: <XCircle className="w-3.5 h-3.5" /> },
  } as Record<string, { label: string; color: string; icon: React.ReactNode }>;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t("leave.title")}</h1>
          <p className="text-sm text-slate-500">{t("leave.subtitle")}</p>
        </div>
        <button onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition">
          <Plus className="w-4 h-4" /> {t("leave.createLeave")}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t("leave.totalRequests"), value: stats.total, color: "text-slate-900" },
          { label: t("leave.pendingRequests"), value: stats.pending, color: "text-yellow-600" },
          { label: t("leave.approvedRequests"), value: stats.approved, color: "text-green-600" },
          { label: t("leave.approvedHours"), value: `${stats.totalHours}h`, color: "text-blue-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-4">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-3 py-2">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-slate-100 rounded"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm font-medium w-28 text-center">
            {format(viewDate, "MMMM yyyy", { locale: dateFnsLocale })}
          </span>
          <button onClick={() => navigate(1)} className="p-1 hover:bg-slate-100 rounded"><ChevronRight className="w-4 h-4" /></button>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {["ALL", ...STATUS_ORDER].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition",
                filterStatus === s ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}>
              {s === "ALL" ? t("common.all") : (statusConfig[s]?.label ?? s)}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-5">
        {STATUS_ORDER.map(status => {
          const items = grouped[status] ?? [];
          if (items.length === 0) return null;
          const cfg = statusConfig[status];
          return (
            <div key={status}>
              <div className="flex items-center gap-2 mb-2">
                <span className={cn("flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full", cfg.color)}>
                  {cfg.icon} {cfg.label}
                </span>
                <span className="text-xs text-slate-400">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map(item => {
                  const canEdit = item.status === "PENDING" && (!isManager ? item.employee.id === currentUserId : true);
                  const canReview = isManager && item.status === "PENDING";
                  return (
                    <div key={item.id} className="bg-white rounded-xl border border-slate-100 p-4 flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isManager && (
                            <span className="text-sm font-semibold text-slate-900">{item.employee.fullName}</span>
                          )}
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", TYPE_COLORS[item.type] ?? "bg-slate-100 text-slate-700")}>
                            {t(`leaveType.${item.type}`) || item.type}
                          </span>
                          <span className="text-sm text-slate-700 font-medium">
                            {format(new Date(item.date), "dd/MM/yyyy", { locale: dateFnsLocale })}
                          </span>
                          <span className="text-sm text-slate-600">
                            {Number(item.requestedHours)}h {t("leave.hoursRequested")}
                            {item.status === "APPROVED" && item.approvedHours != null && (
                              <span className="text-green-600 ml-1">→ {Number(item.approvedHours)}h {t("leave.hoursApproved")}</span>
                            )}
                          </span>
                        </div>
                        {item.reason && (
                          <p className="text-xs text-slate-500 mt-1 truncate">{item.reason}</p>
                        )}
                        {item.approvalNote && (
                          <p className="text-xs text-slate-500 mt-0.5 italic">&ldquo;{item.approvalNote}&rdquo; — {item.approvedBy?.fullName}</p>
                        )}
                        {item.evidenceLink && (
                          <a href={item.evidenceLink} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-0.5">
                            <ExternalLink className="w-3 h-3" /> {t("leave.evidence")}
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {canReview && (
                          <button onClick={() => setReviewingItem(item)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition" title={t("common.approve")}>
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        {canEdit && (
                          <button onClick={() => setEditingItem(item)}
                            className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition">
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        {(isManager || (item.status === "PENDING" && item.employee.id === currentUserId)) && (
                          <button onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <p className="text-sm">{t("leave.noLeave")}</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {(creating || editingItem) && (
        <LeaveFormModal
          item={editingItem ? {
            id: editingItem.id,
            date: editingItem.date,
            type: editingItem.type,
            requestedHours: editingItem.requestedHours,
            reason: editingItem.reason,
            evidenceLink: editingItem.evidenceLink,
            employeeId: editingItem.employee.id,
          } : null}
          employees={employees}
          isManager={isManager}
          currentUserId={currentUserId}
          onClose={() => { setCreating(false); setEditingItem(null); }}
          onSaved={item => { upsert(item); setCreating(false); setEditingItem(null); }}
        />
      )}

      {reviewingItem && (
        <LeaveReviewModal
          item={reviewingItem}
          onClose={() => setReviewingItem(null)}
          onSaved={item => { upsert(item); setReviewingItem(null); }}
        />
      )}
    </div>
  );
}
