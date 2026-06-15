"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Loader2, Trash2, ShieldCheck, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { SKILL_LEVELS } from "@/lib/skills/constants";

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

const LEVEL_COLOR: Record<number, string> = {
  1: "bg-slate-200 dark:bg-slate-700",
  2: "bg-blue-300 dark:bg-blue-800",
  3: "bg-blue-500 dark:bg-blue-600",
  4: "bg-violet-500 dark:bg-violet-600",
  5: "bg-violet-700 dark:bg-violet-500",
};

function LevelPicker({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(l => (
        <button
          key={l}
          type="button"
          disabled={disabled}
          onClick={() => onChange(l)}
          title={SKILL_LEVELS[l]}
          className={cn(
            "w-6 h-6 rounded-md border-2 text-[10px] font-bold transition",
            value >= l ? LEVEL_COLOR[l] + " border-transparent text-white" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400",
            disabled && "cursor-not-allowed opacity-60",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export function MySkillsTab({ employeeId, isOwner }: { employeeId: number; isOwner: boolean }) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [mySkills, setMySkills] = useState<EmployeeSkillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [addingSkillId, setAddingSkillId] = useState<number | "">("");
  const [addingLevel, setAddingLevel] = useState(1);

  const fetchData = useCallback(async () => {
    const [skillsRes, mineRes] = await Promise.all([
      fetch("/api/skills").then(r => r.json()),
      fetch(`/api/employee-skills?employeeId=${employeeId}`).then(r => r.json()),
    ]);
    setSkills(skillsRes.data ?? []);
    setMySkills(mineRes.data ?? []);
  }, [employeeId]);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const ownedSkillIds = new Set(mySkills.map(m => m.skillId));
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
      setAddingSkillId("");
      setAddingLevel(1);
      await fetchData();
    } finally { setAdding(false); }
  }

  async function updateLevel(id: number, currentLevel: number) {
    await fetch(`/api/employee-skills/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentLevel }),
    });
    setMySkills(prev => prev.map(s => s.id === id ? { ...s, currentLevel } : s));
  }

  async function updateTarget(id: number, targetLevel: number | null) {
    await fetch(`/api/employee-skills/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
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
    return <div className="flex items-center justify-center py-10 text-slate-400"><Loader2 className="w-4 h-4 animate-spin mr-2" /> Đang tải…</div>;
  }

  const byCategory = mySkills.reduce<Record<string, EmployeeSkillItem[]>>((acc, s) => {
    const cat = s.skill.category ?? "Khác";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Add skill */}
      {isOwner && availableToAdd.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Thêm skill</label>
            <select
              value={addingSkillId}
              onChange={e => setAddingSkillId(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
            >
              <option value="">Chọn skill…</option>
              {availableToAdd.map(s => (
                <option key={s.id} value={s.id}>{s.category ? `[${s.category}] ` : ""}{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Level hiện tại</label>
            <LevelPicker value={addingLevel} onChange={setAddingLevel} />
          </div>
          <button onClick={addSkill} disabled={adding || !addingSkillId}
            className="px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition flex items-center gap-1">
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Thêm
          </button>
        </div>
      )}

      {skills.length === 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Catalog skill trống. Manager hãy vào tab "Catalog skill" để tạo các skill cơ bản.</p>
        </div>
      )}

      {mySkills.length === 0 && skills.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center text-sm text-slate-500">
          Bạn chưa khai báo skill nào. Hãy thêm các skill từ danh sách phía trên.
        </div>
      )}

      {Object.entries(byCategory).map(([cat, items]) => (
        <div key={cat} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="px-5 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">{cat}</p>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map(s => (
              <div key={s.id} className="px-5 py-3 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[180px]">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    {s.skill.name}
                    {s.verifiedAt && (
                      <span title={`Verified by ${s.verifiedBy?.fullName ?? ""}`}>
                        <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                      </span>
                    )}
                  </p>
                  {s.skill.description && <p className="text-[11px] text-slate-400">{s.skill.description}</p>}
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 mb-0.5">Hiện tại · {SKILL_LEVELS[s.currentLevel]}</p>
                  <LevelPicker value={s.currentLevel} onChange={v => updateLevel(s.id, v)} disabled={!isOwner} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 mb-0.5">Mục tiêu · {s.targetLevel ? SKILL_LEVELS[s.targetLevel] : "—"}</p>
                  <LevelPicker value={s.targetLevel ?? 0} onChange={v => updateTarget(s.id, v)} disabled={!isOwner} />
                </div>
                {isOwner && (
                  <button onClick={() => removeSkill(s.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition">
                    <Trash2 className="w-3.5 h-3.5" />
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
