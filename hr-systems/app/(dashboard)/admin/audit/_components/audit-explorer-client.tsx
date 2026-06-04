"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ShieldCheck, Download, ChevronLeft, ChevronRight, Eye, FileSearch } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";

interface Employee {
  id: number;
  fullName: string;
  department: string | null;
}

interface AuditRow {
  id: number;
  tableName: string;
  recordId: number | null;
  action: string;
  changedAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  sessionId: string | null;
  requestId: string | null;
  endpoint: string | null;
  method: string | null;
  oldData: unknown;
  newData: unknown;
  changedBy: { id: number; fullName: string; avatarUrl: string | null } | null;
}

interface AuditResponse {
  data: AuditRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Props {
  employees: Employee[];
  currentUserId: number;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  UPDATE: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  DELETE: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
};

const TABLE_OPTIONS = [
  "Employee", "Role", "Department", "Team",
  "Task", "TaskTemplate", "TimeLog", "OfficeTime",
  "Customer", "Leave", "Payment", "SalarySummary",
  "PasswordVault", "WorkRule", "SystemLabel",
  "TemplateSuggestion", "EstimateFlag",
];

export function AuditExplorerClient({ employees, currentUserId }: Props) {
  const [employeeId, setEmployeeId] = useState<number | "">("");
  const [tableName, setTableName] = useState("");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState<AuditRow | null>(null);

  const queryString = useMemo(() => {
    const sp = new URLSearchParams();
    if (employeeId) sp.set("employeeId", String(employeeId));
    if (tableName) sp.set("tableName", tableName);
    if (action) sp.set("action", action);
    if (from) sp.set("from", from);
    if (to) sp.set("to", to);
    sp.set("page", String(page));
    sp.set("limit", "50");
    return sp.toString();
  }, [employeeId, tableName, action, from, to, page]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/audit?${queryString}`)
      .then((r) => r.json())
      .then((j) => setData(j))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [queryString]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [employeeId, tableName, action, from, to]);

  function downloadCsv() {
    const sp = new URLSearchParams();
    if (employeeId) sp.set("employeeId", String(employeeId));
    if (tableName) sp.set("tableName", tableName);
    if (action) sp.set("action", action);
    if (from) sp.set("from", from);
    if (to) sp.set("to", to);
    window.location.href = `/api/admin/audit/export?${sp.toString()}`;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Audit Log Explorer
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Truy vết mọi thay đổi: ai, làm gì, khi nào, từ đâu</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/audit/timeline"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium transition"
          >
            <Eye className="w-3.5 h-3.5" /> Timeline view
          </Link>
          <button
            onClick={downloadCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div>
          <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">Nhân viên</label>
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value ? Number(e.target.value) : "")}
            className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả</option>
            <option value={currentUserId}>(Tôi)</option>
            {employees.filter((e) => e.id !== currentUserId).map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.fullName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">Bảng</label>
          <select
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
            className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả</option>
            {TABLE_OPTIONS.map((tn) => (
              <option key={tn} value={tn}>{tn}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">Action</label>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">Từ</label>
          <input
            type="datetime-local"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">Đến</label>
          <input
            type="datetime-local"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {data ? `${data.total.toLocaleString()} log entries` : ""}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-600 dark:text-slate-400 tabular-nums">
              {data ? `${data.page} / ${data.totalPages || 1}` : "—"}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!data || page >= data.totalPages || loading}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={8} cols={7} />
        ) : !data || data.data.length === 0 ? (
          <EmptyState
            icon={FileSearch}
            title="Không có log nào khớp"
            description="Thử nới rộng khoảng thời gian hoặc bỏ bớt bộ lọc."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide bg-slate-50 dark:bg-slate-800/60">
                  <th className="text-left px-5 py-2 whitespace-nowrap">Thời gian</th>
                  <th className="text-left px-3 py-2">Actor</th>
                  <th className="text-left px-3 py-2">Action</th>
                  <th className="text-left px-3 py-2">Bảng / Record</th>
                  <th className="text-left px-3 py-2">Endpoint</th>
                  <th className="text-left px-3 py-2">IP</th>
                  <th className="text-right px-5 py-2">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.data.map((r) => {
                  const at = new Date(r.changedAt);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                      <td className="px-5 py-2 text-xs text-slate-700 dark:text-slate-300 tabular-nums whitespace-nowrap">
                        {at.toLocaleDateString()} {at.toLocaleTimeString()}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-700 dark:text-slate-300">{r.changedBy?.fullName ?? "—"}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-block text-[10px] font-semibold uppercase border rounded px-1.5 py-0.5 ${ACTION_COLORS[r.action] ?? "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"}`}>
                          {r.action}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs font-mono text-slate-700 dark:text-slate-300">
                        {r.tableName}{r.recordId ? <span className="text-slate-400 dark:text-slate-500">#{r.recordId}</span> : ""}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400 font-mono truncate max-w-[200px]">
                        {r.method} {r.endpoint ?? ""}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400 font-mono">{r.ipAddress ?? "—"}</td>
                      <td className="px-5 py-2 text-right">
                        <button
                          onClick={() => setSelectedRow(r)}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 font-medium"
                        >
                          Xem
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selectedRow && (
        <DetailDrawer row={selectedRow} onClose={() => setSelectedRow(null)} />
      )}
    </div>
  );
}

function DetailDrawer({ row, onClose }: { row: AuditRow; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative z-10 w-full max-w-2xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col h-full overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-700">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">#{row.id}</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {row.action} {row.tableName}{row.recordId ? `#${row.recordId}` : ""}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-700">✕</button>
        </div>
        <div className="p-5 space-y-4 text-xs">
          <Field label="Thời gian">{new Date(row.changedAt).toLocaleString()}</Field>
          <Field label="Actor">{row.changedBy?.fullName ?? "—"} (id={row.changedBy?.id ?? "—"})</Field>
          <Field label="Endpoint"><code>{row.method} {row.endpoint ?? "—"}</code></Field>
          <Field label="IP">{row.ipAddress ?? "—"}</Field>
          <Field label="User-Agent" className="break-all">{row.userAgent ?? "—"}</Field>
          <Field label="Session ID"><code>{row.sessionId ?? "—"}</code></Field>
          <Field label="Request ID"><code>{row.requestId ?? "—"}</code></Field>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Old data</p>
            <pre className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded p-2 overflow-x-auto text-[11px]">
              {JSON.stringify(row.oldData, null, 2)}
            </pre>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">New data</p>
            <pre className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded p-2 overflow-x-auto text-[11px]">
              {JSON.stringify(row.newData, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-0.5">{label}</p>
      <p className={`text-slate-800 dark:text-slate-200 ${className}`}>{children}</p>
    </div>
  );
}
