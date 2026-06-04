"use client";

import { useState, useCallback } from "react";
import { COLOR_PRESETS } from "@/lib/system-labels";
import { useLocale } from "@/lib/i18n/context";

type LabelEntry = {
  category: string;
  key: string;
  defaultLabel: string;
  defaultColor: string;
  label: string;
  color: string;
  isActive: boolean;
  sortOrder: number;
  inDb: boolean;
};

type CategoryData = {
  category: string;
  meta: { title: string; description: string };
  entries: LabelEntry[];
};

type Props = {
  initialData: CategoryData[];
};

type RowKey = string;

function rk(category: string, key: string): RowKey {
  return `${category}:${key}`;
}

export function SystemLabelsClient({ initialData }: Props) {
  const { t } = useLocale();
  const [activeCategory, setActiveCategory] = useState(initialData[0]?.category ?? "");
  const [rows, setRows] = useState<Record<RowKey, LabelEntry>>(() => {
    const map: Record<RowKey, LabelEntry> = {};
    for (const cat of initialData) {
      for (const entry of cat.entries) {
        map[rk(entry.category, entry.key)] = { ...entry };
      }
    }
    return map;
  });
  const [dirty, setDirty] = useState<Set<RowKey>>(new Set());
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [colorPicker, setColorPicker] = useState<RowKey | null>(null);

  const showToast = useCallback((type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }, []);

  function updateRow(rowKey: RowKey, patch: Partial<LabelEntry>) {
    setRows((prev) => ({ ...prev, [rowKey]: { ...prev[rowKey], ...patch } }));
    setDirty((prev) => new Set(prev).add(rowKey));
  }

  function resetRow(rowKey: RowKey) {
    setRows((prev) => {
      const current = prev[rowKey];
      return {
        ...prev,
        [rowKey]: { ...current, label: current.defaultLabel, color: current.defaultColor, isActive: true },
      };
    });
    setDirty((prev) => {
      const next = new Set(prev);
      next.add(rowKey);
      return next;
    });
  }

  async function saveAll() {
    if (dirty.size === 0) return;
    setSaving(true);
    try {
      const toSave = [...dirty].map((key) => rows[key]).filter(Boolean);
      await Promise.all(
        toSave.map((row) =>
          fetch("/api/system-labels", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              category: row.category,
              key: row.key,
              label: row.label,
              color: row.color,
              isActive: row.isActive,
              sortOrder: row.sortOrder,
            }),
          })
        )
      );
      setDirty(new Set());
      showToast("success", t("systemLabels.savedChanges").replace("{n}", String(toSave.length)));
    } catch {
      showToast("error", t("systemLabels.saveError"));
    } finally {
      setSaving(false);
    }
  }

  const activeCategoryData = initialData.find((c) => c.category === activeCategory);

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">{t("systemLabels.title")}</h1>
        <p className="text-sm text-slate-500">{t("systemLabels.subtitle")}</p>
      </div>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
            toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Tab bar + Save button */}
      <div className="flex items-center gap-0 border-b border-slate-200">
        <div className="flex-1 flex items-center overflow-x-auto">
          {initialData.map((cat) => {
            const dirtyCount = cat.entries.filter((e) => dirty.has(rk(e.category, e.key))).length;
            return (
              <button
                key={cat.category}
                onClick={() => setActiveCategory(cat.category)}
                className={`relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                  activeCategory === cat.category
                    ? "text-blue-700"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                }`}
              >
                {cat.meta.title}
                {dirtyCount > 0 && (
                  <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-blue-600 text-white rounded-full">
                    {dirtyCount}
                  </span>
                )}
                {activeCategory === cat.category && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
        <div className="flex-shrink-0 pl-4 pb-1">
          <button
            onClick={saveAll}
            disabled={dirty.size === 0 || saving}
            className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {saving
              ? t("common.saving")
              : dirty.size > 0
                ? `${t("common.saveChanges")} (${dirty.size})`
                : t("common.saveChanges")}
          </button>
        </div>
      </div>

      {/* Category description */}
      {activeCategoryData && (
        <p className="text-sm text-slate-500">{activeCategoryData.meta.description}</p>
      )}

      {/* Table */}
      {activeCategoryData && (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-left border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide w-36">
                  {t("systemLabels.colKey")}
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide w-40">
                  {t("systemLabels.colDefault")}
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  {t("systemLabels.colDisplay")}
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide w-48">
                  {t("systemLabels.colColor")}
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide w-24 text-center">
                  {t("systemLabels.colVisible")}
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide w-24 text-right">
                  {t("systemLabels.colActions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {activeCategoryData.entries.map((entry) => {
                const key = rk(entry.category, entry.key);
                const row = rows[key] ?? entry;
                const isDirty = dirty.has(key);
                const isShowingPicker = colorPicker === key;

                return (
                  <tr
                    key={key}
                    className={`border-t border-slate-100 dark:border-slate-800 transition-colors ${
                      isDirty ? "bg-blue-50/40" : "hover:bg-slate-50"
                    }`}
                  >
                    {/* Enum key */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {entry.key}
                        </code>
                        {isDirty && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" title={t("systemLabels.unsavedChanges").replace("{n}", "1")} />
                        )}
                      </div>
                    </td>

                    {/* Default label preview */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${entry.defaultColor}`}>
                        {entry.defaultLabel}
                      </span>
                    </td>

                    {/* Editable label */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <input
                          value={row.label}
                          onChange={(e) => updateRow(key, { label: e.target.value })}
                          className="flex-1 px-2.5 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 max-w-xs"
                          placeholder={entry.defaultLabel}
                        />
                        {/* Live preview */}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium flex-shrink-0 ${row.color}`}>
                          {row.label || entry.defaultLabel}
                        </span>
                      </div>
                    </td>

                    {/* Color picker */}
                    <td className="px-4 py-3">
                      <div className="relative">
                        <button
                          onClick={() => setColorPicker(isShowingPicker ? null : key)}
                          className="flex items-center gap-1.5 px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-md hover:border-slate-300 transition-colors text-xs text-slate-600"
                        >
                          <span className={`w-4 h-4 rounded flex-shrink-0 ${row.color.split(" ")[0]}`} />
                          {t("systemLabels.selectColor")}
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 9l6 6 6-6"/>
                          </svg>
                        </button>

                        {isShowingPicker && (
                          <div className="absolute top-full left-0 mt-1 z-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3 w-64">
                            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">{t("systemLabels.selectColor")}</p>
                            <div className="grid grid-cols-4 gap-1.5">
                              {COLOR_PRESETS.map((preset) => {
                                const isSelected = row.color === preset.value;
                                return (
                                  <button
                                    key={preset.value}
                                    onClick={() => {
                                      updateRow(key, { color: preset.value });
                                      setColorPicker(null);
                                    }}
                                    title={preset.name}
                                    className={`relative flex flex-col items-center gap-1 p-1.5 rounded-md border-2 transition-all ${
                                      isSelected ? "border-blue-500 bg-blue-50" : "border-transparent hover:border-slate-200"
                                    }`}
                                  >
                                    <span className={`w-7 h-5 rounded ${preset.value.split(" ")[0]}`} />
                                    <span className={`text-[9px] font-medium ${preset.value.split(" ")[1]}`}>Aa</span>
                                    {isSelected && (
                                      <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-blue-600 rounded-full flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M20 6L9 17l-5-5"/>
                                        </svg>
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Active toggle */}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => updateRow(key, { isActive: !row.isActive })}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                          row.isActive ? "bg-blue-600" : "bg-slate-200"
                        }`}
                        title={row.isActive ? t("systemLabels.showing") : t("systemLabels.hidden")}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white dark:bg-slate-900 shadow transition-transform ${
                            row.isActive ? "translate-x-[18px]" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </td>

                    {/* Reset */}
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => resetRow(key)}
                        className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 px-2 py-1 rounded transition-colors"
                        title={t("systemLabels.reset")}
                      >
                        {t("systemLabels.reset")}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Bottom save bar (sticky) */}
      {dirty.size > 0 && (
        <div className="fixed bottom-4 right-4 flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl z-40">
          <span className="text-sm text-slate-300">
            {t("systemLabels.unsavedChanges").replace("{n}", String(dirty.size))}
          </span>
          <button
            onClick={() => {
              setDirty(new Set());
              setRows(() => {
                const map: Record<RowKey, LabelEntry> = {};
                for (const cat of initialData) {
                  for (const entry of cat.entries) {
                    map[rk(entry.category, entry.key)] = { ...entry };
                  }
                }
                return map;
              });
            }}
            className="text-sm text-slate-400 dark:text-slate-500 hover:text-slate-200 transition-colors"
          >
            {t("systemLabels.cancel")}
          </button>
          <button
            onClick={saveAll}
            disabled={saving}
            className="text-sm bg-blue-600 hover:bg-blue-500 px-4 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {saving ? t("common.saving") : t("systemLabels.saveAll")}
          </button>
        </div>
      )}

      {/* Close color picker on outside click */}
      {colorPicker && (
        <div className="fixed inset-0 z-10" onClick={() => setColorPicker(null)} />
      )}
    </div>
  );
}
