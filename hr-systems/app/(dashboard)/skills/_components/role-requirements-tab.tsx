"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SKILL_LEVELS } from "@/lib/skills/constants";

interface Role {
  id: number;
  name: string;
  label: string;
  seniority: number;
}

interface Skill {
  id: number;
  name: string;
  category: string | null;
}

interface Requirement {
  id: number;
  roleId: number;
  skillId: number;
  requiredLevel: number;
  importance: "CRITICAL" | "IMPORTANT" | "NICE_TO_HAVE";
  skill: Skill;
  role: { id: number; name: string; label: string };
}

const IMP_OPTIONS = [
  { val: "CRITICAL", label: "Bắt buộc", color: "bg-red-50 text-red-700 border-red-200" },
  { val: "IMPORTANT", label: "Quan trọng", color: "bg-orange-50 text-orange-700 border-orange-200" },
  { val: "NICE_TO_HAVE", label: "Nên có", color: "bg-slate-50 text-slate-600 border-slate-200" },
] as const;

export function RoleRequirementsTab() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [reqs, setReqs] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);

  // Add form
  const [addSkillId, setAddSkillId] = useState<number | "">("");
  const [addLevel, setAddLevel] = useState(3);
  const [addImportance, setAddImportance] = useState<"CRITICAL" | "IMPORTANT" | "NICE_TO_HAVE">("IMPORTANT");
  const [adding, setAdding] = useState(false);

  const fetchData = useCallback(async () => {
    const [rolesRes, skillsRes, reqsRes] = await Promise.all([
      fetch("/api/roles").then(r => r.json()).catch(() => ({ data: [] })),
      fetch("/api/skills").then(r => r.json()),
      fetch("/api/role-skill-requirements").then(r => r.json()),
    ]);
    const rolesList = (rolesRes.data ?? []) as Role[];
    setRoles(rolesList);
    setSkills(skillsRes.data ?? []);
    setReqs(reqsRes.data ?? []);
    if (rolesList.length > 0 && selectedRoleId == null) {
      setSelectedRoleId(rolesList[0].id);
    }
  }, [selectedRoleId]);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return <div className="flex items-center justify-center py-10 text-slate-400"><Loader2 className="w-4 h-4 animate-spin mr-2" /> Đang tải…</div>;
  }

  const roleReqs = reqs.filter(r => r.roleId === selectedRoleId);
  const roleReqsSkillIds = new Set(roleReqs.map(r => r.skillId));
  const availableSkills = skills.filter(s => !roleReqsSkillIds.has(s.id));

  async function addReq() {
    if (!selectedRoleId || !addSkillId) return;
    setAdding(true);
    try {
      await fetch("/api/role-skill-requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleId: selectedRoleId, skillId: addSkillId,
          requiredLevel: addLevel, importance: addImportance,
        }),
      });
      setAddSkillId("");
      await fetchData();
    } finally { setAdding(false); }
  }

  async function updateReq(id: number, patch: Partial<{ requiredLevel: number; importance: string }>) {
    const current = reqs.find(r => r.id === id);
    if (!current) return;
    const body = {
      roleId: current.roleId, skillId: current.skillId,
      requiredLevel: patch.requiredLevel ?? current.requiredLevel,
      importance: (patch.importance ?? current.importance) as any,
    };
    await fetch("/api/role-skill-requirements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setReqs(prev => prev.map(r => r.id === id ? { ...r, ...patch } as any : r));
  }

  async function removeReq(id: number) {
    if (!confirm("Xoá yêu cầu này?")) return;
    await fetch(`/api/role-skill-requirements/${id}`, { method: "DELETE" });
    setReqs(prev => prev.filter(r => r.id !== id));
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Role picker */}
      <div className="md:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Chọn role</p>
        </div>
        {roles.length === 0 ? (
          <p className="p-4 text-xs text-slate-400 text-center">Chưa có role nào trong tổ chức.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {roles.map(r => {
              const count = reqs.filter(x => x.roleId === r.id).length;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedRoleId(r.id)}
                  className={cn(
                    "w-full px-4 py-2 text-left text-sm transition flex items-center justify-between",
                    selectedRoleId === r.id ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium" : "hover:bg-slate-50 dark:hover:bg-slate-800/40",
                  )}
                >
                  <span className="truncate">{r.label}</span>
                  <span className="text-[10px] text-slate-400 ml-2">{count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Requirements editor */}
      <div className="md:col-span-2 space-y-3">
        {selectedRoleId == null ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center text-sm text-slate-400">
            Chọn 1 role bên trái
          </div>
        ) : (
          <>
            {availableSkills.length > 0 && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex flex-wrap items-end gap-2">
                <div className="flex-1 min-w-[160px]">
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Skill</label>
                  <select value={addSkillId} onChange={e => setAddSkillId(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800">
                    <option value="">Chọn…</option>
                    {availableSkills.map(s => (
                      <option key={s.id} value={s.id}>{s.category ? `[${s.category}] ` : ""}{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Level cần</label>
                  <select value={addLevel} onChange={e => setAddLevel(Number(e.target.value))}
                    className="px-2 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800">
                    {[1, 2, 3, 4, 5].map(l => <option key={l} value={l}>{l} - {SKILL_LEVELS[l]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Mức</label>
                  <select value={addImportance} onChange={e => setAddImportance(e.target.value as any)}
                    className="px-2 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800">
                    {IMP_OPTIONS.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
                  </select>
                </div>
                <button onClick={addReq} disabled={adding || !addSkillId}
                  className="px-2.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded flex items-center gap-1">
                  {adding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                  Thêm
                </button>
              </div>
            )}

            {roleReqs.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center text-sm text-slate-400">
                Role này chưa có yêu cầu skill nào.
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400">
                      <th className="text-left px-3 py-2">Skill</th>
                      <th className="text-center px-3 py-2">Level cần</th>
                      <th className="text-center px-3 py-2">Mức</th>
                      <th className="px-2 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {roleReqs.map(r => (
                      <tr key={r.id}>
                        <td className="px-3 py-2">
                          <p className="font-medium text-slate-800 dark:text-slate-200">{r.skill.name}</p>
                          {r.skill.category && <p className="text-[10px] text-slate-400">{r.skill.category}</p>}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <select value={r.requiredLevel}
                            onChange={e => updateReq(r.id, { requiredLevel: Number(e.target.value) })}
                            className="px-1.5 py-0.5 text-[11px] border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800">
                            {[1, 2, 3, 4, 5].map(l => <option key={l} value={l}>{l}</option>)}
                          </select>
                          <p className="text-[9px] text-slate-400 mt-0.5">{SKILL_LEVELS[r.requiredLevel]}</p>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <select value={r.importance}
                            onChange={e => updateReq(r.id, { importance: e.target.value })}
                            className="px-1.5 py-0.5 text-[11px] border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800">
                            {IMP_OPTIONS.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
                          </select>
                        </td>
                        <td className="px-2 py-2 text-right">
                          <button onClick={() => removeReq(r.id)} className="p-1 text-slate-300 hover:text-red-500 transition">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
