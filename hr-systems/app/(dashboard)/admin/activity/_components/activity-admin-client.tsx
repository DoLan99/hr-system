"use client";

import { useEffect, useState } from "react";
import { ActivityHeatmap } from "@/components/tracking/activity-heatmap";
import { Loader2, Activity, Eye, Users } from "lucide-react";

interface Employee {
  id: number;
  fullName: string;
  department: string | null;
  avatarUrl: string | null;
}

interface PageStat {
  path: string;
  totalSec: number;
  uniqueEmployees: number;
}

interface PageStatsResponse {
  data: {
    days: number;
    employeeId: number | null;
    totalSec: number;
    totalRows: number;
    topPages: PageStat[];
  };
}

interface SessionRow {
  id: string;
  employeeId: number;
  loginAt: string;
  logoutAt: string | null;
  lastActivityAt: string;
  ipAddress: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  loginMethod: string;
  logoutReason: string | null;
  employee: { fullName: string };
}

interface Props {
  employees: Employee[];
  currentUserId: number;
  currentUserName: string;
}

function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}p`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem === 0 ? `${h}h` : `${h}h${rem}p`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function ActivityAdminClient({ employees, currentUserId, currentUserName }: Props) {
  const [targetId, setTargetId] = useState(currentUserId);
  const [days, setDays] = useState(30);
  const [pageStats, setPageStats] = useState<PageStatsResponse["data"] | null>(null);
  const [pageStatsLoading, setPageStatsLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  // Fetch page stats
  useEffect(() => {
    setPageStatsLoading(true);
    fetch(`/api/activity/page-stats?employeeId=${targetId}&days=${days}`)
      .then((r) => r.json())
      .then((j: PageStatsResponse) => setPageStats(j.data ?? null))
      .catch(() => setPageStats(null))
      .finally(() => setPageStatsLoading(false));
  }, [targetId, days]);

  // Fetch recent sessions của user (dùng API office-time/auto-derive vì nó trả về sessions trong ngày)
  // Để đơn giản: gọi cho ngày hôm nay → manager xem được session đăng nhập gần nhất
  useEffect(() => {
    setSessionsLoading(true);
    const today = new Date().toISOString().slice(0, 10);
    fetch(`/api/office-time/auto-derive?employeeId=${targetId}&date=${today}`)
      .then((r) => r.json())
      .then((j) => {
        const ss: SessionRow[] = (j?.data?.sessions ?? []).map((s: any) => ({
          ...s,
          employee: { fullName: employees.find((e) => e.id === targetId)?.fullName ?? "" },
        }));
        setSessions(ss);
      })
      .catch(() => setSessions([]))
      .finally(() => setSessionsLoading(false));
  }, [targetId, employees]);

  const targetEmp = employees.find((e) => e.id === targetId);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Activity Tracking
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Theo dõi hoạt động chi tiết theo nhân viên</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Nhân viên:</span>
        <select
          value={targetId}
          onChange={(e) => setTargetId(Number(e.target.value))}
          className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 min-w-[200px]"
        >
          <option value={currentUserId}>(Tôi) {currentUserName}</option>
          {employees
            .filter((e) => e.id !== currentUserId)
            .map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.fullName}
                {emp.department ? ` — ${emp.department}` : ""}
              </option>
            ))}
        </select>

        <span className="text-xs font-medium text-slate-600 dark:text-slate-400 ml-3">Khoảng:</span>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900"
        >
          <option value={7}>7 ngày</option>
          <option value={14}>14 ngày</option>
          <option value={30}>30 ngày</option>
          <option value={60}>60 ngày</option>
          <option value={90}>90 ngày</option>
        </select>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<Activity className="w-4 h-4" />}
          label="Tổng thời gian xem"
          value={pageStats ? formatDuration(pageStats.totalSec) : "—"}
          loading={pageStatsLoading}
        />
        <StatCard
          icon={<Eye className="w-4 h-4" />}
          label="Số page khác nhau"
          value={pageStats ? String(pageStats.topPages.length) : "—"}
          loading={pageStatsLoading}
        />
        <StatCard
          icon={<Users className="w-4 h-4" />}
          label="Ngày có dữ liệu"
          value={pageStats ? `${pageStats.totalRows}/${days}` : "—"}
          loading={pageStatsLoading}
        />
        <StatCard
          icon={<Activity className="w-4 h-4" />}
          label="Sessions hôm nay"
          value={String(sessions.length)}
          loading={sessionsLoading}
        />
      </div>

      {/* Heatmap */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Heatmap hoạt động — {targetEmp?.fullName ?? ""}
        </h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
          Cường độ = số API request (proxy cho mức tích cực). Heartbeat sinh ~1 request/phút khi user thực sự thao tác.
        </p>
        <ActivityHeatmap employeeId={targetId} days={days} />
      </div>

      {/* Top pages */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Top trang được xem nhiều nhất</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Trong {days} ngày gần đây</p>
        </div>
        {pageStatsLoading ? (
          <div className="p-8 flex items-center justify-center text-slate-400 dark:text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : !pageStats || pageStats.topPages.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400 dark:text-slate-500">Chưa có dữ liệu</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide bg-slate-50 dark:bg-slate-800/60">
                <th className="text-left px-5 py-2">#</th>
                <th className="text-left px-3 py-2">Path</th>
                <th className="text-right px-3 py-2">Tổng thời gian</th>
                <th className="text-right px-3 py-2">% tổng</th>
                <th className="text-right px-5 py-2">Tỷ trọng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageStats.topPages.map((p, i) => {
                const pct = pageStats.totalSec > 0 ? (p.totalSec / pageStats.totalSec) * 100 : 0;
                return (
                  <tr key={p.path} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="px-5 py-2 text-slate-400 dark:text-slate-500 text-xs">{i + 1}</td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-700 dark:text-slate-300">{p.path}</td>
                    <td className="px-3 py-2 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                      {formatDuration(p.totalSec)}
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      {pct.toFixed(1)}%
                    </td>
                    <td className="px-5 py-2">
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden w-32 ml-auto">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Sessions hôm nay */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Phiên đăng nhập hôm nay</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Login từ IP/thiết bị nào</p>
        </div>
        {sessionsLoading ? (
          <div className="p-8 flex items-center justify-center text-slate-400 dark:text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400 dark:text-slate-500">Không có phiên nào hôm nay</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide bg-slate-50 dark:bg-slate-800/60">
                <th className="text-left px-5 py-2">Login</th>
                <th className="text-left px-3 py-2">Hoạt động cuối</th>
                <th className="text-left px-3 py-2">IP</th>
                <th className="text-left px-3 py-2">Device</th>
                <th className="text-left px-3 py-2">Browser/OS</th>
                <th className="text-left px-5 py-2">Logout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sessions.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                  <td className="px-5 py-2 text-xs text-slate-700 dark:text-slate-300 tabular-nums">{formatDateTime(s.loginAt)}</td>
                  <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400 tabular-nums">{formatDateTime(s.lastActivityAt)}</td>
                  <td className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400 font-mono">{s.ipAddress ?? "—"}</td>
                  <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400">{s.device ?? "—"}</td>
                  <td className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                    {s.browser ?? "—"} / {s.os ?? "—"}
                  </td>
                  <td className="px-5 py-2 text-xs">
                    {s.logoutAt ? (
                      <span className="text-slate-500 dark:text-slate-400">{formatDateTime(s.logoutAt)}</span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">Đang active</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  loading: boolean;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3">
      <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-xl font-bold text-slate-800 dark:text-slate-200 tabular-nums">
        {loading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : value}
      </p>
    </div>
  );
}
