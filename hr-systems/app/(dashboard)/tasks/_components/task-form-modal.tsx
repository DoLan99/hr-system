"use client";

import { useEffect, useState } from "react";
import { TASK_TYPE_LABELS } from "@/lib/time-logs";
import { useLocale } from "@/lib/i18n/context";

type Props = {
  open: boolean;
  onClose: () => void;
  editing: any | null;
  employees: { id: number; fullName: string; department: string | null }[];
  customers: { id: number; customerName: string | null; businessName: string | null }[];
  templates: any[];
  currentUserId: number;
  isManager: boolean;
  initialStatus?: string;
  onSaved: () => void;
};

const PRIORITIES = ["CRITICAL", "HIGH", "NORMAL", "LOW"];
const STATUSES = ["BACKLOG", "IN_PROGRESS", "BLOCKED", "REVIEW", "DONE"];

export function TaskFormModal({ open, onClose, editing, employees, customers, templates, currentUserId, isManager, initialStatus, onSaved }: Props) {
  const { t } = useLocale();
  const [form, setForm] = useState({
    title: "",
    description: "",
    taskType: "NORMAL",
    priority: "NORMAL",
    status: "IN_PROGRESS",
    estimatedTime: "",
    templateId: "",
    assignedToId: String(currentUserId),
    customerId: "",
    billable: false,
    requiresVideo: false,
    dueDate: "",
    progressPct: "0",
    reasonNextAction: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (editing) {
        setForm({
          title: editing.title ?? "",
          description: editing.description ?? "",
          taskType: editing.taskType,
          priority: editing.priority,
          status: editing.status,
          estimatedTime: editing.estimatedTime?.toString() ?? "",
          templateId: editing.template?.id?.toString() ?? "",
          assignedToId: editing.assignedTo.id.toString(),
          customerId: editing.customer?.id?.toString() ?? "",
          billable: editing.billable,
          requiresVideo: editing.requiresVideo,
          dueDate: editing.dueDate ? new Date(editing.dueDate).toISOString().split("T")[0] : "",
          progressPct: editing.progressPct?.toString() ?? "0",
          reasonNextAction: editing.reasonNextAction ?? "",
        });
      } else {
        setForm({
          title: "",
          description: "",
          taskType: "NORMAL",
          priority: "NORMAL",
          status: initialStatus ?? "IN_PROGRESS",
          estimatedTime: "",
          templateId: "",
          assignedToId: String(currentUserId),
          customerId: "",
          billable: false,
          requiresVideo: false,
          dueDate: "",
          progressPct: "0",
          reasonNextAction: "",
        });
      }
      setError(null);
    }
  }, [open, editing, currentUserId]);

  function applyTemplate(tplId: string) {
    const tpl = templates.find((t) => t.id.toString() === tplId);
    if (!tpl) return;
    setForm({
      ...form,
      templateId: tplId,
      title: form.title || tpl.title,
      taskType: tpl.defaultTaskType,
      priority: tpl.defaultPriority ?? "NORMAL",
      estimatedTime: tpl.defaultEstimatedTime?.toString() ?? "",
      requiresVideo: tpl.requiresVideo ?? ["LEARNING", "NEW_RESEARCH"].includes(tpl.defaultTaskType),
    });
  }

  if (!open) return null;

  async function submit() {
    setError(null);
    setSaving(true);
    try {
      const body: any = {
        title: form.title,
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
        progressPct: Number(form.progressPct),
      };
      if (form.reasonNextAction) body.reasonNextAction = form.reasonNextAction;

      const url = editing ? `/api/tasks/${editing.id}` : "/api/tasks";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
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

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-5 py-3.5 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">{editing ? `${t("tasks.editTask")} ${editing.code}` : t("tasks.addTask")}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <div className="p-5 space-y-3.5">
          {!editing && templates.length > 0 && (
            <div>
              <label className="text-xs text-slate-600 font-medium">{t("tasks.template")} ({t("common.optional")})</label>
              <select
                value={form.templateId}
                onChange={(e) => applyTemplate(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded"
              >
                <option value="">{t("tasks.selectTemplate")}</option>
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.code} · {tpl.title} ({tpl.defaultEstimatedTime ?? "?"} {t("taskTemplates.minutes")})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs text-slate-600 font-medium">Title <span className="text-red-500">*</span> ({t("common.required")})</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded"
            />
          </div>

          <div>
            <label className="text-xs text-slate-600 font-medium">{t("common.description")}</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-600 font-medium">{t("tasks.taskType")}</label>
              <select
                value={form.taskType}
                onChange={(e) => setForm({ ...form, taskType: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded"
              >
                {Object.keys(TASK_TYPE_LABELS).map((k) => (
                  <option key={k} value={k}>{t(`taskType.${k}`) || TASK_TYPE_LABELS[k as keyof typeof TASK_TYPE_LABELS]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-600 font-medium">{t("common.priority")}</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{t(`taskPriority.${p}`) || p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-600 font-medium">{t("common.status")}</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{t(`taskStatus.${s}`) || s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-600 font-medium">{t("tasks.estimatedTime")}</label>
              <input
                type="number"
                value={form.estimatedTime}
                onChange={(e) => setForm({ ...form, estimatedTime: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded"
              />
            </div>
            {isManager && (
              <div>
                <label className="text-xs text-slate-600 font-medium">{t("common.assignedTo")}</label>
                <select
                  value={form.assignedToId}
                  onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.fullName}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="text-xs text-slate-600 font-medium">{t("common.customer")}</label>
              <select
                value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded"
              >
                <option value="">{t("tasks.selectCustomer")}</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.businessName ?? c.customerName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-600 font-medium">{t("tasks.dueDate")}</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-medium">{t("tasks.progress")}</label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.progressPct}
                onChange={(e) => setForm({ ...form, progressPct: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded"
              />
            </div>
          </div>

          {form.status === "BLOCKED" && (
            <div>
              <label className="text-xs text-slate-600 font-medium">{t("tasks.reasonNextAction")}</label>
              <textarea
                value={form.reasonNextAction}
                onChange={(e) => setForm({ ...form, reasonNextAction: e.target.value })}
                rows={2}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded"
              />
            </div>
          )}

          <div className="flex gap-4 pt-1">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.billable}
                onChange={(e) => setForm({ ...form, billable: e.target.checked })}
              />
              {t("tasks.billable")}
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.requiresVideo}
                onChange={(e) => setForm({ ...form, requiresVideo: e.target.checked })}
              />
              {t("tasks.requiresVideo")}
            </label>
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</div>}
        </div>

        <div className="px-5 py-3 border-t bg-slate-50 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded">
            {t("common.cancel")}
          </button>
          <button
            onClick={submit}
            disabled={saving || !form.title}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? t("common.saving") : editing ? t("common.save") : t("common.create")}
          </button>
        </div>
      </div>
    </div>
  );
}
