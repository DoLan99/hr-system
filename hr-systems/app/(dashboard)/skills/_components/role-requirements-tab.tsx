"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Loader2, Trash2 } from "lucide-react";
import { SKILL_LEVELS } from "@/lib/skills/constants";
import { safeJson } from "@/lib/safe-json";

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
  { val: "CRITICAL",     label: "Bắt buộc",  color: "var(--danger)",  bg: "var(--danger-soft)"  },
  { val: "IMPORTANT",    label: "Quan trọng", color: "var(--warn)",    bg: "var(--warn-soft)"    },
  { val: "NICE_TO_HAVE", label: "Nên có",     color: "var(--text-3)",  bg: "var(--border)"       },
] as const;

function impStyle(val: string) {
  return IMP_OPTIONS.find(o => o.val === val) ?? IMP_OPTIONS[2];
}

export function RoleRequirementsTab() {
  const [roles, setRoles]   = useState<Role[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [reqs, setReqs]     = useState<Requirement[]>([]);
  const [loading, setLoading]         = useState(true);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);

  const [addSkillId,    setAddSkillId]    = useState<number | "">("");
  const [addLevel,      setAddLevel]      = useState(3);
  const [addImportance, setAddImportance] = useState<"CRITICAL" | "IMPORTANT" | "NICE_TO_HAVE">("IMPORTANT");
  const [adding, setAdding] = useState(false);

  const fetchData = useCallback(async () => {
    const [rolesRes, skillsRes, reqsRes] = await Promise.all([
      fetch("/api/roles").then(safeJson).catch(() => ({ data: [] })),
      fetch("/api/skills").then(safeJson),
      fetch("/api/role-skill-requirements").then(safeJson),
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
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 0", color: "var(--text-3)", gap: 8 }}>
        <Loader2 size={16} className="animate-spin" /> Đang tải…
      </div>
    );
  }

  const roleReqs        = reqs.filter(r => r.roleId === selectedRoleId);
  const roleReqSkillIds = new Set(roleReqs.map(r => r.skillId));
  const availableSkills = skills.filter(s => !roleReqSkillIds.has(s.id));

  async function addReq() {
    if (!selectedRoleId || !addSkillId) return;
    setAdding(true);
    try {
      await fetch("/api/role-skill-requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId: selectedRoleId, skillId: addSkillId, requiredLevel: addLevel, importance: addImportance }),
      });
      setAddSkillId("");
      await fetchData();
    } finally { setAdding(false); }
  }

  async function updateReq(id: number, patch: Partial<{ requiredLevel: number; importance: string }>) {
    const current = reqs.find(r => r.id === id);
    if (!current) return;
    await fetch("/api/role-skill-requirements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roleId: current.roleId, skillId: current.skillId,
        requiredLevel: patch.requiredLevel ?? current.requiredLevel,
        importance: (patch.importance ?? current.importance) as any,
      }),
    });
    setReqs(prev => prev.map(r => r.id === id ? { ...r, ...patch } as any : r));
  }

  async function removeReq(id: number) {
    if (!confirm("Xoá yêu cầu này?")) return;
    await fetch(`/api/role-skill-requirements/${id}`, { method: "DELETE" });
    setReqs(prev => prev.filter(r => r.id !== id));
  }

  const selStyle: React.CSSProperties = {
    fontFamily: "inherit", fontSize: ".84rem",
    background: "var(--content)", border: "1px solid var(--border-2)",
    borderRadius: 6, padding: "5px 8px", color: "var(--text)", outline: "none",
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16 }}>
      {/* ── Role list ── */}
      <div style={{ background: "var(--elev)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
        <div style={{ padding: "8px 14px", borderBottom: "1px solid var(--border)", fontSize: ".72rem", fontWeight: 700, letterSpacing: ".08em", color: "var(--text-3)", textTransform: "uppercase" }}>
          Chọn role
        </div>
        {roles.length === 0 ? (
          <p style={{ padding: "16px 14px", fontSize: ".82rem", color: "var(--text-3)", textAlign: "center" }}>Chưa có role nào.</p>
        ) : (
          <div>
            {roles.map(r => {
              const count   = reqs.filter(x => x.roleId === r.id).length;
              const isActive = selectedRoleId === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedRoleId(r.id)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    width: "100%", padding: "8px 14px", textAlign: "left", border: "none", cursor: "pointer",
                    fontSize: ".84rem", fontWeight: isActive ? 600 : 400,
                    borderBottom: "1px solid var(--border)",
                    background: isActive ? "var(--accent-soft)" : "transparent",
                    color: isActive ? "var(--accent-ink)" : "var(--text-2)",
                    transition: "background .12s",
                  }}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</span>
                  <span style={{ fontSize: ".72rem", color: "var(--text-3)", marginLeft: 6, flexShrink: 0 }}>{count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Requirements editor ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {selectedRoleId == null ? (
          <div style={{ background: "var(--elev)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "32px 16px", textAlign: "center", color: "var(--text-3)", fontSize: ".84rem" }}>
            Chọn 1 role bên trái
          </div>
        ) : (
          <>
            {/* Add row */}
            {availableSkills.length > 0 && (
              <div style={{ background: "var(--elev)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "10px 14px", display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <label style={{ display: "block", fontSize: ".72rem", fontWeight: 600, color: "var(--text-3)", marginBottom: 4 }}>Skill</label>
                  <select value={addSkillId} onChange={e => setAddSkillId(e.target.value === "" ? "" : Number(e.target.value))} style={{ ...selStyle, width: "100%" }}>
                    <option value="">Chọn…</option>
                    {availableSkills.map(s => (
                      <option key={s.id} value={s.id}>{s.category ? `[${s.category}] ` : ""}{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: ".72rem", fontWeight: 600, color: "var(--text-3)", marginBottom: 4 }}>Level cần</label>
                  <select value={addLevel} onChange={e => setAddLevel(Number(e.target.value))} style={selStyle}>
                    {[1, 2, 3, 4, 5].map(l => <option key={l} value={l}>{l} – {SKILL_LEVELS[l]}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: ".72rem", fontWeight: 600, color: "var(--text-3)", marginBottom: 4 }}>Mức</label>
                  <select value={addImportance} onChange={e => setAddImportance(e.target.value as any)} style={selStyle}>
                    {IMP_OPTIONS.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
                  </select>
                </div>
                <button
                  onClick={addReq}
                  disabled={adding || !addSkillId}
                  className="abtn primary"
                  style={{ height: 32, fontSize: ".8rem", gap: 5, padding: "0 12px" }}
                >
                  {adding ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                  Thêm
                </button>
              </div>
            )}

            {roleReqs.length === 0 ? (
              <div style={{ background: "var(--elev)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "32px 16px", textAlign: "center", color: "var(--text-3)", fontSize: ".84rem" }}>
                Role này chưa có yêu cầu skill nào.
              </div>
            ) : (
              <div style={{ background: "var(--elev)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".82rem" }}>
                  <thead>
                    <tr style={{ background: "var(--content)", borderBottom: "1px solid var(--border)" }}>
                      <th style={{ textAlign: "left", padding: "7px 14px", fontWeight: 600, color: "var(--text-3)", fontSize: ".72rem", textTransform: "uppercase", letterSpacing: ".06em" }}>Skill</th>
                      <th style={{ textAlign: "center", padding: "7px 10px", fontWeight: 600, color: "var(--text-3)", fontSize: ".72rem", textTransform: "uppercase", letterSpacing: ".06em" }}>Level cần</th>
                      <th style={{ textAlign: "center", padding: "7px 10px", fontWeight: 600, color: "var(--text-3)", fontSize: ".72rem", textTransform: "uppercase", letterSpacing: ".06em" }}>Mức</th>
                      <th style={{ width: 32 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {roleReqs.map((r, idx) => {
                      const imp = impStyle(r.importance);
                      return (
                        <tr key={r.id} style={{ borderBottom: idx < roleReqs.length - 1 ? "1px solid var(--border)" : "none" }}>
                          <td style={{ padding: "8px 14px" }}>
                            <span style={{ fontWeight: 500, color: "var(--text)" }}>{r.skill.name}</span>
                            {r.skill.category && (
                              <span style={{ marginLeft: 6, fontSize: ".72rem", color: "var(--text-3)" }}>{r.skill.category}</span>
                            )}
                          </td>
                          <td style={{ padding: "8px 10px", textAlign: "center" }}>
                            <select
                              value={r.requiredLevel}
                              onChange={e => updateReq(r.id, { requiredLevel: Number(e.target.value) })}
                              style={selStyle}
                            >
                              {[1, 2, 3, 4, 5].map(l => <option key={l} value={l}>{l} – {SKILL_LEVELS[l]}</option>)}
                            </select>
                          </td>
                          <td style={{ padding: "8px 10px", textAlign: "center" }}>
                            <select
                              value={r.importance}
                              onChange={e => updateReq(r.id, { importance: e.target.value })}
                              style={{ ...selStyle, color: imp.color }}
                            >
                              {IMP_OPTIONS.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
                            </select>
                          </td>
                          <td style={{ padding: "8px 10px", textAlign: "right" }}>
                            <button
                              onClick={() => removeReq(r.id)}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 4, display: "flex", borderRadius: 4, transition: "color .12s" }}
                              onMouseEnter={e => (e.currentTarget.style.color = "var(--danger)")}
                              onMouseLeave={e => (e.currentTarget.style.color = "var(--text-3)")}
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
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
