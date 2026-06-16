"use client";

import { useState, useMemo } from "react";

const AV_COLORS = [
  "#3B5BDB","#2196f3","#7c3aed","#0891b2","#059669",
  "#d97706","#dc2626","#0f766e","#b45309","#1d4ed8",
  "#6d28d9","#047857","#be185d","#0369a1",
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AV_COLORS[Math.abs(hash) % AV_COLORS.length];
}

function getPerfColor(p: number) {
  if (p >= 9) return "#4ade80";
  if (p >= 8) return "#60a5fa";
  if (p >= 7) return "#fbbf24";
  return "#f87171";
}

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Đang làm",
  ON_LEAVE: "Nghỉ phép",
  PROBATION: "Thử việc",
  INACTIVE: "Đã nghỉ việc",
  active: "Đang làm",
  on_leave: "Nghỉ phép",
  probation: "Thử việc",
  inactive: "Đã nghỉ việc",
};

function statusBadgeClass(status: string) {
  const s = status?.toLowerCase();
  if (s === "active") return "badge active";
  if (s === "on_leave" || s === "leave") return "badge pending";
  if (s === "probation") return "badge processing";
  if (s === "inactive") return "badge inactive";
  return "badge";
}

type Employee = {
  id: string;
  employeeCode: string;
  fullName: string;
  avatarUrl?: string | null;
  emailCompany?: string | null;
  emailGoogle?: string | null;
  mobileCompany?: string | null;
  startDate?: string | null;
  status: string;
  dept?: { id: string; name: string } | null;
  role?: { id: string; name: string; label?: string | null } | null;
  manager?: { id: string; fullName: string } | null;
};

type Department = { id: string; name: string };
type Role = { id: string; name: string; label?: string | null };

type Props = {
  initialEmployees: Employee[];
  departments: Department[];
  roles: Role[];
};

export function EmployeesClient({ initialEmployees, departments, roles }: Props) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [activeDept, setActiveDept] = useState("Tất cả");

  // KPI stats
  const total = initialEmployees.length;
  const activeCount = initialEmployees.filter((e) => e.status?.toLowerCase() === "active").length;
  const onLeaveCount = initialEmployees.filter((e) =>
    ["on_leave", "leave"].includes(e.status?.toLowerCase())
  ).length;
  const deptCount = new Set(initialEmployees.map((e) => e.dept?.name).filter(Boolean)).size;

  // Dept tabs
  const deptNames = ["Tất cả", ...departments.map((d) => d.name)];

  // Filtered employees
  const filtered = useMemo(() => {
    return initialEmployees.filter((e) => {
      if (activeDept !== "Tất cả" && e.dept?.name !== activeDept) return false;
      if (statusFilter && e.status?.toLowerCase() !== statusFilter.toLowerCase()) return false;
      if (roleFilter && !(e.role?.name?.toLowerCase().includes(roleFilter.toLowerCase()) || e.role?.label?.toLowerCase().includes(roleFilter.toLowerCase()))) return false;
      const q = search.toLowerCase();
      if (q) {
        const name = e.fullName?.toLowerCase() || "";
        const email = (e.emailCompany || e.emailGoogle || "").toLowerCase();
        const dept = e.dept?.name?.toLowerCase() || "";
        if (!name.includes(q) && !email.includes(q) && !dept.includes(q)) return false;
      }
      return true;
    });
  }, [initialEmployees, activeDept, statusFilter, roleFilter, search]);

  return (
    <>
      {/* page-actions */}
      <div className="page-actions">
        <div>
          <h1>Nhân sự</h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-3)", marginTop: 3 }}>
            Quản lý toàn bộ thành viên, phòng ban và hồ sơ nhân viên.
          </p>
        </div>
        <div className="page-actions-right">
          <button className="abtn ghost">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export
          </button>
          <button className="abtn primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Thêm nhân viên
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpis">
        <div className="kpi">
          <div className="kt">
            <span className="ki">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="8" r="3"/>
                <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeLinecap="round"/>
                <path d="M16 4a3 3 0 0 1 0 6M21 20a5 5 0 0 0-4-5" strokeLinecap="round"/>
              </svg>
            </span>
            Tổng nhân viên
          </div>
          <div className="kv">{total}</div>
          <div className="kc up">+1 tháng này</div>
        </div>
        <div className="kpi">
          <div className="kt">
            <span className="ki">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4"/>
                <circle cx="12" cy="12" r="9"/>
              </svg>
            </span>
            Đang làm việc
          </div>
          <div className="kv">{activeCount}</div>
          <div className="kc up">{total > 0 ? Math.round((activeCount / total) * 100) : 0}% tổng</div>
        </div>
        <div className="kpi">
          <div className="kt">
            <span className="ki">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="17" rx="2"/>
                <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round"/>
              </svg>
            </span>
            Đang nghỉ phép
          </div>
          <div className="kv">{onLeaveCount}</div>
          <div className="kc flat">
            Thử việc: {initialEmployees.filter((e) => e.status?.toLowerCase() === "probation").length}
          </div>
        </div>
        <div className="kpi">
          <div className="kt">
            <span className="ki">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </span>
            Phòng ban
          </div>
          <div className="kv">{deptCount}</div>
          <div className="kc flat">{deptCount} phòng ban</div>
        </div>
      </div>

      {/* toolbar */}
      <div className="tools">
        <div className="seg">
          <button className={view === "grid" ? "on" : ""} onClick={() => setView("grid")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            Grid
          </button>
          <button className={view === "list" ? "on" : ""} onClick={() => setView("list")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
            </svg>
            List
          </button>
        </div>

        <select
          className="fchip"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ height: 36, padding: "0 13px", borderRadius: 9, background: "var(--elev)", border: "1px solid var(--border)", color: "var(--text-2)", fontFamily: "inherit", fontSize: "0.84rem", outline: "none" }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="active">Đang làm việc</option>
          <option value="on_leave">Nghỉ phép</option>
          <option value="probation">Thử việc</option>
          <option value="inactive">Đã nghỉ việc</option>
        </select>

        <select
          className="fchip"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{ height: 36, padding: "0 13px", borderRadius: 9, background: "var(--elev)", border: "1px solid var(--border)", color: "var(--text-2)", fontFamily: "inherit", fontSize: "0.84rem", outline: "none" }}
        >
          <option value="">Tất cả vai trò</option>
          {roles.map((r) => (
            <option key={r.id} value={r.name}>{r.label || r.name}</option>
          ))}
        </select>

        <div className="spacer" />

        <div className="tsearch">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7"/>
            <path d="M21 21l-4-4"/>
          </svg>
          <input
            type="text"
            placeholder="Tìm tên, email, phòng ban…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ fontSize: "0.84rem", color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
          {filtered.length} nhân viên
        </div>
      </div>

      {/* dept tabs */}
      <div className="stabs">
        {deptNames.map((dept) => {
          const count =
            dept === "Tất cả"
              ? initialEmployees.length
              : initialEmployees.filter((e) => e.dept?.name === dept).length;
          return (
            <button
              key={dept}
              className={`stab${activeDept === dept ? " on" : ""}`}
              onClick={() => setActiveDept(dept)}
            >
              {dept}
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.7rem",
                  background: activeDept === dept ? "rgba(255,255,255,0.2)" : "var(--content)",
                  border: "1px solid var(--border)",
                  borderRadius: 99,
                  padding: "1px 7px",
                  color: activeDept === dept ? "inherit" : "var(--text-3)",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* grid view */}
      {view === "grid" && (
        <div className="emp-grid">
          {filtered.map((emp) => {
            const initials = getInitials(emp.fullName);
            const color = getColor(emp.id);
            const email = emp.emailCompany || emp.emailGoogle || "";
            const roleName = emp.role?.label || emp.role?.name || "";
            const deptName = emp.dept?.name || "";
            const perf = 0; // no perf field in schema yet

            return (
              <div key={emp.id} className="emp-card">
                <div className="eav" style={{ background: color }}>
                  {emp.avatarUrl ? (
                    <img src={emp.avatarUrl} alt={emp.fullName} />
                  ) : (
                    initials
                  )}
                </div>
                <div className="en">{emp.fullName}</div>
                <div className="er">{roleName || email}</div>
                {deptName && <span className="ed">{deptName}</span>}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginTop: 4, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                  <span className={statusBadgeClass(emp.status)}>
                    {STATUS_LABEL[emp.status] || emp.status}
                  </span>
                  <span className="ep">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13" style={{ display: "inline", verticalAlign: "middle", marginRight: 3 }}>
                      <path d="M12 2l2.6 6.3L21 9l-5 4.3L17.5 20 12 16.5 6.5 20 8 13.3 3 9l6.4-.7z"/>
                    </svg>
                    <span style={{ color: getPerfColor(perf) }}>—</span>
                  </span>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 0", color: "var(--text-3)" }}>
              Không tìm thấy nhân viên nào
            </div>
          )}
        </div>
      )}

      {/* list view */}
      {view === "list" && (
        <div style={{ background: "var(--elev)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
          <table className="dtable">
            <thead>
              <tr>
                <th style={{ width: 32 }}></th>
                <th>Nhân viên</th>
                <th>Phòng ban</th>
                <th>Chức vụ</th>
                <th>Ngày vào</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => {
                const initials = getInitials(emp.fullName);
                const color = getColor(emp.id);
                const email = emp.emailCompany || emp.emailGoogle || "";
                const roleName = emp.role?.label || emp.role?.name || "—";
                const deptName = emp.dept?.name || "—";
                const joinDate = emp.startDate
                  ? new Date(emp.startDate).toLocaleDateString("vi-VN")
                  : "—";

                return (
                  <tr key={emp.id} style={{ cursor: "pointer", transition: "background 0.12s" }}>
                    <td>
                      <div
                        className="td-av"
                        style={{ width: 34, height: 34, borderRadius: 9, background: color, display: "grid", placeItems: "center", fontSize: "0.8rem", fontWeight: 700, color: "#fff" }}
                      >
                        {emp.avatarUrl ? (
                          <img src={emp.avatarUrl} alt={emp.fullName} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 9 }} />
                        ) : (
                          initials
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="td-bold">{emp.fullName}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-3)" }}>{email}</div>
                    </td>
                    <td>{deptName}</td>
                    <td style={{ color: "var(--text)" }}>{roleName}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem" }}>{joinDate}</td>
                    <td>
                      <span className={statusBadgeClass(emp.status)}>
                        {STATUS_LABEL[emp.status] || emp.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "60px 0", color: "var(--text-3)" }}>
                    Không tìm thấy nhân viên nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
