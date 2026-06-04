"use client";

import { useState } from "react";
import { User, TrendingUp, BookOpen, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { MySkillsTab } from "./my-skills-tab";
import { CareerPathTab } from "./career-path-tab";
import { CatalogTab } from "./catalog-tab";
import { RoleRequirementsTab } from "./role-requirements-tab";


type TabKey = "mine" | "career" | "catalog" | "roles";

export function SkillsClient({ isManager, currentEmployeeId }: { isManager: boolean; currentEmployeeId: number }) {
  const [tab, setTab] = useState<TabKey>("mine");

  const tabs: { key: TabKey; label: string; icon: typeof User; managerOnly?: boolean }[] = [
    { key: "mine", label: "Kỹ năng của tôi", icon: User },
    { key: "career", label: "Career Path", icon: TrendingUp },
    { key: "catalog", label: "Catalog skill", icon: BookOpen, managerOnly: true },
    { key: "roles", label: "Yêu cầu theo vai trò", icon: Settings, managerOnly: true },
  ];
  const visibleTabs = tabs.filter(t => !t.managerOnly || isManager);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Skill & Career Path</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Tự đánh giá skill · Xem mức sẵn sàng lên vai trò mới · Auto-suggest task học từ gap
        </p>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-700">
        {visibleTabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition -mb-px",
              tab === t.key
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
            )}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      <div>
        {tab === "mine" && <MySkillsTab employeeId={currentEmployeeId} isOwner />}
        {tab === "career" && <CareerPathTab employeeId={currentEmployeeId} />}
        {tab === "catalog" && isManager && <CatalogTab />}
        {tab === "roles" && isManager && <RoleRequirementsTab />}
      </div>
    </div>
  );
}
