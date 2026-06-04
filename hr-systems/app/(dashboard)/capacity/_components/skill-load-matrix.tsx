"use client";

import { useMemo, useState } from "react";
import { Sparkles, Award } from "lucide-react";
import type { SkillLoadResponse } from "@/lib/capacity";
import { cn } from "@/lib/utils";

const TYPE_LABEL: Record<string, string> = {
  NORMAL: "Bình thường",
  LEARNING: "Học",
  NEW_RESEARCH: "R&D",
  MEETING: "Họp",
  ADMIN: "Hành chính",
  BILLABLE_CLIENT: "Client",
  INTERNAL: "Nội bộ",
};

function expColor(count: number, max: number): string {
  if (count === 0) return "bg-slate-50 dark:bg-slate-900/40 text-slate-300";
  const r = max > 0 ? count / max : 0;
  if (r >= 0.75) return "bg-violet-200 dark:bg-violet-900/70 text-violet-900 dark:text-violet-100 font-bold";
  if (r >= 0.5) return "bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-200 font-semibold";
  if (r >= 0.25) return "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300";
  return "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400";
}

function utilBadge(util: number): { cls: string; label: string } {
  if (util === 0) return { cls: "bg-slate-100 text-slate-500", label: "Rảnh" };
  if (util < 50) return { cls: "bg-green-100 text-green-700", label: `${util}%` };
  if (util < 80) return { cls: "bg-lime-100 text-lime-700", label: `${util}%` };
  if (util <= 100) return { cls: "bg-yellow-100 text-yellow-700", label: `${util}%` };
  if (util <= 120) return { cls: "bg-orange-100 text-orange-700", label: `${util}%` };
  return { cls: "bg-red-100 text-red-700", label: `${util}%` };
}

export function SkillLoadMatrix({ data }: { data: SkillLoadResponse }) {
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const maxPerType = useMemo(() => {
    const m: Record<string, number> = {};
    for (const tt of data.taskTypes) m[tt] = 0;
    for (const row of data.rows) {
      for (const s of row.skills) {
        if (s.experienceCount > m[s.taskType]) m[s.taskType] = s.experienceCount;
      }
    }
    return m;
  }, [data]);

  const suggestion = useMemo(() => {
    if (!selectedType) return [];
    return [...data.rows]
      .filter(r => r.skills.find(s => s.taskType === selectedType)!.experienceCount > 0)
      .sort((a, b) => {
        const expA = a.skills.find(s => s.taskType === selectedType)!.experienceCount;
        const expB = b.skills.find(s => s.taskType === selectedType)!.experienceCount;
        const score = (r: typeof a, exp: number) => exp * 2 - r.utilization / 20;
        return score(b, expB) - score(a, expA);
      })
      .slice(0, 3);
  }, [selectedType, data]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-violet-600" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Skill × Load Matrix
          </h3>
          <span className="text-xs text-slate-400">Số task DONE 90 ngày qua + tải tuần này</span>
        </div>
        {selectedType && (
          <button onClick={() => setSelectedType(null)} className="text-xs text-violet-600 hover:underline">
            Bỏ chọn
          </button>
        )}
      </div>

      {selectedType && suggestion.length > 0 && (
        <div className="px-5 py-3 bg-violet-50 dark:bg-violet-950/30 border-b border-violet-200 dark:border-violet-800">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
            <span className="text-xs font-semibold text-violet-800 dark:text-violet-200">
              Gợi ý assignee cho {TYPE_LABEL[selectedType] ?? selectedType}:
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestion.map((s, i) => {
              const exp = s.skills.find(sk => sk.taskType === selectedType)!.experienceCount;
              const util = utilBadge(s.utilization);
              return (
                <div key={s.employeeId} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg border border-violet-200 dark:border-violet-800">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    #{i + 1} {s.fullName}
                  </span>
                  <span className="text-[10px] text-violet-700 dark:text-violet-300">{exp} task</span>
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded", util.cls)}>{util.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60">
              <th className="text-left px-3 py-2 font-semibold text-slate-500 dark:text-slate-400 sticky left-0 bg-slate-50 dark:bg-slate-800/60 min-w-[160px]">
                Nhân viên
              </th>
              <th className="text-center px-3 py-2 font-semibold text-slate-500 dark:text-slate-400 min-w-[70px]">
                Tải tuần
              </th>
              {data.taskTypes.map(tt => (
                <th
                  key={tt}
                  className={cn(
                    "text-center px-2 py-2 font-medium text-slate-500 cursor-pointer hover:bg-violet-50 dark:hover:bg-violet-950/30 transition min-w-[80px]",
                    selectedType === tt && "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300",
                  )}
                  onClick={() => setSelectedType(selectedType === tt ? null : tt)}
                  title="Click để gợi ý assignee"
                >
                  {TYPE_LABEL[tt] ?? tt}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.rows.map(row => {
              const util = utilBadge(row.utilization);
              return (
                <tr key={row.employeeId}>
                  <td className="px-3 py-2 sticky left-0 bg-white dark:bg-slate-900">
                    <p className="font-medium text-slate-900 dark:text-slate-100 text-xs">{row.fullName}</p>
                    <p className="text-[10px] text-slate-400">{row.department ?? ""}</p>
                  </td>
                  <td className="text-center px-3 py-2">
                    <span className={cn("text-[11px] px-2 py-0.5 rounded-full", util.cls)}>{util.label}</span>
                  </td>
                  {row.skills.map(s => (
                    <td
                      key={s.taskType}
                      className={cn(
                        "text-center px-2 py-2",
                        expColor(s.experienceCount, maxPerType[s.taskType] ?? 0),
                        selectedType === s.taskType && "ring-1 ring-violet-400 ring-inset",
                      )}
                    >
                      <div className="font-mono">{s.experienceCount || ""}</div>
                      {s.experienceCount > 0 && (
                        <div className="text-[9px] opacity-70">{Math.round(s.experienceMinutes / 60)}h</div>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
        Click cột task type để xem gợi ý assignee tốt nhất (kinh nghiệm cao + tải thấp).
      </div>
    </div>
  );
}
