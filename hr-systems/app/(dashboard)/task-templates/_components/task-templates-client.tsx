"use client";

import { useState } from "react";
import { Badge } from "@/components/shared/badge";
import { TASK_TYPE_COLORS } from "@/lib/time-logs";
import { useLocale } from "@/lib/i18n/context";
import { TemplateFormModal } from "./template-form-modal";

type Item = {
  id: number;
  code: string;
  title: string;
  description: string | null;
  defaultTaskType: string;
  defaultEstimatedTime: number | null;
  defaultPriority: string;
  requiresVideo: boolean | null;
  department: string | null;
  usageCount: number;
  isActive: boolean;
  _count: { tasks: number };
};

type Props = {
  initialItems: Item[];
  canManage: boolean;
};

export function TaskTemplatesClient({ initialItems, canManage }: Props) {
  const { t } = useLocale();
  const activeCount = initialItems.filter(i => i.isActive).length;
  const [items, setItems] = useState(initialItems);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);

  async function refresh() {
    const res = await fetch(`/api/task-templates?activeOnly=${!showInactive}`).then((r) => r.json());
    setItems(res.data ?? []);
  }

  async function toggleActive(item: Item) {
    await fetch(`/api/task-templates/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !item.isActive }),
    });
    refresh();
  }

  const filtered = items.filter((t) => {
    if (!showInactive && !t.isActive) return false;
    if (search && !`${t.code} ${t.title}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">{t("taskTemplates.title")}</h1>
        <p className="text-sm text-slate-500">{t("taskTemplates.subtitle")} · {t("taskTemplates.activeCount", { count: activeCount })}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder={t("taskTemplates.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-md w-64"
        />
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
          {t("taskTemplates.showHidden")}
        </label>
        {canManage && (
          <button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="ml-auto px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {t("taskTemplates.create")}
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-left">
            <tr>
              <th className="px-3 py-2.5 font-medium">{t("taskTemplates.colCode")}</th>
              <th className="px-3 py-2.5 font-medium">{t("taskTemplates.colTitle")}</th>
              <th className="px-3 py-2.5 font-medium">{t("taskTemplates.colType")}</th>
              <th className="px-3 py-2.5 font-medium">{t("taskTemplates.colEstimate")}</th>
              <th className="px-3 py-2.5 font-medium">{t("taskTemplates.colPriority")}</th>
              <th className="px-3 py-2.5 font-medium">{t("taskTemplates.colVideo")}</th>
              <th className="px-3 py-2.5 font-medium">{t("taskTemplates.colDept")}</th>
              <th className="px-3 py-2.5 font-medium">{t("taskTemplates.colUsed")}</th>
              <th className="px-3 py-2.5 font-medium text-right">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-slate-400">
                  {t("taskTemplates.noTemplates")}
                </td>
              </tr>
            )}
            {filtered.map((item) => (
              <tr key={item.id} className={`border-t border-slate-100 hover:bg-slate-50 ${!item.isActive && "opacity-50"}`}>
                <td className="px-3 py-2.5 font-mono text-xs text-slate-500">{item.code}</td>
                <td className="px-3 py-2.5 text-slate-800">{item.title}</td>
                <td className="px-3 py-2.5">
                  <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${TASK_TYPE_COLORS[item.defaultTaskType as keyof typeof TASK_TYPE_COLORS]}`}>
                    {t(`taskType.${item.defaultTaskType}`) || item.defaultTaskType}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-slate-600">
                  {item.defaultEstimatedTime ?? "—"} {t("taskTemplates.minutes")}
                </td>
                <td className="px-3 py-2.5 text-slate-600">{item.defaultPriority}</td>
                <td className="px-3 py-2.5">{item.requiresVideo === true ? "✅" : item.requiresVideo === false ? "❌" : "—"}</td>
                <td className="px-3 py-2.5 text-slate-600">{item.department ?? "—"}</td>
                <td className="px-3 py-2.5 text-slate-600">
                  {item.usageCount} <span className="text-xs text-slate-400">({item._count.tasks})</span>
                </td>
                <td className="px-3 py-2.5 text-right">
                  {canManage && (
                    <div className="inline-flex gap-1">
                      <button
                        onClick={() => {
                          setEditing(item);
                          setModalOpen(true);
                        }}
                        className="text-xs px-2 py-1 text-slate-600 hover:bg-slate-100 rounded"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => toggleActive(item)}
                        className={`text-xs px-2 py-1 rounded ${item.isActive ? "text-red-600 hover:bg-red-50" : "text-emerald-600 hover:bg-emerald-50"}`}
                      >
                        {item.isActive ? t("taskTemplates.hide") : t("taskTemplates.show")}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TemplateFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
        onSaved={() => {
          setModalOpen(false);
          refresh();
        }}
      />
    </div>
  );
}
