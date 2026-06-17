"use client";

import { useState, useMemo, useCallback } from "react";
import { useCurrentUser } from "@/lib/contexts/current-user-context";
import { format, addMonths, subMonths } from "date-fns";
import { vi as viLocale } from "date-fns/locale";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];
const WORK_START_HOUR = 9; // 09:00

interface TimeLogEntry {
  id: number;
  code: string;
  taskTitle: string;
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number;
  note: string | null;
}

interface OfficeRecord {
  id: number;
  date: string | Date;
  employeeId: number;
  startWork1: string | null;
  startLunch: string | null;
  startWork2: string | null;
  startAfternoonBreak: string | null;
  startWork3: string | null;
  endWorkday: string | null;
  timeLogsTotal: number;
  actualWorked: number | null;
  delta: number | null;
  explanation: string | null;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  approvedBy: { fullName: string } | null;
  approvedAt: string | null;
  timeLogs?: TimeLogEntry[];
}

interface Props {
  initialRecords: OfficeRecord[];
  initialMonth: number;
  initialYear: number;
  employeeId: number;
  employees?: { id: number; fullName: string; department: string | null; avatarUrl?: string | null }[];
  viewingName?: string | null;
}

function fmtTime(d: string | null | undefined): string {
  if (!d) return "—";
  try { return format(new Date(d), "HH:mm"); } catch { return "—"; }
}

function fmtMins(m: number | null | undefined): string {
  if (!m && m !== 0) return "—";
  const h = Math.floor(m / 60);
  const min = m % 60;
  return h + "h" + (min ? " " + min + "ph" : "");
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).slice(-2).join("").toUpperCase();
}

function lateMinutes(startWork1: string | null): number {
  if (!startWork1) return 0;
  const d = new Date(startWork1);
  const minutes = d.getHours() * 60 + d.getMinutes();
  const workStart = WORK_START_HOUR * 60;
  return Math.max(0, minutes - workStart);
}

export function OfficeTimeClient({
  initialRecords, initialMonth, initialYear, employeeId, employees = [], viewingName,
}: Props) {
  const user = useCurrentUser();
  const isManager = MANAGER_ROLES.includes(user.role.name);

  const [viewDate, setViewDate] = useState(new Date(initialYear, initialMonth - 1));
  const [records, setRecords] = useState<OfficeRecord[]>(initialRecords);
  const [targetEmpId, setTargetEmpId] = useState(employeeId);
  const [loading, setLoading] = useState<string | null>(null);

  // Filters
  const [selStatus, setSelStatus] = useState<"all" | "pending" | "approved">("all");

  // Detail Drawer
  const [drawerRecord, setDrawerRecord] = useState<OfficeRecord | null>(null);
  const [drawerLogs, setDrawerLogs] = useState<TimeLogEntry[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Approve/Reject modal
  const [actionModal, setActionModal] = useState<{ recordId: number; action: "approve" | "reject" } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Add/Edit record modal
  const [createModal, setCreateModal] = useState<{ record?: OfficeRecord } | null>(null);
  const [createForm, setCreateForm] = useState({ who: String(targetEmpId), date: format(new Date(), "yyyy-MM-dd"), checkIn: "08:30", checkOut: "", note: "" });
  const [createLoading, setCreateLoading] = useState(false);

  // Edit inline (for edit modal)
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [explanation, setExplanation] = useState("");

  const fetchRecords = useCallback(async (date: Date, empId: number) => {
    setLoading("fetch");
    try {
      const m = date.getMonth() + 1;
      const y = date.getFullYear();
      const res = await fetch(`/api/office-time?month=${m}&year=${y}&employeeId=${empId}`);
      const json = await res.json();
      setRecords(json.data ?? []);
    } finally { setLoading(null); }
  }, []);

  function navigateMonth(dir: 1 | -1) {
    const next = dir === 1 ? addMonths(viewDate, 1) : subMonths(viewDate, 1);
    setViewDate(next);
    fetchRecords(next, targetEmpId);
  }

  function switchEmployee(empId: number) {
    setTargetEmpId(empId);
    fetchRecords(viewDate, empId);
  }

  async function openDrawer(record: OfficeRecord) {
    setDrawerRecord(record);
    setDrawerLogs([]);
    setDrawerLoading(true);
    try {
      const dateStr = format(new Date(record.date), "yyyy-MM-dd");
      const res = await fetch(`/api/office-time/${record.id}?includeLogs=true`);
      if (res.ok) {
        const json = await res.json();
        setDrawerLogs(json.data?.timeLogs ?? []);
      }
    } catch { /* ignore */ } finally { setDrawerLoading(false); }
  }

  function closeDrawer() { setDrawerRecord(null); setDrawerLogs([]); }

  async function doApprove() {
    if (!actionModal) return;
    if (actionModal.action === "reject" && !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/office-time/${actionModal.recordId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: actionModal.action === "approve" ? "APPROVED" : "REJECTED", reason: rejectReason || undefined }),
      });
      const json = await res.json();
      if (json.data) {
        setRecords(prev => prev.map(r => r.id === actionModal.recordId ? json.data : r));
        if (drawerRecord?.id === actionModal.recordId) setDrawerRecord(json.data);
      }
      setActionModal(null);
      setRejectReason("");
    } finally { setActionLoading(false); }
  }

  async function doCreateRecord() {
    setCreateLoading(true);
    try {
      const isEdit = !!createModal?.record;
      const body = {
        employeeId: Number(createForm.who),
        date: createForm.date,
        startWork1: createForm.checkIn ? `${createForm.date}T${createForm.checkIn}:00` : undefined,
        endWorkday: createForm.checkOut ? `${createForm.date}T${createForm.checkOut}:00` : undefined,
        explanation: createForm.note || undefined,
      };
      const url = isEdit ? `/api/office-time/${createModal!.record!.id}` : "/api/office-time";
      const res = await fetch(url, { method: isEdit ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (json.data) {
        setRecords(prev => {
          const idx = prev.findIndex(r => r.id === json.data.id);
          if (idx >= 0) { const n = [...prev]; n[idx] = json.data; return n; }
          return [json.data, ...prev];
        });
      }
      setCreateModal(null);
    } finally { setCreateLoading(false); }
  }

  // Stats
  const stats = useMemo(() => {
    const withData = records.filter(r => r.startWork1);
    const approved = withData.filter(r => r.approvalStatus === "APPROVED");
    const pending = withData.filter(r => r.approvalStatus === "PENDING");
    const late = withData.filter(r => lateMinutes(r.startWork1) > 0);
    const totalMins = approved.reduce((s, r) => s + (r.actualWorked ?? 0), 0);
    const avgMins = approved.length ? Math.round(totalMins / approved.length) : 0;
    const onTimeRate = approved.length ? Math.round((approved.filter(r => !lateMinutes(r.startWork1)).length / approved.length) * 100) : 0;
    return { workDays: approved.length, onTimeRate, lateCount: late.length, avgMins, pending: pending.length };
  }, [records]);

  // Filtered records for table
  const filtered = useMemo(() => {
    let rows = records.filter(r => r.startWork1); // only rows with data
    if (selStatus === "pending") rows = rows.filter(r => r.approvalStatus === "PENDING");
    if (selStatus === "approved") rows = rows.filter(r => r.approvalStatus === "APPROVED");
    return rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, selStatus]);

  const monthLabel = format(viewDate, "MMMM yyyy", { locale: viLocale });
  const viewingEmp = employees.find(e => e.id === targetEmpId);

  function statusChip(status: OfficeRecord["approvalStatus"], startWork1: string | null) {
    if (!startWork1) return <span className="ot-status draft">— Nháp</span>;
    if (status === "APPROVED") return <span className="ot-status approved">✓ Đã duyệt</span>;
    if (status === "REJECTED") return <span className="ot-status rejected">✗ Từ chối</span>;
    return <span className="ot-status pending">● Chờ duyệt</span>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>

      {/* ── Page Header ── */}
      <div className="page-head" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 0 }}>
        <div>
          <h1>Office Time</h1>
          <p>Chấm công <b>{monthLabel}</b> · <b>{stats.pending}</b> bản ghi chờ duyệt</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="abtn ghost">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Xuất Excel
          </button>
          {isManager && (
            <button className="abtn primary" onClick={() => { setCreateForm({ who: String(targetEmpId), date: format(new Date(), "yyyy-MM-dd"), checkIn: "08:30", checkOut: "", note: "" }); setCreateModal({}); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ width: 15, height: 15 }}><path d="M12 5v14M5 12h14"/></svg>
              Thêm bản ghi
            </button>
          )}
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="kpis">
        <div className="kpi">
          <div className="kt"><span className="ki"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round"/></svg></span>Ngày đi làm</div>
          <div className="kv">{stats.workDays}</div>
          <div className="kc flat">tháng {format(viewDate, "M/yyyy")}</div>
        </div>
        <div className="kpi">
          <div className="kt"><span className="ki"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></span>Đúng giờ</div>
          <div className="kv">{stats.onTimeRate}%</div>
          <div className="kc up">{stats.workDays - stats.lateCount} / {stats.workDays} ngày</div>
        </div>
        <div className="kpi">
          <div className="kt"><span className="ki"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.3 3.9l-7 12A2 2 0 0 0 5 19h14a2 2 0 0 0 1.7-3l-7-12a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01" strokeLinecap="round"/></svg></span>Đi trễ</div>
          <div className="kv">{stats.lateCount}</div>
          <div className={`kc ${stats.lateCount > 0 ? "warn" : "flat"}`}>lần trong tháng</div>
        </div>
        <div className="kpi">
          <div className="kt"><span className="ki"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>TB giờ / ngày</div>
          <div className="kv">{fmtMins(stats.avgMins)}</div>
          <div className="kc flat">mỗi thành viên</div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="ot-bar">
        {/* Month nav */}
        <div className="month-nav">
          <button onClick={() => navigateMonth(-1)} title="Tháng trước">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <span className="month-label">{format(viewDate, "MMMM yyyy", { locale: viLocale })}</span>
          <button onClick={() => navigateMonth(1)} title="Tháng sau">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}><path d="M9 6l6 6-6 6"/></svg>
          </button>
        </div>

        {/* Member filter chips (manager) */}
        {isManager && employees.length > 0 && (
          <div className="mf-wrap">
            <button className={`mf-chip${targetEmpId === 0 ? " on" : ""}`} onClick={() => switchEmployee(employeeId)}>
              Của tôi
            </button>
            {employees.map(emp => (
              <button key={emp.id} className={`mf-chip${targetEmpId === emp.id ? " on" : ""}`} onClick={() => switchEmployee(emp.id)}>
                <span className="mf-av">{initials(emp.fullName)}</span>
                {emp.fullName.split(" ").pop()}
              </button>
            ))}
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Status filter */}
        <div className="range-seg" style={{ display: "inline-flex", background: "var(--elev)", border: "1px solid var(--border)", borderRadius: 9, padding: 3, gap: 2 }}>
          {(["all", "pending", "approved"] as const).map(s => (
            <button key={s} onClick={() => setSelStatus(s)}
              style={{ height: 30, padding: "0 13px", borderRadius: 7, fontFamily: "inherit", fontSize: ".82rem", fontWeight: 600, border: "none", cursor: "pointer", transition: "background .15s,color .15s",
                background: selStatus === s ? "var(--accent-soft)" : "none",
                color: selStatus === s ? "var(--accent-ink)" : "var(--text-3)" }}>
              {s === "all" ? "Tất cả" : s === "pending" ? "Chờ duyệt" : "Đã duyệt"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Table ── */}
      <div className="ot-table-wrap">
        <table className="ot-table">
          <thead>
            <tr>
              {isManager && <th>Thành viên</th>}
              <th>Ngày</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Giờ làm</th>
              <th>Trễ</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading === "fetch" ? (
              <tr><td colSpan={isManager ? 8 : 7} style={{ textAlign: "center", padding: "48px 20px", color: "var(--text-3)" }}>Đang tải…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={isManager ? 8 : 7} style={{ textAlign: "center", padding: "48px 20px", color: "var(--text-3)" }}>Không có dữ liệu cho bộ lọc này.</td></tr>
            ) : filtered.map(record => {
              const dateObj = new Date(record.date);
              const dateStr = format(dateObj, "yyyy-MM-dd");
              const isTodayRow = dateStr === format(new Date(), "yyyy-MM-dd");
              const lateMin = lateMinutes(record.startWork1);
              const isWorking = record.startWork1 && !record.endWorkday;
              const emp = employees.find(e => e.id === record.employeeId);

              return (
                <tr key={record.id} data-id={record.id}
                  style={{ cursor: "pointer", ...(isTodayRow && record.approvalStatus === "PENDING" ? { background: "rgba(59,91,219,.04)" } : {}) }}
                  onClick={() => openDrawer(record)}>

                  {isManager && (
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <span className="av-sm" style={{ width: 28, height: 28, fontSize: ".7rem", flexShrink: 0 }}>
                          {emp ? initials(emp.fullName) : "?"}
                        </span>
                        <div>
                          <div style={{ fontSize: ".87rem", fontWeight: 600, color: "var(--text)" }}>{emp?.fullName ?? "—"}</div>
                          <div style={{ fontSize: ".72rem", color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>{emp?.department ?? ""}</div>
                        </div>
                      </div>
                    </td>
                  )}

                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontSize: ".86rem", fontWeight: 600, color: "var(--text)" }}>{format(dateObj, "dd/MM/yyyy")}</span>
                      <span style={{ fontSize: ".72rem", color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
                        {["CN","T2","T3","T4","T5","T6","T7"][dateObj.getDay()]}{isTodayRow ? " · Hôm nay" : ""}
                      </span>
                    </div>
                  </td>

                  <td>
                    <span className="ot-time">{fmtTime(record.startWork1)}</span>
                  </td>

                  <td>
                    {record.endWorkday
                      ? <span className="ot-time">{fmtTime(record.endWorkday)}</span>
                      : isWorking
                        ? <span className="ot-time" style={{ color: "var(--ok)", fontWeight: 600, animation: "wpulse 1.5s infinite" }}>▶ đang làm</span>
                        : <span className="ot-time missing">—</span>}
                  </td>

                  <td>
                    {record.actualWorked
                      ? <span className={`ot-hours${record.actualWorked < 360 ? " low" : ""}`}>{fmtMins(record.actualWorked)}</span>
                      : <span className="ot-hours" style={{ color: "var(--text-3)" }}>—</span>}
                  </td>

                  <td>
                    {lateMin > 0
                      ? <span className="ot-late">+{lateMin}ph</span>
                      : <span style={{ color: "var(--text-3)", fontFamily: "var(--font-mono)", fontSize: ".72rem" }}>—</span>}
                  </td>

                  <td>{statusChip(record.approvalStatus, record.startWork1)}</td>

                  <td onClick={e => e.stopPropagation()}>
                    <div className="ot-btns">
                      {isManager && record.approvalStatus === "PENDING" && record.startWork1 ? (
                        <>
                          <button className="ot-btn approve" onClick={() => { setActionModal({ recordId: record.id, action: "approve" }); setRejectReason(""); }}>✓ Duyệt</button>
                          <button className="ot-btn reject" onClick={() => { setActionModal({ recordId: record.id, action: "reject" }); setRejectReason(""); }}>✗ Từ chối</button>
                        </>
                      ) : record.approvalStatus === "APPROVED" ? (
                        <button className="ot-btn view" onClick={() => openDrawer(record)}>Xem chi tiết</button>
                      ) : (
                        <button className="ot-btn view" onClick={() => openDrawer(record)}>Xem chi tiết</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Detail Drawer ── */}
      <div className={`od-back${drawerRecord ? " open" : ""}`} onClick={closeDrawer} />
      <div className={`od-drawer${drawerRecord ? " open" : ""}`}>
        {drawerRecord && (() => {
          const dateObj = new Date(drawerRecord.date);
          const lateMin = lateMinutes(drawerRecord.startWork1);
          const emp = employees.find(e => e.id === drawerRecord.employeeId);
          const totalLogMins = drawerLogs.reduce((s, l) => s + (l.durationMinutes ?? 0), 0);
          return (
            <>
              <div className="od-head">
                <div className="od-type" style={{ background: "var(--accent)" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" style={{ width: 15, height: 15 }}><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                </div>
                <div>
                  <h3>{emp?.fullName ?? "Chi tiết"} · {format(dateObj, "dd/MM/yyyy")}</h3>
                  <div style={{ fontSize: ".76rem", color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
                    {["CN","T2","T3","T4","T5","T6","T7"][dateObj.getDay()]} · {statusChip(drawerRecord.approvalStatus, drawerRecord.startWork1)}
                  </div>
                </div>
                <button className="od-close" onClick={closeDrawer}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 17, height: 17 }}><path d="M6 6l12 12M18 6L6 18"/></svg>
                </button>
              </div>

              <div className="od-body">
                <div className="od-sec">Thông tin chấm công</div>
                <div className="od-meta">
                  <div className="od-row">
                    <span className="orl">Trạng thái</span>
                    <span className="orv">{statusChip(drawerRecord.approvalStatus, drawerRecord.startWork1)}</span>
                  </div>
                  <div className="od-row">
                    <span className="orl">Check-in</span>
                    <span className="orv">
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{fmtTime(drawerRecord.startWork1)}</span>
                      {lateMin > 0
                        ? <span className="ot-late">+{lateMin}ph trễ</span>
                        : drawerRecord.startWork1 ? <span style={{ fontSize: ".74rem", color: "var(--ok)" }}>● Đúng giờ</span> : null}
                    </span>
                  </div>
                  <div className="od-row">
                    <span className="orl">Nghỉ trưa</span>
                    <span className="orv"><span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{fmtTime(drawerRecord.startLunch)}</span></span>
                  </div>
                  <div className="od-row">
                    <span className="orl">Làm buổi chiều</span>
                    <span className="orv"><span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{fmtTime(drawerRecord.startWork2)}</span></span>
                  </div>
                  <div className="od-row">
                    <span className="orl">Check-out</span>
                    <span className="orv">
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                        {drawerRecord.endWorkday ? fmtTime(drawerRecord.endWorkday) : <span style={{ color: "var(--text-3)" }}>Chưa ra về</span>}
                      </span>
                    </span>
                  </div>
                  <div className="od-row">
                    <span className="orl">Giờ làm</span>
                    <span className="orv" style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: ".95rem" }}>{fmtMins(drawerRecord.actualWorked)}</span>
                  </div>
                  {drawerRecord.approvedBy && (
                    <div className="od-row">
                      <span className="orl">Người duyệt</span>
                      <span className="orv">
                        <span className="av-sm" style={{ width: 22, height: 22, fontSize: ".6rem" }}>{initials(drawerRecord.approvedBy.fullName)}</span>
                        {drawerRecord.approvedBy.fullName}
                      </span>
                    </div>
                  )}
                  {drawerRecord.explanation && (
                    <div className="od-row">
                      <span className="orl">Ghi chú</span>
                      <span className="orv">{drawerRecord.explanation}</span>
                    </div>
                  )}
                </div>

                <div className="od-sec">
                  Time Logs ({drawerLogs.length} mục · <span style={{ color: "var(--accent-ink)" }}>{fmtMins(totalLogMins)}</span>)
                </div>

                {drawerLoading ? (
                  <div style={{ padding: 16, textAlign: "center", color: "var(--text-3)", fontSize: ".83rem" }}>Đang tải…</div>
                ) : (
                  <div className="od-logs">
                    {drawerLogs.length === 0
                      ? <div style={{ padding: 16, textAlign: "center", color: "var(--text-3)", fontSize: ".83rem" }}>Chưa có time log nào.</div>
                      : drawerLogs.map(log => (
                          <div key={log.id} className="od-log-item">
                            <div className="od-log-top">
                              <span className="od-log-id">{log.code}</span>
                              <span className="od-log-title" title={log.taskTitle}>{log.taskTitle}</span>
                              <span className="od-log-dur">{fmtMins(log.durationMinutes)}</span>
                            </div>
                            <div className="od-log-time">
                              {log.startTime ? format(new Date(log.startTime), "HH:mm") : "—"} → {log.endTime ? format(new Date(log.endTime), "HH:mm") : <span style={{ color: "var(--ok)" }}>đang chạy</span>}
                            </div>
                            {log.note && <div className="od-log-note">{log.note}</div>}
                          </div>
                        ))}
                  </div>
                )}

                {isManager && drawerRecord.approvalStatus === "PENDING" && drawerRecord.startWork1 && (
                  <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                    <button className="abtn primary" style={{ flex: 1 }} onClick={() => { setActionModal({ recordId: drawerRecord.id, action: "approve" }); setRejectReason(""); }}>✓ Duyệt</button>
                    <button className="abtn ghost" style={{ color: "var(--danger)", borderColor: "rgba(255,107,107,.3)" }} onClick={() => { setActionModal({ recordId: drawerRecord.id, action: "reject" }); setRejectReason(""); }}>✗ Từ chối</button>
                  </div>
                )}
              </div>
            </>
          );
        })()}
      </div>

      {/* ── Approve / Reject Modal ── */}
      {actionModal && (() => {
        const record = records.find(r => r.id === actionModal.recordId);
        const isApprove = actionModal.action === "approve";
        const emp = employees.find(e => e.id === record?.employeeId);
        return (
          <div className="modal-back" onClick={e => { if (e.target === e.currentTarget) setActionModal(null); }}>
            <div className="ar-modal">
              <div className="ar-head">
                <div className="ar-ico" style={{ background: isApprove ? "var(--ok-soft)" : "var(--danger-soft)", color: isApprove ? "var(--ok)" : "var(--danger)" }}>
                  {isApprove
                    ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: 17, height: 17 }}><path d="M5 12l5 5L20 6"/></svg>
                    : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" style={{ width: 17, height: 17 }}><path d="M6 6l12 12M18 6L6 18"/></svg>}
                </div>
                <h3>{isApprove ? "Phê duyệt chấm công" : "Từ chối chấm công"}</h3>
                <button className="x" onClick={() => setActionModal(null)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 17, height: 17 }}><path d="M6 6l12 12M18 6L6 18"/></svg>
                </button>
              </div>

              <div className="ar-body">
                {record && (
                  <div className="ar-info">
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span className="av-sm" style={{ width: 32, height: 32, fontSize: ".8rem" }}>{emp ? initials(emp.fullName) : "?"}</span>
                      <div>
                        <div style={{ fontSize: ".9rem", fontWeight: 700 }}>{emp?.fullName ?? "—"}</div>
                        <div style={{ fontSize: ".78rem", color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
                          {format(new Date(record.date), "dd/MM/yyyy")} · Check-in: {fmtTime(record.startWork1)}{record.endWorkday ? ` → ${fmtTime(record.endWorkday)}` : ""}
                        </div>
                      </div>
                    </div>
                    {record.actualWorked ? (
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".82rem", color: "var(--text-3)", paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                        <span>Giờ làm:</span>
                        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text)" }}>{fmtMins(record.actualWorked)}</span>
                      </div>
                    ) : null}
                  </div>
                )}

                {!isApprove ? (
                  <div className="ar-field">
                    <label>Lý do từ chối <span style={{ color: "var(--danger)" }}>*</span></label>
                    <textarea
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder="Nhập lý do từ chối để thông báo cho nhân viên…"
                    />
                  </div>
                ) : (
                  <div style={{ fontSize: ".86rem", color: "var(--text-2)", lineHeight: 1.6 }}>
                    Xác nhận phê duyệt bản ghi chấm công này? Nhân viên sẽ được thông báo.
                  </div>
                )}
              </div>

              <div className="ar-foot">
                <button className="abtn ghost" onClick={() => setActionModal(null)}>Hủy</button>
                <button
                  className={`abtn ${isApprove ? "primary" : "ghost"}`}
                  style={!isApprove ? { color: "var(--danger)", borderColor: "rgba(255,107,107,.4)" } : undefined}
                  disabled={actionLoading || (!isApprove && !rejectReason.trim())}
                  onClick={doApprove}
                >
                  {actionLoading ? "Đang xử lý…" : isApprove ? "✓ Phê duyệt" : "✗ Xác nhận từ chối"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Add / Edit Record Modal ── */}
      {createModal && (
        <div className="modal-back" onClick={e => { if (e.target === e.currentTarget) setCreateModal(null); }}>
          <div className="ar-modal" style={{ maxWidth: 480 }}>
            <div className="ar-head">
              <div className="ar-ico" style={{ background: "var(--accent)", color: "#fff" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 17, height: 17 }}><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              </div>
              <h3>{createModal.record ? "Sửa bản ghi" : "Thêm bản ghi chấm công"}</h3>
              <button className="x" onClick={() => setCreateModal(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 17, height: 17 }}><path d="M6 6l12 12M18 6L6 18"/></svg>
              </button>
            </div>

            <div className="ar-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="ar-field">
                  <label>Thành viên *</label>
                  <select value={createForm.who} onChange={e => setCreateForm(f => ({ ...f, who: e.target.value }))}
                    style={{ fontFamily: "inherit", fontSize: ".9rem", color: "var(--text)", background: "var(--content)", border: "1.5px solid var(--border-2)", borderRadius: 9, padding: "9px 12px", outline: "none", width: "100%" }}>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}
                  </select>
                </div>
                <div className="ar-field">
                  <label>Ngày *</label>
                  <input type="date" value={createForm.date} onChange={e => setCreateForm(f => ({ ...f, date: e.target.value }))}
                    style={{ fontFamily: "inherit", fontSize: ".9rem", color: "var(--text)", background: "var(--content)", border: "1.5px solid var(--border-2)", borderRadius: 9, padding: "9px 12px", outline: "none", width: "100%" }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="ar-field">
                  <label>Check-in *</label>
                  <input type="time" value={createForm.checkIn} onChange={e => setCreateForm(f => ({ ...f, checkIn: e.target.value }))}
                    style={{ fontFamily: "inherit", fontSize: ".9rem", color: "var(--text)", background: "var(--content)", border: "1.5px solid var(--border-2)", borderRadius: 9, padding: "9px 12px", outline: "none", width: "100%" }} />
                </div>
                <div className="ar-field">
                  <label>Check-out</label>
                  <input type="time" value={createForm.checkOut} onChange={e => setCreateForm(f => ({ ...f, checkOut: e.target.value }))}
                    style={{ fontFamily: "inherit", fontSize: ".9rem", color: "var(--text)", background: "var(--content)", border: "1.5px solid var(--border-2)", borderRadius: 9, padding: "9px 12px", outline: "none", width: "100%" }} />
                </div>
              </div>
              <div className="ar-field">
                <label>Ghi chú</label>
                <textarea value={createForm.note} onChange={e => setCreateForm(f => ({ ...f, note: e.target.value }))}
                  style={{ fontFamily: "inherit", fontSize: ".9rem", color: "var(--text)", background: "var(--content)", border: "1.5px solid var(--border-2)", borderRadius: 9, padding: "9px 12px", outline: "none", resize: "vertical", minHeight: 68, width: "100%" }} />
              </div>
            </div>

            <div className="ar-foot">
              <button className="abtn ghost" onClick={() => setCreateModal(null)}>Hủy</button>
              <button className="abtn primary" onClick={doCreateRecord} disabled={createLoading || !createForm.checkIn}>
                {createLoading ? "Đang lưu…" : createModal.record ? "Lưu thay đổi" : "Tạo bản ghi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
