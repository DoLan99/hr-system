"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Loader2, Trash2, BookOpen, ShieldCheck } from "lucide-react";
import { SKILL_LEVELS } from "@/lib/skills/constants";
import { safeJson } from "@/lib/safe-json";

interface Skill {
  id: number;
  name: string;
  category: string | null;
  description: string | null;
}

interface EmployeeSkillItem {
  id: number;
  skillId: number;
  currentLevel: number;
  targetLevel: number | null;
  notes: string | null;
  verifiedAt: string | null;
  skill: Skill;
  verifiedBy: { fullName: string } | null;
}

const LEVEL_COLORS: Record<number, string> = {
  1: "#ef4444", 2: "#f59e0b", 3: "#3B5BDB", 4: "#22c55e", 5: "#a78bfa",
};

function LevelPicker({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map(l => (
        <button
          key={l}
          type="button"
          disabled={disabled}
          onClick={() => onChange(l)}
          title={SKILL_LEVELS[l]}
          style={{
            width: 24, height: 24, borderRadius: 6, border: "2px solid",
            fontSize: 10, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
            transition: "all .12s", opacity: disabled ? 0.6 : 1,
            background: value >= l ? LEVEL_COLORS[l] : "var(--content)",
            borderColor: value >= l ? "transparent" : "var(--border-2)",
            color: value >= l ? "#fff" : "var(--text-3)",
          }}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export function MySkillsTab({ employeeId, isOwner }: { employeeId: number; isOwner: boolean }) {
  const [skills, setSkills]       = useState<Skill[]>([]);
  const [mySkills, setMySkills]   = useState<EmployeeSkillItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [adding, setAdding]       = useState(false);
  const [addingSkillId, setAddingSkillId] = useState<number | "">("");
  const [addingLevel, setAddingLevel]     = useState(1);

  const fetchData = useCallback(async () => {
    const [skillsRes, mineRes] = await Promise.all([
      fetch("/api/skills").then(safeJson),
      fetch(`/api/employee-skills?employeeId=${employeeId}`).then(safeJson),
    ]);
    setSkills(skillsRes.data ?? []);
    setMySkills(mineRes.data ?? []);
  }, [employeeId]);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const ownedSkillIds  = new Set(mySkills.map(m => m.skillId));
  const availableToAdd = skills.filter(s => !ownedSkillIds.has(s.id));

  async function addSkill() {
    if (!addingSkillId) return;
    setAdding(true);
    try {
      await fetch("/api/employee-skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId: addingSkillId, currentLevel: addingLevel, employeeId }),
      });
      setAddingSkillId(""); setAddingLevel(1);
      await fetchData();
    } finally { setAdding(false); }
  }

  async function updateLevel(id: number, currentLevel: number) {
    await fetch(`/api/employee-skills/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentLevel }),
    });
    setMySkills(prev => prev.map(s => s.id === id ? { ...s, currentLevel } : s));
  }

  async function updateTarget(id: number, targetLevel: number | null) {
    await fetch(`/api/employee-skills/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetLevel }),
    });
    setMySkills(prev => prev.map(s => s.id === id ? { ...s, targetLevel } : s));
  }

  async function removeSkill(id: number) {
    if (!confirm("Xoá skill này khỏi profile?")) return;
    await fetch(`/api/employee-skills/${id}`, { method: "DELETE" });
    setMySkills(prev => prev.filter(s => s.id !== id));
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 0", color: "var(--text-3)", gap: 8 }}>
        <Loader2 size={16} className="animate-spin" /> Đang tải…
      </div>
    );
  }

  const byCategory = mySkills.reduce<Record<string, EmployeeSkillItem[]>>((acc, s) => {
    const cat = s.skill.category ?? "Khác";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  const selStyle: React.CSSProperties = {
    fontFamily: "inherit", fontSize: ".86rem",
    background: "var(--content)", border: "1px solid var(--border-2)",
    borderRadius: 8, padding: "6px 10px", color: "var(--text)", outline: "none",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Add skill row */}
      {isOwner && availableToAdd.length > 0 && (
        <div style={{ background: "var(--elev)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "12px 16px", display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ display: "block", fontSize: ".72rem", fontWeight: 600, color: "var(--text-3)", marginBottom: 4 }}>Thêm skill</label>
            <select
              value={addingSkillId}
              onChange={e => setAddingSkillId(e.target.value === "" ? "" : Number(e.target.value))}
              style={{ ...selStyle, width: "100%" }}
            >
              <option value="">Chọn skill…</option>
              {availableToAdd.map(s => (
                <option key={s.id} value={s.id}>{s.category ? `[${s.category}] ` : ""}{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: ".72rem", fontWeight: 600, color: "var(--text-3)", marginBottom: 4 }}>Level hiện tại</label>
            <LevelPicker value={addingLevel} onChange={setAddingLevel} />
          </div>
          <button
            onClick={addSkill}
            disabled={adding || !addingSkillId}
            className="abtn primary"
            style={{ height: 34, fontSize: ".82rem", gap: 6 }}
          >
            {adding ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
            Thêm
          </button>
        </div>
      )}

      {skills.length === 0 && (
        <div style={{ background: "var(--elev)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "32px 16px", textAlign: "center" }}>
          <BookOpen size={32} style={{ margin: "0 auto 8px", display: "block", color: "var(--text-3)", opacity: 0.4 }} />
          <p style={{ fontSize: ".84rem", color: "var(--text-3)", margin: 0 }}>Catalog skill trống. Manager hãy vào tab "Catalog skill" để tạo skill.</p>
        </div>
      )}

      {mySkills.length === 0 && skills.length > 0 && (
        <div style={{ background: "var(--elev)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "32px 16px", textAlign: "center", fontSize: ".84rem", color: "var(--text-3)" }}>
          Bạn chưa khai báo skill nào. Hãy thêm từ danh sách phía trên.
        </div>
      )}

      {Object.entries(byCategory).map(([cat, items]) => (
        <div key={cat} style={{ background: "var(--elev)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
          <div style={{ padding: "7px 16px", background: "var(--content)", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: ".72rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--text-3)" }}>{cat}</span>
          </div>
          <div>
            {items.map((s, idx) => (
              <div key={s.id} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: idx < items.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: ".86rem", fontWeight: 500, color: "var(--text)" }}>
                    {s.skill.name}
                    {s.verifiedAt && (
                      <ShieldCheck size={13} style={{ color: "var(--ok)" }} title={`Verified by ${s.verifiedBy?.fullName ?? ""}`} />
                    )}
                  </div>
                  {s.skill.description && (
                    <p style={{ fontSize: ".75rem", color: "var(--text-3)", margin: "2px 0 0" }}>{s.skill.description}</p>
                  )}
                </div>
                <div>
                  <p style={{ fontSize: ".7rem", color: "var(--text-3)", marginBottom: 3 }}>Hiện tại · {SKILL_LEVELS[s.currentLevel]}</p>
                  <LevelPicker value={s.currentLevel} onChange={v => updateLevel(s.id, v)} disabled={!isOwner} />
                </div>
                <div>
                  <p style={{ fontSize: ".7rem", color: "var(--text-3)", marginBottom: 3 }}>Mục tiêu · {s.targetLevel ? SKILL_LEVELS[s.targetLevel] : "—"}</p>
                  <LevelPicker value={s.targetLevel ?? 0} onChange={v => updateTarget(s.id, v)} disabled={!isOwner} />
                </div>
                {isOwner && (
                  <button
                    onClick={() => removeSkill(s.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 4, borderRadius: 4, display: "flex", transition: "color .12s" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "var(--danger)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "var(--text-3)")}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
