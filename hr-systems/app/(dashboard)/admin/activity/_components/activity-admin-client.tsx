"use client";

import { useEffect, useMemo, useState } from "react";
import { ActivityHeatmap } from "@/components/tracking/activity-heatmap";

// ── Types ─────────────────────────────────────────────────────

interface Employee {
  id: number;
  fullName: string;
  department: string | null;
  avatarUrl: string | null;
}

interface PageStat { path: string; totalSec: number; uniqueEmployees: number }

interface PageStatsResponse {
  data: { days: number; employeeId: number | null; totalSec: number; totalRows: number; topPages: PageStat[] };
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
  city?: string | null;
  country?: string | null;
  loginMethod: string;
  logoutReason: string | null;
  employee?: { id: number; fullName: string; department: string | null };
}

interface TimelineEvent {
  id: number;
  tableName: string;
  action: string;
  recordId: number | null;
  changedAt: string;
  endpoint: string | null;
  method: string | null;
  changedById: number | null;
  changedBy: { id: number; fullName: string; department: string | null } | null;
}

interface OnlineUser {
  id: string;
  employeeId: number;
  loginAt: string;
  lastActivityAt: string;
  ipAddress: string | null;
  device: string | null;
  browser: string | null;
  employee: { id: number; fullName: string; avatarUrl: string | null; department: string | null };
}

interface TopUser {
  employeeId: number;
  fullName: string;
  avatarUrl: string | null;
  department: string | null;
  activeSeconds: number;
  daysActive: number;
}

interface AnomalyRow {
  id: number;
  type: string;
  severity: string;
  status: string;
  title: string;
  description: string;
  createdAt: string;
  employee: { id: number; fullName: string; avatarUrl: string | null } | null;
}

interface Props {
  employees: Employee[];
  currentUserId: number;
  currentUserName: string;
}

type TargetId = number | "all";

// ── Avatars ───────────────────────────────────────────────────

const AVCOLORS = ["#3B5BDB", "#2196f3", "#7c3aed", "#0891b2", "#059669", "#d97706", "#dc2626", "#0f766e", "#b45309", "#1d4ed8", "#6d28d9", "#be185d"];

function initials(name: string): string {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}
function avColor(id: number): string {
  return AVCOLORS[Math.abs(id) % AVCOLORS.length];
}

// ── Format helpers ────────────────────────────────────────────

function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}p`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem === 0 ? `${h}h` : `${h}h ${rem}p`;
}
function fmtTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function dayLabel(iso: string): string {
  const d = new Date(iso); d.setHours(0, 0, 0, 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Hôm nay";
  if (diffDays === 1) return "Hôm qua";
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return d.toLocaleDateString("vi-VN");
}

const TABLE_LABEL: Record<string, string> = {
  task: "task", time_log: "time log", employee: "nhân viên", customer: "khách hàng",
  message: "tin nhắn", inventory_item: "mặt hàng", inventory_transaction: "giao dịch kho",
  leave: "đơn nghỉ phép", payment: "thanh toán", performance_review: "đánh giá",
  password_vault: "vault", department: "phòng ban", team: "team", role: "vai trò",
  workflow_template: "workflow", system_label: "nhãn", office_time: "chấm công",
};
function tableLabel(t: string): string {
  return TABLE_LABEL[t] ?? t.replace(/_/g, " ");
}

function actionMeta(action: string): { verb: string; badge: string } {
  const a = action.toUpperCase();
  if (a === "CREATE" || a === "INSERT") return { verb: "tạo", badge: "task" };
  if (a === "UPDATE") return { verb: "cập nhật", badge: "review" };
  if (a === "DELETE") return { verb: "xoá", badge: "warn" };
  return { verb: action.toLowerCase(), badge: "vault" };
}

function renderTimelineGroups(items: TimelineEvent[]) {
  const groups: Record<string, TimelineEvent[]> = {};
  const order: string[] = [];
  for (const it of items) {
    const k = dayLabel(it.changedAt);
    if (!groups[k]) { groups[k] = []; order.push(k); }
    groups[k].push(it);
  }
  return order.map((day) => (
    <div key={day}>
      <div className="tl-day">{day}</div>
      {groups[day].map((it) => {
        const meta = actionMeta(it.action);
        const name = it.changedBy?.fullName ?? "Hệ thống";
        const recordRef = it.recordId !== null ? `#${it.recordId}` : "";
        return (
          <div key={it.id} className="tl-item">
            <span className="tl-av" style={{ width: 30, height: 30, borderRadius: 50, background: avColor(it.changedById ?? 0), fontSize: ".7rem" }}>
              {initials(name)}
            </span>
            <div className="tl-content">
              <span className="tl-who">{name}</span>
              <div className="tl-desc">{meta.verb} {tableLabel(it.tableName)} <b>{recordRef}</b></div>
              <div className="tl-meta">
                <span className={`tl-badge ${meta.badge}`}>{it.action.toUpperCase()}</span>
                <span>{fmtTime(it.changedAt)}</span>
                {it.endpoint && <span style={{ color: "var(--text-3)" }}>{it.method} {it.endpoint}</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  ));
}

function fmtRelative(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "vừa xong";
  if (diff < 3600) return Math.round(diff / 60) + " phút trước";
  if (diff < 86400) return Math.round(diff / 3600) + " giờ trước";
  return Math.round(diff / 86400) + " ngày trước";
}

// ── Main client ───────────────────────────────────────────────

export function ActivityAdminClient({ employees, currentUserId, currentUserName }: Props) {
  const [targetId, setTargetId] = useState<TargetId>("all");
  const [days, setDays] = useState(30);
  const [tab, setTab] = useState<"timeline" | "sessions" | "modules">("timeline");

  const isAll = targetId === "all";

  const [pageStats, setPageStats] = useState<PageStatsResponse["data"] | null>(null);
  const [pageStatsLoading, setPageStatsLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(true);
  const [online, setOnline] = useState<OnlineUser[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [alerts, setAlerts] = useState<AnomalyRow[]>([]);

  // page-stats: supports all (omit employeeId) or single
  useEffect(() => {
    setPageStatsLoading(true);
    const url = isAll
      ? `/api/activity/page-stats?days=${days}`
      : `/api/activity/page-stats?employeeId=${targetId}&days=${days}`;
    fetch(url)
      .then((r) => r.json())
      .then((j: PageStatsResponse) => setPageStats(j.data ?? null))
      .catch(() => setPageStats(null))
      .finally(() => setPageStatsLoading(false));
  }, [targetId, days, isAll]);

  // sessions (recent, scoped)
  useEffect(() => {
    setSessionsLoading(true);
    const qs = new URLSearchParams({ days: String(Math.min(days, 14)), limit: "40" });
    if (!isAll) qs.set("employeeId", String(targetId));
    fetch(`/api/activity/sessions?${qs}`)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((j) => setSessions(j.data ?? []))
      .catch(() => setSessions([]))
      .finally(() => setSessionsLoading(false));
  }, [targetId, isAll, days]);

  // timeline (audit feed)
  useEffect(() => {
    setTimelineLoading(true);
    const qs = new URLSearchParams({ limit: "50" });
    if (!isAll) qs.set("employeeId", String(targetId));
    fetch(`/api/activity/timeline?${qs}`)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((j) => setTimeline(j.data ?? []))
      .catch(() => setTimeline([]))
      .finally(() => setTimelineLoading(false));
  }, [targetId, isAll]);

  // online users (all mode)
  useEffect(() => {
    if (!isAll) { setOnline([]); return; }
    fetch(`/api/activity/online-users`)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((j) => setOnline(j.data ?? []))
      .catch(() => setOnline([]));
  }, [isAll]);

  // top users (all mode)
  useEffect(() => {
    if (!isAll) { setTopUsers([]); return; }
    fetch(`/api/activity/top-users?days=${days}&limit=10`)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((j) => setTopUsers(j.data ?? []))
      .catch(() => setTopUsers([]));
  }, [isAll, days]);

  // anomalies (always)
  useEffect(() => {
    fetch(`/api/admin/anomalies?status=OPEN&limit=20`)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((j) => setAlerts(j.data ?? []))
      .catch(() => setAlerts([]));
  }, []);

  const targetEmp = !isAll ? employees.find((e) => e.id === targetId) : undefined;

  // ── Stat cards ──
  const stats = useMemo(() => {
    const totalSec = pageStats?.totalSec ?? 0;
    const totalRows = pageStats?.totalRows ?? 0;
    if (isAll) {
      const totalActive = topUsers.reduce((s, u) => s + u.activeSeconds, 0);
      const avgPerUser = topUsers.length > 0 ? Math.round(totalActive / topUsers.length) : 0;
      return [
        { c: "#3B5BDB", v: `${online.length}/${employees.length}`, l: "Online / Tổng",   d: "trong 10 phút qua",       dc: online.length > 0 ? "up" as const : "" as const },
        { c: "#059669", v: formatDuration(totalActive),            l: `Tổng active / ${days} ngày`, d: `${topUsers.length} người tham gia`, dc: "" as const },
        { c: "#d97706", v: formatDuration(avgPerUser),             l: "TB / người",      d: `${days} ngày qua`,       dc: "" as const },
        { c: "#dc2626", v: String(alerts.length),                   l: "Cảnh báo mở",     d: "Toàn org",                dc: alerts.length > 0 ? "dn" as const : "" as const },
      ];
    }
    return [
      { c: "#3B5BDB", v: formatDuration(totalSec), l: `Tổng thời gian / ${days} ngày`, d: `${totalRows} ngày có dữ liệu`, dc: "" as const },
      { c: "#059669", v: String(pageStats?.topPages.length ?? 0), l: "Trang được xem", d: pageStats ? "trong khoảng đã chọn" : "—", dc: "" as const },
      { c: "#d97706", v: totalRows > 0 ? formatDuration(Math.round(totalSec / totalRows)) : "—", l: "TB / ngày", d: targetEmp?.fullName ?? "—", dc: "" as const },
      { c: "#dc2626", v: String(alerts.length), l: "Cảnh báo mở", d: "Toàn org", dc: alerts.length > 0 ? "dn" as const : "" as const },
    ];
  }, [isAll, pageStats, online, topUsers, alerts, employees.length, days, targetEmp]);

  const heatmapKey: number | "all" = isAll ? "all" : (targetId as number);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />

      {/* Page head */}
      <div className="page-head" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 22 }}>
        <div>
          <h1>Activity Tracking</h1>
          <p>
            {isAll
              ? "Tổng quan hoạt động toàn workspace — phiên đang mở, người dùng tích cực và cảnh báo."
              : "Theo dõi hoạt động chi tiết của 1 thành viên."}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div className="date-range">
            <select
              value={isAll ? "all" : String(targetId)}
              onChange={(e) => setTargetId(e.target.value === "all" ? "all" : Number(e.target.value))}
              style={{ minWidth: 200 }}
            >
              <option value="all">▦ Toàn bộ thành viên</option>
              <option value={String(currentUserId)}>(Tôi) {currentUserName}</option>
              {employees.filter((e) => e.id !== currentUserId).map((emp) => (
                <option key={emp.id} value={String(emp.id)}>{emp.fullName}{emp.department ? ` — ${emp.department}` : ""}</option>
              ))}
            </select>
            <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
              <option value={7}>7 ngày qua</option>
              <option value={14}>14 ngày qua</option>
              <option value={30}>30 ngày qua</option>
              <option value={60}>60 ngày qua</option>
              <option value={90}>90 ngày qua</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="at-stats">
        {stats.map((s, i) => (
          <div key={i} className="at-stat">
            <span className="ati" style={{ background: `${s.c}22`, color: s.c }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {i === 0 && (isAll
                  ? <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>
                  : <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" strokeLinecap="round"/></>)}
                {i === 1 && <path d="M3 12h4l3 8 4-16 3 8h4" strokeLinecap="round" strokeLinejoin="round"/>}
                {i === 2 && <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" strokeLinecap="round"/></>}
                {i === 3 && <><path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z"/><path d="M12 8v4M12 16h.01" strokeLinecap="round"/></>}
              </svg>
            </span>
            <div>
              <div className="atv">{pageStatsLoading && !isAll && i < 3 ? "…" : s.v}</div>
              <div className="atl">{s.l}</div>
              <div className={`atd ${s.dc}`}>{s.d}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Layout */}
      <div className="at-layout">
        <div className="at-main">

          {/* Heatmap */}
          <div className="ap">
            <div className="ap-head">
              <h3>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>
                {isAll ? "Heatmap hoạt động toàn org" : `Heatmap hoạt động — ${targetEmp?.fullName ?? ""}`}
              </h3>
              <span style={{ fontSize: ".72rem", color: "var(--text-3)" }}>{days} ngày</span>
            </div>
            <div className="ap-body">
              <ActivityHeatmap key={`${heatmapKey}-${days}`} employeeId={heatmapKey} days={days} />
            </div>
          </div>

          {/* Tabbed panel */}
          <div className="ap">
            <div className="at-tabs">
              <div className={`at-tab${tab === "timeline" ? " on" : ""}`} onClick={() => setTab("timeline")}>Timeline hoạt động</div>
              <div className={`at-tab${tab === "sessions" ? " on" : ""}`} onClick={() => setTab("sessions")}>Phiên đăng nhập</div>
              <div className={`at-tab${tab === "modules" ? " on" : ""}`} onClick={() => setTab("modules")}>Sử dụng module</div>
            </div>

            {tab === "timeline" && (
              <div className="ap-body" style={{ maxHeight: 520, overflowY: "auto" }}>
                {timelineLoading ? (
                  <div className="at-empty">Đang tải…</div>
                ) : timeline.length === 0 ? (
                  <div className="at-empty">Chưa có hoạt động nào</div>
                ) : (
                  <div className="timeline">
                    {renderTimelineGroups(timeline)}
                  </div>
                )}
              </div>
            )}

            {tab === "sessions" && (
              <div style={{ padding: 0 }}>
                {sessionsLoading ? (
                  <div className="at-empty">Đang tải…</div>
                ) : sessions.length === 0 ? (
                  <div className="at-empty">Chưa có phiên đăng nhập</div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table className="sess-table">
                      <thead>
                        <tr>
                          <th></th>
                          <th>Thành viên</th>
                          <th>IP · Địa điểm</th>
                          <th>Thiết bị</th>
                          <th>Đăng nhập</th>
                          <th>Thời lượng</th>
                          <th>Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessions.map((s) => {
                          const isActive = !s.logoutAt;
                          const name = s.employee?.fullName ?? targetEmp?.fullName ?? "—";
                          const endRef = s.logoutAt ?? s.lastActivityAt;
                          const durSec = Math.max(0, Math.round((new Date(endRef).getTime() - new Date(s.loginAt).getTime()) / 1000));
                          return (
                            <tr key={s.id}>
                              <td>
                                <span className="tl-av" style={{ width: 28, height: 28, borderRadius: 50, background: avColor(s.employeeId), fontSize: ".68rem" }}>
                                  {initials(name)}
                                </span>
                              </td>
                              <td style={{ fontWeight: 600, color: "var(--text)" }}>{name}</td>
                              <td>
                                <div style={{ fontFamily: "var(--font-mono)", fontSize: ".76rem" }}>{s.ipAddress ?? "—"}</div>
                                <div style={{ color: "var(--text-3)", fontSize: ".7rem" }}>{[s.city, s.country].filter(Boolean).join(" · ") || "—"}</div>
                              </td>
                              <td>
                                <div style={{ fontSize: ".8rem" }}>{s.device ?? "—"}</div>
                                <div style={{ color: "var(--text-3)", fontSize: ".72rem" }}>{s.browser ?? "—"}{s.os ? ` · ${s.os}` : ""}</div>
                              </td>
                              <td style={{ fontFamily: "var(--font-mono)", fontSize: ".78rem" }}>{fmtTime(s.loginAt)}</td>
                              <td style={{ fontFamily: "var(--font-mono)", fontSize: ".78rem" }}>{formatDuration(durSec)}</td>
                              <td>
                                {isActive
                                  ? <span className="flag ok">● Đang active</span>
                                  : <span className="flag na">⏻ {s.logoutReason ?? "Đã thoát"}</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {tab === "modules" && (
              <div className="ap-body">
                {pageStatsLoading ? (
                  <div className="at-empty">Đang tải…</div>
                ) : !pageStats || pageStats.topPages.length === 0 ? (
                  <div className="at-empty">Chưa có dữ liệu trong khoảng đã chọn</div>
                ) : (
                  <div>
                    <p style={{ fontSize: ".82rem", color: "var(--text-3)", marginBottom: 14 }}>
                      Tổng <b style={{ color: "var(--text)" }}>{formatDuration(pageStats.totalSec)}</b> · {pageStats.topPages.length} trang trong {days} ngày
                      {isAll && " · toàn org"}
                    </p>
                    {pageStats.topPages.slice(0, 12).map((p) => {
                      const pct = pageStats.totalSec > 0 ? (p.totalSec / pageStats.totalSec) * 100 : 0;
                      return (
                        <div key={p.path} className="mod-bar-row">
                          <span className="mbn" title={p.path}>{p.path}</span>
                          <div className="mbt"><i style={{ width: `${Math.min(100, pct)}%`, background: "#3B5BDB" }} /></div>
                          <span className="mbv">{formatDuration(p.totalSec)}</span>
                          {isAll && <span className="mbu">{p.uniqueEmployees}p</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        <div className="at-side">

          {/* Online / sessions panel */}
          <div className="ap">
            <div className="ap-head">
              <h3>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                {isAll ? "Đang online" : "Phiên hôm nay"}
                <span style={{ fontFamily: "var(--font-mono)", fontSize: ".72rem", background: "var(--ok-soft)", color: "var(--ok)", borderRadius: 99, padding: "2px 8px", marginLeft: 4 }}>
                  {isAll ? online.length : sessions.filter((s) => !s.logoutAt).length}
                </span>
              </h3>
            </div>
            <div className="ap-body">
              {isAll ? (
                online.length === 0 ? (
                  <div style={{ fontSize: ".82rem", color: "var(--text-3)", textAlign: "center", padding: "16px 0" }}>Không có ai online</div>
                ) : (
                  <div className="online-list">
                    {online.slice(0, 8).map((u) => (
                      <div key={u.id} className="ol-row">
                        <div className="ol-av" style={{ background: avColor(u.employeeId) }}>
                          {initials(u.employee.fullName)}
                          <span className="ol-pulse" />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div className="ol-name">{u.employee.fullName}</div>
                          <div className="ol-page">{u.employee.department ?? u.device ?? "—"}</div>
                        </div>
                        <div className="ol-dur" title={`Đăng nhập ${fmtTime(u.loginAt)}`}>{fmtRelative(u.lastActivityAt)}</div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                sessions.length === 0 ? (
                  <div style={{ fontSize: ".82rem", color: "var(--text-3)", textAlign: "center", padding: "16px 0" }}>Chưa có phiên nào</div>
                ) : (
                  <div className="online-list">
                    {sessions.slice(0, 6).map((s) => {
                      const isActive = !s.logoutAt;
                      return (
                        <div key={s.id} className="ol-row">
                          <div className="ol-av" style={{ background: avColor(s.employeeId) }}>
                            {initials(targetEmp?.fullName ?? "?")}
                            {isActive && <span className="ol-pulse" />}
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div className="ol-name">{targetEmp?.fullName ?? "—"}</div>
                            <div className="ol-page">{s.device ?? "—"}</div>
                          </div>
                          <div className="ol-dur">{fmtTime(s.loginAt)}</div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Top users — only in all-mode */}
          {isAll && (
            <div className="ap">
              <div className="ap-head">
                <h3>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  Thành viên hoạt động nhất
                </h3>
              </div>
              <div className="ap-body">
                {topUsers.length === 0 ? (
                  <div style={{ fontSize: ".82rem", color: "var(--text-3)", textAlign: "center", padding: "16px 0" }}>Chưa có dữ liệu</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {topUsers.slice(0, 5).map((u, i) => (
                      <div key={u.employeeId} className="tu-mini">
                        <span className="tu-rank">{i + 1}</span>
                        <span className="ol-av" style={{ background: avColor(u.employeeId) }}>{initials(u.fullName)}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="ol-name">{u.fullName}</div>
                          <div className="ol-page">{formatDuration(u.activeSeconds)} · {u.daysActive} ngày</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Alerts */}
          <div className="ap">
            <div className="ap-head">
              <h3>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z"/><path d="M12 8v4M12 16h.01"/></svg>
                Cảnh báo bất thường
                {alerts.length > 0 && (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: ".72rem", background: "var(--danger-soft)", color: "var(--danger)", borderRadius: 99, padding: "2px 8px", marginLeft: 4 }}>{alerts.length}</span>
                )}
              </h3>
            </div>
            <div className="ap-body">
              {alerts.length === 0 ? (
                <div style={{ fontSize: ".82rem", color: "var(--text-3)", textAlign: "center", padding: "16px 0" }}>Không có cảnh báo mở</div>
              ) : (
                <div className="alert-list">
                  {alerts.slice(0, 8).map((a) => {
                    const cls = a.severity === "CRITICAL" || a.severity === "HIGH" ? "danger" : "warn";
                    return (
                      <div key={a.id} className={`at-alert ${cls}`}>
                        <div className="ai">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z"/><path d="M12 8v4M12 16h.01"/></svg>
                        </div>
                        <div className="atxt">
                          <div className="at">{a.title}</div>
                          <div className="as">{a.employee?.fullName ?? "—"}{a.description ? ` · ${a.description}` : ""}</div>
                        </div>
                        <div className="at-time">{fmtRelative(a.createdAt)}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

// ── Style ─────────────────────────────────────────────────────

const STYLE = `
.at-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px}
.at-stat{background:var(--elev);border:1px solid var(--border);border-radius:var(--r-lg);padding:15px 17px;display:flex;align-items:center;gap:13px}
.at-stat .ati{width:40px;height:40px;border-radius:11px;display:grid;place-items:center;flex-shrink:0}
.at-stat .ati svg{width:18px;height:18px}
.at-stat .atv{font-size:1.5rem;font-weight:800;letter-spacing:-.02em;color:var(--text);line-height:1.1}
.at-stat .atl{font-size:.78rem;color:var(--text-3);margin-top:3px}
.at-stat .atd{font-size:.74rem;font-weight:600;margin-top:3px;color:var(--text-3)}
.atd.up{color:var(--ok)}.atd.dn{color:var(--danger)}

.at-layout{display:grid;grid-template-columns:1fr 340px;gap:16px}
.at-main{display:flex;flex-direction:column;gap:16px;min-width:0}
.at-side{display:flex;flex-direction:column;gap:16px}

.ap{background:var(--elev);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden}
.ap-head{display:flex;align-items:center;justify-content:space-between;padding:13px 17px;border-bottom:1px solid var(--border)}
.ap-head h3{font-size:.9rem;font-weight:700;display:flex;align-items:center;gap:8px;color:var(--text);margin:0}
.ap-head h3 svg{width:15px;height:15px;color:var(--accent-ink)}
.ap-body{padding:16px 17px}

.at-empty{padding:32px;text-align:center;color:var(--text-3);font-size:.86rem}

.at-tabs{display:flex;gap:4px;padding:10px;border-bottom:1px solid var(--border)}
.at-tab{font-size:.82rem;font-weight:500;padding:7px 14px;border-radius:8px;color:var(--text-2);cursor:pointer;transition:all .15s;user-select:none}
.at-tab:hover{color:var(--text);background:var(--content)}
.at-tab.on{background:var(--accent-soft);color:var(--accent-ink);font-weight:600}

.timeline{display:flex;flex-direction:column;gap:0}
.tl-day{padding:12px 0 6px;font-family:var(--font-mono);font-size:.72rem;color:var(--text-3);text-transform:uppercase;letter-spacing:.05em;position:sticky;top:0;background:var(--elev);z-index:2}
.tl-day:first-child{padding-top:2px}
.tl-item{display:flex;gap:13px;padding:10px 0;border-bottom:1px dashed var(--border);align-items:flex-start}
.tl-item:last-child{border-bottom:none}
.tl-content{flex:1;min-width:0}
.tl-who{font-weight:600;font-size:.84rem;color:var(--text)}
.tl-desc{font-size:.82rem;color:var(--text-2);margin-top:1px;line-height:1.4}
.tl-desc b{color:var(--text);font-weight:600;font-family:var(--font-mono);font-size:.78rem}
.tl-meta{font-family:var(--font-mono);font-size:.68rem;color:var(--text-3);margin-top:5px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.tl-badge{display:inline-flex;align-items:center;gap:4px;font-family:var(--font-mono);font-size:.64rem;font-weight:700;padding:2px 7px;border-radius:99px;letter-spacing:.04em}
.tl-badge.task{background:var(--accent-soft);color:var(--accent-ink)}
.tl-badge.login{background:var(--ok-soft);color:var(--ok)}
.tl-badge.salary{background:rgba(217,119,6,.12);color:#d97706}
.tl-badge.review{background:rgba(124,58,237,.12);color:#7c3aed}
.tl-badge.leave{background:rgba(190,24,93,.12);color:#be185d}
.tl-badge.vault{background:rgba(100,116,139,.14);color:#64748b}
.tl-badge.warn{background:var(--danger-soft);color:var(--danger)}

.mod-bar-row{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)}
.mod-bar-row:last-child{border-bottom:none}
.mbn{font-size:.82rem;font-weight:500;width:180px;flex-shrink:0;color:var(--text-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:var(--font-mono)}
.mbt{flex:1;height:8px;border-radius:99px;background:var(--border);overflow:hidden}
.mbt i{display:block;height:100%;border-radius:99px;transition:width .6s var(--ease)}
.mbv{font-family:var(--font-mono);font-size:.74rem;color:var(--text-3);width:60px;text-align:right;flex-shrink:0}
.mbu{font-family:var(--font-mono);font-size:.7rem;color:var(--text-3);width:34px;text-align:right;flex-shrink:0;background:var(--content);border:1px solid var(--border);border-radius:99px;padding:1px 6px}

.tu-row{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border)}
.tu-row:last-child{border-bottom:none}
.tu-mini{display:flex;align-items:center;gap:10px;padding:7px 10px;background:var(--content);border:1px solid var(--border);border-radius:9px}
.tu-rank{font-family:var(--font-mono);font-size:.74rem;color:var(--text-3);width:20px;text-align:right;flex-shrink:0;font-weight:700}
.tu-name{font-size:.86rem;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tu-meta{font-size:.72rem;color:var(--text-3);margin-top:1px}
.tu-bar{width:120px;height:6px;border-radius:99px;background:var(--border);overflow:hidden;flex-shrink:0}
.tu-bar i{display:block;height:100%;border-radius:99px;transition:width .6s var(--ease)}
.tu-val{font-family:var(--font-mono);font-size:.78rem;font-weight:700;color:var(--text-2);width:64px;text-align:right;flex-shrink:0}

.online-list{display:flex;flex-direction:column;gap:6px}
.ol-row{display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--content);border:1px solid var(--border);border-radius:9px}
.ol-av{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-size:.68rem;font-weight:700;color:#fff;flex-shrink:0;position:relative}
.ol-pulse{position:absolute;bottom:0;right:0;width:9px;height:9px;border-radius:50%;border:2px solid var(--elev);background:var(--ok)}
.ol-name{font-weight:600;font-size:.83rem;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ol-page{font-size:.72rem;color:var(--text-3);font-family:var(--font-mono);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ol-dur{font-size:.72rem;color:var(--text-3);font-family:var(--font-mono);margin-left:auto;flex-shrink:0}

.alert-list{display:flex;flex-direction:column;gap:8px}
.at-alert{display:flex;gap:11px;padding:11px 13px;border-radius:10px;border:1px solid;align-items:flex-start}
.at-alert.warn{background:rgba(251,191,36,.08);border-color:rgba(251,191,36,.25)}
.at-alert.danger{background:rgba(239,68,68,.08);border-color:rgba(239,68,68,.25)}
.at-alert .ai{width:28px;height:28px;border-radius:8px;display:grid;place-items:center;flex-shrink:0}
.at-alert.warn .ai{background:rgba(251,191,36,.15);color:#f59e0b}
.at-alert.danger .ai{background:rgba(239,68,68,.15);color:#ef4444}
.at-alert .ai svg{width:14px;height:14px}
.at-alert .atxt{flex:1;min-width:0}
.at-alert .atxt .at{font-weight:600;font-size:.83rem;color:var(--text)}
.at-alert .atxt .as{font-size:.74rem;color:var(--text-2);margin-top:2px;line-height:1.4}
.at-alert .at-time{font-family:var(--font-mono);font-size:.68rem;color:var(--text-3);margin-left:auto;white-space:nowrap;flex-shrink:0}

.date-range{display:flex;align-items:center;gap:8px;font-size:.83rem;flex-wrap:wrap}
.date-range select{background:var(--content);border:1.5px solid var(--border-2);border-radius:9px;padding:8px 11px;font-family:inherit;font-size:.84rem;color:var(--text);outline:none;transition:border-color .15s}
.date-range select:focus{border-color:var(--accent)}

.tl-av{display:grid;place-items:center;font-weight:700;color:#fff;flex-shrink:0}

.sess-table{width:100%;border-collapse:collapse;font-size:.84rem}
.sess-table th{text-align:left;padding:9px 12px;font-family:var(--font-mono);font-size:.64rem;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--text-3);border-bottom:1px solid var(--border);background:var(--content)}
.sess-table td{padding:10px 12px;border-bottom:1px solid var(--border);color:var(--text-2);vertical-align:middle}
.sess-table tbody tr:hover{background:var(--content)}
.sess-table tbody tr:last-child td{border-bottom:none}
.flag{display:inline-flex;align-items:center;gap:5px;font-family:var(--font-mono);font-size:.66rem;font-weight:600;padding:3px 9px;border-radius:99px;text-transform:uppercase;letter-spacing:.04em}
.flag.ok{background:var(--ok-soft);color:var(--ok)}
.flag.na{background:var(--border);color:var(--text-3)}
.flag.warn{background:var(--warn-soft);color:var(--warn)}

@media(max-width:1050px){.at-layout{grid-template-columns:1fr}.at-side{display:grid;grid-template-columns:1fr 1fr}}
@media(max-width:700px){.at-stats{grid-template-columns:1fr 1fr}.at-side{grid-template-columns:1fr}}
`;
