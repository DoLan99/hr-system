"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Loader2, BookOpen, Trash2, Settings, ShieldCheck, Sparkles, AlertTriangle } from "lucide-react";
import { CatalogTab } from "./catalog-tab";
import { RoleRequirementsTab } from "./role-requirements-tab";

// ── Types ──────────────────────────────────────────────
interface Employee {
  id: number;
  fullName: string;
  avatarUrl: string | null;
  department: string | null;
  role: { name: string; label: string } | null;
}

interface SkillItem {
  id: number;
  skillId: number;
  currentLevel: number;
  targetLevel: number | null;
  verifiedAt: string | null;
  verifiedBy: { fullName: string } | null;
  notes: string | null;
  skill: { id: number; name: string; category: string | null; description: string | null };
}

interface RoleReadiness {
  roleId: number;
  roleName: string;
  roleLabel: string;
  seniority: number;
  isCurrent: boolean;
  readinessPct: number;
  metRequirements: number;
  totalRequirements: number;
  criticalGaps: number;
  status: string;
  gaps: { skillId: number; skillName: string; currentLevel: number; requiredLevel: number; gap: number; met: boolean; importance: string }[];
}

// ── Constants ──────────────────────────────────────────
const LEVEL_COLORS = ["", "#ef4444", "#f59e0b", "#3B5BDB", "#22c55e", "#a78bfa"];
const LEVEL_LABELS = ["", "Beginner", "Elementary", "Intermediate", "Advanced", "Expert"];

const AV_COLORS = [
  "linear-gradient(135deg,#8b7bff,#4f7aff)",
  "linear-gradient(135deg,#f97316,#fbbf24)",
  "linear-gradient(135deg,#22c55e,#06b6d4)",
  "linear-gradient(135deg,#ec4899,#a855f7)",
  "linear-gradient(135deg,#3b82f6,#8b5cf6)",
];

function avColor(name: string) {
  const code = (name.charCodeAt(0) || 0) + (name.charCodeAt(1) || 0);
  return AV_COLORS[code % AV_COLORS.length];
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

// ── Skill dots ─────────────────────────────────────────
function SkillDots({ level, onChange }: { level: number; onChange?: (v: number) => void }) {
  return (
    <div className="skill-dots">
      {[1, 2, 3, 4, 5].map(i => (
        <div
          key={i}
          className={`skill-dot${i <= level ? ` filled lv${i}` : ""}`}
          title={LEVEL_LABELS[i]}
          onClick={() => onChange?.(i)}
        />
      ))}
    </div>
  );
}

// ── Score ring (right sidebar) ─────────────────────────
function SkScoreRing({ score, max = 5 }: { score: number; max?: number }) {
  const r = 34;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / max);
  const color = score >= 4 ? "var(--ok)" : score >= 3 ? "var(--accent)" : "var(--warn)";
  return (
    <div className="sk-score-ring">
      <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="40" cy="40" r={r} fill="none" stroke="var(--border)" strokeWidth="6" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} />
      </svg>
      <div className="ring-text">
        <span className="ring-val" style={{ color, fontSize: "1.1rem", fontWeight: 800, fontFamily: "var(--font-mono)" }}>{score}</span>
        <span className="ring-lbl" style={{ fontSize: ".6rem", color: "var(--text-3)" }}>/ {max}</span>
      </div>
    </div>
  );
}

// ── Career Path nodes ──────────────────────────────────
function CareerPathDisplay({ roles, currentRole }: { roles: RoleReadiness[]; currentRole: string | null }) {
  const sorted = [...roles].sort((a, b) => a.seniority - b.seniority);
  if (!sorted.length) {
    return (
      <div style={{ padding: "16px 18px", background: "var(--content)", color: "var(--text-3)", fontSize: ".84rem" }}>
        Chưa có career track. Manager cần tạo role + yêu cầu skill.
      </div>
    );
  }
  const curIdx = sorted.findIndex(r => r.isCurrent);
  return (
    <div className="career-path">
      {sorted.map((r, i) => {
        const state = curIdx < 0 ? (i === 0 ? "current" : "future") :
          i < curIdx ? "done" : i === curIdx ? "current" : i === curIdx + 1 ? "next" : "future";
        return (
          <div key={r.roleId} style={{ display: "contents" }}>
            <div className={`cp-node ${state}`}>
              <div className={`cp-circle ${state}`}>
                {state === "done"
                  ? <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M5 12l5 5L20 6" /></svg>
                  : state === "current" ? "▶" : i + 1}
              </div>
              <span className={`cp-label ${state}`}>{r.roleLabel}</span>
            </div>
            {i < sorted.length - 1 && (
              <div className={`cp-connector${i < curIdx ? " done" : i === curIdx - 1 ? " active" : ""}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ─────────────────────────────────────
export function SkillsClient({ isManager, currentEmployeeId }: { isManager: boolean; currentEmployeeId: number }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selId, setSelId] = useState(currentEmployeeId);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [catalog, setCatalog] = useState<{ id: number; name: string; category: string | null }[]>([]);
  const [careerData, setCareerData] = useState<RoleReadiness[]>([]);
  const [loadingMain, setLoadingMain] = useState(true);
  const [adminTab, setAdminTab] = useState<"none" | "catalog" | "roles">("none");

  // Load employees list for manager
  useEffect(() => {
    if (!isManager) {
      // just use current employee as single member
      return;
    }
    fetch("/api/employees?status=ACTIVE")
      .then(r => r.json())
      .then(d => {
        const emps: Employee[] = (d.data ?? []).map((e: any) => ({
          id: e.id, fullName: e.fullName, avatarUrl: e.avatarUrl,
          department: e.department, role: e.role,
        }));
        setEmployees(emps);
      })
      .catch(() => {});
  }, [isManager]);

  const loadSkills = useCallback(async (empId: number) => {
    setLoadingMain(true);
    try {
      const [skillsRes, catalogRes, careerRes] = await Promise.all([
        fetch(`/api/employee-skills?employeeId=${empId}`).then(r => r.json()),
        fetch("/api/skills").then(r => r.json()),
        fetch(`/api/skills/career-path?employeeId=${empId}`).then(r => r.json()),
      ]);
      setSkills(skillsRes.data ?? []);
      setCatalog(catalogRes.data ?? []);
      setCareerData(careerRes.data?.candidates ?? []);
    } finally {
      setLoadingMain(false);
    }
  }, []);

  useEffect(() => { loadSkills(selId); }, [selId, loadSkills]);

  // Derived data
  const byCategory = skills.reduce<Record<string, SkillItem[]>>((acc, s) => {
    const cat = s.skill.category ?? "Khác";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  const allLevels = skills.map(s => s.currentLevel);
  const avgSkill = allLevels.length
    ? Math.round(allLevels.reduce((a, b) => a + b, 0) / allLevels.length * 10) / 10
    : 0;
  const expertCount = skills.filter(s => s.currentLevel >= 5).length;
  const verifiedSkills = skills.filter(s => s.verifiedAt);
  const totalGaps = careerData.reduce((a, r) => a + r.gaps.filter(g => !g.met).length, 0);

  const currentRole = careerData.find(r => r.isCurrent)?.roleLabel ?? null;
  const nextRole = [...careerData].sort((a, b) => a.seniority - b.seniority)
    .find(r => !r.isCurrent && r.seniority > (careerData.find(r2 => r2.isCurrent)?.seniority ?? -1))?.roleLabel ?? null;

  const ownedSkillIds = new Set(skills.map(s => s.skillId));
  const availableToAdd = catalog.filter(c => !ownedSkillIds.has(c.id));

  // Add skill inline
  const [addSkillId, setAddSkillId] = useState<number | "">("");
  const [addLevel, setAddLevel] = useState(1);
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    if (!addSkillId) return;
    setAdding(true);
    try {
      await fetch("/api/employee-skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId: addSkillId, currentLevel: addLevel, employeeId: selId }),
      });
      setAddSkillId(""); setAddLevel(1);
      await loadSkills(selId);
    } finally { setAdding(false); }
  }

  async function updateLevel(id: number, currentLevel: number) {
    await fetch(`/api/employee-skills/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentLevel }),
    });
    setSkills(prev => prev.map(s => s.id === id ? { ...s, currentLevel } : s));
  }

  async function removeSkill(id: number) {
    if (!confirm("Xoá skill này khỏi profile?")) return;
    await fetch(`/api/employee-skills/${id}`, { method: "DELETE" });
    setSkills(prev => prev.filter(s => s.id !== id));
  }

  // Selected employee info
  const selEmployee = employees.find(e => e.id === selId);
  const selName = selEmployee?.fullName ?? "Tôi";
  const selDept = selEmployee?.department ?? "";
  const selRole = selEmployee?.role?.label ?? currentRole ?? "";

  const isOwner = selId === currentEmployeeId;

  const CAT_STYLE: Record<string, { color: string; bg: string; ico: string }> = {
    "Kỹ năng cốt lõi":  { color: "#3B5BDB", bg: "rgba(59,91,219,.12)", ico: "M12 2l9 5-9 5-9-5zM3 12l9 5 9-5M3 17l9 5 9-5" },
    "Tools & DevOps":   { color: "#f59e0b", bg: "rgba(245,158,11,.12)", ico: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" },
    "Soft Skills":      { color: "#22c55e", bg: "rgba(34,197,94,.12)",  ico: "M9 8m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" },
  };

  function getCatStyle(cat: string) {
    return CAT_STYLE[cat] ?? { color: "var(--accent)", bg: "var(--accent-soft)", ico: "M12 2l9 5-9 5-9-5z" };
  }

  return (
    <div>
      {/* Page head */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--text)", margin: 0 }}>Skill &amp; Career</h1>
          <p style={{ fontSize: ".8rem", color: "var(--text-3)", marginTop: 4, marginBottom: 0 }}>
            Bản đồ kỹ năng &amp; lộ trình phát triển · <b>{skills.length}</b> kỹ năng đang track
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {isManager && (
            <>
              <button
                className={`abtn ghost${adminTab === "catalog" ? " on" : ""}`}
                style={{ height: 36, fontSize: ".82rem", gap: 6 }}
                onClick={() => setAdminTab(t => t === "catalog" ? "none" : "catalog")}
              >
                <BookOpen size={14} /> Catalog skill
              </button>
              <button
                className={`abtn ghost${adminTab === "roles" ? " on" : ""}`}
                style={{ height: 36, fontSize: ".82rem", gap: 6 }}
                onClick={() => setAdminTab(t => t === "roles" ? "none" : "roles")}
              >
                <Settings size={14} /> Yêu cầu role
              </button>
            </>
          )}
        </div>
      </div>

      {/* Admin panels */}
      {adminTab === "catalog" && (
        <div className="sc-card" style={{ marginBottom: 20 }}>
          <div className="sc-card-head"><h3>Catalog Skill</h3></div>
          <div className="sc-card-body"><CatalogTab /></div>
        </div>
      )}
      {adminTab === "roles" && (
        <div className="sc-card" style={{ marginBottom: 20 }}>
          <div className="sc-card-head"><h3>Yêu cầu theo vai trò</h3></div>
          <div className="sc-card-body"><RoleRequirementsTab /></div>
        </div>
      )}

      {/* KPIs */}
      <div className="kpis" style={{ marginBottom: 24 }}>
        <div className="kpi">
          <div className="kt"><div className="ki"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2l9 5-9 5-9-5z" /><path d="M3 12l9 5 9-5M3 17l9 5 9-5" /></svg></div>Kỹ năng đang track</div>
          <div className="kv">{skills.length}</div>
          <div className="kc flat">{isManager ? `${employees.length || 1} thành viên` : "của tôi"}</div>
        </div>
        <div className="kpi">
          <div className="kt"><div className="ki"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2l2.6 6.3L21 9l-5 4.3L17.5 20 12 16.5 6.5 20 8 13.3 3 9l6.4-.7z" /></svg></div>Mức kỹ năng TB</div>
          <div className="kv">{avgSkill}/5</div>
          <div className="kc up">điểm trung bình</div>
        </div>
        <div className="kpi">
          <div className="kt"><div className="ki"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg></div>Expert (lv 5)</div>
          <div className="kv">{expertCount}</div>
          <div className="kc up">kỹ năng</div>
        </div>
        <div className="kpi">
          <div className="kt"><div className="ki" style={{ background: "var(--warn-soft)", color: "var(--warn)" }}><AlertTriangle size={14} /></div>Gap cần học</div>
          <div className="kv">{totalGaps}</div>
          <div className="kc warn">để lên cấp</div>
        </div>
      </div>

      {/* Member tabs (manager sees whole team) */}
      {isManager && employees.length > 0 && (
        <div className="member-tabs">
          {employees.slice(0, 8).map((e, idx) => (
            <button
              key={e.id}
              className={`mtab${selId === e.id ? " on" : ""}`}
              onClick={() => setSelId(e.id)}
            >
              <div className="mav" style={{ background: avColor(e.fullName) }}>{initials(e.fullName)}</div>
              <div>
                <div className="mname">{e.fullName}</div>
                <div className="mrole">{e.department ?? "—"}</div>
              </div>
              <span className="mlevel">{e.role?.label?.split(" ").pop() ?? "—"}</span>
            </button>
          ))}
        </div>
      )}

      {loadingMain ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 0", color: "var(--text-3)" }}>
          <Loader2 size={18} className="animate-spin" style={{ marginRight: 8 }} /> Đang tải kỹ năng…
        </div>
      ) : (
        <div className="sc-layout">
          {/* ── LEFT column ── */}
          <div>
            {/* Career path */}
            <div className="sc-card">
              <div className="sc-card-head">
                <h3>Lộ trình career</h3>
                <span className="sub">
                  {currentRole ? `Hiện tại: ${currentRole}${nextRole ? ` → ${nextRole}` : ""}` : "Chưa xác định vai trò"}
                </span>
              </div>
              <CareerPathDisplay roles={careerData} currentRole={currentRole} />
            </div>

            {/* Skill map */}
            <div className="sc-card">
              <div className="sc-card-head">
                <h3>Bản đồ kỹ năng</h3>
                <span className="sub">Click dot để cập nhật mức độ</span>
              </div>
              <div className="sc-card-body">
                {/* Level legend */}
                <div className="level-legend">
                  {[1, 2, 3, 4, 5].map(i => (
                    <span key={i} className="ll-item">
                      <span className="ll-dot" style={{ background: LEVEL_COLORS[i] }} />
                      {LEVEL_LABELS[i]}
                    </span>
                  ))}
                </div>

                {/* Add skill row */}
                {(isOwner || isManager) && availableToAdd.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                    <select
                      value={addSkillId}
                      onChange={e => setAddSkillId(e.target.value === "" ? "" : Number(e.target.value))}
                      style={{ flex: 1, minWidth: 180, fontFamily: "inherit", fontSize: ".86rem", background: "var(--content)", border: "1px solid var(--border-2)", borderRadius: 8, padding: "6px 10px", color: "var(--text)", outline: "none" }}
                    >
                      <option value="">+ Thêm kỹ năng…</option>
                      {availableToAdd.map(s => (
                        <option key={s.id} value={s.id}>{s.category ? `[${s.category}] ` : ""}{s.name}</option>
                      ))}
                    </select>
                    <div className="skill-dots">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div
                          key={i}
                          className={`skill-dot${i <= addLevel ? ` filled lv${i}` : ""}`}
                          title={LEVEL_LABELS[i]}
                          onClick={() => setAddLevel(i)}
                        />
                      ))}
                    </div>
                    <button
                      onClick={handleAdd}
                      disabled={adding || !addSkillId}
                      className="abtn primary"
                      style={{ height: 32, fontSize: ".8rem", gap: 5, padding: "0 12px" }}
                    >
                      {adding ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                      Thêm
                    </button>
                  </div>
                )}

                {skills.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "28px 0", color: "var(--text-3)" }}>
                    <BookOpen size={32} style={{ margin: "0 auto 8px", display: "block", opacity: 0.35 }} />
                    <p style={{ fontSize: ".84rem" }}>Chưa khai báo kỹ năng nào.</p>
                  </div>
                ) : (
                  Object.entries(byCategory).map(([cat, items]) => {
                    const style = getCatStyle(cat);
                    const avg = Math.round(items.reduce((a, s) => a + s.currentLevel, 0) / items.length * 10) / 10;
                    return (
                      <div key={cat} className="skill-cat">
                        <div className="skill-cat-head">
                          <div className="skill-cat-ico" style={{ background: style.bg }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke={style.color} strokeWidth="2" strokeLinecap="round">
                              <path d={style.ico} />
                            </svg>
                          </div>
                          <span className="skill-cat-name">{cat}</span>
                          <span className="skill-cat-avg" style={{ color: style.color }}>TB {avg}/5</span>
                        </div>
                        <div>
                          {items.map(s => (
                            <div key={s.id} className="skill-row">
                              <span className="skill-name">
                                {s.skill.name}
                                {s.verifiedAt && <ShieldCheck size={12} style={{ color: "var(--ok)" }} />}
                                {s.targetLevel && s.targetLevel > s.currentLevel && (
                                  <span className="snbadge hot">↑{s.targetLevel}</span>
                                )}
                              </span>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <SkillDots
                                  level={s.currentLevel}
                                  onChange={isOwner || isManager ? v => updateLevel(s.id, v) : undefined}
                                />
                                {(isOwner || isManager) && (
                                  <button
                                    onClick={() => removeSkill(s.id)}
                                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 2, display: "flex" }}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Career gaps as goals */}
            {careerData.some(r => r.gaps.some(g => !g.met)) && (
              <div className="sc-card">
                <div className="sc-card-head">
                  <h3>Mục tiêu phát triển</h3>
                  <span className="sub">Gap kỹ năng cần cải thiện</span>
                </div>
                <div className="sc-card-body">
                  <div className="goal-list">
                    {careerData
                      .filter(r => r.gaps.some(g => !g.met))
                      .slice(0, 6)
                      .flatMap(r => r.gaps.filter(g => !g.met).map(g => ({ role: r.roleLabel, gap: g })))
                      .slice(0, 8)
                      .map(({ role, gap }) => (
                        <div key={`${role}-${gap.skillId}`} className="goal-item">
                          <div className="goal-check">
                            <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="11" height="11"><path d="M5 12l5 5L20 6" /></svg>
                          </div>
                          <div className="goal-body">
                            <div className="goal-title">Nâng kỹ năng {gap.skillName} lên {LEVEL_LABELS[gap.requiredLevel]}</div>
                            <div className="goal-meta">
                              <span className="goal-tag">{role}</span>
                              <span className="goal-tag">{LEVEL_LABELS[gap.currentLevel] || "Chưa có"} → {LEVEL_LABELS[gap.requiredLevel]}</span>
                            </div>
                            <div className="goal-progress">
                              <i style={{ width: `${Math.round((gap.currentLevel / gap.requiredLevel) * 100)}%` }} />
                            </div>
                          </div>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: ".76rem", fontWeight: 700, color: "var(--text-3)" }}>
                            {Math.round((gap.currentLevel / gap.requiredLevel) * 100)}%
                          </span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT column ── */}
          <div className="sc-right">
            {/* Summary ring */}
            <div className="summary-ring">
              <div className="mav" style={{ width: 52, height: 52, borderRadius: "50%", background: avColor(selName), display: "grid", placeItems: "center", color: "#fff", fontSize: "1rem", fontWeight: 700 }}>
                {initials(selName)}
              </div>
              <div className="sr-name">{selName}</div>
              <div className="sr-role">{selDept || selRole || "—"}</div>
              {currentRole && <div className="sr-level">{currentRole}</div>}
              <SkScoreRing score={avgSkill} />
              <div style={{ fontSize: ".76rem", color: "var(--text-3)" }}>Điểm kỹ năng trung bình</div>
            </div>

            {/* Stat grid */}
            <div className="sc-stat-grid">
              <div className="sc-stat">
                <div className="sv">{skills.length}</div>
                <div className="sl">Kỹ năng</div>
              </div>
              <div className="sc-stat">
                <div className="sv">{expertCount}</div>
                <div className="sl">Expert (lv5)</div>
              </div>
              <div className="sc-stat">
                <div className="sv">{verifiedSkills.length}</div>
                <div className="sl">Đã xác nhận</div>
              </div>
              <div className="sc-stat">
                <div className="sv">{totalGaps}</div>
                <div className="sl">Gap cần học</div>
              </div>
            </div>

            {/* Career readiness */}
            {careerData.length > 0 && (
              <div className="sc-card">
                <div className="sc-card-head"><h3>Career readiness</h3></div>
                <div className="sc-card-body" style={{ padding: "12px 18px" }}>
                  {[...careerData].sort((a, b) => a.seniority - b.seniority).map(r => (
                    <div key={r.roleId} style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: ".82rem", fontWeight: r.isCurrent ? 700 : 500, color: r.isCurrent ? "var(--accent-ink)" : "var(--text-2)" }}>
                          {r.roleLabel}{r.isCurrent && " ✦"}
                        </span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: ".76rem", fontWeight: 700, color: r.readinessPct >= 90 ? "var(--ok)" : r.readinessPct >= 60 ? "var(--accent)" : "var(--warn)" }}>
                          {r.readinessPct}%
                        </span>
                      </div>
                      <div style={{ height: 5, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", borderRadius: 99, transition: "width .5s var(--ease)",
                          width: `${r.readinessPct}%`,
                          background: r.readinessPct >= 90 ? "var(--ok)" : r.readinessPct >= 60 ? "var(--accent)" : "var(--warn)",
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Verified skills as certs */}
            {verifiedSkills.length > 0 && (
              <div className="sc-card">
                <div className="sc-card-head"><h3>Kỹ năng đã xác nhận</h3></div>
                <div className="sc-card-body" style={{ padding: "12px 18px" }}>
                  <div className="cert-list">
                    {verifiedSkills.map(s => (
                      <div key={s.id} className="cert-item">
                        <div className="cert-ico" style={{ background: "var(--ok-soft)" }}>
                          <ShieldCheck size={15} style={{ color: "var(--ok)" }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="cert-name">{s.skill.name}</div>
                          <div className="cert-date">
                            {s.verifiedBy?.fullName ? `Bởi ${s.verifiedBy.fullName}` : "Đã xác nhận"}
                          </div>
                        </div>
                        <span className="cert-badge verified">✓ Verified</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {verifiedSkills.length === 0 && (
              <div style={{ background: "var(--elev)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "16px 18px", textAlign: "center", color: "var(--text-3)", fontSize: ".8rem" }}>
                <Sparkles size={20} style={{ margin: "0 auto 6px", display: "block", opacity: 0.4 }} />
                Chưa có kỹ năng nào được xác nhận bởi manager.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
