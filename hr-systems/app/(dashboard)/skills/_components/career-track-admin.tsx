"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Loader2, Trash2, Edit2, ChevronRight, ChevronDown, X } from "lucide-react";
import { SKILL_LEVELS } from "@/lib/skills/constants";

interface Skill { id: number; name: string; category: string | null }
interface LevelSkill { skillId: number; requiredLevel: number; importance: string; skill: Skill }
interface Level { id: number; name: string; seniority: number; skillRequirements: LevelSkill[] }
interface Track { id: number; name: string; description: string | null; color: string | null; levels: Level[]; _count: { employees: number } }

const TRACK_COLORS = ["#3B5BDB","#7c3aed","#0891b2","#059669","#d97706","#dc2626","#be185d","#0f766e"];
const IMP = [
  { val: "CRITICAL", label: "Bắt buộc", color: "var(--danger)" },
  { val: "IMPORTANT", label: "Quan trọng", color: "var(--warn)" },
  { val: "NICE_TO_HAVE", label: "Nên có", color: "var(--text-3)" },
] as const;

const inp: React.CSSProperties = {
  fontFamily: "inherit", fontSize: ".86rem",
  background: "var(--content)", border: "1px solid var(--border-2)",
  borderRadius: 7, padding: "6px 10px", color: "var(--text)", outline: "none", width: "100%", boxSizing: "border-box",
};

async function safeJson(r: Response) {
  const text = await r.text().catch(() => "");
  if (!text) return {};
  try { return JSON.parse(text); } catch { return {}; }
}

export function CareerTrackAdmin({ allSkills }: { allSkills: Skill[] }) {
  const [tracks, setTracks]           = useState<Track[]>([]);
  const [loading, setLoading]         = useState(true);
  const [selectedId, setSelectedId]   = useState<number | null>(null);
  const [expandedLevels, setExpanded] = useState<Set<number>>(new Set());

  // Track form
  const [showTrackForm, setShowTrackForm] = useState(false);
  const [editTrack, setEditTrack]         = useState<Track | null>(null);

  // Level form
  const [addingLevelTrackId, setAddingLevelTrackId] = useState<number | null>(null);
  const [newLevelName, setNewLevelName]             = useState("");
  const [newLevelSen, setNewLevelSen]               = useState(1);
  const [savingLevel, setSavingLevel]               = useState(false);

  const fetchTracks = useCallback(async () => {
    const res = await fetch("/api/career-tracks").then(safeJson).catch(() => ({ data: [] }));
    const list: Track[] = res.data ?? [];
    setTracks(list);
    if (list.length > 0 && selectedId == null) setSelectedId(list[0].id);
  }, [selectedId]);

  useEffect(() => {
    setLoading(true);
    fetchTracks().finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const selectedTrack = tracks.find(t => t.id === selectedId) ?? null;

  function toggleLevel(id: number) {
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  async function addLevel(trackId: number) {
    if (!newLevelName.trim()) return;
    setSavingLevel(true);
    try {
      const res = await fetch(`/api/career-tracks/${trackId}/levels`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newLevelName.trim(), seniority: newLevelSen }),
      }).then(safeJson);
      if (res.data) {
        setTracks(prev => prev.map(t => t.id === trackId
          ? { ...t, levels: [...t.levels, res.data].sort((a: Level, b: Level) => a.seniority - b.seniority) }
          : t));
        setNewLevelName(""); setNewLevelSen(prev => prev + 1);
        setAddingLevelTrackId(null);
      }
    } finally { setSavingLevel(false); }
  }

  async function deleteLevel(trackId: number, levelId: number) {
    if (!confirm("Xóa cấp này?")) return;
    await fetch(`/api/career-tracks/${trackId}/levels/${levelId}`, { method: "DELETE" });
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, levels: t.levels.filter(l => l.id !== levelId) } : t));
  }

  async function addSkillToLevel(trackId: number, levelId: number, skillId: number, requiredLevel: number, importance: string) {
    const res = await fetch(`/api/career-tracks/${trackId}/levels/${levelId}/skills`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skillId, requiredLevel, importance }),
    }).then(safeJson);
    if (res.data) {
      setTracks(prev => prev.map(t => t.id === trackId ? {
        ...t,
        levels: t.levels.map(l => l.id === levelId
          ? { ...l, skillRequirements: [...l.skillRequirements.filter(s => s.skillId !== skillId), res.data] }
          : l),
      } : t));
    }
  }

  async function removeSkillFromLevel(trackId: number, levelId: number, skillId: number) {
    await fetch(`/api/career-tracks/${trackId}/levels/${levelId}/skills`, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skillId }),
    });
    setTracks(prev => prev.map(t => t.id === trackId ? {
      ...t,
      levels: t.levels.map(l => l.id === levelId
        ? { ...l, skillRequirements: l.skillRequirements.filter(s => s.skillId !== skillId) }
        : l),
    } : t));
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "24px 0", color: "var(--text-3)" }}>
      <Loader2 size={15} className="animate-spin" /> Đang tải…
    </div>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16, minHeight: 400 }}>
      {/* ── Left: Track list ── */}
      <div style={{ background: "var(--elev)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "8px 14px 8px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: ".72rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--text-3)" }}>Track</span>
          <button onClick={() => { setEditTrack(null); setShowTrackForm(true); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)", padding: 2, display: "flex" }}>
            <Plus size={15} />
          </button>
        </div>
        {tracks.length === 0 && (
          <div style={{ padding: "20px 14px", fontSize: ".82rem", color: "var(--text-3)", textAlign: "center" }}>
            Chưa có track nào. Tạo mới để bắt đầu.
          </div>
        )}
        {tracks.map(t => (
          <button key={t.id} onClick={() => setSelectedId(t.id)}
            style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 14px",
              border: "none", borderBottom: "1px solid var(--border)", cursor: "pointer", textAlign: "left",
              background: selectedId === t.id ? "var(--accent-soft)" : "transparent",
              color: selectedId === t.id ? "var(--accent-ink)" : "var(--text-2)",
              fontWeight: selectedId === t.id ? 600 : 400, fontSize: ".84rem", transition: "background .1s",
            }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", flexShrink: 0, background: t.color ?? "var(--accent)" }} />
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</span>
            <span style={{ fontSize: ".72rem", color: "var(--text-3)" }}>{t.levels.length}</span>
          </button>
        ))}
      </div>

      {/* ── Right: Track detail ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {!selectedTrack ? (
          <div style={{ background: "var(--elev)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "40px 0", textAlign: "center", color: "var(--text-3)", fontSize: ".84rem" }}>
            Chọn track bên trái hoặc tạo mới
          </div>
        ) : (
          <>
            {/* Track header */}
            <div style={{ background: "var(--elev)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 14, height: 14, borderRadius: "50%", background: selectedTrack.color ?? "var(--accent)", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 700, fontSize: ".92rem", color: "var(--text)" }}>{selectedTrack.name}</span>
                {selectedTrack.description && <span style={{ fontSize: ".78rem", color: "var(--text-3)", marginLeft: 10 }}>{selectedTrack.description}</span>}
              </div>
              <span style={{ fontSize: ".76rem", color: "var(--text-3)" }}>{selectedTrack._count.employees} nhân viên</span>
              <button onClick={() => { setEditTrack(selectedTrack); setShowTrackForm(true); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 4, display: "flex" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--accent)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-3)")}>
                <Edit2 size={13} />
              </button>
            </div>

            {/* Levels */}
            {selectedTrack.levels.map(level => {
              const isOpen = expandedLevels.has(level.id);
              const usedSkillIds = new Set(level.skillRequirements.map(s => s.skillId));
              const availableSkills = allSkills.filter(s => !usedSkillIds.has(s.id));
              return (
                <LevelCard
                  key={level.id}
                  level={level}
                  trackId={selectedTrack.id}
                  isOpen={isOpen}
                  onToggle={() => toggleLevel(level.id)}
                  onDelete={() => deleteLevel(selectedTrack.id, level.id)}
                  availableSkills={availableSkills}
                  onAddSkill={(skillId, req, imp) => addSkillToLevel(selectedTrack.id, level.id, skillId, req, imp)}
                  onRemoveSkill={skillId => removeSkillFromLevel(selectedTrack.id, level.id, skillId)}
                />
              );
            })}

            {/* Add level */}
            {addingLevelTrackId === selectedTrack.id ? (
              <div style={{ background: "var(--elev)", border: "1px solid var(--accent)", borderRadius: "var(--r-lg)", padding: "12px 16px", display: "flex", flexWrap: "wrap", gap: 8, alignItems: "flex-end" }}>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <label style={{ display: "block", fontSize: ".72rem", fontWeight: 600, color: "var(--text-3)", marginBottom: 4 }}>Tên cấp</label>
                  <input value={newLevelName} onChange={e => setNewLevelName(e.target.value)} placeholder="vd. Junior, Senior…" style={inp} autoFocus />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: ".72rem", fontWeight: 600, color: "var(--text-3)", marginBottom: 4 }}>Thứ tự</label>
                  <input type="number" min={1} value={newLevelSen} onChange={e => setNewLevelSen(Number(e.target.value))}
                    style={{ ...inp, width: 70 }} />
                </div>
                <button onClick={() => addLevel(selectedTrack.id)} disabled={savingLevel || !newLevelName.trim()}
                  className="abtn primary" style={{ height: 34, gap: 5, fontSize: ".82rem" }}>
                  {savingLevel ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Thêm
                </button>
                <button onClick={() => setAddingLevelTrackId(null)} className="abtn ghost" style={{ height: 34, fontSize: ".82rem" }}>
                  <X size={13} />
                </button>
              </div>
            ) : (
              <button onClick={() => { setAddingLevelTrackId(selectedTrack.id); setNewLevelSen((selectedTrack.levels[selectedTrack.levels.length - 1]?.seniority ?? 0) + 1); }}
                style={{ background: "var(--elev)", border: "1px dashed var(--border-2)", borderRadius: "var(--r-lg)", padding: "10px 16px", cursor: "pointer", color: "var(--text-3)", fontSize: ".84rem", display: "flex", alignItems: "center", gap: 6, width: "100%", transition: "border-color .12s" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border-2)")}>
                <Plus size={14} /> Thêm cấp độ
              </button>
            )}
          </>
        )}
      </div>

      {/* Track form modal */}
      {showTrackForm && (
        <TrackFormModal
          track={editTrack}
          onClose={() => { setShowTrackForm(false); setEditTrack(null); }}
          onSaved={saved => {
            setTracks(prev => {
              const idx = prev.findIndex(t => t.id === saved.id);
              if (idx >= 0) return prev.map(t => t.id === saved.id ? { ...t, ...saved } : t);
              return [...prev, { ...saved, levels: saved.levels ?? [], _count: { employees: 0 } }];
            });
            setSelectedId(saved.id);
            setShowTrackForm(false); setEditTrack(null);
          }}
        />
      )}
    </div>
  );
}

// ── Level card ────────────────────────────────────────────────
function LevelCard({ level, trackId, isOpen, onToggle, onDelete, availableSkills, onAddSkill, onRemoveSkill }: {
  level: Level; trackId: number; isOpen: boolean; onToggle: () => void; onDelete: () => void;
  availableSkills: Skill[];
  onAddSkill: (skillId: number, req: number, imp: string) => void;
  onRemoveSkill: (skillId: number) => void;
}) {
  const [addSkillId,  setAddSkillId]  = useState<number | "">("");
  const [addLevel,    setAddLevel]    = useState(3);
  const [addImp,      setAddImp]      = useState("IMPORTANT");

  const selStyle: React.CSSProperties = { ...inp, padding: "5px 8px", fontSize: ".82rem" };

  return (
    <div style={{ background: "var(--elev)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
      <button onClick={onToggle}
        style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 16px", border: "none", background: "none", cursor: "pointer", textAlign: "left" }}>
        {isOpen ? <ChevronDown size={14} style={{ color: "var(--text-3)" }} /> : <ChevronRight size={14} style={{ color: "var(--text-3)" }} />}
        <span style={{ fontWeight: 600, fontSize: ".88rem", color: "var(--text)", flex: 1 }}>
          {level.name}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: ".72rem", color: "var(--text-3)", background: "var(--content)", border: "1px solid var(--border)", borderRadius: 99, padding: "2px 8px" }}>
          {level.skillRequirements.length} skill
        </span>
        <button onClick={e => { e.stopPropagation(); onDelete(); }}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 4, marginLeft: 4, display: "flex", borderRadius: 4 }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--danger)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--text-3)")}>
          <Trash2 size={13} />
        </button>
      </button>

      {isOpen && (
        <div style={{ borderTop: "1px solid var(--border)", padding: "12px 16px", background: "var(--content)", display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Existing skills */}
          {level.skillRequirements.map(s => {
            const imp = IMP.find(i => i.val === s.importance) ?? IMP[1];
            return (
              <div key={s.skillId} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "var(--elev)", border: "1px solid var(--border)", borderRadius: 8 }}>
                <span style={{ flex: 1, fontSize: ".84rem", color: "var(--text)", fontWeight: 500 }}>{s.skill.name}</span>
                <span style={{ fontSize: ".74rem", color: imp.color }}>{imp.label}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: ".76rem", color: "var(--text-3)" }}>lv{s.requiredLevel} – {SKILL_LEVELS[s.requiredLevel]}</span>
                <button onClick={() => onRemoveSkill(s.skillId)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 2, display: "flex" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "var(--danger)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "var(--text-3)")}>
                  <X size={12} />
                </button>
              </div>
            );
          })}

          {/* Add skill row */}
          {availableSkills.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "flex-end", paddingTop: 4 }}>
              <select value={addSkillId} onChange={e => setAddSkillId(e.target.value === "" ? "" : Number(e.target.value))}
                style={{ ...selStyle, flex: 1, minWidth: 160 }}>
                <option value="">+ Thêm skill…</option>
                {availableSkills.map(s => <option key={s.id} value={s.id}>{s.category ? `[${s.category}] ` : ""}{s.name}</option>)}
              </select>
              <select value={addLevel} onChange={e => setAddLevel(Number(e.target.value))} style={{ ...selStyle, width: "auto" }}>
                {[1,2,3,4,5].map(l => <option key={l} value={l}>{l} – {SKILL_LEVELS[l]}</option>)}
              </select>
              <select value={addImp} onChange={e => setAddImp(e.target.value)} style={{ ...selStyle, width: "auto" }}>
                {IMP.map(i => <option key={i.val} value={i.val}>{i.label}</option>)}
              </select>
              <button disabled={!addSkillId} onClick={() => { if (addSkillId) { onAddSkill(addSkillId as number, addLevel, addImp); setAddSkillId(""); } }}
                className="abtn primary" style={{ height: 30, fontSize: ".78rem", gap: 4, padding: "0 10px" }}>
                <Plus size={12} /> Thêm
              </button>
            </div>
          )}
          {availableSkills.length === 0 && level.skillRequirements.length === 0 && (
            <p style={{ fontSize: ".8rem", color: "var(--text-3)", margin: 0 }}>Chưa có skill nào trong catalog. Thêm skill ở tab Catalog trước.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Track form modal ──────────────────────────────────────────
function TrackFormModal({ track, onClose, onSaved }: {
  track: Track | null;
  onClose: () => void;
  onSaved: (t: Track) => void;
}) {
  const [name,  setName]  = useState(track?.name ?? "");
  const [desc,  setDesc]  = useState(track?.description ?? "");
  const [color, setColor] = useState(track?.color ?? TRACK_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  async function save() {
    if (!name.trim()) return;
    setSaving(true); setError(null);
    try {
      const url    = track ? `/api/career-tracks/${track.id}` : "/api/career-tracks";
      const method = track ? "PUT" : "POST";
      const r = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: desc || undefined, color }),
      });
      const json = await safeJson(r);
      if (r.ok && json.data) onSaved(json.data);
      else setError(typeof json.error === "string" ? json.error : `HTTP ${r.status} — ${JSON.stringify(json.error ?? json)}`);
    } finally { setSaving(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.45)" }}>
      <div style={{ width: "100%", maxWidth: 400, background: "var(--elev)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", boxShadow: "0 20px 60px rgba(0,0,0,.3)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
          <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--text)" }}>{track ? "Sửa track" : "Tạo Career Track"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", display: "flex" }}><X size={16} /></button>
        </div>
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: ".78rem", fontWeight: 600, color: "var(--text-2)", marginBottom: 5 }}>Tên track *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="vd. Frontend Developer, Backend Developer, Design…"
              style={{ ...inp }} autoFocus />
          </div>
          <div>
            <label style={{ display: "block", fontSize: ".78rem", fontWeight: 600, color: "var(--text-2)", marginBottom: 5 }}>Mô tả</label>
            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Mô tả ngắn về track này…" style={inp} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: ".78rem", fontWeight: 600, color: "var(--text-2)", marginBottom: 8 }}>Màu nhận diện</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {TRACK_COLORS.map(c => (
                <span key={c} onClick={() => setColor(c)}
                  style={{ width: 24, height: 24, borderRadius: "50%", background: c, cursor: "pointer", border: color === c ? "3px solid var(--text)" : "3px solid transparent", boxSizing: "border-box" }} />
              ))}
            </div>
          </div>
          {error && <p style={{ color: "var(--danger)", fontSize: ".82rem", margin: 0 }}>{error}</p>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4 }}>
            <button onClick={onClose} className="abtn ghost" style={{ height: 34, fontSize: ".82rem" }}>Hủy</button>
            <button onClick={save} disabled={saving || !name.trim()} className="abtn primary" style={{ height: 34, fontSize: ".82rem", gap: 6 }}>
              {saving ? <Loader2 size={13} className="animate-spin" /> : null} Lưu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
