"use client";

import { useEffect, useState, useRef } from "react";

// Hardcoded issue types (not from DB)
const ISSUE_TYPE_OPTIONS = [
  { key: "TASK",    label: "Task",    color: "#3B5BDB" },
  { key: "BUG",     label: "Bug",     color: "#ef4444" },
  { key: "STORY",   label: "Story",   color: "#22c55e" },
  { key: "SUBTASK", label: "Subtask", color: "#f59e0b" },
];

const PRIO_OPTIONS = [
  { value: "CRITICAL", label: "Khẩn cấp", color: "#ef4444" },
  { value: "HIGH",     label: "Cao",       color: "#ef4444" },
  { value: "NORMAL",   label: "Vừa",       color: "#f59e0b" },
  { value: "LOW",      label: "Thấp",      color: "#94a3b8" },
];

type TaskTypeOpt = { key: string; label: string; color: string; iconEmoji: string };
type EmployeeOpt = { id: number; fullName: string };
type Props = { open: boolean; onClose: () => void; editing: any | null; onSaved: () => void; taskTypes?: TaskTypeOpt[]; employees?: EmployeeOpt[] };

const EMPTY_FORM = {
  code: "", title: "", description: "",
  defaultTaskType: "TASK", defaultEstimatedTime: "",
  defaultPriority: "NORMAL", requiresVideo: "default",
  department: "", linkTemplate: "", defaultAssigneeId: "",
};

export function TemplateFormModal({ open, onClose, editing, onSaved, taskTypes, employees = [] }: Props) {
  const categoryOptions = taskTypes ?? [];
  const [form, setForm] = useState(EMPTY_FORM);
  const [checklist, setChecklist] = useState<string[]>([]);
  const [clInput, setClInput] = useState("");
  const [labels, setLabels] = useState<string[]>([]);
  const [lblInput, setLblInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const clRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        code: editing.code,
        title: editing.title,
        description: editing.description ?? "",
        defaultTaskType: editing.defaultTaskType,
        defaultEstimatedTime: editing.defaultEstimatedTime ? (editing.defaultEstimatedTime / 60).toString() : "",
        defaultAssigneeId: editing.defaultAssigneeId?.toString() ?? "",
        defaultPriority: editing.defaultPriority ?? "NORMAL",
        requiresVideo: editing.requiresVideo === null ? "default" : editing.requiresVideo ? "true" : "false",
        department: editing.department ?? "",
        linkTemplate: editing.linkTemplate ?? "",
      });
      setChecklist(editing.defaultChecklist ?? []);
      setLabels(editing.defaultLabels ?? []);
    } else {
      setForm(EMPTY_FORM);
      setChecklist([]);
      setLabels([]);
    }
    setClInput(""); setLblInput(""); setError(null);
  }, [open, editing]);

  if (!open) return null;

  function addClItem() {
    const v = clInput.trim();
    if (v && !checklist.includes(v)) setChecklist(p => [...p, v]);
    setClInput("");
    clRef.current?.focus();
  }

  function removeClItem(i: number) { setChecklist(p => p.filter((_, idx) => idx !== i)); }
  function moveClItem(i: number, dir: -1 | 1) {
    setChecklist(p => {
      const n = [...p];
      const j = i + dir;
      if (j < 0 || j >= n.length) return p;
      [n[i], n[j]] = [n[j], n[i]]; return n;
    });
  }

  function addLabel() {
    const v = lblInput.trim();
    if (v && !labels.includes(v)) setLabels(p => [...p, v]);
    setLblInput("");
  }

  async function submit() {
    setError(null); setSaving(true);
    try {
      const body: any = {
        title: form.title,
        description: form.description || undefined,
        defaultTaskType: form.defaultTaskType,
        defaultEstimatedTime: form.defaultEstimatedTime ? Math.round(Number(form.defaultEstimatedTime) * 60) : null,
        defaultPriority: form.defaultPriority,
        requiresVideo: form.requiresVideo === "default" ? null : form.requiresVideo === "true",
        department: form.department || undefined,
        linkTemplate: form.linkTemplate || undefined,
        defaultChecklist: checklist.length ? checklist : null,
        defaultLabels: labels.length ? labels : null,
        defaultAssigneeId: form.defaultAssigneeId ? Number(form.defaultAssigneeId) : null,
      };
      if (!editing) body.code = form.code;
      const url = editing ? `/api/task-templates/${editing.id}` : "/api/task-templates";
      const res = await fetch(url, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) { setError(typeof json.error === "string" ? json.error : JSON.stringify(json.error)); return; }
      onSaved();
    } finally { setSaving(false); }
  }

  const f = (key: keyof typeof EMPTY_FORM, val: string) => setForm(p => ({ ...p, [key]: val }));

  const inputStyle: React.CSSProperties = {
    fontFamily: "inherit", fontSize: ".9rem", color: "var(--text)", background: "var(--content)",
    border: "1.5px solid var(--border-2)", borderRadius: 9, padding: "9px 12px", outline: "none", width: "100%",
    transition: "border-color .15s, box-shadow .15s",
  };
  const labelStyle: React.CSSProperties = { fontSize: ".72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-3)" };
  const fieldStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 7 };

  return (
    <div className="modal-back" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="tpl-modal">
        {/* Header */}
        <div className="tpl-mhead">
          <div className="mico">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 17, height: 17, color: "#fff" }}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          </div>
          <h3>{editing ? `Sửa — ${editing.code}` : "Tạo Template mới"}</h3>
          <button className="x" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 17, height: 17 }}><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>

        {/* Body */}
        <div className="tpl-mbody">
          {/* Code (create only) */}
          {!editing && (
            <div style={fieldStyle}>
              <label style={labelStyle}>Code <span style={{ color: "var(--danger)" }}>*</span></label>
              <input value={form.code} onChange={e => f("code", e.target.value.toUpperCase())}
                placeholder="VD: CODE_REVIEW, API_ENDPOINT…"
                style={{ ...inputStyle, fontFamily: "var(--font-mono)" }} />
            </div>
          )}

          {/* Title */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Tên template <span style={{ color: "var(--danger)" }}>*</span></label>
            <input value={form.title} onChange={e => f("title", e.target.value)} style={inputStyle} />
          </div>

          {/* Issue Type — hardcoded */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Loại issue</label>
            <div className="itype-row">
              {ISSUE_TYPE_OPTIONS.map(opt => (
                <button key={opt.key} type="button"
                  className={`itype-btn${form.defaultTaskType === opt.key ? " on" : ""}`}
                  style={form.defaultTaskType === opt.key ? { borderColor: opt.color, background: opt.color + "20" } : {}}
                  onClick={() => f("defaultTaskType", opt.key)}>
                  <span className="idot" style={{ background: opt.color }} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Row: Priority + Estimate */}
          <div className="tpl-mrow">
            <div style={fieldStyle}>
              <label style={labelStyle}>Ưu tiên</label>
              <select value={form.defaultPriority} onChange={e => f("defaultPriority", e.target.value)} style={inputStyle}>
                {PRIO_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Ước tính (giờ)</label>
              <input type="number" value={form.defaultEstimatedTime} onChange={e => f("defaultEstimatedTime", e.target.value)}
                placeholder="VD: 4" style={inputStyle} />
            </div>
          </div>

          {/* Row: Danh mục + Giao mặc định */}
          <div className="tpl-mrow">
            <div style={fieldStyle}>
              <label style={labelStyle}>Danh mục</label>
              <select value={form.department} onChange={e => f("department", e.target.value)} style={inputStyle}>
                <option value="">— Chọn danh mục —</option>
                {categoryOptions.map(t => (
                  <option key={t.key} value={t.label}>{t.label}</option>
                ))}
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Giao mặc định</label>
              <select value={form.defaultAssigneeId} onChange={e => f("defaultAssigneeId", e.target.value)} style={inputStyle}>
                <option value="">— Không chỉ định —</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.fullName}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Link tài liệu */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Link tài liệu</label>
            <input type="url" value={form.linkTemplate} onChange={e => f("linkTemplate", e.target.value)} placeholder="https://…" style={inputStyle} />
          </div>

          {/* Description */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Mô tả</label>
            <textarea value={form.description} onChange={e => f("description", e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical", minHeight: 68 }} />
          </div>

          {/* Labels */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Labels / Tags</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
              {labels.map((lb, i) => (
                <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "var(--accent-soft)", color: "var(--accent-ink)", fontSize: ".78rem", fontWeight: 600, padding: "3px 9px", borderRadius: 99 }}>
                  {lb}
                  <button type="button" onClick={() => setLabels(p => p.filter((_, j) => j !== i))}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent-ink)", padding: 0, lineHeight: 1, fontSize: ".9rem" }}>×</button>
                </span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={lblInput} onChange={e => setLblInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addLabel(); } }}
                placeholder="Nhập label rồi Enter…" style={{ ...inputStyle, flex: 1 }} />
              <button type="button" className="abtn ghost" onClick={addLabel} style={{ flexShrink: 0 }}>Thêm</button>
            </div>
          </div>

          {/* Checklist */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Checklist mặc định ({checklist.length} bước)</label>
            {checklist.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 8 }}>
                {checklist.map((cl, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "var(--content)", border: "1px solid var(--border)", borderRadius: 8 }}>
                    <span style={{ width: 16, height: 16, border: "1.5px solid var(--border-2)", borderRadius: 4, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: ".85rem", color: "var(--text-2)" }}>{cl}</span>
                    <button type="button" onClick={() => moveClItem(i, -1)} disabled={i === 0}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: "0 2px", fontSize: ".9rem", opacity: i === 0 ? .3 : 1 }}>↑</button>
                    <button type="button" onClick={() => moveClItem(i, 1)} disabled={i === checklist.length - 1}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: "0 2px", fontSize: ".9rem", opacity: i === checklist.length - 1 ? .3 : 1 }}>↓</button>
                    <button type="button" onClick={() => removeClItem(i)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)", padding: "0 2px", fontSize: "1rem" }}>×</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <input ref={clRef} value={clInput} onChange={e => setClInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addClItem(); } }}
                placeholder="Nhập bước checklist rồi Enter…" style={{ ...inputStyle, flex: 1 }} />
              <button type="button" className="abtn ghost" onClick={addClItem} style={{ flexShrink: 0 }}>Thêm</button>
            </div>
          </div>

          {error && (
            <div style={{ fontSize: ".86rem", color: "var(--danger)", background: "var(--danger-soft)", padding: "9px 12px", borderRadius: 8 }}>{error}</div>
          )}
        </div>

        {/* Footer */}
        <div className="tpl-mfoot">
          <button className="abtn ghost" onClick={onClose}>Hủy</button>
          <button className="abtn primary" disabled={saving || !form.title || (!editing && !form.code)} onClick={submit}>
            {saving ? "Đang lưu…" : editing ? "Cập nhật" : "Tạo Template"}
          </button>
        </div>
      </div>
    </div>
  );
}
