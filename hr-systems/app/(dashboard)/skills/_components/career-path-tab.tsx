"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, TrendingUp, Sparkles, AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { SKILL_LEVELS } from "@/lib/skills";

interface SkillGap {
  skillId: number;
  skillName: string;
  category: string | null;
  currentLevel: number;
  requiredLevel: number;
  gap: number;
  importance: "CRITICAL" | "IMPORTANT" | "NICE_TO_HAVE";
  met: boolean;
}

interface RoleReadiness {
  roleId: number;
  roleName: string;
  roleLabel: string;
  seniority: number;
  isCurrent: boolean;
  totalRequirements: number;
  metRequirements: number;
  criticalGaps: number;
  readinessPct: number;
  status: "ready" | "almost" | "developing" | "early";
  gaps: SkillGap[];
}

const STATUS_LABEL: Record<string, string> = {
  ready: "Sẵn sàng",
  almost: "Gần sẵn sàng",
  developing: "Đang phát triển",
  early: "Cần học thêm nhiều",
};

const STATUS_COLOR: Record<string, string> = {
  ready: "bg-green-100 text-green-700 border-green-200",
  almost: "bg-blue-100 text-blue-700 border-blue-200",
  developing: "bg-yellow-100 text-yellow-700 border-yellow-200",
  early: "bg-slate-100 text-slate-600 border-slate-200",
};

const IMP_COLOR: Record<string, string> = {
  CRITICAL: "text-red-600 bg-red-50 dark:bg-red-950/40",
  IMPORTANT: "text-orange-600 bg-orange-50 dark:bg-orange-950/40",
  NICE_TO_HAVE: "text-slate-500 bg-slate-50 dark:bg-slate-800",
};

const IMP_LABEL: Record<string, string> = {
  CRITICAL: "Bắt buộc",
  IMPORTANT: "Quan trọng",
  NICE_TO_HAVE: "Nên có",
};

export function CareerPathTab({ employeeId }: { employeeId: number }) {
  const [data, setData] = useState<{ candidates: RoleReadiness[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [creating, setCreating] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/skills/career-path?employeeId=${employeeId}`).then(r => r.json());
    setData(res.data ?? null);
  }, [employeeId]);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  function toggle(roleId: number) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(roleId)) next.delete(roleId); else next.add(roleId);
      return next;
    });
  }

  async function createLearningTask(gap: SkillGap) {
    setCreating(gap.skillId);
    try {
      const res = await fetch("/api/skills/learning-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillId: gap.skillId,
          fromLevel: gap.currentLevel,
          toLevel: gap.requiredLevel,
          estimatedHours: gap.gap * 8,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        alert(`Đã tạo task ${json.data.code}: ${json.data.title}`);
      } else {
        alert(`Lỗi: ${JSON.stringify(json.error)}`);
      }
    } finally { setCreating(null); }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-10 text-slate-400"><Loader2 className="w-4 h-4 animate-spin mr-2" /> Đang tính career path…</div>;
  }
  if (!data) return null;

  const candidates = data.candidates;
  const sorted = [...candidates].sort((a, b) => {
    if (a.isCurrent && !b.isCurrent) return -1;
    if (b.isCurrent && !a.isCurrent) return 1;
    return b.readinessPct - a.readinessPct;
  });

  return (
    <div className="space-y-3">
      {candidates.length === 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center">
          <TrendingUp className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Chưa có role nào trong tổ chức. Manager cần tạo role + yêu cầu skill ở tab "Yêu cầu theo vai trò".</p>
        </div>
      )}

      {sorted.map(role => {
        const isOpen = expanded.has(role.roleId);
        return (
          <div key={role.roleId} className={cn(
            "bg-white dark:bg-slate-900 border rounded-xl overflow-hidden",
            role.isCurrent ? "border-blue-300 dark:border-blue-700" : "border-slate-200 dark:border-slate-700",
          )}>
            <button
              onClick={() => toggle(role.roleId)}
              className="w-full px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{role.roleLabel}</p>
                    {role.isCurrent && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">Hiện tại</span>}
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium border", STATUS_COLOR[role.status])}>
                      {STATUS_LABEL[role.status]}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Đáp ứng {role.metRequirements}/{role.totalRequirements} yêu cầu
                    {role.criticalGaps > 0 && <span className="text-red-600 ml-1">· {role.criticalGaps} gap bắt buộc</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-24">
                  <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                    <span>Sẵn sàng</span>
                    <span className="font-bold">{role.readinessPct}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={cn(
                      "h-full rounded-full transition-all",
                      role.readinessPct >= 90 ? "bg-green-500" :
                        role.readinessPct >= 70 ? "bg-blue-500" :
                          role.readinessPct >= 50 ? "bg-yellow-500" : "bg-slate-300",
                    )} style={{ width: `${role.readinessPct}%` }} />
                  </div>
                </div>
                {role.status === "ready" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                {role.criticalGaps > 0 && <AlertTriangle className="w-4 h-4 text-red-500" />}
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-slate-100 dark:border-slate-800 p-4 bg-slate-50/40 dark:bg-slate-800/20 space-y-2">
                {role.gaps.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-3">Role này chưa có yêu cầu skill nào.</p>
                ) : (
                  role.gaps.map(g => (
                    <div key={g.skillId} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg px-3 py-2 flex flex-wrap items-center gap-2">
                      <div className="flex-1 min-w-[180px]">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                          {g.skillName}
                          {g.category && <span className="text-[10px] text-slate-400">[{g.category}]</span>}
                          <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-medium", IMP_COLOR[g.importance])}>
                            {IMP_LABEL[g.importance]}
                          </span>
                        </p>
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400">
                        {g.currentLevel > 0 ? SKILL_LEVELS[g.currentLevel] : "—"}
                        <span className="mx-1.5 text-slate-300">→</span>
                        <span className="font-semibold">{SKILL_LEVELS[g.requiredLevel]}</span>
                      </div>
                      {g.met ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-green-600 font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Đạt
                        </span>
                      ) : (
                        <button
                          onClick={() => createLearningTask(g)}
                          disabled={creating === g.skillId}
                          className="text-[11px] px-2 py-1 rounded bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 hover:bg-violet-200 disabled:opacity-50 transition flex items-center gap-1"
                        >
                          {creating === g.skillId ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                          Tạo task học
                        </button>
                      )}
                    </div>
                  ))
                )}

                {role.gaps.some(g => !g.met) && (
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-2">
                    <Sparkles className="w-3 h-3 text-violet-500" />
                    Mỗi gap tạo 1 LEARNING task ({"gap × 8h"}). Bạn có thể chỉnh ở trang Tasks.
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
