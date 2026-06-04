"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Clock,
  LogIn,
  LogOut,
  PlayCircle,
  StopCircle,
  Lock,
  Mail,
  AlertTriangle,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  CalendarX,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

interface Employee {
  id: number;
  fullName: string;
  department: string | null;
}

interface TimelineEvent {
  at: string;
  type: string;
  summary: string;
  meta?: Record<string, unknown>;
}

interface TimelineResponse {
  data: {
    employeeId: number;
    date: string;
    events: TimelineEvent[];
    stats: {
      total: number;
      sessionCount: number;
      auditCount: number;
      timeLogStartCount: number;
      vaultAccessCount: number;
      apiErrorCount: number;
    };
  };
}

interface Props {
  employees: Employee[];
  currentUserId: number;
  currentUserName: string;
}

const TYPE_META: Record<
  string,
  { icon: React.ElementType; color: string; bg: string; label: string }
> = {
  SESSION_LOGIN: { icon: LogIn, color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-100 dark:bg-blue-950/60", label: "Login" },
  SESSION_LOGOUT: { icon: LogOut, color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800", label: "Logout" },
  AUDIT_CREATE: { icon: Plus, color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-100 dark:bg-emerald-950/60", label: "Create" },
  AUDIT_UPDATE: { icon: Pencil, color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-100 dark:bg-blue-950/60", label: "Update" },
  AUDIT_DELETE: { icon: Trash2, color: "text-red-700 dark:text-red-300", bg: "bg-red-100 dark:bg-red-950/60", label: "Delete" },
  TIMELOG_START: { icon: PlayCircle, color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-100 dark:bg-emerald-950/60", label: "Start timer" },
  TIMELOG_STOP: { icon: StopCircle, color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-100 dark:bg-amber-950/60", label: "Stop timer" },
  OFFICE_CLOCK: { icon: Clock, color: "text-indigo-700 dark:text-indigo-300", bg: "bg-indigo-100 dark:bg-indigo-950/60", label: "Clock-in/out" },
  VAULT_ACCESS: { icon: Lock, color: "text-purple-700 dark:text-purple-300", bg: "bg-purple-100 dark:bg-purple-950/60", label: "Vault" },
  MESSAGE_AUDIT: { icon: Mail, color: "text-cyan-700 dark:text-cyan-300", bg: "bg-cyan-100 dark:bg-cyan-950/60", label: "Message" },
  API_ERROR: { icon: AlertTriangle, color: "text-red-700 dark:text-red-300", bg: "bg-red-50 dark:bg-red-950/40", label: "API error" },
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

export function TimelineClient({ employees, currentUserId, currentUserName }: Props) {
  const [employeeId, setEmployeeId] = useState(currentUserId);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [result, setResult] = useState<TimelineResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/audit/timeline?employeeId=${employeeId}&date=${date}`)
      .then((r) => r.json())
      .then((j: TimelineResponse) => setResult(j.data ?? null))
      .catch(() => setResult(null))
      .finally(() => setLoading(false));
  }, [employeeId, date]);

  const filteredEvents = useMemo(() => {
    if (!result) return [];
    if (!filter) return result.events;
    return result.events.filter((e) => e.type === filter);
  }, [result, filter]);

  const groupedByHour = useMemo(() => {
    const buckets: Record<string, TimelineEvent[]> = {};
    for (const e of filteredEvents) {
      const hour = e.at.slice(11, 13);
      if (!buckets[hour]) buckets[hour] = [];
      buckets[hour].push(e);
    }
    return Object.entries(buckets).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredEvents]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Timeline hoạt động
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Gộp Session · Audit · TimeLog · Office · Vault · Message · API Error vào 1 trục thời gian
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap">
        <div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mr-2">Nhân viên:</span>
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(Number(e.target.value))}
            className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]"
          >
            <option value={currentUserId}>(Tôi) {currentUserName}</option>
            {employees.filter((e) => e.id !== currentUserId).map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.fullName}</option>
            ))}
          </select>
        </div>
        <div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mr-2">Ngày:</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-xs text-slate-500 dark:text-slate-400">Lọc:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả</option>
            {Object.entries(TYPE_META).map(([k, m]) => (
              <option key={k} value={k}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      {result && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-2">
          <StatPill label="Tổng" value={result.stats.total} color="text-slate-700 dark:text-slate-300" />
          <StatPill label="Sessions" value={result.stats.sessionCount} color="text-blue-600 dark:text-blue-400" />
          <StatPill label="Audit" value={result.stats.auditCount} color="text-slate-700 dark:text-slate-300" />
          <StatPill label="Timer start" value={result.stats.timeLogStartCount} color="text-emerald-600 dark:text-emerald-400" />
          <StatPill label="Vault" value={result.stats.vaultAccessCount} color="text-purple-600 dark:text-purple-400" />
          <StatPill label="API errors" value={result.stats.apiErrorCount} color="text-red-600 dark:text-red-400" />
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4">
                <Skeleton className="w-6 h-6 rounded-full mt-1" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : !result || filteredEvents.length === 0 ? (
          <EmptyState
            icon={CalendarX}
            title="Không có sự kiện nào"
            description="User này chưa có hoạt động nào trong ngày được chọn. Thử ngày khác hoặc đổi nhân viên."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {groupedByHour.map(([hour, events]) => (
              <div key={hour} className="px-5 py-4">
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-3">
                  {hour}:00
                </p>
                <ol className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-3 space-y-3">
                  {events.map((e, idx) => {
                    const meta = TYPE_META[e.type] ?? { icon: Activity, color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800", label: e.type };
                    const Icon = meta.icon;
                    return (
                      <li key={`${e.at}-${idx}`} className="ml-6">
                        <span className={`absolute -left-3 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white ${meta.bg}`}>
                          <Icon className={`w-3 h-3 ${meta.color}`} />
                        </span>
                        <div className="flex items-baseline gap-2">
                          <time className="text-xs text-slate-400 dark:text-slate-500 font-mono tabular-nums w-16 flex-shrink-0">
                            {formatTime(e.at)}
                          </time>
                          <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${meta.bg} ${meta.color}`}>
                            {meta.label}
                          </span>
                          <span className="text-sm text-slate-700 dark:text-slate-300 leading-tight">{e.summary}</span>
                        </div>
                        {e.meta && Object.keys(e.meta).length > 0 && (
                          <details className="mt-1 ml-[78px]">
                            <summary className="text-[11px] text-slate-400 dark:text-slate-500 cursor-pointer hover:text-slate-600">Chi tiết</summary>
                            <pre className="mt-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded p-2 text-[10px] text-slate-600 dark:text-slate-400 overflow-x-auto">
                              {JSON.stringify(e.meta, null, 2)}
                            </pre>
                          </details>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2">
      <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold tracking-wide">{label}</p>
      <p className={`text-lg font-bold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}
