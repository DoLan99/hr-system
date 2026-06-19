"use client";

import { useEffect, useState } from "react";
import { safeJson } from "@/lib/safe-json";

type GoalStatus = "NOT_STARTED" | "IN_PROGRESS" | "DONE" | "CANCELLED";

interface Goal {
  id: number;
  title: string;
  description?: string | null;
  category?: string | null;
  targetDate?: string | null;
  status: GoalStatus;
  progressPct: number;
  targetLevel?: number | null;
  skill?: { id: number; name: string; category?: string | null } | null;
}

interface Skill { id: number; name: string; category?: string | null }

const STATUS_LABEL: Record<GoalStatus, string> = {
  NOT_STARTED: "Chưa bắt đầu",
  IN_PROGRESS: "Đang thực hiện",
  DONE: "Hoàn thành",
  CANCELLED: "Đã huỷ",
};

const STATUS_COLOR: Record<GoalStatus, string> = {
  NOT_STARTED: "var(--text-3)",
  IN_PROGRESS: "var(--accent-ink)",
  DONE: "var(--ok)",
  CANCELLED: "var(--danger)",
};

const STATUS_BG: Record<GoalStatus, string> = {
  NOT_STARTED: "var(--border)",
  IN_PROGRESS: "var(--accent-soft)",
  DONE: "var(--ok-soft)",
  CANCELLED: "var(--danger-soft)",
};

const CATEGORIES = ["Kỹ năng", "Career", "Hành vi", "Kiến thức", "Khác"];
const LEVEL_LABELS = ["", "Beginner", "Elementary", "Intermediate", "Advanced", "Expert"];
const LEVEL_COLORS = ["", "#ef4444", "#f97316", "#3B5BDB", "#22c55e", "#a855f7"];

function fmt(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN");
}

function daysLeft(d?: string | null) {
  if (!d) return null;
  const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  return diff;
}

const EMPTY_FORM = {
  title: "", description: "", category: "Kỹ năng",
  targetDate: "", skillId: "", targetLevel: "", status: "IN_PROGRESS" as GoalStatus, progressPct: 0,
};

export function GoalsTab({ employeeId, isOwner, isManager }: {
  employeeId: number; isOwner: boolean; isManager: boolean;
}) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<GoalStatus | "ALL">("ALL");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/development-goals?employeeId=${employeeId}`).then(safeJson),
      fetch("/api/skills").then(safeJson),
    ]).then(([g, s]) => {
      setGoals(g.data ?? []);
      setSkills(s.data ?? []);
    }).finally(() => setLoading(false));
  }, [employeeId]);

  function openNew() {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
  }

  function openEdit(g: Goal) {
    setEditing(g);
    setForm({
      title: g.title,
      description: g.description ?? "",
      category: g.category ?? "Kỹ năng",
      targetDate: g.targetDate ? g.targetDate.slice(0, 10) : "",
      skillId: g.skill ? String(g.skill.id) : "",
      targetLevel: g.targetLevel ? String(g.targetLevel) : "",
      status: g.status,
      progressPct: g.progressPct,
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const body = {
        employeeId,
        title: form.title,
        description: form.description || null,
        category: form.category || null,
        targetDate: form.targetDate || null,
        skillId: form.skillId ? Number(form.skillId) : null,
        targetLevel: form.targetLevel ? Number(form.targetLevel) : null,
        status: form.status,
        progressPct: Number(form.progressPct),
      };
      const url = editing ? `/api/development-goals/${editing.id}` : "/api/development-goals";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await safeJson(res);
      if (res.ok) {
        setGoals(prev => editing
          ? prev.map(g => g.id === editing.id ? json.data : g)
          : [json.data, ...prev]);
        setShowForm(false);
      }
    } finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    if (!confirm("Xoá mục tiêu này?")) return;
    await fetch(`/api/development-goals/${id}`, { method: "DELETE" });
    setGoals(prev => prev.filter(g => g.id !== id));
  }

  async function updateProgress(id: number, progressPct: number) {
    const status: GoalStatus = progressPct >= 100 ? "DONE" : progressPct > 0 ? "IN_PROGRESS" : "NOT_STARTED";
    await fetch(`/api/development-goals/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ progressPct, status }),
    });
    setGoals(prev => prev.map(g => g.id === id ? { ...g, progressPct, status } : g));
  }

  const shown = filter === "ALL" ? goals : goals.filter(g => g.status === filter);
  const doneCount = goals.filter(g => g.status === "DONE").length;
  const inProgressCount = goals.filter(g => g.status === "IN_PROGRESS").length;

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, gap:12, flexWrap:"wrap" }}>
        <div>
          <div style={{ fontSize:"1rem", fontWeight:700, color:"var(--text)" }}>Mục tiêu phát triển</div>
          <div style={{ fontSize:".78rem", color:"var(--text-3)", marginTop:2 }}>
            {doneCount}/{goals.length} hoàn thành · {inProgressCount} đang thực hiện
          </div>
        </div>
        {(isOwner || isManager) && (
          <button className="abtn primary" style={{ height:34, fontSize:".82rem" }} onClick={openNew}>
            + Thêm mục tiêu
          </button>
        )}
      </div>

      {/* Filter tabs */}
      {goals.length > 0 && (
        <div style={{ display:"flex", gap:4, marginBottom:16, flexWrap:"wrap" }}>
          {(["ALL","IN_PROGRESS","NOT_STARTED","DONE","CANCELLED"] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)}
              style={{
                padding:"4px 12px", borderRadius:99, fontSize:".76rem", fontWeight:600, cursor:"pointer",
                border:`1.5px solid ${filter === s ? "var(--accent)" : "var(--border)"}`,
                background: filter === s ? "var(--accent-soft)" : "none",
                color: filter === s ? "var(--accent-ink)" : "var(--text-3)",
                fontFamily:"inherit",
              }}>
              {s === "ALL" ? `Tất cả (${goals.length})` : `${STATUS_LABEL[s]} (${goals.filter(g => g.status === s).length})`}
            </button>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }}
          onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div style={{ background:"var(--elev)", border:"1px solid var(--border)", borderRadius:16, width:"100%", maxWidth:520, maxHeight:"90vh", overflowY:"auto", padding:"24px 28px", display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <h3 style={{ margin:0, fontSize:"1rem", fontWeight:700 }}>{editing ? "Sửa mục tiêu" : "Thêm mục tiêu mới"}</h3>
              <button onClick={() => setShowForm(false)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:"1.2rem", color:"var(--text-3)", lineHeight:1 }}>×</button>
            </div>

            <div className="dm-f">
              <label>Tên mục tiêu *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Vd: Nâng level React lên Advanced" />
            </div>

            <div className="dm-grid">
              <div className="dm-f">
                <label>Danh mục</label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="dm-f">
                <label>Trạng thái</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as GoalStatus }))}>
                  {Object.entries(STATUS_LABEL).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="dm-f">
                <label>Kỹ năng liên quan</label>
                <select value={form.skillId} onChange={e => setForm(p => ({ ...p, skillId: e.target.value }))}>
                  <option value="">— Không —</option>
                  {skills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="dm-f">
                <label>Mục tiêu level</label>
                <select value={form.targetLevel} onChange={e => setForm(p => ({ ...p, targetLevel: e.target.value }))}>
                  <option value="">— Không —</option>
                  {[1,2,3,4,5].map(l => <option key={l} value={l}>{LEVEL_LABELS[l]}</option>)}
                </select>
              </div>
              <div className="dm-f">
                <label>Hạn hoàn thành</label>
                <input type="date" value={form.targetDate} onChange={e => setForm(p => ({ ...p, targetDate: e.target.value }))} />
              </div>
              <div className="dm-f">
                <label>Tiến độ (%)</label>
                <input type="number" min={0} max={100} value={form.progressPct} onChange={e => setForm(p => ({ ...p, progressPct: Number(e.target.value) }))} />
              </div>
            </div>

            <div className="dm-f">
              <label>Mô tả</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                rows={3} placeholder="Chi tiết về mục tiêu..."
                style={{ resize:"vertical", fontFamily:"inherit", fontSize:".86rem", background:"var(--content)", border:"1px solid var(--border-2)", borderRadius:8, padding:"8px 12px", color:"var(--text)", outline:"none" }} />
            </div>

            <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:4 }}>
              <button className="abtn ghost" style={{ height:34 }} onClick={() => setShowForm(false)}>Hủy</button>
              <button className="abtn primary" style={{ height:34 }} onClick={handleSave} disabled={saving || !form.title.trim()}>
                {saving ? "Đang lưu..." : editing ? "Lưu thay đổi" : "Thêm mục tiêu"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Goals list */}
      {loading ? (
        <div style={{ color:"var(--text-3)", textAlign:"center", padding:"32px 0" }}>Đang tải...</div>
      ) : shown.length === 0 ? (
        <div style={{ textAlign:"center", padding:"40px 0", color:"var(--text-3)" }}>
          <div style={{ fontSize:"2rem", marginBottom:8 }}>🎯</div>
          <div style={{ fontSize:".88rem" }}>
            {filter !== "ALL" ? "Không có mục tiêu nào trong trạng thái này." : "Chưa có mục tiêu phát triển nào. Hãy thêm mục tiêu đầu tiên!"}
          </div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {shown.map(goal => {
            const days = daysLeft(goal.targetDate);
            const isOverdue = days !== null && days < 0 && goal.status !== "DONE";
            return (
              <div key={goal.id} style={{
                background:"var(--content)", border:`1px solid ${goal.status === "DONE" ? "var(--ok)" : isOverdue ? "var(--danger)" : "var(--border)"}`,
                borderRadius:12, padding:"14px 16px", transition:"border-color .15s",
              }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
                  {/* Checkbox circle */}
                  <button
                    onClick={() => updateProgress(goal.id, goal.status === "DONE" ? 0 : 100)}
                    style={{
                      width:22, height:22, borderRadius:"50%", flexShrink:0, marginTop:1, cursor:"pointer",
                      border:`2px solid ${goal.status === "DONE" ? "var(--ok)" : "var(--border-2)"}`,
                      background: goal.status === "DONE" ? "var(--ok)" : "none",
                      display:"grid", placeItems:"center",
                    }}>
                    {goal.status === "DONE" && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" width={11} height={11}><path d="M5 12l5 5L20 6"/></svg>
                    )}
                  </button>

                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                      <span style={{ fontSize:".9rem", fontWeight:700, color: goal.status === "DONE" ? "var(--text-3)" : "var(--text)", textDecoration: goal.status === "DONE" ? "line-through" : "none" }}>
                        {goal.title}
                      </span>
                      <span style={{ fontSize:".72rem", fontWeight:600, padding:"2px 8px", borderRadius:99, background: STATUS_BG[goal.status], color: STATUS_COLOR[goal.status] }}>
                        {STATUS_LABEL[goal.status]}
                      </span>
                      {goal.category && (
                        <span style={{ fontSize:".72rem", color:"var(--text-3)", padding:"2px 8px", borderRadius:99, background:"var(--elev)", border:"1px solid var(--border)" }}>
                          {goal.category}
                        </span>
                      )}
                    </div>

                    {goal.description && (
                      <div style={{ fontSize:".8rem", color:"var(--text-3)", marginTop:4 }}>{goal.description}</div>
                    )}

                    <div style={{ display:"flex", gap:12, marginTop:8, flexWrap:"wrap", alignItems:"center" }}>
                      {goal.skill && (
                        <span style={{ fontSize:".76rem", color:"var(--text-2)" }}>
                          🧩 {goal.skill.name}
                          {goal.targetLevel && (
                            <span style={{ marginLeft:4, color: LEVEL_COLORS[goal.targetLevel], fontWeight:700 }}>→ {LEVEL_LABELS[goal.targetLevel]}</span>
                          )}
                        </span>
                      )}
                      {goal.targetDate && (
                        <span style={{ fontSize:".76rem", color: isOverdue ? "var(--danger)" : "var(--text-3)" }}>
                          📅 {fmt(goal.targetDate)}{isOverdue ? " (quá hạn)" : days !== null && days <= 7 ? ` (còn ${days}d)` : ""}
                        </span>
                      )}
                    </div>

                    {/* Progress bar */}
                    {goal.status !== "CANCELLED" && (
                      <div style={{ marginTop:10 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                          <span style={{ fontSize:".72rem", color:"var(--text-3)" }}>Tiến độ</span>
                          <span style={{ fontSize:".72rem", fontWeight:700, fontFamily:"var(--font-mono)", color: goal.progressPct >= 100 ? "var(--ok)" : "var(--text-2)" }}>{goal.progressPct}%</span>
                        </div>
                        <div style={{ height:5, background:"var(--border)", borderRadius:99, overflow:"hidden" }}>
                          <div style={{
                            height:"100%", borderRadius:99, transition:"width .4s",
                            background: goal.progressPct >= 100 ? "var(--ok)" : goal.progressPct >= 60 ? "var(--accent)" : "var(--warn)",
                            width:`${goal.progressPct}%`,
                          }} />
                        </div>
                        {(isOwner || isManager) && goal.status !== "DONE" && (
                          <input type="range" min={0} max={100} step={5} value={goal.progressPct}
                            onChange={e => updateProgress(goal.id, Number(e.target.value))}
                            style={{ width:"100%", marginTop:4, accentColor:"var(--accent)" }} />
                        )}
                      </div>
                    )}
                  </div>

                  {(isOwner || isManager) && (
                    <div style={{ display:"flex", gap:4, flexShrink:0 }}>
                      <button onClick={() => openEdit(goal)} className="abtn ghost" style={{ height:28, padding:"0 8px", fontSize:".76rem" }}>Sửa</button>
                      <button onClick={() => handleDelete(goal.id)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-3)", padding:"4px 6px", fontSize:"1rem", lineHeight:1 }}>×</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
