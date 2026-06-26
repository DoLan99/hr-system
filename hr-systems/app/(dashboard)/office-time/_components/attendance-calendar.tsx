"use client";

import { useState, useMemo } from "react";
import { format, addMonths, eachDayOfInterval, getDay } from "date-fns";
import { vi as viLocale } from "date-fns/locale";

// ─── Types ────────────────────────────────────────────────────────────────────
interface OTRecord {
  id: number;
  date: string;
  startWork1: string | null;
  endWorkday: string | null;
  actualWorked: number | null;
  approvalStatus: string;
  explanation?: string | null;
}

interface LeaveRecord {
  id: number;
  date: string;
  type: "VACATION" | "HOLIDAY" | "ILLNESS" | "OTHER";
  requestedHours: number;
  status: string;
}

interface EmployeeInfo {
  fullName: string;
  employeeCode: string | null;
  department: string | null;
  position?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  workSchedule?: string | null;
  annualLeaveDays?: number;
}

interface EmployeeListItem {
  id: number;
  fullName: string;
  department: string | null;
  employeeCode: string | null;
}

interface Props {
  records: OTRecord[];
  leaves: LeaveRecord[];
  employee: EmployeeInfo;
  employees?: EmployeeListItem[];       // list for SUPER_ADMIN / ADMIN / HR
  currentEmployeeId?: number;
  selfId?: number;
  initialMonth: number;
  initialYear: number;
  onMonthChange?: (month: number, year: number) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DOW_FULL = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

function fmt(iso: string | null | undefined): string {
  if (!iso) return "--";
  try { return format(new Date(iso), "HH:mm"); } catch { return "--"; }
}

function fmtMins(m: number | null): string {
  if (!m) return "--";
  const h = Math.floor(m / 60), mn = m % 60;
  return h + "h" + (mn ? mn + "p" : "");
}

type AttCode = "X" | "X/2" | "P" | "P/2" | "L" | "L/2" | "U" | "U/2" | "TS" | "TS/2"
  | "CĐ" | "CĐ/2" | "XU" | "XP" | "PU" | "CĐP" | "CĐU" | "--" | "OFF";

const CODE_STYLE: Record<string, { bg: string; color: string }> = {
  "X":    { bg: "rgba(34,197,94,.12)",  color: "#16a34a" },
  "X/2":  { bg: "rgba(34,197,94,.12)",  color: "#16a34a" },
  "P":    { bg: "rgba(139,92,246,.12)", color: "#7c3aed" },
  "P/2":  { bg: "rgba(139,92,246,.12)", color: "#7c3aed" },
  "L":    { bg: "rgba(239,68,68,.12)",  color: "#dc2626" },
  "L/2":  { bg: "rgba(239,68,68,.12)",  color: "#dc2626" },
  "U":    { bg: "rgba(248,113,113,.10)", color: "#b91c1c" },
  "U/2":  { bg: "rgba(248,113,113,.10)", color: "#b91c1c" },
  "TS":   { bg: "rgba(56,189,248,.12)", color: "#0284c7" },
  "TS/2": { bg: "rgba(56,189,248,.12)", color: "#0284c7" },
  "CĐ":   { bg: "rgba(20,184,166,.12)", color: "#0f766e" },
  "CĐ/2": { bg: "rgba(20,184,166,.12)", color: "#0f766e" },
  "XU":   { bg: "rgba(251,191,36,.12)", color: "#b45309" },
  "XP":   { bg: "rgba(251,191,36,.12)", color: "#b45309" },
  "PU":   { bg: "rgba(251,191,36,.12)", color: "#b45309" },
  "CĐP":  { bg: "rgba(20,184,166,.12)", color: "#0f766e" },
  "CĐU":  { bg: "rgba(20,184,166,.12)", color: "#0f766e" },
  "--":   { bg: "transparent",          color: "#94a3b8" },
  "OFF":  { bg: "transparent",          color: "#94a3b8" },
};

const CODE_LABEL: Record<string, string> = {
  "X": "Đi làm cả ngày", "X/2": "Đi làm sáng thứ 7",
  "P": "Nghỉ phép cả ngày", "P/2": "Nghỉ phép sáng thứ 7",
  "L": "Nghỉ lễ, Tết", "L/2": "Nghỉ lễ, Tết sáng thứ 7",
  "U": "NKL/Nghỉ BH cả ngày", "U/2": "NKL/Nghỉ BH sáng thứ 7",
  "TS": "Nghỉ thai sản", "TS/2": "Nghỉ thai sản sáng thứ 7",
  "CĐ": "Nghỉ chế độ cả ngày", "CĐ/2": "Nghỉ chế độ sáng thứ 7",
  "XU": "Đi làm nửa ngày, NKL nửa ngày",
  "XP": "Đi làm nửa ngày, nghỉ phép nửa ngày",
  "PU": "Nghỉ phép nửa ngày, NKL nửa ngày",
  "CĐP": "Nghỉ chế độ nửa ngày, phép nửa ngày",
  "CĐU": "Nghỉ chế độ nửa ngày, NKL nửa ngày",
  "--": "Không đi làm",
};

const LEAVE_TYPE_LABEL: Record<string, string> = {
  VACATION: "Nghỉ phép hưởng lương (Có lương)",
  HOLIDAY:  "Nghỉ lễ, Tết",
  ILLNESS:  "Nghỉ bệnh/ốm đau",
  OTHER:    "Nghỉ không lương",
};

// Payroll period: 26th prev-month → 25th this month
function getPayrollPeriod(year: number, month: number) {
  const start = new Date(year, month - 2, 26);
  const end = new Date(year, month - 1, 25);
  return { start, end };
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function AttendanceCalendar({
  records, leaves, employee, employees, currentEmployeeId, selfId,
  initialMonth, initialYear, onMonthChange,
}: Props) {
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [empSearch, setEmpSearch] = useState("");
  const [empDropOpen, setEmpDropOpen] = useState(false);

  function navigate(dir: 1 | -1) {
    const d = addMonths(new Date(year, month - 1), dir);
    const m = d.getMonth() + 1, y = d.getFullYear();
    setMonth(m); setYear(y);
    onMonthChange?.(m, y);
  }

  const { start, end } = getPayrollPeriod(year, month);
  const days = eachDayOfInterval({ start, end });

  const otMap = useMemo(() => {
    const m: Record<string, OTRecord> = {};
    records.forEach(r => { m[r.date.slice(0, 10)] = r; });
    return m;
  }, [records]);

  const leaveMap = useMemo(() => {
    const m: Record<string, LeaveRecord[]> = {};
    leaves.forEach(l => {
      const k = l.date.slice(0, 10);
      if (!m[k]) m[k] = [];
      m[k].push(l);
    });
    return m;
  }, [leaves]);

  function getDayCode(d: Date): AttCode {
    const dow = getDay(d);
    const isSat = dow === 6, isSun = dow === 0;
    const key = format(d, "yyyy-MM-dd");
    const ot = otMap[key];
    const lv = leaveMap[key] ?? [];
    const approvedLeave = lv.find(l => l.status === "APPROVED");

    if (isSun) return "--";
    if (isSat) { return ot?.startWork1 ? "X/2" : "--"; }

    const hasWork = !!ot?.startWork1;
    if (!approvedLeave) return hasWork ? "X" : "U";

    if (approvedLeave.type === "HOLIDAY") return hasWork ? "X" : "L";
    if (approvedLeave.type === "VACATION" || approvedLeave.type === "ILLNESS") {
      return hasWork ? "XP" : "P";
    }
    return hasWork ? "XU" : "U";
  }

  function getLateMinutes(ot: OTRecord | undefined): number {
    if (!ot?.startWork1) return 0;
    const ci = new Date(ot.startWork1);
    const mins = ci.getHours() * 60 + ci.getMinutes();
    return Math.max(0, mins - 9 * 60);
  }

  // Stats
  const stats = useMemo(() => {
    let chuanNgay = 0, thucTe = 0, ngayPhep = 0, nghiLe = 0, nghiKhongLuong = 0, nghiCheDoNgay = 0;
    days.forEach(d => {
      if (getDay(d) === 0 || getDay(d) === 6) return;
      chuanNgay++;
      const code = getDayCode(d);
      if (code === "X" || code === "X/2") thucTe++;
      if (code === "P") ngayPhep++;
      if (code === "L") nghiLe++;
      if (code === "U") nghiKhongLuong++;
      if (code === "CĐ") nghiCheDoNgay++;
      if (code === "XP" || code === "XU") { thucTe += 0.5; if (code === "XP") ngayPhep += 0.5; else nghiKhongLuong += 0.5; }
    });
    const tinhLuong = thucTe + ngayPhep + nghiLe + nghiCheDoNgay;
    const phepTonDau = (employee.annualLeaveDays ?? 12) / 2;
    return {
      chuanNgay, thucTe: Math.round(thucTe * 2) / 2, ngayPhep, nghiLe,
      nghiKhongLuong, nghiCheDoNgay, tinhLuong: Math.round(tinhLuong * 2) / 2,
      phepTonDau, phepConLai: Math.round(Math.max(0, phepTonDau - ngayPhep) * 2) / 2,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records, leaves, month, year]);

  // Build calendar weeks (Mon = col 0)
  const calendarRows = useMemo(() => {
    const grid: (Date | null)[][] = [];
    const firstDow = getDay(start);
    const offset = firstDow === 0 ? 6 : firstDow - 1;
    let week: (Date | null)[] = Array(offset).fill(null);
    days.forEach(d => {
      const col = getDay(d) === 0 ? 6 : getDay(d) - 1;
      if (col === 0 && week.length > 0) { grid.push(week); week = []; }
      week.push(d);
    });
    if (week.some(Boolean)) { while (week.length < 7) week.push(null); grid.push(week); }
    return grid;
  }, [days, start]);

  const today = format(new Date(), "yyyy-MM-dd");
  const periodLabel = `${format(start, "dd/MM/yyyy")} - ${format(end, "dd/MM/yyyy")}`;

  const filteredEmps = employees?.filter(e =>
    empSearch === "" ||
    e.fullName.toLowerCase().includes(empSearch.toLowerCase()) ||
    (e.employeeCode ?? "").toLowerCase().includes(empSearch.toLowerCase()) ||
    (e.department ?? "").toLowerCase().includes(empSearch.toLowerCase())
  ) ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--text)" }}>
            Bảng công — {employee.fullName}
          </h1>
          {employee.employeeCode && (
            <span style={{ fontSize: 13, color: "var(--text-3)", borderLeft: "1px solid var(--border)", paddingLeft: 12 }}>
              Mã NV: <b style={{ color: "var(--text-2)" }}>{employee.employeeCode}</b>
            </span>
          )}
          {employee.department && (
            <span style={{ fontSize: 13, color: "var(--text-3)", borderLeft: "1px solid var(--border)", paddingLeft: 12 }}>
              Phòng ban: <b style={{ color: "var(--text-2)" }}>{employee.department}</b>
            </span>
          )}
        </div>

        {/* Employee selector (SUPER_ADMIN / ADMIN / HR) */}
        {employees && employees.length > 0 && (
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setEmpDropOpen(o => !o)}
              style={{
                display: "flex", alignItems: "center", gap: 8, height: 36, padding: "0 14px",
                borderRadius: 10, border: "1px solid var(--border)",
                background: empDropOpen ? "var(--elev)" : "transparent",
                cursor: "pointer", color: "var(--text-2)", fontSize: 13, fontWeight: 600,
                fontFamily: "inherit",
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width={14} height={14}><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
              Xem nhân viên khác
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" width={13} height={13} style={{ opacity: .6 }}><path d="M6 9l6 6 6-6"/></svg>
            </button>

            {empDropOpen && (
              <>
                <div onClick={() => setEmpDropOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 10 }} />
                <div style={{
                  position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 20,
                  width: 280, background: "var(--content)", border: "1px solid var(--border)",
                  borderRadius: 14, boxShadow: "0 8px 32px rgba(0,0,0,.18)", overflow: "hidden",
                }}>
                  {/* Search */}
                  <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--elev)", borderRadius: 8, padding: "7px 10px" }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width={13} height={13} style={{ color: "var(--text-3)", flexShrink: 0 }}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                      <input
                        autoFocus
                        value={empSearch}
                        onChange={e => setEmpSearch(e.target.value)}
                        placeholder="Tìm theo tên, mã NV..."
                        style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 13, color: "var(--text)", fontFamily: "inherit" }}
                      />
                    </div>
                  </div>

                  {/* Employee list */}
                  <div style={{ maxHeight: 280, overflowY: "auto" }}>
                    {/* "Của tôi" option */}
                    {selfId && (
                      <a
                        href={`?view=calendar&employeeId=${selfId}`}
                        onClick={() => setEmpDropOpen(false)}
                        style={{
                          display: "flex", alignItems: "center", gap: 10, padding: "9px 14px",
                          textDecoration: "none",
                          background: currentEmployeeId === selfId ? "var(--accent-soft)" : "transparent",
                        }}
                        onMouseEnter={e => { if (currentEmployeeId !== selfId) (e.currentTarget as HTMLElement).style.background = "var(--elev)"; }}
                        onMouseLeave={e => { if (currentEmployeeId !== selfId) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                      >
                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--accent)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" width={14} height={14}><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: currentEmployeeId === selfId ? "var(--accent-ink)" : "var(--text)" }}>Của tôi</div>
                        </div>
                        {currentEmployeeId === selfId && (
                          <svg style={{ marginLeft: "auto", color: "var(--accent)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width={14} height={14}><path d="M20 6L9 17l-5-5"/></svg>
                        )}
                      </a>
                    )}

                    {filteredEmps.length === 0 && (
                      <div style={{ padding: "16px 14px", fontSize: 13, color: "var(--text-3)", textAlign: "center" }}>Không tìm thấy</div>
                    )}

                    {filteredEmps.map(emp => (
                      <a
                        key={emp.id}
                        href={`?view=calendar&employeeId=${emp.id}`}
                        onClick={() => setEmpDropOpen(false)}
                        style={{
                          display: "flex", alignItems: "center", gap: 10, padding: "9px 14px",
                          textDecoration: "none",
                          background: currentEmployeeId === emp.id ? "var(--accent-soft)" : "transparent",
                        }}
                        onMouseEnter={e => { if (currentEmployeeId !== emp.id) (e.currentTarget as HTMLElement).style.background = "var(--elev)"; }}
                        onMouseLeave={e => { if (currentEmployeeId !== emp.id) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                      >
                        <div style={{
                          width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                          background: "var(--elev)", border: "1px solid var(--border)",
                          display: "grid", placeItems: "center",
                          fontSize: 11, fontWeight: 700, color: "var(--text-2)",
                        }}>
                          {emp.fullName.split(" ").map(w => w[0]).slice(-2).join("").toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: currentEmployeeId === emp.id ? "var(--accent-ink)" : "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {emp.fullName}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                            {emp.employeeCode ?? ""}{emp.employeeCode && emp.department ? " · " : ""}{emp.department ?? ""}
                          </div>
                        </div>
                        {currentEmployeeId === emp.id && (
                          <svg style={{ flexShrink: 0, color: "var(--accent)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width={14} height={14}><path d="M20 6L9 17l-5-5"/></svg>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Deadline alert */}
      <div style={{
        display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 16px",
        background: "rgba(251,146,60,.08)", border: "1px solid rgba(251,146,60,.25)", borderRadius: 10,
      }}>
        <span style={{ width: 18, height: 18, borderRadius: "50%", background: "#f97316", color: "#fff", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 800, flexShrink: 0, marginTop: 1 }}>!</span>
        <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.7 }}>
          Vui lòng tạo đơn đăng ký trước 12h ngày {format(end, "dd")} — Quản lý duyệt trước 12 ngày {format(addMonths(end, 1), "dd")}.<br />
          <span style={{ color: "var(--text-3)" }}>Mọi thắc mắc liên hệ HC: Đinh Hồng Hoa – Administration (hoa.dh@kiotviet.com) trước 18h ngày {format(addMonths(end, 1), "dd")}.</span>
        </div>
      </div>

      {/* Main: calendar + stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, alignItems: "start" }}>
        {/* Calendar card */}
        <div style={{ background: "var(--content)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
          {/* Calendar header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => navigate(-1)} style={navBtnStyle}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" width={16} height={16}><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
                Tháng {String(month).padStart(2, "0")}/{year}
              </span>
              <button onClick={() => navigate(1)} style={navBtnStyle}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" width={16} height={16}><path d="M9 6l6 6-6 6"/></svg>
              </button>
            </div>
            <span style={{ fontSize: 12, color: "var(--text-3)" }}>{periodLabel}</span>
          </div>

          {/* Day-of-week header */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid var(--border)" }}>
            {["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"].map(d => (
              <div key={d} style={{
                textAlign: "center", padding: "10px 4px",
                fontSize: 12, fontWeight: 700,
                color: d.includes("7") || d.includes("nhật") ? "var(--text-3)" : "var(--text-2)",
              }}>{d}</div>
            ))}
          </div>

          {/* Calendar rows */}
          {calendarRows.map((week, wi) => (
            <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: wi < calendarRows.length - 1 ? "1px solid var(--border)" : "none" }}>
              {week.map((d, di) => {
                if (!d) return <div key={di} style={{ minHeight: 76, background: "var(--elev)", borderRight: di < 6 ? "1px solid var(--border)" : "none" }} />;
                const key = format(d, "yyyy-MM-dd");
                const isToday = key === today;
                const dow = getDay(d);
                const isOffDay = dow === 0 || dow === 6;
                const ot = otMap[key];
                const code = getDayCode(d);
                const codeStyle = CODE_STYLE[code] ?? CODE_STYLE["--"];
                const lateMin = getLateMinutes(ot);

                return (
                  <div
                    key={di}
                    onClick={() => !isOffDay && setSelectedDay(d)}
                    style={{
                      minHeight: 76, padding: "8px 6px",
                      borderRight: di < 6 ? "1px solid var(--border)" : "none",
                      background: isToday ? "rgba(101,130,255,.06)" : isOffDay ? "var(--elev)" : "transparent",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                      position: "relative",
                      cursor: isOffDay ? "default" : "pointer",
                      transition: "background .12s",
                    }}
                    onMouseEnter={e => { if (!isOffDay) (e.currentTarget as HTMLDivElement).style.background = isToday ? "rgba(101,130,255,.10)" : "var(--elev)"; }}
                    onMouseLeave={e => { if (!isOffDay) (e.currentTarget as HTMLDivElement).style.background = isToday ? "rgba(101,130,255,.06)" : "transparent"; }}
                  >
                    <span style={{
                      fontSize: 12, fontWeight: isToday ? 800 : 600,
                      color: isToday ? "var(--accent)" : isOffDay ? "var(--text-3)" : "var(--text-2)",
                      width: 22, height: 22, display: "grid", placeItems: "center",
                      borderRadius: "50%", background: isToday ? "rgba(101,130,255,.15)" : "transparent",
                    }}>{d.getDate()}</span>

                    {code !== "--" && code !== "OFF" ? (
                      <span style={{
                        fontSize: 12, fontWeight: 800, padding: "2px 7px", borderRadius: 5,
                        background: codeStyle.bg, color: codeStyle.color, letterSpacing: "-0.02em",
                      }}>{code}</span>
                    ) : (
                      <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 500 }}>--</span>
                    )}

                    {ot?.startWork1 && (
                      <span style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "var(--font-mono)", lineHeight: 1.2, textAlign: "center" }}>
                        {fmt(ot.startWork1)} - {ot.endWorkday ? fmt(ot.endWorkday) : "—"}
                      </span>
                    )}

                    {lateMin > 0 && (
                      <span title="Đi muộn" style={{
                        position: "absolute", top: 4, right: 4,
                        width: 7, height: 7, borderRadius: "50%", background: "#f97316",
                      }} />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Stats panel */}
        <div style={{ background: "var(--content)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "var(--text)" }}>
              Thống kê T{month}, {year}
            </h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--border)", borderBottom: "1px solid var(--border)" }}>
            <StatBox label="Công thực tế" value={stats.thucTe} color="var(--accent)" bg="rgba(101,130,255,.06)" />
            <StatBox label="Công tính lương" value={stats.tinhLuong} color="#16a34a" bg="rgba(34,197,94,.05)" />
          </div>
          <div style={{ padding: "10px 0" }}>
            {[
              { label: "Công chuẩn",              value: stats.chuanNgay },
              { label: "Phép",                     value: stats.ngayPhep > 0 ? stats.ngayPhep : null },
              { label: "Nghỉ lễ, Tết",             value: stats.nghiLe > 0 ? stats.nghiLe : null },
              { label: "Nghỉ chế độ",              value: stats.nghiCheDoNgay > 0 ? stats.nghiCheDoNgay : null },
              { label: "Nghỉ không lương",         value: stats.nghiKhongLuong > 0 ? stats.nghiKhongLuong : null },
              { label: "Nghỉ thai sản",            value: null },
              { label: "Phạt đi muộn/về sớm (h)",  value: null },
              { label: "Truy thu/ bù công",        value: null },
              { label: "Phép tồn đầu tháng",      value: stats.phepTonDau },
              { label: "Ngày phép còn lại",        value: stats.phepConLai },
            ].map(row => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 18px" }}>
                <span style={{ fontSize: 12.5, color: "var(--text-2)" }}>{row.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: row.value != null ? "var(--text)" : "var(--text-3)", fontFamily: "var(--font-mono)" }}>
                  {row.value != null ? row.value : "--"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ background: "var(--content)", border: "1px solid var(--border)", borderRadius: 16, padding: "16px 20px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>Chú thích</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "8px 24px" }}>
          {LEGEND.map(item => (
            <div key={item.code} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                width: 36, height: 22, display: "grid", placeItems: "center", flexShrink: 0,
                borderRadius: 5, fontSize: 11, fontWeight: 800, letterSpacing: "-0.02em",
                background: CODE_STYLE[item.code]?.bg ?? "transparent",
                color: CODE_STYLE[item.code]?.color ?? "var(--text-3)",
                border: `1px solid ${CODE_STYLE[item.code]?.color ? CODE_STYLE[item.code].color + "33" : "var(--border)"}`,
              }}>
                {item.code === "--"
                  ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width={12} height={12}><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/></svg>
                  : item.code}
              </span>
              <span style={{ fontSize: 12, color: "var(--text-2)" }}>{item.label}</span>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 36, display: "flex", justifyContent: "center" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f97316" }} />
            </span>
            <span style={{ fontSize: 12, color: "var(--text-2)" }}>Phạt đi muộn/về sớm</span>
          </div>
        </div>
      </div>

      {/* Day detail modal */}
      {selectedDay && (
        <DayDetailModal
          day={selectedDay}
          ot={otMap[format(selectedDay, "yyyy-MM-dd")]}
          leaves={leaveMap[format(selectedDay, "yyyy-MM-dd")] ?? []}
          code={getDayCode(selectedDay)}
          lateMinutes={getLateMinutes(otMap[format(selectedDay, "yyyy-MM-dd")])}
          employee={employee}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
}

// ─── Day Detail Modal ─────────────────────────────────────────────────────────
function DayDetailModal({
  day, ot, leaves, code, lateMinutes, employee, onClose,
}: {
  day: Date;
  ot: OTRecord | undefined;
  leaves: LeaveRecord[];
  code: AttCode;
  lateMinutes: number;
  employee: EmployeeInfo;
  onClose: () => void;
}) {
  const dow = getDay(day);
  const dowLabel = DOW_FULL[dow];
  const approvedLeave = leaves.find(l => l.status === "APPROVED");

  const totalWorkedMins = ot?.actualWorked ?? null;
  const penaltyHours = lateMinutes > 0 ? Math.round(lateMinutes / 60 * 10) / 10 : 0;

  const codeStyle = CODE_STYLE[code] ?? CODE_STYLE["--"];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 100, backdropFilter: "blur(2px)" }}
      />
      {/* Modal */}
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        zIndex: 101, width: "min(680px, 95vw)", background: "var(--content)",
        borderRadius: 18, boxShadow: "0 24px 64px rgba(0,0,0,.3)",
        border: "1px solid var(--border)", overflow: "hidden",
      }}>
        {/* Modal header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid var(--border)" }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--text)" }}>
            Chi tiết chấm công ngày {format(day, "dd/MM/yyyy")} ({dowLabel})
          </h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "var(--elev)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" width={16} height={16}><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 0 }}>
          {/* Employee info grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 32px", paddingBottom: 18, borderBottom: "1px solid var(--border)", marginBottom: 18 }}>
            <InfoRow label="Mã nhân viên" value={employee.employeeCode ?? "--"} bold />
            <InfoRow label="Họ tên" value={employee.fullName} bold />
            <InfoRow label="Phòng ban" value={employee.department ?? "--"} />
            <InfoRow label="Vị trí" value={employee.position ?? "--"} />
            <InfoRow label="Lịch làm việc" value={employee.workSchedule ?? "STANDARD_8H"} />
            <div />
            <InfoRow label="Ngày gia nhập" value={employee.startDate ? format(new Date(employee.startDate), "dd/MM/yyyy") : "--"} />
            <InfoRow label="Ngày nghỉ việc" value={employee.endDate ? format(new Date(employee.endDate), "dd/MM/yyyy") : "--"} />
          </div>

          {/* Time info row */}
          <div style={{ display: "flex", alignItems: "center", gap: 0, paddingBottom: 18, borderBottom: "1px solid var(--border)", marginBottom: 18 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 4 }}>Giờ vào đầu tiên</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: ot?.startWork1 ? "#16a34a" : "var(--text-3)", fontFamily: "var(--font-mono)" }}>
                {fmt(ot?.startWork1)}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 4 }}>Giờ ra cuối cùng</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: ot?.endWorkday ? "#dc2626" : "var(--text-3)", fontFamily: "var(--font-mono)" }}>
                {fmt(ot?.endWorkday)}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 4 }}>Tổng giờ</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: totalWorkedMins ? "#3b5bdb" : "var(--text-3)", fontFamily: "var(--font-mono)" }}>
                {totalWorkedMins ? fmtMins(totalWorkedMins) : "0h"}
              </div>
            </div>
          </div>

          {/* Công */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 14, borderBottom: "1px solid var(--border)", marginBottom: 14 }}>
            <span style={{ fontSize: 13, color: "var(--text-3)", minWidth: 40 }}>Công:</span>
            <span style={{
              fontSize: 13, fontWeight: 800, padding: "3px 10px", borderRadius: 6,
              background: codeStyle.bg, color: codeStyle.color,
              border: `1px solid ${codeStyle.color}33`,
            }}>{code}</span>
            <span style={{ fontSize: 14, color: "var(--text-2)" }}>{CODE_LABEL[code] ?? "--"}</span>
          </div>

          {/* Leave info */}
          {approvedLeave && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 14, borderBottom: "1px solid var(--border)", marginBottom: 14 }}>
              <span style={{ fontSize: 13, color: "var(--text-3)", minWidth: 100 }}>Đơn nghỉ phép:</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#7c3aed" }}>{LEAVE_TYPE_LABEL[approvedLeave.type] ?? approvedLeave.type}</span>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                background: "rgba(34,197,94,.12)", color: "#16a34a", border: "1px solid rgba(34,197,94,.3)",
              }}>Đã duyệt</span>
            </div>
          )}

          {/* Explanation */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, paddingBottom: 14, marginBottom: 14 }}>
            <span style={{ fontSize: 13, color: "var(--text-3)", minWidth: 60 }}>Giải trình:</span>
            <span style={{ fontSize: 13, color: ot?.explanation ? "var(--text)" : "var(--text-3)" }}>
              {ot?.explanation ?? "--"}
            </span>
          </div>

          {/* Penalty row */}
          <div style={{ display: "flex", alignItems: "center", gap: 40, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
            <div>
              <span style={{ fontSize: 13, color: "var(--text-3)" }}>Tổng phút đi muộn/về sớm: </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: lateMinutes > 0 ? "#f97316" : "var(--text)" }}>
                {lateMinutes} phút
              </span>
            </div>
            <div>
              <span style={{ fontSize: 13, color: "var(--text-3)" }}>Giờ phạt: </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: penaltyHours > 0 ? "#f97316" : "var(--text)" }}>
                {penaltyHours}h
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────
function StatBox({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div style={{ padding: "14px 16px", background: bg, display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{label}</span>
      <span style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
    </div>
  );
}

function InfoRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
      <span style={{ fontSize: 13, color: "var(--text-3)", flexShrink: 0 }}>{label}:</span>
      <span style={{ fontSize: 13, fontWeight: bold ? 700 : 500, color: "var(--text)" }}>{value}</span>
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  width: 30, height: 30, borderRadius: 8, border: "1px solid var(--border)",
  background: "transparent", cursor: "pointer", display: "grid", placeItems: "center",
  color: "var(--text-2)",
};

const LEGEND: { code: string; label: string }[] = [
  { code: "X",    label: "Đi làm cả ngày" },
  { code: "X/2",  label: "Đi làm sáng thứ 7" },
  { code: "P",    label: "Nghỉ phép cả ngày" },
  { code: "P/2",  label: "Nghỉ phép sáng thứ 7" },
  { code: "L",    label: "Nghỉ lễ, Tết" },
  { code: "L/2",  label: "Nghỉ lễ, Tết sáng thứ 7" },
  { code: "U",    label: "NKL/Nghỉ BH cả ngày" },
  { code: "U/2",  label: "NKL/Nghỉ BH sáng thứ 7" },
  { code: "CĐ",   label: "Nghỉ chế độ (tang gia,...)" },
  { code: "CĐ/2", label: "Nghỉ chế độ sáng thứ 7" },
  { code: "XU",   label: "Đi làm nửa ngày, NKL nửa ngày" },
  { code: "XP",   label: "Đi làm nửa ngày, nghỉ phép nửa ngày" },
  { code: "PU",   label: "Nghỉ phép nửa ngày, NKL nửa ngày" },
  { code: "CĐP",  label: "Nghỉ chế độ nửa ngày, phép nửa ngày" },
  { code: "CĐU",  label: "Nghỉ chế độ nửa ngày, NKL nửa ngày" },
  { code: "TS",   label: "Nghỉ thai sản" },
  { code: "TS/2", label: "Nghỉ thai sản sáng thứ 7" },
  { code: "--",   label: "Không đi làm" },
];
