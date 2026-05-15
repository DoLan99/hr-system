"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useLocale } from "@/lib/i18n/context";
import { RichTextEditor } from "@/components/shared/rich-text-editor";

type Props = {
  open: boolean;
  onClose: () => void;
  employees: { id: number; fullName: string; department: string | null }[];
  customers: { id: number; customerName: string | null; businessName: string | null }[];
  templates: {
    id: number;
    code: string;
    title: string;
    defaultTaskType: string;
    defaultEstimatedTime: number | null;
    defaultPriority: string | null;
    requiresVideo: boolean;
  }[];
  currentUserId: number;
  isManager: boolean;
  initialStatus?: string;
  onSaved: () => void;
};

const STATUSES  = ["BACKLOG", "IN_PROGRESS", "BLOCKED", "REVIEW", "DONE"];
const PRIORITIES = ["CRITICAL", "HIGH", "NORMAL", "LOW"];
const TASK_TYPES = ["NORMAL", "LEARNING", "NEW_RESEARCH", "MEETING", "ADMIN", "BILLABLE_CLIENT", "INTERNAL"];

const STATUS_STYLE: Record<string, string> = {
  BACKLOG:     "bg-slate-100 text-slate-700 border-slate-200",
  IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
  BLOCKED:     "bg-red-50 text-red-700 border-red-200",
  REVIEW:      "bg-amber-50 text-amber-700 border-amber-200",
  DONE:        "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function SideLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] text-slate-400 w-24 flex-shrink-0 pt-0.5 font-medium uppercase tracking-wide">
      {children}
    </span>
  );
}

function SideRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 py-2.5 border-b border-slate-100 last:border-0">
      <SideLabel>{label}</SideLabel>
      <div className="flex-1 min-w-0 text-xs text-slate-700">{children}</div>
    </div>
  );
}

const DEFAULT_FORM = (userId: number, status: string) => ({
  title: "",
  description: "",
  taskType: "NORMAL",
  priority: "NORMAL",
  status,
  estimatedTime: "",
  templateId: "",
  assignedToId: String(userId),
  customerId: "",
  billable: false,
  requiresVideo: false,
  dueDate: "",
  reasonNextAction: "",
});

export function TaskCreateDrawer({
  open, onClose, employees, customers, templates,
  currentUserId, isManager, initialStatus = "IN_PROGRESS", onSaved,
}: Props) {
  const { t } = useLocale();
  const [form, setForm] = useState(DEFAULT_FORM(currentUserId, initialStatus));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-init form when drawer opens
  const [lastOpen, setLastOpen] = useState(false);
  if (open && !lastOpen) {
    setForm(DEFAULT_FORM(currentUserId, initialStatus));
    setError(null);
    setLastOpen(true);
  }
  if (!open && lastOpen) setLastOpen(false);

  function applyTemplate(tplId: string) {
    const tpl = templates.find((t) => t.id.toString() === tplId);
    if (!tpl) { setForm({ ...form, templateId: "" }); return; }
    setForm({
      ...form,
      templateId: tplId,
      title: form.title || tpl.title,
      taskType: tpl.defaultTaskType,
      priority: tpl.defaultPriority ?? "NORMAL",
      estimatedTime: tpl.defaultEstimatedTime?.toString() ?? "",
      requiresVideo: tpl.requiresVideo ?? false,
    });
  }

  async function submit() {
    if (!form.title.trim()) { setError(t("tasks.titleRequired") || "Title is required"); return; }
    setError(null);
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        title: form.title.trim(),
        description: form.description || undefined,
        taskType: form.taskType,
        priority: form.priority,
        status: form.status,
        estimatedTime: form.estimatedTime ? Number(form.estimatedTime) : null,
        templateId: form.templateId ? Number(form.templateId) : null,
        assignedToId: Number(form.assignedToId),
        customerId: form.customerId ? Number(form.customerId) : null,
        billable: form.billable,
        requiresVideo: form.requiresVideo,
        dueDate: form.dueDate || null,
      };
      if (form.status === "BLOCKED" && form.reasonNextAction) {
        body.reasonNextAction = form.reasonNextAction;
      }
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : JSON.stringify(json.error));
        return;
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      <div className="relative z-10 w-full max-w-4xl bg-white shadow-2xl flex flex-col h-full animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 flex-shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-slate-700">{t("tasks.addTask")}</h2>
            {templates.length > 0 && (
              <select
                value={form.templateId}
                onChange={(e) => applyTemplate(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-600 bg-white outline-none focus:ring-2 focus:ring-blue-200 max-w-[220px]"
              >
                <option value="">{t("tasks.selectTemplate")}</option>
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.code} · {tpl.title}
                  </option>
                ))}
              </select>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* ── Main content ── */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 min-w-0">
            {/* Title */}
            <div>
              <input
                autoFocus
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
                placeholder={`${t("common.title")} *`}
                className="w-full text-2xl font-bold text-slate-900 placeholder:text-slate-300 bg-transparent outline-none border-0 leading-tight"
              />
              <div className="h-px bg-slate-200 mt-2" />
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                {t("common.description")}
              </h3>
              <RichTextEditor
                value={form.description}
                onChange={(html) => setForm({ ...form, description: html })}
                placeholder={t("tasks.addDescription")}
                minHeight={200}
              />
            </div>

            {/* Blocked reason */}
            {form.status === "BLOCKED" && (
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  {t("tasks.reasonNextAction")}
                </h3>
                <textarea
                  value={form.reasonNextAction}
                  onChange={(e) => setForm({ ...form, reasonNextAction: e.target.value })}
                  rows={3}
                  className="w-full text-sm border border-red-200 bg-red-50 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-200 resize-none placeholder:text-red-300 text-red-700"
                  placeholder={t("tasks.reasonNextAction")}
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div className="w-[264px] flex-shrink-0 border-l border-slate-200 bg-slate-50/40 overflow-y-auto flex flex-col">
            {/* Status */}
            <div className="px-4 pt-4 pb-3 border-b border-slate-200">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">{t("common.status")}</p>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className={`w-full text-sm font-semibold px-3 py-2 rounded-lg border cursor-pointer outline-none transition-colors ${STATUS_STYLE[form.status] ?? "bg-slate-100 text-slate-700 border-slate-200"}`}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{t(`taskStatus.${s}`) || s}</option>
                ))}
              </select>
            </div>

            {/* Detail rows */}
            <div className="px-4 py-2 flex-1">
              {/* Priority */}
              <SideRow label={t("common.priority")}>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full bg-transparent text-xs outline-none cursor-pointer -ml-0.5"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{t(`taskPriority.${p}`) || p}</option>
                  ))}
                </select>
              </SideRow>

              {/* Task Type */}
              <SideRow label={t("tasks.taskType")}>
                <select
                  value={form.taskType}
                  onChange={(e) => setForm({ ...form, taskType: e.target.value })}
                  className="w-full bg-transparent text-xs outline-none cursor-pointer -ml-0.5"
                >
                  {TASK_TYPES.map((tp) => (
                    <option key={tp} value={tp}>{t(`taskType.${tp}`) || tp}</option>
                  ))}
                </select>
              </SideRow>

              {/* Assignee (manager only) */}
              {isManager && employees.length > 0 && (
                <SideRow label={t("common.assignedTo")}>
                  <select
                    value={form.assignedToId}
                    onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}
                    className="w-full bg-transparent text-xs outline-none cursor-pointer -ml-0.5"
                  >
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>{e.fullName}</option>
                    ))}
                  </select>
                </SideRow>
              )}

              {/* Customer */}
              <SideRow label={t("common.customer")}>
                <select
                  value={form.customerId}
                  onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                  className="w-full bg-transparent text-xs outline-none cursor-pointer -ml-0.5"
                >
                  <option value="">{t("common.none")}</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.businessName ?? c.customerName}</option>
                  ))}
                </select>
              </SideRow>

              {/* Due date */}
              <SideRow label={t("tasks.dueDate")}>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full bg-transparent text-xs outline-none cursor-pointer -ml-0.5"
                />
              </SideRow>

              {/* Estimated time */}
              <SideRow label={t("tasks.estimatedTime")}>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    value={form.estimatedTime}
                    onChange={(e) => setForm({ ...form, estimatedTime: e.target.value })}
                    placeholder="min"
                    className="w-20 text-xs bg-white border border-slate-200 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-blue-200"
                  />
                  <span className="text-slate-400 text-xs">{t("common.minute")}</span>
                </div>
              </SideRow>

              {/* Billable */}
              <SideRow label={t("tasks.billable")}>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.billable}
                    onChange={(e) => setForm({ ...form, billable: e.target.checked })}
                    className="w-3.5 h-3.5 rounded"
                  />
                  <span className={form.billable ? "text-emerald-600 font-semibold" : "text-slate-400"}>
                    {form.billable ? t("common.yes") : t("common.no")}
                  </span>
                </label>
              </SideRow>

              {/* Requires video */}
              <SideRow label={t("tasks.requiresVideo")}>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.requiresVideo}
                    onChange={(e) => setForm({ ...form, requiresVideo: e.target.checked })}
                    className="w-3.5 h-3.5 rounded"
                  />
                  <span className={form.requiresVideo ? "text-blue-600 font-semibold" : "text-slate-400"}>
                    {form.requiresVideo ? t("common.yes") : t("common.no")}
                  </span>
                </label>
              </SideRow>
            </div>

            {/* Create button — pinned to bottom */}
            <div className="px-4 py-4 border-t border-slate-200 bg-white flex flex-col gap-2">
              <button
                onClick={submit}
                disabled={saving || !form.title.trim()}
                className="w-full py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-colors shadow-sm"
              >
                {saving ? t("common.saving") : t("common.create")}
              </button>
              <button
                onClick={onClose}
                disabled={saving}
                className="w-full py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
