"use client";

import { useState, useMemo, useCallback } from "react";
import { useCurrentUser } from "@/lib/contexts/current-user-context";
import { format } from "date-fns";
import { vi as viLocale } from "date-fns/locale";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];

type AttCode = "X" | "X/2" | "P" | "P/2" | "L" | "L/2" | "CĐ" | "CĐ/2" | "TS" | "TS/2"
  | "U" | "U/2" | "XP" | "XU" | "PU" | "CĐU" | "--";

interface GridDay {
  date: string; dow: number; isWorkDay: boolean; isWeekend: boolean;
  isSaturday: boolean; isFuture: boolean; code: AttCode;
  workUnit: number; leaveUnit: number;
  checkIn: string | null; checkOut: string | null;
  explanation: string | null; isManualTime: boolean;
  leaveType: string | null; leaveShift: string | null;
}

interface AttSummary {
  standardDays: number; actualDays: number; payrollDays: number;
  paidLeaveDays: number; unpaidLeaveDays: number; holidayDays: number;
  specialLeaveDays: number; maternityDays: number; lateCount: number;
}

interface Period { start: string; end: string; month: number; year: number; }

interface Employee { id: number; fullName: string; department: string | null; avatarUrl?: string | null; }

interface EmployeeInfo {
  employeeCode: string;
  fullName: string;
  department: string;
  position: string;
  startDate: string;
  status: string;
}

interface Props {
  initialGrid: GridDay[]; initialSummary: AttSummary; initialPeriod: Period;
  initialMonth: number; initialYear: number; employeeId: number;
  employees?: Employee[]; viewingName?: string | null;
  employeeInfo?: EmployeeInfo | null;
}

const CODE_COLOR: Record<string, string> = {
  "X": "#16a34a", "X/2": "#16a34a",
  "P": "#4338ca", "P/2": "#4338ca",
  "L": "#7c3aed", "L/2": "#7c3aed",
  "CĐ": "#ea580c", "CĐ/2": "#ea580c",
  "TS": "#db2777", "TS/2": "#db2777",
  "U": "#374151", "U/2": "#374151",
  "XP": "#4338ca", "XU": "#374151",
  "PU": "#7c3aed", "CĐU": "#991b1b",
};

const CODE_LABEL: Record<string, string> = {
  "X": "Đi làm", "X/2": "Nửa ngày làm",
  "P": "Nghỉ phép", "P/2": "Phép nửa ngày",
  "L": "Nghỉ lễ", "L/2": "Lễ nửa ngày",
  "CĐ": "Nghỉ chế độ", "CĐ/2": "Chế độ nửa ngày",
  "TS": "Thai sản", "TS/2": "Thai sản nửa ngày",
  "U": "NKL/Nghỉ BH cả ngày", "U/2": "NKL nửa ngày",
  "XP": "Làm + Nghỉ phép", "XU": "Làm + Không lương",
  "PU": "Phép + Không lương", "CĐU": "Chế độ + Không lương",
  "--": "Không làm việc",
};

const COL_HEADERS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];

function fmtTime(d: string | null | undefined): string {
  if (!d) return "";
  try { return format(new Date(d), "HH:mm"); } catch { return ""; }
}

function totalHours(ci: string | null, co: string | null): string {
  if (!ci || !co) return "0h";
  try {
    const diff = (new Date(co).getTime() - new Date(ci).getTime()) / 3600000;
    if (diff <= 0) return "0h";
    return diff % 1 === 0 ? `${diff}h` : `${diff.toFixed(1)}h`;
  } catch { return "0h"; }
}

function fmtNum(n: number): string {
  return n % 1 === 0 ? String(n) : n.toFixed(1);
}

export function OfficeTimeClient({
  initialGrid, initialSummary, initialPeriod,
  initialMonth, initialYear, employeeId, employees = [], viewingName, employeeInfo,
}: Props) {
  const user = useCurrentUser();
  const isManager = MANAGER_ROLES.includes(user.role.name);

  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [empId, setEmpId] = useState(employeeId);
  const [grid, setGrid] = useState(initialGrid);
  const [summary, setSummary] = useState(initialSummary);
  const [period, setPeriod] = useState(initialPeriod);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<GridDay | null>(null);

  const fetchData = useCallback(async (m: number, y: number, eid: number) => {
    setLoading(true);
    setModal(null);
    try {
      const p = new URLSearchParams({ month: String(m), year: String(y), employeeId: String(eid) });
      const res = await fetch(`/api/office-time?${p}`);
      const json = await res.json();
      setGrid(json.grid ?? []);
      setSummary(json.summary ?? initialSummary);
      setPeriod(json.period ?? initialPeriod);
    } finally { setLoading(false); }
  }, []);

  function changeMonth(delta: number) {
    let m = month + delta, y = year;
    if (m < 1) { m = 12; y--; } else if (m > 12) { m = 1; y++; }
    setMonth(m); setYear(y);
    fetchData(m, y, empId);
  }

  const weeks = useMemo(() => {
    const ws: GridDay[][] = [];
    let week: GridDay[] = [];
    for (const day of grid) {
      week.push(day);
      if (day.dow === 0) { ws.push(week); week = []; }
    }
    if (week.length > 0) ws.push(week);
    return ws;
  }, [grid]);

  const todayStr = format(new Date(), "yyyy-MM-dd");

  // Modal day label (e.g. "02/07/2026 (Thứ Năm)")
  const modalTitle = modal
    ? format(new Date(modal.date + "T12:00:00"), "dd/MM/yyyy (EEEE)", { locale: viLocale })
    : "";

  const emp = employeeInfo;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .ot-layout { display: grid; grid-template-columns: 1fr 300px; gap: 16px; align-items: start; }
        @media (max-width: 1100px) { .ot-layout { grid-template-columns: 1fr; } }

        .ot-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; }

        .ot-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px 12px; }
        .ot-month-nav { display: flex; align-items: center; gap: 4px; }
        .ot-nav-btn { width: 28px; height: 28px; border: none; background: transparent; border-radius: 7px; cursor: pointer; display: grid; place-items: center; color: #6b7280; transition: background .12s; }
        .ot-nav-btn:hover { background: #f3f4f6; color: #111827; }
        .ot-month-lbl { font-size: .92rem; font-weight: 700; color: #111827; min-width: 130px; text-align: center; font-variant-numeric: tabular-nums; }
        .ot-period-lbl { font-size: .74rem; color: #9ca3af; font-variant-numeric: tabular-nums; }

        .ot-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .ot-table th { font-size: .7rem; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: #9ca3af; padding: 8px 0; text-align: center; border-bottom: 1px solid #f3f4f6; }
        .ot-table th.wk { background: #f5f7ff; color: #b0bef5; }
        .ot-table td { padding: 0; }
        .ot-table td.wk { background: #f5f7ff; }

        .ot-cell { position: relative; padding: 10px 10px 8px; min-height: 82px; display: flex; flex-direction: column; align-items: flex-start; cursor: pointer; transition: background .12s; border: 1.5px solid transparent; margin: 2px; border-radius: 10px; }
        .ot-cell:hover { background: #f0f4ff; }
        .ot-cell.off { cursor: default; }
        .ot-cell.off:hover { background: transparent; }
        .ot-cell.today .ot-dnum { color: #2563eb; font-weight: 800; }
        .ot-dnum { font-size: .72rem; font-weight: 500; color: #9ca3af; line-height: 1; font-variant-numeric: tabular-nums; }
        .ot-code-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; gap: 5px; }
        .ot-code { font-size: 1.05rem; font-weight: 800; line-height: 1; font-variant-numeric: tabular-nums; }
        .ot-time { font-size: .63rem; color: #9ca3af; font-variant-numeric: tabular-nums; text-align: center; line-height: 1; }
        .ot-manual-dot { position: absolute; top: 7px; right: 7px; width: 5px; height: 5px; border-radius: 50%; background: #f59e0b; }

        /* Sidebar stats */
        .ot-sb-head { padding: 14px 18px 12px; border-bottom: 1px solid #f3f4f6; }
        .ot-sb-head h3 { margin: 0; font-size: .88rem; font-weight: 700; color: #111827; }
        .ot-sb-top { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 12px 18px; border-bottom: 1px solid #f3f4f6; }
        .ot-kpi { background: #eff6ff; border-radius: 10px; padding: 10px 12px; }
        .ot-kpi-lbl { font-size: .62rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #2563eb; margin-bottom: 4px; }
        .ot-kpi-val { font-size: 1.45rem; font-weight: 800; color: #1d4ed8; font-variant-numeric: tabular-nums; line-height: 1; }
        .ot-sb-section { padding: 10px 18px 2px; font-size: .68rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #9ca3af; }
        .ot-rows { padding: 0 18px 12px; }
        .ot-row { display: flex; align-items: center; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid #f9fafb; font-size: .8rem; }
        .ot-row:last-child { border-bottom: none; }
        .ot-row-lbl { color: #6b7280; }
        .ot-row-val { font-variant-numeric: tabular-nums; font-weight: 700; color: #111827; }
        .ot-row-val.dim { color: #d1d5db; font-weight: 400; }
        .ot-row-val.warn { color: #d97706; }

        /* Modal */
        .ot-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.35); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .ot-modal { background: #fff; border-radius: 16px; width: 100%; max-width: 620px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,.18); }
        .ot-modal-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 24px 16px; border-bottom: 1px solid #f3f4f6; }
        .ot-modal-head h2 { margin: 0; font-size: .96rem; font-weight: 700; color: #111827; }
        .ot-modal-close { width: 30px; height: 30px; border: none; background: #f3f4f6; border-radius: 8px; cursor: pointer; display: grid; place-items: center; color: #6b7280; font-size: 1rem; transition: background .12s; flex-shrink: 0; }
        .ot-modal-close:hover { background: #e5e7eb; color: #111827; }
        .ot-modal-body { padding: 20px 24px 24px; display: flex; flex-direction: column; gap: 0; }

        /* Modal info grid */
        .ot-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
        .ot-info-row { display: flex; align-items: baseline; gap: 6px; padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-size: .82rem; }
        .ot-info-row.full { grid-column: 1 / -1; }
        .ot-info-row:last-child { border-bottom: none; }
        .ot-info-lbl { color: #6b7280; white-space: nowrap; flex-shrink: 0; }
        .ot-info-val { font-weight: 700; color: #111827; }
        .ot-info-val.accent { color: #16a34a; }

        /* Attendance row in modal */
        .ot-att-row { display: flex; align-items: center; gap: 24px; padding: 12px 0; border-bottom: 1px solid #f3f4f6; font-size: .82rem; }
        .ot-att-item { display: flex; flex-direction: column; gap: 2px; }
        .ot-att-lbl { font-size: .68rem; color: #9ca3af; font-weight: 500; }
        .ot-att-val { font-weight: 700; color: #111827; font-variant-numeric: tabular-nums; }
        .ot-att-val.red { color: #dc2626; }
        .ot-att-val.blue { color: #2563eb; }

        /* Code badge in modal */
        .ot-code-badge { display: inline-flex; align-items: center; gap: 8px; padding: 5px 12px 5px 8px; border-radius: 8px; font-size: .84rem; font-weight: 700; }
        .ot-code-badge span { width: 28px; height: 28px; border-radius: 6px; display: grid; place-items: center; font-size: .82rem; font-weight: 800; background: rgba(255,255,255,.5); }

        /* Topbar */
        .ot-topbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
        .ot-emp-sel { height: 32px; padding: 0 10px; border-radius: 8px; border: 1px solid #e5e7eb; background: #fff; font-family: inherit; font-size: .82rem; color: #374151; outline: none; cursor: pointer; }
        .ot-emp-sel:focus { border-color: #93c5fd; }
        .spin { animation: ot-spin .7s linear infinite; }
        @keyframes ot-spin { to { transform: rotate(360deg); } }
      ` }} />

      {/* Top bar */}
      <div className="ot-topbar">
        <div>
          <h1 style={{ margin: 0, fontSize: "1.08rem", fontWeight: 700 }}>Chấm công</h1>
          {viewingName && <p style={{ margin: "2px 0 0", fontSize: ".78rem", color: "#9ca3af" }}>Xem: {viewingName}</p>}
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {isManager && employees.length > 0 && (
            <select className="ot-emp-sel" value={empId} onChange={e => { const id = Number(e.target.value); setEmpId(id); fetchData(month, year, id); }}>
              {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
            </select>
          )}
          {loading && (
            <svg className="spin" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" width="16" height="16">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          )}
        </div>
      </div>

      <div className="ot-layout">
        {/* Calendar */}
        <div className="ot-card">
          <div className="ot-head">
            <div className="ot-month-nav">
              <button type="button" className="ot-nav-btn" onClick={() => changeMonth(-1)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" width="14" height="14"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <span className="ot-month-lbl">Tháng {String(month).padStart(2, "0")}/{year}</span>
              <button type="button" className="ot-nav-btn" onClick={() => changeMonth(1)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" width="14" height="14"><path d="M9 6l6 6-6 6" /></svg>
              </button>
            </div>
            <span className="ot-period-lbl">
              {format(new Date(period.start + "T12:00:00"), "dd/MM/yyyy")} – {format(new Date(period.end + "T12:00:00"), "dd/MM/yyyy")}
            </span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="ot-table">
              <thead>
                <tr>
                  {COL_HEADERS.map((h, i) => (
                    <th key={h} className={i >= 5 ? "wk" : ""}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weeks.map((week, wi) => (
                  <tr key={wi}>
                    {wi === 0 && Array.from({ length: (week[0].dow + 6) % 7 }).map((_, i) => (
                      <td key={`e${i}`} className={i >= 5 ? "wk" : ""} />
                    ))}
                    {week.map(day => {
                      const isOff = day.isWeekend || day.isSaturday;
                      const isToday = day.date === todayStr;
                      const color = CODE_COLOR[day.code] ?? "#374151";
                      const ci = fmtTime(day.checkIn);
                      const co = fmtTime(day.checkOut);
                      return (
                        <td key={day.date} className={isOff ? "wk" : ""}>
                          <div
                            className={["ot-cell", isOff ? "off" : "", isToday ? "today" : ""].filter(Boolean).join(" ")}
                            onClick={() => { if (!isOff) setModal(day); }}
                          >
                            {day.isManualTime && <span className="ot-manual-dot" title="Giờ chỉnh tay" />}
                            <span className="ot-dnum">{day.date.slice(8)}</span>
                            <div className="ot-code-wrap">
                              {isOff ? (
                                <span className="ot-code" style={{ color: "#d1d5db", fontSize: ".82rem", fontWeight: 400 }}>--</span>
                              ) : (
                                <>
                                  <span className="ot-code" style={{ color: day.isFuture ? "#9ca3af" : day.code === "--" ? "#9ca3af" : color, fontWeight: day.isFuture ? 400 : 800 }}>
                                    {day.code}
                                  </span>
                                  {!day.isFuture && (ci || co) && (
                                    <span className="ot-time">{ci}{co ? ` - ${co}` : ""}</span>
                                  )}
                                  {!day.isFuture && !ci && !co && day.code !== "--" && (
                                    <span className="ot-time" style={{ opacity: .4 }}>-</span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                    {wi === weeks.length - 1 && (() => {
                      const last = week[week.length - 1];
                      const filled = last.dow === 0 ? 7 : last.dow;
                      return Array.from({ length: 7 - filled }).map((_, i) => (
                        <td key={`t${i}`} className={(filled + i) >= 5 ? "wk" : ""} />
                      ));
                    })()}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats sidebar */}
        <div className="ot-card" style={{ position: "sticky", top: 76 }}>
          <div className="ot-sb-head">
            <h3>Thống kê T{String(month).padStart(2, "0")}, {year}</h3>
          </div>
          <div className="ot-sb-top">
            <div className="ot-kpi">
              <div className="ot-kpi-lbl">Công thực tế</div>
              <div className="ot-kpi-val">{fmtNum(summary.actualDays)}</div>
            </div>
            <div className="ot-kpi">
              <div className="ot-kpi-lbl">Công tính lương</div>
              <div className="ot-kpi-val">{fmtNum(summary.payrollDays)}</div>
            </div>
          </div>
          <div className="ot-sb-section">Chi tiết</div>
          <div className="ot-rows">
            {[
              { label: "Công chuẩn",              val: summary.standardDays,     warn: false },
              { label: "Phép",                    val: summary.paidLeaveDays,    warn: false },
              { label: "Nghi lễ, Tết",            val: summary.holidayDays,      warn: false },
              { label: "Nghỉ chế độ",             val: summary.specialLeaveDays, warn: false },
              { label: "Nghỉ không lương",        val: summary.unpaidLeaveDays,  warn: true  },
              { label: "Nghỉ thai sản",           val: summary.maternityDays,    warn: false },
              { label: "Phạt đi muộn/về sớm (h)", val: null,                     warn: false },
              { label: "Truy thu/ bù công",        val: null,                     warn: false },
              { label: "Phép tồn đầu tháng",      val: null,                     warn: false },
              { label: "Ngày phép còn lại",        val: null,                     warn: false },
            ].map(r => {
              const display = r.val === null ? "--" : r.val === 0 ? "--" : fmtNum(r.val);
              const dim = display === "--";
              return (
                <div key={r.label} className="ot-row">
                  <span className="ot-row-lbl">{r.label}</span>
                  <span className={`ot-row-val${dim ? " dim" : r.warn && !dim ? " warn" : ""}`}>{display}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Day detail modal */}
      {modal && (
        <div className="ot-overlay" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="ot-modal">
            <div className="ot-modal-head">
              <h2>Chi tiết chấm công ngày {modalTitle}</h2>
              <button type="button" className="ot-modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="ot-modal-body">
              {/* Employee info */}
              <div className="ot-info-grid">
                <div className="ot-info-row">
                  <span className="ot-info-lbl">Mã nhân viên:</span>
                  <span className="ot-info-val">{emp?.employeeCode ?? "--"}</span>
                </div>
                <div className="ot-info-row">
                  <span className="ot-info-lbl">Họ tên:</span>
                  <span className="ot-info-val">{emp?.fullName ?? "--"}</span>
                </div>
                <div className="ot-info-row">
                  <span className="ot-info-lbl">Phòng ban:</span>
                  <span className="ot-info-val">{emp?.department ?? "--"}</span>
                </div>
                <div className="ot-info-row">
                  <span className="ot-info-lbl">Vị trí:</span>
                  <span className="ot-info-val">{emp?.position ?? "--"}</span>
                </div>
                <div className="ot-info-row full">
                  <span className="ot-info-lbl">Lịch làm việc:</span>
                  <span className="ot-info-val">STANDARD_8H</span>
                </div>
                <div className="ot-info-row">
                  <span className="ot-info-lbl">Ngày gia nhập:</span>
                  <span className="ot-info-val">{emp?.startDate ?? "--"}</span>
                </div>
                <div className="ot-info-row">
                  <span className="ot-info-lbl">Ngày nghỉ việc:</span>
                  <span className="ot-info-val">{emp?.status === "INACTIVE" ? "--" : "--"}</span>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: "#f3f4f6", margin: "4px 0 12px" }} />

              {/* Attendance info */}
              <div className="ot-att-row">
                <div className="ot-att-item">
                  <span className="ot-att-lbl">Giờ vào đầu tiên</span>
                  <span className="ot-att-val" style={{ color: fmtTime(modal.checkIn) ? "#111827" : "#dc2626" }}>
                    {fmtTime(modal.checkIn) || "--"}
                  </span>
                </div>
                <div className="ot-att-item">
                  <span className="ot-att-lbl">Giờ ra cuối cùng</span>
                  <span className="ot-att-val" style={{ color: fmtTime(modal.checkOut) ? "#111827" : "#dc2626" }}>
                    {fmtTime(modal.checkOut) || "--"}
                  </span>
                </div>
                <div className="ot-att-item">
                  <span className="ot-att-lbl">Tổng giờ</span>
                  <span className="ot-att-val blue">{totalHours(modal.checkIn, modal.checkOut)}</span>
                </div>
              </div>

              {/* Work status */}
              <div style={{ padding: "12px 0", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: 10, fontSize: ".82rem" }}>
                <span style={{ color: "#6b7280" }}>Công:</span>
                <div
                  className="ot-code-badge"
                  style={{
                    background: modal.code === "--" ? "#f3f4f6" : `${CODE_COLOR[modal.code] ?? "#374151"}18`,
                    color: CODE_COLOR[modal.code] ?? "#374151",
                  }}
                >
                  <span style={{ background: `${CODE_COLOR[modal.code] ?? "#374151"}22` }}>{modal.code}</span>
                  {CODE_LABEL[modal.code] ?? ""}
                </div>
              </div>

              {/* Explanation */}
              <div style={{ padding: "12px 0", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "baseline", gap: 8, fontSize: ".82rem" }}>
                <span style={{ color: "#6b7280", flexShrink: 0 }}>Giải trình:</span>
                <span style={{ fontWeight: 500, color: modal.explanation ? "#111827" : "#9ca3af" }}>
                  {modal.explanation || "--"}
                </span>
              </div>

              {/* Late / penalty */}
              <div style={{ padding: "12px 0", display: "flex", alignItems: "center", gap: 32, fontSize: ".82rem" }}>
                <div style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
                  <span style={{ color: "#6b7280" }}>Tổng phút đi muộn/về sớm:</span>
                  <span style={{ fontWeight: 700 }}>0 phút</span>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
                  <span style={{ color: "#6b7280" }}>Giờ phạt:</span>
                  <span style={{ fontWeight: 700 }}>0h</span>
                </div>
              </div>

              {modal.isManualTime && (
                <div style={{ marginTop: 4, padding: "8px 12px", background: "#fffbeb", borderRadius: 8, fontSize: ".78rem", color: "#92400e", fontWeight: 600 }}>
                  ⚠ Giờ chấm công này đã được chỉnh sửa thủ công
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
