"use client";

import { useEffect, useState, useCallback } from "react";
import type { WorkloadResponse, ForecastResponse, SkillLoadResponse } from "@/lib/capacity/types";

const AV_COLORS = ["#3B5BDB","#2196f3","#7c3aed","#0891b2","#059669","#d97706","#dc2626","#be185d","#0f766e","#b45309","#1d4ed8","#6d28d9"];

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}
function capColor(pct: number) {
  if (pct > 100) return "#ef4444";
  if (pct > 85) return "#f97316";
  if (pct > 60) return "#3B5BDB";
  return "#22c55e";
}
function capBadgeClass(pct: number) {
  if (pct > 100) return "cap-over";
  if (pct > 85) return "cap-high";
  if (pct > 50) return "cap-ok";
  return "cap-low";
}
function capBadgeLabel(pct: number) {
  if (pct > 100) return `${pct}% Quá tải`;
  if (pct > 85) return `${pct}% Cao`;
  if (pct > 50) return `${pct}% Bình thường`;
  return `${pct}% Nhẹ`;
}
function Avatar({ name, idx, size = 28, radius = 8 }: { name: string; idx: number; size?: number; radius?: number }) {
  return (
    <span className="av-s" style={{ width: size, height: size, borderRadius: radius, background: AV_COLORS[idx % AV_COLORS.length], display: "grid", placeItems: "center", color: "#fff", fontSize: ".64rem", fontWeight: 700, flexShrink: 0 }}>
      {initials(name)}
    </span>
  );
}

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type View = "skills" | "members" | "timeline" | "forecast";

export function CapacityClient() {
  const [workload, setWorkload] = useState<WorkloadResponse | null>(null);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [skillLoad, setSkillLoad] = useState<SkillLoadResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("skills");

  const fetchAll = useCallback(async () => {
    const sd = ymd(new Date());
    const [wl, fc, sk] = await Promise.all([
      fetch(`/api/capacity/workload?startDate=${sd}&days=14`).then(r => r.json()),
      fetch(`/api/capacity/forecast`).then(r => r.json()),
      fetch(`/api/capacity/skill-load`).then(r => r.json()),
    ]);
    setWorkload(wl.data ?? null);
    setForecast(fc.data ?? null);
    setSkillLoad(sk.data ?? null);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchAll().finally(() => setLoading(false));
  }, [fetchAll]);

  const employees = workload?.employees ?? [];
  const overloaded = employees.filter(e => e.avgUtilization > 100).length;
  const avgUtil = employees.length ? Math.round(employees.reduce((s, e) => s + e.avgUtilization, 0) / employees.length) : 0;

  const taskTypes = skillLoad?.taskTypes ?? [];
  const skillRows = skillLoad?.rows ?? [];

  const TASK_TYPE_LABELS: Record<string, string> = {
    NORMAL: "Task thường",
    LEARNING: "Học tập / Training",
    NEW_RESEARCH: "Nghiên cứu mới",
    MEETING: "Họp / Sync",
    ADMIN: "Hành chính",
    BILLABLE_CLIENT: "Client (billable)",
    INTERNAL: "Nội bộ",
  };

  // Demand weights per task type (business priority × 100)
  const TASK_TYPE_DEMAND: Record<string, number> = {
    NORMAL: 85, LEARNING: 40, NEW_RESEARCH: 55,
    MEETING: 35, ADMIN: 30, BILLABLE_CLIENT: 90, INTERNAL: 50,
  };

  const totalEmpCount = Math.max(1, skillRows.length);

  const skillStats = taskTypes.map((tt, idx) => {
    const membersWith = skillRows.filter(r => r.skills.some(s => s.taskType === tt && s.experienceCount > 0));
    // Supply = % of team who has done this task type
    const supply = Math.round((membersWith.length / totalEmpCount) * 100);
    const demand = TASK_TYPE_DEMAND[tt] ?? 50;
    const gap = demand > supply + 10;
    return {
      name: tt,
      label: TASK_TYPE_LABELS[tt] ?? tt,
      membersWith,
      supply,
      demand,
      gap,
      color: AV_COLORS[idx % AV_COLORS.length],
    };
  });

  const gapSkills = skillStats.filter(s => s.gap).length;

  // Timeline: show per-employee per-day (first 10 days)
  const freeEmps = employees.filter(e => e.avgUtilization < 50);
  const overloadedEmps = employees.filter(e => e.avgUtilization > 100);

  // Forecast 6 months: derive from team backlog
  const totalBacklogH = forecast ? Math.round(forecast.team.totalBacklogMinutes / 60) : 0;
  const velocityH = forecast ? Math.round(forecast.team.totalVelocityPerWeek / 60) : 0;
  const etaWeeks = forecast?.team.etaWeeks ?? 0;
  const forecastEmployees = forecast?.employees.slice(0, 6) ?? [];

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 20px", color: "var(--text-3)", gap: 10 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        Đang tải capacity…
      </div>
    );
  }

  return (
    <div>
      {/* Page head */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 22 }}>
        <div>
          <h1>Capacity Planning</h1>
          <p style={{ fontSize: ".9rem", color: "var(--text-2)", marginTop: 4 }}>Phân tích workload, dự báo năng lực và gợi ý tuyển dụng / tái phân công.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <select className="fb-select" style={{ background: "var(--elev)", border: "1px solid var(--border-2)", borderRadius: 9, padding: "8px 12px", fontFamily: "inherit", fontSize: ".84rem", color: "var(--text)", outline: "none", height: 40 }}>
            <option>Sprint 14 (hiện tại)</option>
            <option>Sprint 15 (tiếp theo)</option>
            <option>Q3/2026</option>
          </select>
          <button className="abtn ghost">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="cp-stats">
        {[
          { color: "#3B5BDB", svg: <><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeLinecap="round"/><path d="M16 4a3 3 0 0 1 0 6M21 20a5 5 0 0 0-4-5" strokeLinecap="round"/></>, v: employees.length, l: "Thành viên đang hoạt động", d: "trong sprint này", dc: "ok" },
          { color: avgUtil > 90 ? "#dc2626" : "#d97706", svg: <path d="M3 12h4l3 8 4-16 3 8h4" strokeLinecap="round" strokeLinejoin="round"/>, v: `${avgUtil}%`, l: "Trung bình workload", d: avgUtil > 90 ? "⚠ Cần cân bằng" : "Mức ổn định", dc: avgUtil > 90 ? "danger" : "warn" },
          { color: "#dc2626", svg: <><path d="M10.3 3.9l-7 12A2 2 0 0 0 5 19h14a2 2 0 0 0 1.7-3l-7-12a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01" strokeLinecap="round"/></>, v: overloaded, l: "Thành viên bị quá tải", d: overloaded > 0 ? "Cần phân công lại" : "Không có", dc: overloaded > 0 ? "danger" : "ok" },
          { color: "#f97316", svg: <><circle cx="12" cy="8" r="5"/><path d="M8.5 12.5L7 22l5-3 5 3-1.5-9.5" strokeLinecap="round" strokeLinejoin="round"/></>, v: gapSkills, l: "Kỹ năng thiếu hụt", d: gapSkills > 0 ? "Xem chi tiết bên dưới" : "Đủ năng lực", dc: gapSkills > 0 ? "warn" : "ok" },
        ].map((s, i) => (
          <div className="cp-stat" key={i}>
            <span className="csi" style={{ background: s.color + "22", color: s.color }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">{s.svg}</svg>
            </span>
            <div>
              <div className="csv">{s.v}</div>
              <div className="csl">{s.l}</div>
              <div className={`csd ${s.dc}`}>{s.d}</div>
            </div>
          </div>
        ))}
      </div>

      {/* View chips */}
      <div className="cp-chips">
        {([["skills","Theo kỹ năng"],["members","Theo thành viên"],["timeline","Timeline / Sprint"],["forecast","Dự báo"]] as [View,string][]).map(([k,l]) => (
          <button key={k} className={`cp-chip${view === k ? " on" : ""}`} onClick={() => setView(k)}>{l}</button>
        ))}
      </div>

      {/* Layout */}
      <div className="cp-layout">
        <div className="cp-main">

          {/* Skills view */}
          {view === "skills" && (
            <div className="cp">
              <div className="cp-head">
                <h3>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5"/><path d="M8.5 12.5L7 22l5-3 5 3-1.5-9.5"/></svg>
                  Workload theo kỹ năng
                </h3>
                <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: ".78rem", color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
                  <span>■ Cung</span><span style={{ opacity: .45 }}>■ Cầu</span>
                </div>
              </div>
              <div className="skill-list">
                <div style={{ display: "grid", gridTemplateColumns: "180px minmax(0,1fr) 110px 80px", gap: 14, padding: "8px 18px", borderBottom: "1px solid var(--border)", background: "var(--content)" }}>
                  {["Kỹ năng","Cung / Cầu","Thành viên","Trạng thái"].map(h => (
                    <span key={h} style={{ fontFamily: "var(--font-mono)", fontSize: ".68rem", fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--text-3)" }}>{h}</span>
                  ))}
                </div>
                {skillStats.length === 0 ? (
                  <div style={{ padding: "32px", textAlign: "center", color: "var(--text-3)" }}>Chưa có dữ liệu kỹ năng</div>
                ) : skillStats.map((sk, i) => (
                  <div key={sk.name} style={{ display: "grid", gridTemplateColumns: "180px minmax(0,1fr) 110px 80px", gap: 14, alignItems: "center", padding: "11px 18px", borderBottom: "1px solid var(--border)" }}>
                    <div className="sk-name">
                      <span className="sk-dot" style={{ background: sk.color }} />
                      {sk.label}
                      {sk.gap && <span className="gap-badge">Thiếu</span>}
                    </div>
                    <div className="sk-bar-wrap">
                      <div className="sk-bar">
                        <div className="sf" style={{ width: `${Math.min(sk.supply, 100)}%`, background: sk.color }} />
                        <div className="st" style={{ left: `${Math.min(sk.demand, 100)}%` }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: ".64rem", color: "var(--text-3)" }}>
                        <span>Cung: {sk.supply}%</span><span>Cầu: {sk.demand}%</span>
                      </div>
                    </div>
                    <div className="sk-members">
                      <div style={{ display: "flex" }}>
                        {sk.membersWith.slice(0, 3).map((r, j) => (
                          <Avatar key={j} name={r.fullName} idx={skillRows.indexOf(r)} size={22} radius={50} />
                        ))}
                      </div>
                      <span>{sk.membersWith.length}</span>
                    </div>
                    <div className="sk-pct" style={{ color: sk.gap ? "var(--danger)" : "var(--ok)" }}>
                      {sk.gap ? `−${sk.demand - sk.supply}%` : "✓ Đủ"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Members view */}
          {view === "members" && (
            <div className="cp">
              <div className="cp-head">
                <h3>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 4a3 3 0 0 1 0 6M21 20a5 5 0 0 0-4-5" strokeLinecap="round"/></svg>
                  Workload từng thành viên
                </h3>
              </div>
              <table className="mem-table">
                <thead>
                  <tr>
                    <th>Thành viên</th>
                    <th>Phòng ban</th>
                    <th>Kỹ năng</th>
                    <th>Tasks</th>
                    <th>Giờ / tuần</th>
                    <th>Workload</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "var(--text-3)" }}>Chưa có dữ liệu workload</td></tr>
                  ) : employees.map((e, i) => {
                    const pct = Math.round(e.avgUtilization);
                    const c = capColor(pct);
                    const totalTasks = e.days.reduce((s, d) => s + d.taskCount, 0);
                    const totalH = Math.round(e.totalLoadMinutes / 60);
                    // Get skills from skillLoad rows for this employee
                    const empSkillRow = skillRows.find(r => r.employeeId === e.employeeId);
                    const empSkills = empSkillRow?.skills.filter(s => s.experienceCount > 0).slice(0, 2) ?? [];
                    return (
                      <tr key={e.employeeId}>
                        <td>
                          <div className="mem-av">
                            <Avatar name={e.fullName} idx={i} size={28} radius={8} />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: ".86rem", color: "var(--text)" }}>{e.fullName}</div>
                              <div style={{ fontSize: ".74rem", color: "var(--text-3)" }}>{e.department ?? "—"}</div>
                            </div>
                          </div>
                        </td>
                        <td>{e.department ?? "—"}</td>
                        <td>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {empSkills.length > 0 ? empSkills.map((s, j) => (
                              <span key={j} style={{ fontSize: ".7rem", padding: "1px 6px", borderRadius: 99, background: "var(--accent-soft)", color: "var(--accent-ink)", fontFamily: "var(--font-mono)" }}>{s.taskType}</span>
                            )) : <span style={{ color: "var(--text-3)", fontSize: ".78rem" }}>—</span>}
                          </div>
                        </td>
                        <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text)" }}>{totalTasks}</td>
                        <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text)" }}>{totalH}h</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div className="mem-bar"><i style={{ width: `${Math.min(pct, 100)}%`, background: c }} /></div>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: ".76rem", fontWeight: 700, color: c }}>{pct}%</span>
                          </div>
                        </td>
                        <td><span className={`cap-badge ${capBadgeClass(pct)}`}>{capBadgeLabel(pct)}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Timeline view */}
          {view === "timeline" && (
            <div className="cp">
              <div className="cp-head">
                <h3>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
                  Timeline workload theo tuần
                </h3>
                <div style={{ display: "flex", gap: 6, fontFamily: "var(--font-mono)", fontSize: ".7rem" }}>
                  <span style={{ color: "#22c55e" }}>■ &lt;60%</span>
                  <span style={{ color: "#3B5BDB" }}>■ 60-85%</span>
                  <span style={{ color: "#f97316" }}>■ 86-100%</span>
                  <span style={{ color: "#ef4444" }}>■ &gt;100%</span>
                </div>
              </div>
              <div className="sprint-grid">
                <div className="sg-head">
                  <div className="sg-name-col">Thành viên</div>
                  {employees[0]?.days.slice(0, 10).map(d => (
                    <div key={d.date} className="sg-week">{d.date.slice(5)}</div>
                  ))}
                </div>
                {employees.map((e, i) => (
                  <div className="sg-row" key={e.employeeId}>
                    <div className="sg-person">
                      <Avatar name={e.fullName} idx={i} size={22} radius={8} />
                      <span>{e.fullName.split(" ").slice(-1)[0]}</span>
                    </div>
                    <div className="sg-cells">
                      {e.days.slice(0, 10).map(d => {
                        const pct = Math.round(d.utilization);
                        const c = capColor(pct);
                        return (
                          <div key={d.date} className="sg-cell">
                            {pct > 0 ? (
                              <div className="sg-block" style={{ background: c + "22", color: c, border: `1px solid ${c}44` }} title={`${pct}%`}>{pct}%</div>
                            ) : (
                              <div className="sg-block" style={{ background: "var(--border)", color: "var(--text-3)", border: "1px solid var(--border)" }}>—</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Forecast view */}
          {view === "forecast" && (
            <div className="cp">
              <div className="cp-head">
                <h3>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6" strokeLinecap="round"/></svg>
                  Dự báo workload 6 tháng
                </h3>
              </div>
              <div className="cp-body">
                {forecastEmployees.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "32px", color: "var(--text-3)" }}>Chưa có dữ liệu dự báo</div>
                ) : (
                  <>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 0 }}>
                      <div style={{ width: 32, flexShrink: 0, paddingBottom: 10, display: "flex", flexDirection: "column", justifyContent: "space-between", height: 150, alignItems: "flex-end", fontFamily: "var(--font-mono)", fontSize: ".62rem", color: "var(--text-3)", paddingRight: 4 }}>
                        <span>100%</span><span>75%</span><span>50%</span><span>25%</span>
                      </div>
                      <div style={{ flex: 1, position: "relative" }}>
                        <div style={{ position: "absolute", inset: "0 0 10px 0", display: "flex", flexDirection: "column", justifyContent: "space-between", pointerEvents: "none" }}>
                          {[100,75,50,25].map(v => <div key={v} style={{ borderTop: "1px dashed var(--border)", width: "100%" }} />)}
                        </div>
                        <div className="fc-chart">
                          {forecastEmployees.map((e, i) => {
                            const backlogH = Math.round(e.backlogMinutes / 60);
                            const barH = Math.min(130, Math.round((e.backlogMinutes / (forecast!.team.totalBacklogMinutes || 1)) * 130 * forecastEmployees.length));
                            const isForecast = i >= 3;
                            return (
                              <div className="fc-bar-wrap" key={e.employeeId}>
                                <div className={`fc-bar ${isForecast ? "forecast" : "actual"}`} style={{ height: Math.max(4, barH) }}>
                                  <span className="fc-tip">{backlogH}h</span>
                                </div>
                                <span className="fc-lbl">{e.fullName.split(" ").slice(-1)[0]}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    <p style={{ fontSize: ".78rem", color: "var(--text-3)", marginTop: 10 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="12" height="12" style={{ verticalAlign: "middle", marginRight: 4 }}><path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z"/></svg>
                      Tổng backlog team: <b style={{ color: "var(--text)" }}>{totalBacklogH}h</b> · Velocity: <b style={{ color: "var(--text)" }}>{velocityH}h/tuần</b>
                      {etaWeeks ? ` · ETA: ~${etaWeeks} tuần` : ""}
                    </p>
                    <table className="mem-table" style={{ marginTop: 16 }}>
                      <thead>
                        <tr><th>Thành viên</th><th>Backlog</th><th>Velocity/tuần</th><th>ETA</th><th>Độ chính xác</th></tr>
                      </thead>
                      <tbody>
                        {forecastEmployees.map((e, i) => (
                          <tr key={e.employeeId}>
                            <td>
                              <div className="mem-av">
                                <Avatar name={e.fullName} idx={i} size={26} radius={8} />
                                <span style={{ fontWeight: 600, color: "var(--text)" }}>{e.fullName}</span>
                              </div>
                            </td>
                            <td style={{ fontFamily: "var(--font-mono)" }}>{Math.round(e.backlogMinutes / 60)}h ({e.backlogTasks} tasks)</td>
                            <td style={{ fontFamily: "var(--font-mono)" }}>{Math.round(e.velocityMinutesPerWeek / 60)}h</td>
                            <td style={{ fontFamily: "var(--font-mono)" }}>{e.etaWeeks != null ? `~${e.etaWeeks}w` : "—"}</td>
                            <td><span className={`cap-badge ${e.confidence === "high" ? "cap-ok" : e.confidence === "medium" ? "cap-high" : "cap-low"}`}>{e.confidence}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Side panel */}
        <div className="cp-side">
          {/* Recommendations */}
          <div className="cp">
            <div className="cp-head">
              <h3>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>
                Gợi ý từ hệ thống
              </h3>
            </div>
            <div className="cp-body">
              <div className="rec-list">
                {overloadedEmps.length > 0 && (
                  <div className="rec-card risk">
                    <div className="rec-ico">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 3.9l-7 12A2 2 0 0 0 5 19h14a2 2 0 0 0 1.7-3l-7-12a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>
                    </div>
                    <div>
                      <div className="rec-t">{overloadedEmps[0].fullName} đang quá tải</div>
                      <div className="rec-s">{Math.round(overloadedEmps[0].avgUtilization)}% workload. Xem xét chuyển task sang sprint sau hoặc phân công lại.</div>
                    </div>
                  </div>
                )}
                {gapSkills > 0 && (
                  <div className="rec-card hire">
                    <div className="rec-ico">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                    </div>
                    <div>
                      <div className="rec-t">Thiếu hụt {gapSkills} kỹ năng</div>
                      <div className="rec-s">Cầu vượt cung tại: {skillStats.filter(s => s.gap).map(s => s.name).join(", ")}. Cân nhắc tuyển thêm hoặc đào tạo.</div>
                    </div>
                  </div>
                )}
                {freeEmps.length > 0 && (
                  <div className="rec-card balance">
                    <div className="rec-ico">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h4l3 8 4-16 3 8h4" strokeLinecap="round"/></svg>
                    </div>
                    <div>
                      <div className="rec-t">Tái phân công để cân bằng</div>
                      <div className="rec-s">{freeEmps.map(e => e.fullName.split(" ").slice(-1)[0]).join(", ")} còn capacity trống ({freeEmps.map(e => Math.round(e.avgUtilization) + "%").join(", ")}). Có thể nhận thêm task.</div>
                    </div>
                  </div>
                )}
                {overloadedEmps.length === 0 && freeEmps.length === 0 && gapSkills === 0 && (
                  <div className="rec-card hire">
                    <div className="rec-ico">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                    </div>
                    <div>
                      <div className="rec-t">Workload cân bằng</div>
                      <div className="rec-s">Tất cả thành viên đang ở mức workload hợp lý. Tiếp tục theo dõi sprint tiếp theo.</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Top 5 workload */}
          <div className="cp">
            <div className="cp-head">
              <h3>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><rect x="7" y="11" width="3" height="6"/><rect x="12" y="7" width="3" height="10"/><rect x="17" y="13" width="3" height="4"/></svg>
                Workload top {Math.min(5, employees.length)}
              </h3>
            </div>
            <div className="cp-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[...employees].sort((a, b) => b.avgUtilization - a.avgUtilization).slice(0, 5).map((e, i) => {
                const pct = Math.round(e.avgUtilization);
                const c = capColor(pct);
                return (
                  <div key={e.employeeId} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: ".7rem", color: "var(--text-3)", width: 14, textAlign: "right" }}>{i + 1}</span>
                    <Avatar name={e.fullName} idx={i} size={26} radius={8} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: ".82rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.fullName.split(" ").slice(-1)[0]}</div>
                      <div className="mem-bar" style={{ width: "100%", marginTop: 4 }}><i style={{ width: `${Math.min(pct, 100)}%`, background: c }} /></div>
                    </div>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: ".78rem", fontWeight: 700, color: c }}>{pct}%</span>
                  </div>
                );
              })}
              {employees.length === 0 && <div style={{ color: "var(--text-3)", fontSize: ".84rem", textAlign: "center" }}>Chưa có dữ liệu</div>}
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
