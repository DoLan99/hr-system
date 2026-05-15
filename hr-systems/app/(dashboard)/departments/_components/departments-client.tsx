"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Plus, Pencil, Trash2, ChevronDown, Users, UserCheck, Building2, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/context";
import { DeptFormModal } from "./dept-form-modal";
import { TeamFormModal } from "./team-form-modal";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER"];

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
  const { data: session } = useSession();
  const { t } = useLocale();
  const role = (session?.user as any)?.role ?? "";
  const isManager = MANAGER_ROLES.includes(role);

  const [depts, setDepts] = useState<Department[]>(initialDepts);
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [tab, setTab] = useState<"depts" | "teams">("depts");
  const [expandedDepts, setExpandedDepts] = useState<Set<number>>(new Set(initialDepts.map(d => d.id)));

  const [deptModal, setDeptModal] = useState<{ open: boolean; item: Department | null }>({ open: false, item: null });
  const [teamModal, setTeamModal] = useState<{ open: boolean; item: Team | null }>({ open: false, item: null });

  function toggleExpand(id: number) {
    setExpandedDepts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function upsertDept(d: Department) {
    setDepts(prev => {
      const idx = prev.findIndex(x => x.id === d.id);
      return idx >= 0 ? prev.map(x => x.id === d.id ? d : x) : [...prev, d];
    });
  }

  function upsertTeam(t: Team) {
    setTeams(prev => {
      const idx = prev.findIndex(x => x.id === t.id);
      return idx >= 0 ? prev.map(x => x.id === t.id ? t : x) : [...prev, t];
    });
  }

  async function deleteDept(id: number) {
    if (!confirm(t("common.confirmDelete"))) return;
    const res = await fetch(`/api/departments/${id}`, { method: "DELETE" });
    if (res.ok) setDepts(prev => prev.filter(d => d.id !== id));
  }

  async function deleteTeam(id: number) {
    if (!confirm(t("common.confirmDelete"))) return;
    const res = await fetch(`/api/teams/${id}`, { method: "DELETE" });
    if (res.ok) setTeams(prev => prev.filter(t => t.id !== id));
  }

  const deptOptions = depts.map(d => ({ id: d.id, name: d.name }));
  const totalMembers = depts.reduce((s, d) => s + d._count.employees, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight leading-tight">{t("departments.title")}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{t("departments.subtitle")}</p>
        </div>
        {isManager && (
          <div className="flex gap-2">
            {tab === "depts" && (
              <button onClick={() => setDeptModal({ open: true, item: null })} className="btn-primary">
                <Plus className="w-4 h-4" /> {t("departments.addDepartment")}
              </button>
            )}
            {tab === "teams" && (
              <button onClick={() => setTeamModal({ open: true, item: null })} className="btn-primary">
                <Plus className="w-4 h-4" /> {t("departments.addTeam")}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t("departments.departments"), value: depts.filter(d => d.isActive).length, icon: Building2, color: "text-blue-600", bg: "bg-blue-50" },
          { label: t("departments.teams"), value: teams.filter(t => t.isActive).length, icon: GitBranch, color: "text-purple-600", bg: "bg-purple-50" },
          { label: t("employees.title"), value: totalMembers, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map(s => (
          <div key={s.label} className="stat-card flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
              <s.icon className={s.color} style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <p className="text-[11.5px] font-medium text-slate-500 uppercase tracking-wide">{s.label}</p>
              <p className="text-[22px] font-bold text-slate-900 leading-none mt-0.5">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {([["depts", t("departments.departments"), Building2], ["teams", t("departments.teams"), GitBranch]] as const).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key as "depts" | "teams")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium transition",
              tab === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}>
            <Icon style={{ width: 14, height: 14 }} />
            {label}
          </button>
        ))}
      </div>

      {/* ─── Departments tab ─── */}
      {tab === "depts" && (
        <div className="space-y-3">
          {depts.length === 0 && (
            <div className="text-center py-16 text-slate-400 text-sm">{t("departments.noDepartments")}</div>
          )}
          {depts.map(dept => {
            const isExpanded = expandedDepts.has(dept.id);
            const linkedTeams = dept.teams.map(t => t.team);
            return (
              <div key={dept.id} className={cn(
                "bg-white rounded-xl border shadow-card overflow-hidden",
                dept.isActive ? "border-slate-200" : "border-slate-100 opacity-70"
              )}>
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <button onClick={() => toggleExpand(dept.id)}
                    className="flex-1 flex items-center gap-3 min-w-0 text-left">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                      <Building2 style={{ width: 17, height: 17 }} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[14px] font-semibold text-slate-900">{dept.name}</span>
                        {dept.code && (
                          <span className="text-[11px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{dept.code}</span>
                        )}
                        {!dept.isActive && (
                          <span className="text-[11px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{t("departments.suspended")}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-[12px] text-slate-400 flex-wrap">
                        {dept.head && (
                          <span className="flex items-center gap-1"><UserCheck style={{ width: 12, height: 12 }} /> {dept.head.fullName}</span>
                        )}
                        <span className="flex items-center gap-1"><Users style={{ width: 12, height: 12 }} /> {dept._count.employees} {t("departments.members")}</span>
                        <span className="flex items-center gap-1"><GitBranch style={{ width: 12, height: 12 }} /> {linkedTeams.length} {t("departments.teams").toLowerCase()}</span>
                      </div>
                    </div>
                    <ChevronDown style={{ width: 16, height: 16 }} className={cn("text-slate-400 flex-shrink-0 transition-transform", isExpanded && "rotate-180")} />
                  </button>

                  {isManager && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => setDeptModal({ open: true, item: dept })}
                        className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition">
                        <Pencil style={{ width: 14, height: 14 }} />
                      </button>
                      <button onClick={() => deleteDept(dept.id)}
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition">
                        <Trash2 style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  )}
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3">
                    {dept.description && (
                      <p className="text-[12.5px] text-slate-500 mb-2.5">{dept.description}</p>
                    )}
                    {linkedTeams.length === 0 ? (
                      <p className="text-[12px] text-slate-400 italic">{t("departments.noLinkedTeams")}</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-[11.5px] text-slate-400 mr-1 self-center">{t("departments.linkedTeams")}</span>
                        {linkedTeams.map(t => (
                          <span key={t.id} className={cn(
                            "text-[12px] font-medium px-2.5 py-1 rounded-lg border",
                            t.isActive
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-slate-100 text-slate-400 border-slate-200"
                          )}>
                            <GitBranch style={{ width: 11, height: 11, display: "inline", marginRight: 3 }} />
                            {t.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Teams tab ─── */}
      {tab === "teams" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {teams.length === 0 && (
            <div className="col-span-2 text-center py-16 text-slate-400 text-sm">{t("departments.noTeams")}</div>
          )}
          {teams.map(team => (
            <div key={team.id} className={cn(
              "bg-white rounded-xl border shadow-card p-4 space-y-3",
              team.isActive ? "border-slate-200 hover:border-purple-300" : "border-slate-100 opacity-70"
            )}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center flex-shrink-0">
                    <GitBranch style={{ width: 16, height: 16 }} className="text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[14px] font-semibold text-slate-900">{team.name}</span>
                      {team.code && (
                        <span className="text-[11px] font-mono bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">{team.code}</span>
                      )}
                      {!team.isActive && (
                        <span className="text-[11px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{t("departments.suspended")}</span>
                      )}
                    </div>
                    {team.lead && (
                      <p className="text-[12px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <UserCheck style={{ width: 12, height: 12 }} /> {team.lead.fullName}
                      </p>
                    )}
                  </div>
                </div>
                {isManager && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => setTeamModal({ open: true, item: team })}
                      className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition">
                      <Pencil style={{ width: 14, height: 14 }} />
                    </button>
                    <button onClick={() => deleteTeam(team.id)}
                      className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition">
                      <Trash2 style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                )}
              </div>

              {team.description && (
                <p className="text-[12.5px] text-slate-500">{team.description}</p>
              )}

              <div className="flex items-center flex-wrap gap-1.5 pt-2.5 border-t border-slate-100">
                <span className="text-[11.5px] text-slate-400 flex items-center gap-1">
                  <Users style={{ width: 12, height: 12 }} /> {team._count.employees} {t("departments.members").slice(0, 2)}
                </span>
                {team.departments.length === 0 ? (
                  <span className="text-[11.5px] text-slate-300 italic ml-2">{t("departments.notLinked")}</span>
                ) : (
                  <>
                    <span className="text-slate-200 mx-1">|</span>
                    {team.departments.map(({ department }) => (
                      <span key={department.id}
                        className="text-[11.5px] bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-md font-medium">
                        {department.name}
                      </span>
                    ))}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {deptModal.open && (
        <DeptFormModal
          dept={deptModal.item}
          employees={employees}
          onClose={() => setDeptModal({ open: false, item: null })}
          onSaved={d => { upsertDept(d); setDeptModal({ open: false, item: null }); }}
        />
      )}
      {teamModal.open && (
        <TeamFormModal
          team={teamModal.item}
          departments={deptOptions}
          employees={employees}
          onClose={() => setTeamModal({ open: false, item: null })}
          onSaved={t => { upsertTeam(t); setTeamModal({ open: false, item: null }); }}
        />
      )}
    </div>
  );
}
