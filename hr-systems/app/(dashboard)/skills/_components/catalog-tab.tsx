"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Loader2, Trash2, Edit2, X, Save } from "lucide-react";
import { safeJson } from "@/lib/safe-json";

interface Skill {
  id: number;
  name: string;
  category: string | null;
  description: string | null;
  isActive: boolean;
}

const inpStyle: React.CSSProperties = {
  width: "100%", fontFamily: "inherit", fontSize: ".86rem",
  background: "var(--content)", border: "1px solid var(--border-2)",
  borderRadius: 8, padding: "7px 10px", color: "var(--text)", outline: "none",
  boxSizing: "border-box",
};

export function CatalogTab() {
  const [skills, setSkills]           = useState<Skill[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showCreate, setShowCreate]   = useState(false);
  const [editing, setEditing]         = useState<Skill | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Skill | null>(null);
  const [deleting, setDeleting]       = useState(false);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/skills").then(safeJson);
    setSkills(res.data ?? []);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    await fetch(`/api/skills/${confirmDelete.id}`, { method: "DELETE" });
    setDeleting(false);
    setConfirmDelete(null);
    fetchData();
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 0", color: "var(--text-3)", gap: 8 }}>
        <Loader2 size={16} className="animate-spin" /> Đang tải…
      </div>
    );
  }

  const byCategory = skills.reduce<Record<string, Skill[]>>((acc, s) => {
    const cat = s.category ?? "Khác";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: ".8rem", color: "var(--text-3)" }}>{skills.length} skill trong catalog</span>
        <button onClick={() => setShowCreate(true)} className="abtn primary" style={{ height: 32, fontSize: ".8rem", gap: 5, padding: "0 12px" }}>
          <Plus size={13} /> Thêm skill
        </button>
      </div>

      {skills.length === 0 ? (
        <div style={{ background: "var(--elev)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "32px 16px", textAlign: "center", fontSize: ".84rem", color: "var(--text-3)" }}>
          Chưa có skill nào. Bắt đầu bằng cách thêm (vd: "React", "TypeScript", "PostgreSQL", "Communication"…).
        </div>
      ) : (
        Object.entries(byCategory).map(([cat, items]) => (
          <div key={cat} style={{ background: "var(--elev)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
            <div style={{ padding: "7px 16px", background: "var(--content)", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: ".72rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--text-3)" }}>{cat}</span>
            </div>
            <div>
              {items.map((s, idx) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", borderBottom: idx < items.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: ".86rem", fontWeight: 500, color: "var(--text)" }}>{s.name}</span>
                    {s.description && (
                      <p style={{ fontSize: ".75rem", color: "var(--text-3)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setEditing(s)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 4, borderRadius: 4, display: "flex", transition: "color .12s" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "var(--accent)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "var(--text-3)")}
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(s)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 4, borderRadius: 4, display: "flex", transition: "color .12s" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "var(--danger)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "var(--text-3)")}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {showCreate && (
        <SkillFormModal onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); fetchData(); }} />
      )}
      {editing && (
        <SkillFormModal skill={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); fetchData(); }} />
      )}
      {confirmDelete && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.45)" }}>
          <div style={{ width: "100%", maxWidth: 380, background: "var(--elev)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", boxShadow: "0 20px 60px rgba(0,0,0,.3)", padding: "24px 24px 20px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--danger-soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Trash2 size={16} style={{ color: "var(--danger)" }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: ".95rem", color: "var(--text)", marginBottom: 4 }}>Xoá skill</div>
                <div style={{ fontSize: ".84rem", color: "var(--text-2)", lineHeight: 1.5 }}>
                  Bạn có chắc muốn xoá <b style={{ color: "var(--text)" }}>{confirmDelete.name}</b>? Skill sẽ bị tắt khỏi catalog và không thể gán thêm cho nhân viên.
                </div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setConfirmDelete(null)} className="abtn ghost" style={{ height: 34, padding: "0 14px", fontSize: ".84rem" }} disabled={deleting}>
                Huỷ
              </button>
              <button onClick={handleDelete} disabled={deleting}
                style={{ height: 34, padding: "0 16px", fontSize: ".84rem", fontWeight: 600, fontFamily: "inherit", borderRadius: 8, border: "none", cursor: deleting ? "not-allowed" : "pointer", background: "var(--danger)", color: "#fff", display: "flex", alignItems: "center", gap: 6, opacity: deleting ? .7 : 1 }}>
                {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                Xoá
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SkillFormModal({ skill, onClose, onSaved }: { skill?: Skill; onClose: () => void; onSaved: () => void }) {
  const [name, setName]               = useState(skill?.name ?? "");
  const [category, setCategory]       = useState(skill?.category ?? "");
  const [description, setDescription] = useState(skill?.description ?? "");
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const url    = skill ? `/api/skills/${skill.id}` : "/api/skills";
      const method = skill ? "PUT" : "POST";
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category: category || null, description: description || null }),
      });
      const json = await safeJson(res);
      if (!res.ok) { setError(json.error ?? "Lỗi"); return; }
      onSaved();
    } finally { setSaving(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.45)", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 420, background: "var(--elev)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", boxShadow: "0 20px 60px rgba(0,0,0,.3)" }}>
        {/* Head */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
          <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--text)" }}>
            {skill ? "Sửa skill" : "Thêm skill mới"}
          </h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 4, borderRadius: 6, display: "flex" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={save} style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: ".78rem", fontWeight: 600, color: "var(--text-2)", marginBottom: 5 }}>Tên skill *</label>
            <input
              required value={name} onChange={e => setName(e.target.value)}
              placeholder="vd: React, PostgreSQL, Communication"
              style={inpStyle}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: ".78rem", fontWeight: 600, color: "var(--text-2)", marginBottom: 5 }}>Nhóm</label>
            <input
              value={category} onChange={e => setCategory(e.target.value)}
              placeholder="vd: Frontend, Backend, Soft Skills, Tools"
              style={inpStyle}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: ".78rem", fontWeight: 600, color: "var(--text-2)", marginBottom: 5 }}>Mô tả</label>
            <textarea
              rows={3} value={description} onChange={e => setDescription(e.target.value)}
              style={{ ...inpStyle, resize: "vertical" }}
            />
          </div>

          {error && <p style={{ fontSize: ".8rem", color: "var(--danger)", margin: 0 }}>{typeof error === "string" ? error : JSON.stringify(error)}</p>}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4 }}>
            <button type="button" onClick={onClose} className="abtn ghost" style={{ height: 34, fontSize: ".82rem" }}>Hủy</button>
            <button type="submit" disabled={saving} className="abtn primary" style={{ height: 34, fontSize: ".82rem", gap: 6 }}>
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
