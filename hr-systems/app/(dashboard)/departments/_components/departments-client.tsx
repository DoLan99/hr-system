"use client";

import { useState } from "react";
import { useCurrentUser } from "@/lib/contexts/current-user-context";
import { DeptFormModal } from "./dept-form-modal";
import { TeamFormModal } from "./team-form-modal";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER"];
const AVCOLORS = ["#3B5BDB", "#2196f3", "#7c3aed", "#0891b2", "#059669", "#d97706", "#dc2626", "#7c3aed", "#0f766e", "#b45309", "#1d4ed8", "#6d28d9", "#047857", "#be185d"];

function colorFor(id: number) {
  return AVCOLORS[id % AVCOLORS.length];
}
function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

interface Employee { id: number; fullName: string }
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

export function DepartmentsClient({ initialDepts, initialTeams, employees }: Props) {
  const user = useCurrentUser();
  const isManager = MANAGER_ROLES.includes(user.role.name);

  const [depts, setDepts] = useState<Department[]>(initialDepts);
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [search, setSearch] = useState("");
  const [openDepts, setOpenDepts] = useState<Set<number>>(new Set(initialDepts.map((d) => d.id)));

  const [deptModal, setDeptModal] = useState<{ open: boolean; item: Department | null }>({ open: false, item: null });
  const [teamModal, setTeamModal] = useState<{ open: boolean; item: Team | null; deptId: number | null }>({ open: false, item: null, deptId: null });

  function toggle(id: number) {
    setOpenDepts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
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
    if (!confirm("Xóa phòng ban này?")) return;
    const res = await fetch(`/api/departments/${id}`, { method: "DELETE" });
    if (res.ok) setDepts((prev) => prev.filter((d) => d.id !== id));
  }
  async function deleteTeam(id: number) {
    if (!confirm("Xóa team này?")) return;
    const res = await fetch(`/api/teams/${id}`, { method: "DELETE" });
    if (res.ok) setTeams((prev) => prev.filter((t) => t.id !== id));
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

  return (
    <>
      <style>{`
        .dept-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px}
        .dst{background:var(--elev);border:1px solid var(--border);border-radius:var(--r-lg);padding:16px 18px;display:flex;align-items:center;gap:14px}
        .dst .di{width:42px;height:42px;border-radius:11px;display:grid;place-items:center;flex-shrink:0;background:var(--accent-soft);color:var(--accent-ink)}
        .dst .di svg{width:20px;height:20px}
        .dst .dv{font-size:1.65rem;font-weight:800;letter-spacing:-0.03em}
        .dst .dl{font-size:0.8rem;color:var(--text-3);margin-top:1px}
        .dg{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px}
        .dept-card{background:var(--elev);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden;transition:border-color .2s,box-shadow .2s}
        .dept-card:hover{border-color:var(--border-2)}
        .dc-head{display:flex;align-items:center;gap:12px;padding:18px 18px 14px;cursor:pointer;user-select:none}
        .dc-ico{width:40px;height:40px;border-radius:10px;display:grid;place-items:center;flex-shrink:0}
        .dc-ico svg{width:20px;height:20px}
        .dc-name{font-weight:700;font-size:1.02rem}
        .dc-sub{font-size:0.78rem;color:var(--text-3);margin-top:2px}
        .dc-head .dc-chev{margin-left:auto;color:var(--text-3);transition:transform .2s;flex-shrink:0}
        .dc-head .dc-chev svg{width:16px;height:16px}
        .dept-card.open .dc-chev{transform:rotate(180deg)}
        .dc-meta{display:flex;gap:8px;padding:0 18px 14px;flex-wrap:wrap}
        .dc-tag{display:inline-flex;align-items:center;gap:5px;font-size:0.74rem;font-weight:500;padding:3px 9px;border-radius:99px;background:var(--content);color:var(--text-2);border:1px solid var(--border)}
        .dc-lead{display:flex;align-items:center;gap:8px;padding:0 18px 14px;font-size:0.85rem;color:var(--text-2)}
        .dc-lead .lav{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font-size:0.62rem;font-weight:700;color:#fff;flex-shrink:0}
        .dc-lead b{color:var(--text)}
        .dc-teams{border-top:1px solid var(--border);display:none;flex-direction:column;gap:0}
        .dept-card.open .dc-teams{display:flex}
        .team-row{display:flex;align-items:center;gap:12px;padding:13px 18px;border-bottom:1px solid var(--border);transition:background .15s}
        .team-row:last-child{border-bottom:none}
        .team-row:hover{background:var(--content)}
        .team-ico{width:30px;height:30px;border-radius:8px;display:grid;place-items:center;flex-shrink:0}
        .team-ico svg{width:14px;height:14px}
        .tr-name{font-weight:600;font-size:0.88rem}
        .tr-sub{font-size:0.74rem;color:var(--text-3);margin-top:1px}
        .tr-avs{display:flex;margin-left:auto;align-items:center}
        .tr-avs .av-xs{width:22px;height:22px;border-radius:50%;border:2px solid var(--elev);margin-left:-7px;display:grid;place-items:center;font-size:0.56rem;font-weight:700;color:#fff;flex-shrink:0}
        .tr-avs .av-xs:first-child{margin-left:0}
        .tr-ct{font-family:var(--font-mono);font-size:0.72rem;color:var(--text-3);margin-left:6px;white-space:nowrap}
        .dc-footer{display:flex;gap:8px;padding:12px 18px;border-top:1px solid var(--border);background:var(--content)}
        .dc-empty-teams{padding:14px 18px;font-size:0.8rem;color:var(--text-3);font-style:italic}
        @media(max-width:900px){.dept-stats{grid-template-columns:1fr 1fr}.dg{grid-template-columns:1fr}}
      `}</style>

      {/* Page head */}
      <div className="page-head" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 22 }}>
        <div>
          <h1>Phòng ban & Teams</h1>
          <p>Quản lý cơ cấu tổ chức, phòng ban và nhóm làm việc.</p>
        </div>
        {isManager && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="abtn ghost" style={{ gap: 7 }} onClick={() => setTeamModal({ open: true, item: null, deptId: null })}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" width={15} height={15}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx={9} cy={7} r={4} /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              Thêm team
            </button>
            <button className="abtn primary" style={{ gap: 7 }} onClick={() => setDeptModal({ open: true, item: null })}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" width={15} height={15}><path d="M12 5v14M5 12h14" /></svg>
              Thêm phòng ban
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="dept-stats">
        <div className="dst">
          <span className="di"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx={9} cy={7} r={4} /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg></span>
          <div><div className="dv">{activeDepts.length}</div><div className="dl">Phòng ban</div></div>
        </div>
        <div className="dst">
          <span className="di"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><rect x={9} y={2} width={6} height={5} rx={1} /><rect x={3} y={16} width={6} height={5} rx={1} /><rect x={15} y={16} width={6} height={5} rx={1} /><path d="M12 7v5M6 16v-2h12v2" strokeLinejoin="round" /></svg></span>
          <div><div className="dv">{activeTeams.length}</div><div className="dl">Teams</div></div>
        </div>
        <div className="dst">
          <span className="di"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx={12} cy={8} r={4} /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg></span>
          <div><div className="dv">{totalMembers}</div><div className="dl">Thành viên</div></div>
        </div>
        <div className="dst">
          <span className="di"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M3 3v18h18" /><path d="M7 14l4-4 3 3 5-6" strokeLinejoin="round" /></svg></span>
          <div><div className="dv">{avgTeamSize}</div><div className="dl">TB / team</div></div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="tools" style={{ marginBottom: 18 }}>
        <div className="tsearch" style={{ minWidth: 240 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx={11} cy={11} r={7} /><path d="M21 21l-4-4" /></svg>
          <input type="text" placeholder="Tìm phòng ban, team…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="spacer" />
        <span style={{ fontSize: "0.83rem", color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>{filteredDepts.length} phòng ban</span>
      </div>

      {/* Cards */}
      <div className="dg">
        {filteredDepts.map((dept) => {
          const isOpen = openDepts.has(dept.id);
          const deptTeams = teamsByDept(dept);
          const memberIds = new Set<number>();
          deptTeams.forEach((t) => { /* placeholder, member-level data not fetched per team */ });
          return (
            <div key={dept.id} className={`dept-card${isOpen ? " open" : ""}`}>
              <div className="dc-head" onClick={() => toggle(dept.id)}>
                <span className="dc-ico" style={{ background: "var(--accent-soft)", color: "var(--accent-ink)" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><rect x={2} y={7} width={20} height={14} rx={2} /><path d="M16 7V5a2 2 0 0 0-4 0v2M8 7V5a2 2 0 0 0-4 0v2" /></svg>
                </span>
                <div>
                  <div className="dc-name">{dept.name}</div>
                  <div className="dc-sub">{dept.description ?? "—"}</div>
                </div>
                <span className="dc-chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg></span>
              </div>
              <div className="dc-meta">
                <span className="dc-tag">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={12} height={12}><circle cx={9} cy={8} r={3} /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><path d="M16 4a3 3 0 0 1 0 6M21 20a5 5 0 0 0-4-5" strokeLinecap="round" /></svg>
                  {dept._count.employees} thành viên
                </span>
                <span className="dc-tag">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={12} height={12}><rect x={9} y={2} width={6} height={5} rx={1} /><rect x={3} y={16} width={6} height={5} rx={1} /><rect x={15} y={16} width={6} height={5} rx={1} /><path d="M12 7v5M6 16v-2h12v2" strokeLinejoin="round" /></svg>
                  {deptTeams.length} teams
                </span>
                {!dept.isActive && <span className="dc-tag" style={{ color: "var(--text-3)" }}>Tạm dừng</span>}
              </div>
              {dept.head && (
                <div className="dc-lead">
                  <span className="lav" style={{ background: colorFor(dept.head.id) }}>{initials(dept.head.fullName)}</span>
                  <span>Trưởng phòng <b>{dept.head.fullName}</b></span>
                </div>
              )}
              <div className="dc-teams">
                {deptTeams.length === 0 ? (
                  <div className="dc-empty-teams">Chưa có team nào.</div>
                ) : (
                  deptTeams.map((t) => (
                    <div key={t.id} className="team-row">
                      <span className="team-ico" style={{ background: "var(--accent-soft)", color: "var(--accent-ink)" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx={9} cy={7} r={4} /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="tr-name">{t.name}</div>
                        <div className="tr-sub">Lead: {t.lead?.fullName ?? "—"}</div>
                      </div>
                      <div className="tr-avs">
                        <span className="tr-ct">{t._count.employees} người</span>
                        {isManager && (
                          <>
                            <button className="mini-btn ghost" style={{ marginLeft: 8 }} onClick={(e) => { e.stopPropagation(); setTeamModal({ open: true, item: t, deptId: dept.id }); }}>Sửa</button>
                            <button className="mini-btn ghost" onClick={(e) => { e.stopPropagation(); deleteTeam(t.id); }}>Xóa</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              {isManager && (
                <div className="dc-footer">
                  <button className="abtn ghost" style={{ height: 30, fontSize: "0.8rem" }} onClick={() => setTeamModal({ open: true, item: null, deptId: dept.id })}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" width={13} height={13}><path d="M12 5v14M5 12h14" /></svg>
                    Thêm team
                  </button>
                  <button className="abtn ghost" style={{ height: 30, fontSize: "0.8rem" }} onClick={() => setDeptModal({ open: true, item: dept })}>
                    Chỉnh sửa
                  </button>
                  <button className="abtn ghost" style={{ height: 30, fontSize: "0.8rem", color: "var(--danger)" }} onClick={() => deleteDept(dept.id)}>
                    Xóa
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {deptModal.open && (
        <DeptFormModal
          dept={deptModal.item}
          employees={employees}
          onClose={() => setDeptModal({ open: false, item: null })}
          onSaved={(d) => { upsertDept(d); setDeptModal({ open: false, item: null }); }}
        />
      )}
      {teamModal.open && (
        <TeamFormModal
          team={teamModal.item}
          departments={deptOptions}
          employees={employees}
          onClose={() => setTeamModal({ open: false, item: null, deptId: null })}
          onSaved={(t) => { upsertTeam(t); setTeamModal({ open: false, item: null, deptId: null }); }}
        />
      )}
    </>
  );
}
