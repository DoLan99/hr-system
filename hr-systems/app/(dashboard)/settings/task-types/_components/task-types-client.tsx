"use client";

import { useState } from "react";

const SYSTEM_KEYS = ["NORMAL", "LEARNING", "NEW_RESEARCH", "MEETING", "ADMIN", "BILLABLE_CLIENT", "INTERNAL"];

const PRESET_COLORS = [
  "#3B5BDB", "#8b5cf6", "#06b6d4", "#f59e0b",
  "#94a3b8", "#22c55e", "#64748b", "#ef4444",
  "#ec4899", "#f97316", "#84cc16", "#14b8a6",
];

type TaskType = {
  id: number;
  key: string;
  label: string;
  color: string;
  iconEmoji: string;
  sortOrder: number;
  isActive: boolean;
};

type Props = { initialTypes: TaskType[] };

const EMPTY_FORM = { key: "", label: "", color: "#3B5BDB", iconEmoji: "✦" };

export function TaskTypesClient({ initialTypes }: Props) {
  const [types, setTypes] = useState<TaskType[]>(initialTypes);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TaskType | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/task-types").then(r => r.json());
    setTypes(res.data ?? []);
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(t: TaskType) {
    setEditing(t);
    setForm({ key: t.key, label: t.label, color: t.color, iconEmoji: t.iconEmoji });
    setError(null);
    setModalOpen(true);
  }

  async function save() {
    setSaving(true); setError(null);
    try {
      const url = editing ? `/api/task-types/${editing.id}` : "/api/task-types";
      const method = editing ? "PUT" : "POST";
      const body = editing
        ? { key: form.key !== editing.key ? form.key : undefined, label: form.label, color: form.color, iconEmoji: form.iconEmoji }
        : { key: form.key, label: form.label, color: form.color, iconEmoji: form.iconEmoji };

      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) { setError(typeof json.error === "string" ? json.error : "Có lỗi xảy ra"); return; }
      setModalOpen(false);
      refresh();
    } finally { setSaving(false); }
  }

  async function toggleActive(t: TaskType) {
    await fetch(`/api/task-types/${t.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !t.isActive }),
    });
    refresh();
  }

  async function doDelete() {
    if (!deleteId) return;
    setDeleting(true); setDeleteError(null);
    try {
      const res = await fetch(`/api/task-types/${deleteId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) { setDeleteError(typeof json.error === "string" ? json.error : "Có lỗi"); return; }
      setDeleteId(null);
      refresh();
    } finally { setDeleting(false); }
  }

  const f = (key: keyof typeof EMPTY_FORM, val: string) => setForm(p => ({ ...p, [key]: val }));

  const inputStyle: React.CSSProperties = {
    fontFamily: "inherit", fontSize: ".9rem", color: "var(--text)", background: "var(--content)",
    border: "1.5px solid var(--border-2)", borderRadius: 9, padding: "9px 12px", outline: "none", width: "100%",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: ".72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-3)",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div className="page-head" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 0 }}>
        <div>
          <h1>Loại Task</h1>
          <p>Quản lý các loại công việc trong tổ chức · {types.filter(t => t.isActive).length} đang hoạt động</p>
        </div>
        <button className="abtn primary" onClick={openCreate}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ width: 15, height: 15 }}><path d="M12 5v14M5 12h14"/></svg>
          Thêm loại mới
        </button>
      </div>

      {/* List */}
      <div style={{ background: "var(--jh-content)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--elev)", borderBottom: "1px solid var(--border)" }}>
              {["Loại", "Key", "Trạng thái", "Số task", ""].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: ".75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", color: "var(--text-3)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {types.map((t, i) => {
              const isSystem = SYSTEM_KEYS.includes(t.key);
              return (
                <tr key={t.id} style={{ borderBottom: i < types.length - 1 ? "1px solid var(--border)" : "none", opacity: t.isActive ? 1 : .5, transition: "opacity .15s" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: t.color, display: "grid", placeItems: "center", fontSize: "1.1rem", flexShrink: 0 }}>
                        {t.iconEmoji}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: ".9rem", color: "var(--text)" }}>{t.label}</div>
                        {isSystem && <div style={{ fontSize: ".7rem", color: "var(--text-3)" }}>Loại hệ thống</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <code style={{ fontFamily: "var(--font-mono)", fontSize: ".8rem", background: "var(--elev)", padding: "2px 8px", borderRadius: 6, color: "var(--text-2)" }}>{t.key}</code>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {t.isActive
                      ? <span className="ot-status approved">✓ Hoạt động</span>
                      : <span className="ot-status draft">— Ẩn</span>}
                  </td>
                  <td style={{ padding: "12px 16px", fontFamily: "var(--font-mono)", fontSize: ".82rem", color: "var(--text-3)" }}>
                    {t.sortOrder}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <button className="abtn ghost" style={{ height: 30, padding: "0 10px", fontSize: ".8rem" }} onClick={() => openEdit(t)}>
                        Sửa
                      </button>
                      <button className="abtn ghost" style={{ height: 30, padding: "0 10px", fontSize: ".8rem" }} onClick={() => toggleActive(t)}>
                        {t.isActive ? "Ẩn" : "Hiện"}
                      </button>
                      {!isSystem && (
                        <button className="abtn ghost" style={{ height: 30, padding: "0 10px", fontSize: ".8rem", color: "var(--danger)", borderColor: "rgba(255,107,107,.3)" }}
                          onClick={() => { setDeleteId(t.id); setDeleteError(null); }}>
                          Xóa
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="modal-back" onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="ar-modal" style={{ maxWidth: 500 }}>
            <div className="ar-head">
              <div className="ar-ico" style={{ background: form.color, fontSize: "1.1rem", color: "white" }}>{form.iconEmoji}</div>
              <h3>{editing ? `Sửa — ${editing.label}` : "Thêm loại task mới"}</h3>
              <button className="x" onClick={() => setModalOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 17, height: 17 }}><path d="M6 6l12 12M18 6L6 18"/></svg>
              </button>
            </div>

            <div className="ar-body" style={{ gap: 16 }}>
              {/* Key */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={labelStyle}>Key <span style={{ color: "var(--danger)" }}>*</span></label>
                <input value={form.key} onChange={e => f("key", e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
                  placeholder="VD: BUG_FIX, SPRINT_TASK…"
                  style={{ ...inputStyle, fontFamily: "var(--font-mono)" }} />
                {!editing && (
                  <span style={{ fontSize: ".75rem", color: "var(--text-3)" }}>Chỉ gồm chữ HOA, số và dấu _.</span>
                )}
                {editing && SYSTEM_KEYS.includes(editing.key) && form.key !== editing.key && (
                  <span style={{ fontSize: ".75rem", color: "var(--warn,#f59e0b)", background: "rgba(245,158,11,.1)", padding: "5px 9px", borderRadius: 6 }}>
                    ⚠ Đây là loại hệ thống — đổi key sẽ cascade cập nhật tất cả task và template đang dùng loại này.
                  </span>
                )}
                {editing && !SYSTEM_KEYS.includes(editing.key) && form.key !== editing.key && (
                  <span style={{ fontSize: ".75rem", color: "var(--text-3)" }}>
                    Đổi key sẽ tự động cập nhật tất cả task và template đang dùng loại này.
                  </span>
                )}
              </div>

              {/* Label */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={labelStyle}>Tên hiển thị <span style={{ color: "var(--danger)" }}>*</span></label>
                <input value={form.label} onChange={e => f("label", e.target.value)} placeholder="VD: Bug Fix, Sprint Task…" style={inputStyle} />
              </div>

              {/* Icon Emoji */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={labelStyle}>Icon (emoji)</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input value={form.iconEmoji} onChange={e => f("iconEmoji", e.target.value)} placeholder="✦" maxLength={2}
                    style={{ ...inputStyle, width: 72, textAlign: "center", fontSize: "1.3rem" }} />
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {["✦", "🐛", "⚡", "📋", "🎯", "🔧", "💡", "🚀", "📊", "🔒", "🎨", "📱"].map(e => (
                      <button key={e} type="button" onClick={() => f("iconEmoji", e)}
                        style={{ width: 32, height: 32, borderRadius: 7, border: `1.5px solid ${form.iconEmoji === e ? "var(--accent)" : "var(--border-2)"}`, background: form.iconEmoji === e ? "var(--accent-soft)" : "var(--elev)", cursor: "pointer", fontSize: "1rem" }}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Color */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={labelStyle}>Màu nền</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  {PRESET_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => f("color", c)}
                      style={{ width: 28, height: 28, borderRadius: 7, background: c, border: `2.5px solid ${form.color === c ? "var(--text)" : "transparent"}`, cursor: "pointer", flexShrink: 0, transition: "border-color .13s" }} />
                  ))}
                  <input type="color" value={form.color} onChange={e => f("color", e.target.value)}
                    style={{ width: 36, height: 28, borderRadius: 7, border: "1.5px solid var(--border-2)", cursor: "pointer", padding: 2, background: "none" }} />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: ".8rem", color: "var(--text-3)" }}>{form.color}</span>
                </div>
              </div>

              {/* Preview */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--elev)", borderRadius: 9 }}>
                <span style={{ fontSize: ".78rem", color: "var(--text-3)" }}>Xem trước:</span>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: form.color, display: "grid", placeItems: "center", fontSize: "1rem" }}>{form.iconEmoji}</div>
                <span style={{ fontWeight: 700, fontSize: ".9rem", color: "var(--text)" }}>{form.label || "Tên loại"}</span>
                <span style={{ fontSize: ".75rem", padding: "2px 9px", borderRadius: 99, background: form.color + "20", color: form.color, fontWeight: 700 }}>{form.label || "Tên loại"}</span>
              </div>

              {error && <div style={{ fontSize: ".86rem", color: "var(--danger)", background: "var(--danger-soft)", padding: "9px 12px", borderRadius: 8 }}>{error}</div>}
            </div>

            <div className="ar-foot">
              <button className="abtn ghost" onClick={() => setModalOpen(false)}>Hủy</button>
              <button className="abtn primary" disabled={saving || !form.label || (!editing && !form.key)} onClick={save}>
                {saving ? "Đang lưu…" : editing ? "Cập nhật" : "Tạo loại"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="modal-back" onClick={e => { if (e.target === e.currentTarget) setDeleteId(null); }}>
          <div className="ar-modal" style={{ maxWidth: 400 }}>
            <div className="ar-head">
              <div className="ar-ico" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ width: 17, height: 17 }}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
              </div>
              <h3>Xóa loại task?</h3>
              <button className="x" onClick={() => setDeleteId(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 17, height: 17 }}><path d="M6 6l12 12M18 6L6 18"/></svg>
              </button>
            </div>
            <div className="ar-body">
              <p style={{ fontSize: ".88rem", color: "var(--text-2)", lineHeight: 1.6, margin: 0 }}>
                Chỉ có thể xóa loại chưa được dùng trong task hoặc template nào.
              </p>
              {deleteError && <div style={{ fontSize: ".85rem", color: "var(--danger)", background: "var(--danger-soft)", padding: "9px 12px", borderRadius: 8, marginTop: 10 }}>{deleteError}</div>}
            </div>
            <div className="ar-foot">
              <button className="abtn ghost" onClick={() => setDeleteId(null)}>Hủy</button>
              <button className="abtn ghost" style={{ color: "var(--danger)", borderColor: "rgba(255,107,107,.4)" }}
                disabled={deleting} onClick={doDelete}>
                {deleting ? "Đang xóa…" : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
