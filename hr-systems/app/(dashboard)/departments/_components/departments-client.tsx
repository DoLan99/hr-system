"use client";

import { useState, useCallback } from "react";
import { useCurrentUser } from "@/lib/contexts/current-user-context";
import { useToast } from "@/lib/hooks/use-toast";
import { DeptFormModal } from "./dept-form-modal";
import { TeamFormModal } from "./team-form-modal";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER"];
const AVCOLORS = ["#3B5BDB","#2196f3","#7c3aed","#0891b2","#059669","#d97706","#dc2626","#be185d","#0f766e","#b45309","#1d4ed8","#6d28d9","#047857","#9333ea"];

function colorFor(id: number) { return AVCOLORS[id % AVCOLORS.length]; }
function initials(name: string) { return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase(); }
function hexToRgba(hex: string, a: number) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}

interface Employee { id: number; fullName: string; avatarUrl?: string | null; role?: { label: string } | null }
interface TeamLink { team: { id: number; name: string; isActive: boolean } }

interface Department {
  id: number; name: string; code?: string | null;
  description?: string | null; headId?: number | null;
  head?: { id: number; fullName: string } | null;
  isActive: boolean;
  teams: TeamLink[];
  _count: { employees: number };
}

interface DeptLink { department: { id: number; name: string } }

interface Team {
  id: number; name: string; code?: string | null;
  description?: string | null; leadId?: number | null;
  lead?: { id: number; fullName: string } | null;
  isActive: boolean;
  departments: DeptLink[];
  _count: { employees: number };
}

interface Props {
  initialDepts: Department[];
  initialTeams: Team[];
  employees: Employee[];
}

interface TeamDetail {
  team: Team;
  dept: Department;
  members: Employee[];
  loading: boolean;
}

export function DepartmentsClient({ initialDepts, initialTeams, employees }: Props) {
  const user = useCurrentUser();
  const { toast } = useToast();
  const isManager = MANAGER_ROLES.includes(user.role.name);

  const [depts, setDepts] = useState<Department[]>(initialDepts);
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"cards" | "org">("cards");
  const [openDepts, setOpenDepts] = useState<Set<number>>(new Set(initialDepts.map((d) => d.id)));
  const [teamDetail, setTeamDetail] = useState<TeamDetail | null>(null);

  const [deptModal, setDeptModal] = useState<{ open: boolean; item: Department | null }>({ open: false, item: null });
  const [teamModal, setTeamModal] = useState<{ open: boolean; item: Team | null; deptId: number | null }>({ open: false, item: null, deptId: null });

  function toggle(id: number) {
    setOpenDepts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function openTeamDetail(team: Team, dept: Department) {
    setTeamDetail({ team, dept, members: [], loading: true });
    try {
      const res = await fetch(`/api/employees?teamId=${team.id}`);
      const json = await res.json();
      setTeamDetail({ team, dept, members: json.data ?? [], loading: false });
    } catch {
      setTeamDetail((prev) => prev ? { ...prev, loading: false } : null);
    }
  }

  function upsertDept(d: Department) {
    setDepts((prev) => {
      const idx = prev.findIndex((x) => x.id === d.id);
      return idx >= 0 ? prev.map((x) => (x.id === d.id ? d : x)) : [...prev, d];
    });
  }
  function upsertTeam(t: Team) {
    setTeams((prev) => {
      const idx = prev.findIndex((x) => x.id === t.id);
      return idx >= 0 ? prev.map((x) => (x.id === t.id ? t : x)) : [...prev, t];
    });
  }
  async function deleteDept(id: number) {
    const dept = depts.find((d) => d.id === id);
    if (!confirm(`Xóa phòng ban "${dept?.name}"?`)) return;
    const res = await fetch(`/api/departments/${id}`, { method: "DELETE" });
    if (res.ok) {
      setDepts((prev) => prev.filter((d) => d.id !== id));
      toast({ title: "Đã xóa phòng ban", description: dept?.name, variant: "default" });
    }
  }
  async function deleteTeam(id: number) {
    const team = teams.find((t) => t.id === id);
    if (!confirm(`Xóa team "${team?.name}"?`)) return;
    const res = await fetch(`/api/teams/${id}`, { method: "DELETE" });
    if (res.ok) {
      setTeams((prev) => prev.filter((t) => t.id !== id));
      toast({ title: "Đã xóa nhóm", description: team?.name, variant: "default" });
    }
  }

  const teamsByDept = (dept: Department) =>
    teams.filter((t) => t.departments.some((dl) => dl.department.id === dept.id));

  const totalMembers = depts.reduce((s, d) => s + d._count.employees, 0);
  const activeDepts = depts.filter((d) => d.isActive);
  const activeTeams = teams.filter((t) => t.isActive);
  const avgTeamSize = activeTeams.length > 0 ? (totalMembers / activeTeams.length).toFixed(1) : "0";

  const filteredDepts = depts.filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    if (d.name.toLowerCase().includes(q)) return true;
    return teamsByDept(d).some((t) => t.name.toLowerCase().includes(q));
  });

  const deptOptions = depts.map((d) => ({ id: d.id, name: d.name }));

  const BuildingIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x={2} y={7} width={20} height={14} rx={2} /><path d="M16 7V5a2 2 0 0 0-4 0v2M8 7V5a2 2 0 0 0-4 0v2" />
    </svg>
  );
  const TeamIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx={9} cy={7} r={4} />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );

  return (
    <>
      {/* Page head */}
      <div className="page-head" style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", gap:16, flexWrap:"wrap", marginBottom:22 }}>
        <div>
          <h1>Phòng ban & Teams</h1>
          <p>Quản lý cơ cấu tổ chức, phòng ban và nhóm làm việc.</p>
        </div>
        {isManager && (
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <button className="abtn ghost" style={{ gap:7 }} onClick={() => setTeamModal({ open:true, item:null, deptId:null })}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" width={15} height={15}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx={9} cy={7} r={4} /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              Thêm team
            </button>
            <button className="abtn primary" style={{ gap:7 }} onClick={() => setDeptModal({ open:true, item:null })}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" width={15} height={15}><path d="M12 5v14M5 12h14" /></svg>
              Thêm phòng ban
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="dept-stats">
        <div className="dst">
          <span className="di" style={{ background:"#eef2ff", color:"#3B5BDB" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><rect x={2} y={7} width={20} height={14} rx={2} /><path d="M16 7V5a2 2 0 0 0-4 0v2M8 7V5a2 2 0 0 0-4 0v2" /></svg>
          </span>
          <div><div className="dv">{activeDepts.length}</div><div className="dl">Phòng ban</div></div>
        </div>
        <div className="dst">
          <span className="di" style={{ background:"#f0fdf4", color:"#059669" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><rect x={9} y={2} width={6} height={5} rx={1} /><rect x={3} y={16} width={6} height={5} rx={1} /><rect x={15} y={16} width={6} height={5} rx={1} /><path d="M12 7v5M6 16v-2h12v2" strokeLinejoin="round" /></svg>
          </span>
          <div><div className="dv">{activeTeams.length}</div><div className="dl">Teams</div></div>
        </div>
        <div className="dst">
          <span className="di" style={{ background:"#faf5ff", color:"#7c3aed" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx={12} cy={8} r={4} /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
          </span>
          <div><div className="dv">{totalMembers}</div><div className="dl">Thành viên</div></div>
        </div>
        <div className="dst">
          <span className="di" style={{ background:"#fff7ed", color:"#d97706" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M3 3v18h18" /><path d="M7 14l4-4 3 3 5-6" strokeLinejoin="round" /></svg>
          </span>
          <div><div className="dv">{avgTeamSize}</div><div className="dl">TB / team</div></div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="tools" style={{ marginBottom:18 }}>
        <div className="tsearch" style={{ minWidth:240 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx={11} cy={11} r={7} /><path d="M21 21l-4-4" /></svg>
          <input type="text" placeholder="Tìm phòng ban, team…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="spacer" />
        <div className="seg">
          <button className={view === "cards" ? "on" : ""} onClick={() => setView("cards")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={14} height={14}><rect x={3} y={3} width={7} height={7} rx={1} /><rect x={14} y={3} width={7} height={7} rx={1} /><rect x={3} y={14} width={7} height={7} rx={1} /><rect x={14} y={14} width={7} height={7} rx={1} /></svg>
            Cards
          </button>
          <button className={view === "org" ? "on" : ""} onClick={() => setView("org")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={14} height={14}><rect x={9} y={2} width={6} height={5} rx={1} /><rect x={3} y={16} width={6} height={5} rx={1} /><rect x={15} y={16} width={6} height={5} rx={1} /><path d="M12 7v5M6 16v-2h12v2" strokeLinejoin="round" /></svg>
            Org Chart
          </button>
        </div>
        <span style={{ fontSize:"0.83rem", color:"var(--text-3)", fontFamily:"var(--font-mono)" }}>{filteredDepts.length} phòng ban</span>
      </div>

      {view === "cards" ? (
        /* Cards view */
        <div className="dg">
          {filteredDepts.map((dept) => {
            const isOpen = openDepts.has(dept.id);
            const deptTeams = teamsByDept(dept);
            const color = colorFor(dept.id);
            return (
              <div key={dept.id} className={`dept-card${isOpen ? " open" : ""}`}>
                <div className="dc-head" onClick={() => toggle(dept.id)}>
                  <span className="dc-ico" style={{ background: hexToRgba(color, 0.12), color }}>
                    <BuildingIcon />
                  </span>
                  <div>
                    <div className="dc-name">{dept.name}</div>
                    <div className="dc-sub">{dept.description ?? (dept.code ? `#${dept.code}` : "—")}</div>
                  </div>
                  <span className="dc-chev">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                  </span>
                </div>
                <div className="dc-meta">
                  <span className="dc-tag">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={12} height={12}><circle cx={9} cy={8} r={3} /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><path d="M16 4a3 3 0 0 1 0 6M21 20a5 5 0 0 0-4-5" /></svg>
                    {dept._count.employees} thành viên
                  </span>
                  <span className="dc-tag">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={12} height={12}><rect x={9} y={2} width={6} height={5} rx={1} /><rect x={3} y={16} width={6} height={5} rx={1} /><rect x={15} y={16} width={6} height={5} rx={1} /><path d="M12 7v5M6 16v-2h12v2" strokeLinejoin="round" /></svg>
                    {deptTeams.length} teams
                  </span>
                  {!dept.isActive && <span className="dc-tag" style={{ color:"var(--text-3)" }}>Tạm dừng</span>}
                </div>
                {dept.head && (
                  <div className="dc-lead">
                    <span className="lav" style={{ background: colorFor(dept.head.id) }}>{initials(dept.head.fullName)}</span>
                    <span>Trưởng phòng <b>{dept.head.fullName}</b></span>
                  </div>
                )}
                <div className="dc-teams">
                  {deptTeams.length === 0 ? (
                    <div style={{ padding:"14px 18px", fontSize:"0.8rem", color:"var(--text-3)", fontStyle:"italic" }}>Chưa có team nào.</div>
                  ) : (
                    deptTeams.map((t) => {
                      const tcolor = colorFor(t.id + 7);
                      return (
                        <div key={t.id} className="team-row" onClick={() => openTeamDetail(t, dept)}>
                          <span className="team-ico" style={{ background: hexToRgba(tcolor, 0.12), color: tcolor }}>
                            <TeamIcon />
                          </span>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div className="tr-name">{t.name}</div>
                            <div className="tr-sub">Lead: {t.lead?.fullName ?? "—"}</div>
                          </div>
                          <div className="tr-avs">
                            <span className="tr-ct">{t._count.employees} người</span>
                          </div>
                          {isManager && (
                            <div style={{ display:"flex", gap:4, marginLeft:8 }} onClick={(e) => e.stopPropagation()}>
                              <button className="abtn ghost" style={{ height:26, fontSize:"0.74rem", padding:"0 8px" }}
                                onClick={() => setTeamModal({ open:true, item:t, deptId:dept.id })}>Sửa</button>
                              <button className="abtn ghost" style={{ height:26, fontSize:"0.74rem", padding:"0 8px", color:"var(--danger)" }}
                                onClick={() => deleteTeam(t.id)}>Xóa</button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
                {isManager && (
                  <div className="dc-footer">
                    <button className="abtn ghost" style={{ height:30, fontSize:"0.8rem" }}
                      onClick={() => setTeamModal({ open:true, item:null, deptId:dept.id })}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" width={13} height={13}><path d="M12 5v14M5 12h14" /></svg>
                      Thêm team
                    </button>
                    <button className="abtn ghost" style={{ height:30, fontSize:"0.8rem" }}
                      onClick={() => setDeptModal({ open:true, item:dept })}>Chỉnh sửa</button>
                    <button className="abtn ghost" style={{ height:30, fontSize:"0.8rem", color:"var(--danger)" }}
                      onClick={() => deleteDept(dept.id)}>Xóa</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Org chart view */
        <div className="org-wrap">
          <div className="org-tree">
            <div className="org-root">{user.organization?.name ?? "Công ty"}</div>
            <div className="org-line-down" />
            <div className="org-row" style={{ position:"relative" }}>
              {/* horizontal connector */}
              {filteredDepts.length > 1 && (
                <div style={{
                  position:"absolute", top:0, left:"50%", transform:"translateX(-50%)",
                  height:"2px", background:"var(--border-2)",
                  width: `calc(${(filteredDepts.length - 1) * 100 / filteredDepts.length}% + 20px)`,
                  zIndex:0,
                }} />
              )}
              {filteredDepts.map((dept) => {
                const color = colorFor(dept.id);
                const deptTeams = teamsByDept(dept);
                return (
                  <div key={dept.id} className="org-col">
                    <div className="org-node" onClick={() => setView("cards")}>
                      <div className="on-av" style={{ background: hexToRgba(color, 0.15), color }}>{initials(dept.name)}</div>
                      <div className="on-name">{dept.name}</div>
                      <div className="on-ct">{dept._count.employees} người · {deptTeams.length} teams</div>
                    </div>
                    {deptTeams.length > 0 && (
                      <>
                        <div className="org-line-down" style={{ height:20 }} />
                        <div className="org-row" style={{ gap:10 }}>
                          {deptTeams.map((t) => {
                            const tc = colorFor(t.id + 7);
                            return (
                              <div key={t.id} style={{
                                background:"var(--content)", border:"1px solid var(--border)",
                                borderRadius:9, padding:"8px 12px", textAlign:"center", minWidth:90, cursor:"pointer",
                                position:"relative", marginTop:20,
                              }}
                                onClick={() => openTeamDetail(t, dept)}>
                                <div style={{ position:"absolute", top:-20, left:"50%", transform:"translateX(-50%)", width:2, height:20, background:"var(--border-2)" }} />
                                <div style={{ width:22, height:22, borderRadius:6, background:hexToRgba(tc,0.15), color:tc, display:"grid", placeItems:"center", margin:"0 auto 6px" }}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={11} height={11}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx={9} cy={7} r={4} /></svg>
                                </div>
                                <div style={{ fontSize:".75rem", fontWeight:600, color:"var(--text)" }}>{t.name}</div>
                                <div style={{ fontSize:".68rem", color:"var(--text-3)", fontFamily:"var(--font-mono)" }}>{t._count.employees}p</div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Team detail side panel */}
      <div className={`dept-scrim-overlay${teamDetail ? " on" : ""}`} onClick={() => setTeamDetail(null)} />
      <div className={`team-detail${teamDetail ? " open" : ""}`}>
        {teamDetail && (
          <>
            <div className="td-head">
              <span className="team-ico" style={{ background: hexToRgba(colorFor(teamDetail.team.id + 7), 0.12), color: colorFor(teamDetail.team.id + 7) }}>
                <TeamIcon />
              </span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:".95rem", color:"var(--text)" }}>{teamDetail.team.name}</div>
                <div style={{ fontSize:".78rem", color:"var(--text-3)" }}>{teamDetail.dept.name}</div>
              </div>
              {isManager && (
                <button className="abtn ghost" style={{ height:30, fontSize:"0.78rem" }}
                  onClick={() => { setTeamDetail(null); setTeamModal({ open:true, item:teamDetail.team, deptId:teamDetail.dept.id }); }}>
                  Sửa
                </button>
              )}
              <button style={{ width:30, height:30, borderRadius:8, display:"grid", placeItems:"center", background:"none", border:"none", cursor:"pointer", color:"var(--text-3)" }}
                onClick={() => setTeamDetail(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" width={16} height={16}><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="td-body">
              {teamDetail.team.lead && (
                <div>
                  <div style={{ fontSize:".78rem", fontWeight:600, color:"var(--text-3)", marginBottom:8, textTransform:"uppercase", letterSpacing:".05em" }}>Team lead</div>
                  <div className="member-row">
                    <div className="mr-av" style={{ background: colorFor(teamDetail.team.lead.id) }}>{initials(teamDetail.team.lead.fullName)}</div>
                    <div>
                      <div className="mr-name">{teamDetail.team.lead.fullName}</div>
                      <div className="mr-role">Lead</div>
                    </div>
                  </div>
                </div>
              )}
              <div>
                <div style={{ fontSize:".78rem", fontWeight:600, color:"var(--text-3)", marginBottom:8, textTransform:"uppercase", letterSpacing:".05em" }}>
                  Thành viên ({teamDetail.loading ? "…" : teamDetail.members.length})
                </div>
                {teamDetail.loading ? (
                  <div style={{ padding:"20px 0", textAlign:"center", color:"var(--text-3)", fontSize:".85rem" }}>Đang tải…</div>
                ) : teamDetail.members.length === 0 ? (
                  <div style={{ padding:"20px 0", textAlign:"center", color:"var(--text-3)", fontSize:".85rem" }}>Chưa có thành viên</div>
                ) : (
                  <div className="member-list">
                    {teamDetail.members.map((m) => (
                      <div key={m.id} className="member-row">
                        <div className="mr-av" style={{ background: colorFor(m.id) }}>{initials(m.fullName)}</div>
                        <div>
                          <div className="mr-name">{m.fullName}</div>
                          <div className="mr-role">{m.role?.label ?? "—"}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {teamDetail.team.description && (
                <div style={{ background:"var(--content)", borderRadius:10, padding:"12px 14px", fontSize:".84rem", color:"var(--text-2)" }}>
                  {teamDetail.team.description}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {deptModal.open && (
        <DeptFormModal
          dept={deptModal.item}
          employees={employees}
          onClose={() => setDeptModal({ open:false, item:null })}
          onSaved={(d) => { upsertDept(d); setDeptModal({ open:false, item:null }); }}
        />
      )}
      {teamModal.open && (
        <TeamFormModal
          team={teamModal.item}
          departments={deptOptions}
          employees={employees}
          onClose={() => setTeamModal({ open:false, item:null, deptId:null })}
          onSaved={(t) => { upsertTeam(t); setTeamModal({ open:false, item:null, deptId:null }); }}
        />
      )}
    </>
  );
}
