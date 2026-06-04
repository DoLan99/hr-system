"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, RefreshCcw, Loader2, CheckCircle2, X, ShieldAlert, ShieldCheck } from "lucide-react";
import { toast } from "@/lib/hooks/use-toast";
import { EmptyState } from "@/components/shared/empty-state";
import { CardListSkeleton } from "@/components/ui/skeleton";

interface Alert {
  id: number;
  type: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "DISMISSED";
  title: string;
  description: string;
  metadata: Record<string, unknown> | null;
  auditLogId: number | null;
  sessionId: string | null;
  apiAccessLogId: string | null;
  notes: string | null;
  createdAt: string;
  acknowledgedAt: string | null;
  employee: { id: number; fullName: string; avatarUrl: string | null } | null;
  acknowledgedBy: { id: number; fullName: string } | null;
}

interface ListResponse {
  data: Alert[];
  total: number;
  page: number;
  totalPages: number;
  byStatus: Record<string, number>;
}

const TYPE_LABELS: Record<string, string> = {
  UNUSUAL_IP: "IP lạ",
  OFF_HOURS_VAULT: "Vault ngoài giờ",
  BULK_DELETE: "Xoá hàng loạt",
  TIMELOG_OVER_ESTIMATE: "Vượt estimate",
  FAILED_API_SPIKE: "Spike lỗi API",
  LATE_LOGIN: "Login trễ",
  NO_ACTIVITY_LONG: "Không hoạt động lâu",
  CONCURRENT_SESSIONS: "Session đồng thời",
};

const SEVERITY_STYLE: Record<string, string> = {
  INFO: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  WARNING: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  CRITICAL: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
};

const STATUS_STYLE: Record<string, string> = {
  OPEN: "bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
  ACKNOWLEDGED: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  RESOLVED: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  DISMISSED: "bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700",
};

export function AnomaliesClient({ canRefresh }: { canRefresh: boolean }) {
  const [status, setStatus] = useState<string>("OPEN");
  const [severity, setSeverity] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const query = useMemo(() => {
    const sp = new URLSearchParams();
    if (status) sp.set("status", status);
    if (severity) sp.set("severity", severity);
    if (type) sp.set("type", type);
    sp.set("page", String(page));
    return sp.toString();
  }, [status, severity, type, page]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/anomalies?${query}`)
      .then((r) => r.json())
      .then((j: ListResponse) => setData(j))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [query]);

  useEffect(() => setPage(1), [status, severity, type]);

  async function runRefresh() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/anomalies/refresh?hours=24", { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        // Reload list
        const r2 = await fetch(`/api/admin/anomalies?${query}`);
        setData(await r2.json());
        toast({
          variant: "success",
          title: "Quét hoàn tất",
          description: `${json.data.created} alert mới · ${json.data.skipped} đã tồn tại`,
        });
      } else {
        toast({ variant: "error", title: "Lỗi quét", description: json.error });
      }
    } finally {
      setRefreshing(false);
    }
  }

  async function changeStatus(id: number, newStatus: Alert["status"], notes?: string) {
    const res = await fetch(`/api/admin/anomalies/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, notes }),
    });
    if (res.ok) {
      const j = await res.json();
      setData((prev) =>
        prev
          ? {
              ...prev,
              data: prev.data.map((a) => (a.id === id ? { ...a, ...j.data } : a)),
            }
          : prev,
      );
    } else {
      const j = await res.json().catch(() => ({}));
      toast({ variant: "error", title: "Không cập nhật được", description: j.error });
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
            Anomaly Alerts
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Cảnh báo bất thường: IP lạ · Vault ngoài giờ · Bulk delete · Vượt estimate · API spike</p>
        </div>
        {canRefresh && (
          <button
            onClick={runRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium transition"
          >
            {refreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
            Quét lại (24h)
          </button>
        )}
      </div>

      {/* Status pills */}
      {data?.byStatus && (
        <div className="grid grid-cols-4 gap-2">
          {(["OPEN", "ACKNOWLEDGED", "RESOLVED", "DISMISSED"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(status === s ? "" : s)}
              className={`text-left px-3 py-2 rounded-lg border transition ${
                status === s ? STATUS_STYLE[s] + " font-semibold" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <p className="text-[10px] uppercase tracking-wide opacity-80">{s}</p>
              <p className="text-lg font-bold tabular-nums">{data.byStatus[s] ?? 0}</p>
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap">
        <div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mr-2">Severity:</span>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1.5"
          >
            <option value="">Tất cả</option>
            <option value="INFO">INFO</option>
            <option value="WARNING">WARNING</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>
        <div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mr-2">Loại:</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1.5"
          >
            <option value="">Tất cả</option>
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {loading ? (
          <CardListSkeleton count={4} />
        ) : !data || data.data.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
            <EmptyState
              icon={ShieldCheck}
              title="Không có cảnh báo nào"
              description="Tốt — hệ thống không phát hiện bất thường nào với bộ lọc hiện tại."
            />
          </div>
        ) : (
          data.data.map((a) => (
            <AlertCard key={a.id} alert={a} onChange={changeStatus} />
          ))
        )}
      </div>
    </div>
  );
}

function AlertCard({
  alert,
  onChange,
}: {
  alert: Alert;
  onChange: (id: number, status: Alert["status"], notes?: string) => Promise<void>;
}) {
  const [notes, setNotes] = useState(alert.notes ?? "");
  const [busy, setBusy] = useState(false);

  async function handle(newStatus: Alert["status"]) {
    setBusy(true);
    try {
      await onChange(alert.id, newStatus, notes || undefined);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`bg-white dark:bg-slate-900 border rounded-xl p-4 ${alert.severity === "CRITICAL" ? "border-red-300 dark:border-red-700" : "border-slate-200 dark:border-slate-700"}`}>
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${SEVERITY_STYLE[alert.severity].split(" ").slice(0, 2).join(" ")}`}>
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{alert.title}</p>
            <span className={`text-[10px] font-semibold uppercase border rounded px-1.5 py-0.5 ${SEVERITY_STYLE[alert.severity]}`}>
              {alert.severity}
            </span>
            <span className={`text-[10px] font-semibold uppercase border rounded px-1.5 py-0.5 ${STATUS_STYLE[alert.status]}`}>
              {alert.status}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              {TYPE_LABELS[alert.type] ?? alert.type}
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{alert.description}</p>
          <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
            <span>👤 {alert.employee?.fullName ?? "—"}</span>
            <span>🕒 {new Date(alert.createdAt).toLocaleString()}</span>
            {alert.acknowledgedBy && (
              <span>
                ✓ {alert.acknowledgedBy.fullName} · {alert.acknowledgedAt ? new Date(alert.acknowledgedAt).toLocaleString() : ""}
              </span>
            )}
          </div>
          {alert.metadata && (
            <details className="mt-2">
              <summary className="text-[11px] text-slate-400 dark:text-slate-500 cursor-pointer hover:text-slate-600">Metadata</summary>
              <pre className="mt-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded p-2 text-[10px] overflow-x-auto">
                {JSON.stringify(alert.metadata, null, 2)}
              </pre>
            </details>
          )}
        </div>

        {alert.status !== "RESOLVED" && alert.status !== "DISMISSED" && (
          <div className="flex flex-col gap-1 flex-shrink-0">
            {alert.status === "OPEN" && (
              <button
                onClick={() => handle("ACKNOWLEDGED")}
                disabled={busy}
                className="text-xs px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium"
              >
                Xác nhận
              </button>
            )}
            <button
              onClick={() => handle("RESOLVED")}
              disabled={busy}
              className="text-xs px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium inline-flex items-center gap-1"
            >
              <CheckCircle2 className="w-3 h-3" /> Resolved
            </button>
            <button
              onClick={() => handle("DISMISSED")}
              disabled={busy}
              className="text-xs px-2.5 py-1 rounded bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 font-medium inline-flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Dismiss
            </button>
          </div>
        )}
      </div>

      {(alert.status === "ACKNOWLEDGED" || alert.status === "OPEN") && (
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ghi chú khi xử lý (tuỳ chọn)…"
          rows={1}
          className="mt-3 w-full text-xs border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-300"
        />
      )}
    </div>
  );
}
