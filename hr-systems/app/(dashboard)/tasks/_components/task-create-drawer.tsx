"use client";

import { useState } from "react";
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

const STATUSES = ["BACKLOG", "IN_PROGRESS", "BLOCKED", "REVIEW", "DONE"];
const PRIORITIES: { value: string; cls: "hi" | "md" | "lo" }[] = [
  { value: "CRITICAL", cls: "hi" },
  { value: "HIGH", cls: "hi" },
  { value: "NORMAL", cls: "md" },
  { value: "LOW", cls: "lo" },
];
const TASK_TYPES: { value: string; color: string }[] = [
  { value: "NORMAL", color: "#3B5BDB" },
  { value: "LEARNING", color: "#8b5cf6" },
  { value: "NEW_RESEARCH", color: "#06b6d4" },
  { value: "MEETING", color: "#f59e0b" },
  { value: "ADMIN", color: "#94a3b8" },
  { value: "BILLABLE_CLIENT", color: "#22c55e" },
  { value: "INTERNAL", color: "#64748b" },
];

function prioCls(p: string) {
  return PRIORITIES.find((x) => x.value === p)?.cls ?? "md";
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
  supportId: "",
  customerId: "",
  billable: false,
  requiresVideo: false,
  dueDate: "",
  reasonNextAction: "",
});

export function TaskCreateDrawer({
  open, onClose, employees, customers, templates,
  currentUserId, isManager, initialStatus = "BACKLOG", onSaved,
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
    const tpl = templates.find((tp) => tp.id.toString() === tplId);
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
        supportId: form.supportId ? Number(form.supportId) : null,
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
      const text = await res.text();
      let json: any = null;
      try { json = text ? JSON.parse(text) : null; } catch { /* not JSON */ }
      if (!res.ok) {
        setError(json && typeof json.error === "string" ? json.error : (json ? JSON.stringify(json.error) : `Lỗi server (${res.status})`));
        return;
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="modal-back" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="jira-modal">
        {/* Header */}
        <div className="jm-head">
          <span className="jm-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </span>
          <h3>{t("tasks.addTask")}</h3>
          {templates.length > 0 && (
            <select
              value={form.templateId}
              onChange={(e) => applyTemplate(e.target.value)}
              className="jm-proj"
              style={{ cursor: "pointer", maxWidth: 200 }}
            >
              <option value="">{t("tasks.selectTemplate")}</option>
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>{tpl.code} · {tpl.title}</option>
              ))}
            </select>
          )}
          <button className="x" onClick={onClose} aria-label="Đóng" style={{ marginLeft: "auto" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="jm-body">
          {/* Left */}
          <div className="jm-left">
            <div>
              <div className="jm-label">{t("tasks.taskType")}</div>
              <div className="itype-row">
                {TASK_TYPES.map((tp) => (
                  <button
                    key={tp.value}
                    type="button"
                    className={`itype${form.taskType === tp.value ? " on" : ""}`}
                    style={form.taskType === tp.value ? { borderColor: tp.color, background: tp.color + "18" } : undefined}
                    onClick={() => setForm({ ...form, taskType: tp.value })}
                  >
                    <span className="it-dot" style={{ background: tp.color }} />
                    {t(`taskType.${tp.value}`) || tp.value}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="jm-label">{t("common.title")} <span style={{ color: "var(--danger)" }}>*</span></div>
              <input
                autoFocus
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
                placeholder="Tóm tắt ngắn gọn nhiệm vụ…"
                className="jm-summary"
              />
            </div>

            <div>
              <div className="jm-label">{t("common.description")}</div>
              <RichTextEditor
                value={form.description}
                onChange={(html) => setForm({ ...form, description: html })}
                placeholder={t("tasks.addDescription")}
                minHeight={280}
              />
            </div>

            {form.status === "BLOCKED" && (
              <div>
                <div className="jm-label" style={{ color: "var(--danger)" }}>{t("tasks.reasonNextAction")}</div>
                <textarea
                  value={form.reasonNextAction}
                  onChange={(e) => setForm({ ...form, reasonNextAction: e.target.value })}
                  rows={3}
                  className="jm-desc"
                  style={{ borderColor: "var(--danger)" }}
                  placeholder={t("tasks.reasonNextAction")}
                />
              </div>
            )}

            {error && (
              <div style={{ fontSize: "0.84rem", color: "var(--danger)", background: "var(--danger-soft)", border: "1px solid var(--danger)", padding: "8px 12px", borderRadius: 8 }}>
                {error}
              </div>
            )}
          </div>

          {/* Right */}
          <div className="jm-right">
            <div className="jm-sec">Chi tiết</div>

            <div className="jm-field">
              <span className="jf-label">{t("common.status")}</span>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{t(`taskStatus.${s}`) || s}</option>
                ))}
              </select>
            </div>

            <div className="jm-field">
              <span className="jf-label">{t("common.priority")}</span>
              <span className={`prio-sel ${prioCls(form.priority)}`}>
                <i />
                <span>{t(`taskPriority.${form.priority}`) || form.priority}</span>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>{t(`taskPriority.${p.value}`) || p.value}</option>
                  ))}
                </select>
              </span>
            </div>

            {isManager && employees.length > 0 && (
              <div className="jm-field">
                <span className="jf-label">{t("common.assignedTo")}</span>
                <select value={form.assignedToId} onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.fullName}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="jm-field">
              <span className="jf-label">{t("tasks.support")}</span>
              <select value={form.supportId} onChange={(e) => setForm({ ...form, supportId: e.target.value })}>
                <option value="">— Chưa chọn —</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.fullName}</option>
                ))}
              </select>
            </div>

            <div className="jm-field">
              <span className="jf-label">{t("common.customer")}</span>
              <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
                <option value="">{t("common.none")}</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.businessName ?? c.customerName}</option>
                ))}
              </select>
            </div>

            <div className="jm-field">
              <span className="jf-label">{t("tasks.dueDate")}</span>
              <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>

            <div className="jm-field">
              <span className="jf-label">{t("tasks.estimatedTime")}</span>
              <input
                type="number"
                min={0}
                value={form.estimatedTime}
                onChange={(e) => setForm({ ...form, estimatedTime: e.target.value })}
                placeholder="phút"
              />
            </div>

            <label className="jm-check">
              <input
                type="checkbox"
                checked={form.billable}
                onChange={(e) => setForm({ ...form, billable: e.target.checked })}
              />
              {t("tasks.billable")}
            </label>

            <label className="jm-check">
              <input
                type="checkbox"
                checked={form.requiresVideo}
                onChange={(e) => setForm({ ...form, requiresVideo: e.target.checked })}
              />
              {t("tasks.requiresVideo")}
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="jm-foot">
          <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
            <button className="abtn ghost" onClick={onClose} disabled={saving}>{t("common.cancel")}</button>
            <button className="abtn primary" onClick={submit} disabled={saving || !form.title.trim()}>
              {saving ? t("common.saving") : t("common.create")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
