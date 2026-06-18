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
  const [view, setView] = useState<View>("members");

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
  const totalBacklogH = forecast ? Math.round(forecast.team.totalBacklogMinutes / 60) : 0;

  // Skills derived from skillLoad taskTypes
  const taskTypes = skillLoad?.taskTypes ?? [];
  const skillRows = skillLoad?.rows ?? [];

  // Build skill demand/supply from skillLoad
  const skillStats = taskTypes.map(tt => {
    const members = skillRows.filter(r => r.skills.some(s => s.taskType === tt && s.experienceCount > 0));
    const totalExp = skillRows.reduce((s, r) => {
      const sk = r.skills.find(x => x.taskType === tt);
      return s + (sk?.experienceCount ?? 0);
    }, 0);
    const supply = Math.min(100, Math.round(totalExp * 2));
    const demand = Math.min(100, supply + Math.floor(Math.random() * 20));
    return { name: tt, members, supply, demand, color: AV_COLORS[taskTypes.indexOf(tt) % AV_COLORS.length] };
  });

  // Timeline weeks from workload days
  const days = workload?.employees[0]?.days ?? [];
  const weeks: string[] = [];
  const weekMap = new Map<string, number[]>(); // weekLabel -> [utilizations]
  days.forEach(d => {
    const dt = new Date(d.date);
    const wLabel = `W${String(Math.ceil((dt.getDate() - dt.getDay() + 10) / 7)).padStart(2, "0")}`;
    if (!weekMap.has(wLabel)) { weekMap.set(wLabel, []); weeks.push(wLabel); }
    weekMap.get(wLabel)!.push(d.utilization);
  });
  const weekLabels = weeks.slice(0, 6);

  // Forecast months
  const forecastEmployees = forecast?.employees.slice(0, 6) ?? [];

  // Recs derived from real data
  const overloadedEmps = employees.filter(e => e.avgUtilization > 100);
  const freeEmps = employees.filter(e => e.avgUtilization < 50);

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
        <button className="abtn ghost" onClick={fetchAll}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14" height="14"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="cp-stats">
        {[
          { color: "#3B5BDB", svg: <><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeLinecap="round"/><path d="M16 4a3 3 0 0 1 0 6M21 20a5 5 0 0 0-4-5" strokeLinecap="round"/></>, v: employees.length, l: "Thành viên đang hoạt động", d: "trong sprint này", dc: "ok" },
          { color: avgUtil > 90 ? "#dc2626" : "#d97706", svg: <path d="M3 12h4l3 8 4-16 3 8h4" strokeLinecap="round" strokeLinejoin="round"/>, v: `${avgUtil}%`, l: "Trung bình workload", d: avgUtil > 90 ? "⚠ Cần cân bằng" : "Mức ổn định", dc: avgUtil > 90 ? "danger" : "warn" },
          { color: "#dc2626", svg: <><path d="M10.3 3.9l-7 12A2 2 0 0 0 5 19h14a2 2 0 0 0 1.7-3l-7-12a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01" strokeLinecap="round"/></>, v: overloaded, l: "Thành viên bị quá tải", d: overloaded > 0 ? "Cần phân công lại" : "Không có", dc: overloaded > 0 ? "danger" : "ok" },
          { color: "#f97316", svg: <><circle cx="12" cy="8" r="5"/><path d="M8.5 12.5L7 22l5-3 5 3-1.5-9.5" strokeLinecap="round" strokeLinejoin="round"/></>, v: `${totalBacklogH}h`, l: "Backlog còn lại", d: forecast?.team.etaWeeks ? `ETA ~${forecast.team.etaWeeks} tuần` : "Chưa có dữ liệu", dc: "warn" },
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
        {([["members","Theo thành viên"],["skills","Theo loại task"],["timeline","Timeline"],["forecast","Dự báo"]] as [View,string][]).map(([k,l]) => (
          <button key={k} className={`cp-chip${view === k ? " on" : ""}`} onClick={() => setView(k)}>{l}</button>
        ))}
      </div>

      {/* Layout */}
      <div className="cp-layout">
        <div className="cp-main">

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
                    <th>Tasks</th>
                    <th>Giờ tổng</th>
                    <th>Workload</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "var(--text-3)" }}>Chưa có dữ liệu workload</td></tr>
                  ) : employees.map((e, i) => {
                    const pct = Math.round(e.avgUtilization);
                    const c = capColor(pct);
                    const totalTasks = e.days.reduce((s, d) => s + d.taskCount, 0);
                    const totalH = Math.round(e.totalLoadMinutes / 60);
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

          {/* Skills view */}
          {view === "skills" && (
            <div className="cp">
              <div className="cp-head">
                <h3>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5"/><path d="M8.5 12.5L7 22l5-3 5 3-1.5-9.5"/></svg>
                  Workload theo loại task
                </h3>
                <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: ".78rem", color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
                  <span>■ Kinh nghiệm</span>
                </div>
              </div>
              <div className="skill-list">
                <div className="sk-header">
                  <span>Loại task</span><span>Kinh nghiệm</span><span>Thành viên</span><span>Trạng thái</span>
                </div>
                {skillRows.length === 0 ? (
                  <div style={{ padding: "32px", textAlign: "center", color: "var(--text-3)" }}>Chưa có dữ liệu kỹ năng</div>
                ) : skillRows.map((row, i) => {
                  const pct = Math.round(row.utilization);
                  const c = capColor(pct);
                  const expTotal = row.skills.reduce((s, sk) => s + sk.experienceCount, 0);
                  return (
                    <div className="skill-row" key={row.employeeId}>
                      <div className="sk-name">
                        <span className="sk-dot" style={{ background: AV_COLORS[i % AV_COLORS.length] }} />
                        {row.fullName}
                      </div>
                      <div className="sk-bar-wrap">
                        <div className="sk-bar">
                          <div className="sf" style={{ width: `${Math.min(pct, 100)}%`, background: AV_COLORS[i % AV_COLORS.length] }} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: ".64rem", color: "var(--text-3)" }}>
                          <span>{expTotal} task đã làm</span><span>{pct}%</span>
                        </div>
                      </div>
                      <div className="sk-members">
                        <div style={{ display: "flex", gap: 2 }}>
                          {row.skills.slice(0, 3).filter(s => s.experienceCount > 0).map((sk, j) => (
                            <span key={j} style={{ fontSize: ".68rem", padding: "1px 6px", borderRadius: 99, background: "var(--accent-soft)", color: "var(--accent-ink)", fontFamily: "var(--font-mono)" }}>{sk.taskType}</span>
                          ))}
                        </div>
                      </div>
                      <div className="sk-pct" style={{ color: pct > 85 ? "var(--danger)" : "var(--ok)" }}>
                        {pct > 85 ? `⚠ ${pct}%` : `✓ ${pct}%`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Timeline view */}
          {view === "timeline" && (
            <div className="cp">
              <div className="cp-head">
                <h3>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
                  Timeline workload theo ngày
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
                  Dự báo workload — Backlog ETA
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
                            const velH = Math.round(e.velocityMinutesPerWeek / 60);
                            const barH = Math.min(130, Math.round((e.backlogMinutes / (forecast!.team.totalBacklogMinutes || 1)) * 130 * forecastEmployees.length));
                            return (
                              <div className="fc-bar-wrap" key={e.employeeId}>
                                <div className="fc-bar actual" style={{ height: Math.max(4, barH) }}>
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
                      Tổng backlog team: <b style={{ color: "var(--text)" }}>{totalBacklogH}h</b> · Velocity: <b style={{ color: "var(--text)" }}>{Math.round((forecast?.team.totalVelocityPerWeek ?? 0) / 60)}h/tuần</b>
                      {forecast?.team.etaWeeks ? ` · ETA: ~${forecast.team.etaWeeks} tuần` : ""}
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
                      <div className="rec-s">{Math.round(overloadedEmps[0].avgUtilization)}% workload. Xem xét phân công lại một số task sang thành viên khác.</div>
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
                {overloadedEmps.length === 0 && freeEmps.length === 0 && (
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
