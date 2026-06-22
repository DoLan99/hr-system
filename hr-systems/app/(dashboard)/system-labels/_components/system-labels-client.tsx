"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
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

type Props = { initialData: CategoryData[] };

type RowKey = string;
function rk(category: string, key: string): RowKey { return `${category}:${key}`; }

// ── Module / Group meta ───────────────────────────────────────

const MODULE_OF: Record<string, string> = {
  TASK_TYPE: "tasks",
  TASK_PRIORITY: "tasks",
  TASK_STATUS: "tasks",
  LEAVE_TYPE: "leave",
  PAYMENT_TYPE: "payment",
};

const MODULES: { id: string; name: string; svg: React.ReactNode }[] = [
  { id: "all",     name: "Tất cả",     svg: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></> },
  { id: "tasks",   name: "Công việc",  svg: <><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></> },
  { id: "leave",   name: "Nghỉ phép",  svg: <><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></> },
  { id: "payment", name: "Thanh toán", svg: <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/> },
];

const GROUP_META: Record<string, { color: string; svg: React.ReactNode }> = {
  TASK_TYPE:     { color: "#3B5BDB", svg: <><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></> },
  TASK_PRIORITY: { color: "#dc2626", svg: <><path d="M10.3 3.9l-7 12A2 2 0 0 0 5 19h14a2 2 0 0 0 1.7-3l-7-12a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01" strokeLinecap="round"/></> },
  TASK_STATUS:   { color: "#0891b2", svg: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" strokeLinecap="round"/></> },
  LEAVE_TYPE:    { color: "#be185d", svg: <><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></> },
  PAYMENT_TYPE:  { color: "#d97706", svg: <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/> },
};

// ── Tailwind class → hex dot color ────────────────────────────

const TW_HEX: Record<string, string> = {
  slate: "#64748b", zinc: "#52525b", blue: "#3B5BDB", sky: "#0891b2",
  indigo: "#6366f1", emerald: "#059669", green: "#22c55e", amber: "#f59e0b",
  orange: "#f97316", red: "#dc2626", pink: "#ec4899", violet: "#7c3aed",
  teal: "#0f766e", stone: "#78716c", cyan: "#06b6d4", fuchsia: "#d946ef",
};
function dotColor(twClass: string): string {
  const m = /bg-(\w+)-/.exec(twClass);
  return m ? TW_HEX[m[1]] ?? "#64748b" : "#64748b";
}

// ── Main client ───────────────────────────────────────────────

export function SystemLabelsClient({ initialData }: Props) {
  const { t } = useLocale();

  const [rows, setRows] = useState<Record<RowKey, LabelEntry>>(() => {
    const map: Record<RowKey, LabelEntry> = {};
    for (const cat of initialData) for (const e of cat.entries) map[rk(e.category, e.key)] = { ...e };
    return map;
  });
  const [dirty, setDirty] = useState<Set<RowKey>>(new Set());
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const [activeModule, setActiveModule] = useState("all");
  const [sortAZ, setSortAZ] = useState(true);
  const [searchQ, setSearchQ] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<RowKey | null>(null);

  const showToast = useCallback((type: "ok" | "err", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 2800);
  }, []);

  function updateRow(key: RowKey, patch: Partial<LabelEntry>) {
    setRows((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
    setDirty((prev) => new Set(prev).add(key));
  }

  function resetRow(key: RowKey) {
    setRows((prev) => {
      const cur = prev[key];
      return { ...prev, [key]: { ...cur, label: cur.defaultLabel, color: cur.defaultColor, isActive: true } };
    });
    setDirty((prev) => new Set(prev).add(key));
  }

  async function saveAll() {
    if (dirty.size === 0) return;
    setSaving(true);
    try {
      const toSave = [...dirty].map((k) => rows[k]).filter(Boolean);
      await Promise.all(
        toSave.map((row) =>
          fetch("/api/system-labels", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              category: row.category, key: row.key, label: row.label,
              color: row.color, isActive: row.isActive, sortOrder: row.sortOrder,
            }),
          })
        )
      );
      setDirty(new Set());
      showToast("ok", t("systemLabels.savedChanges").replace("{n}", String(toSave.length)));
    } catch {
      showToast("err", t("systemLabels.saveError"));
    } finally { setSaving(false); }
  }

  function discardAll() {
    setRows(() => {
      const map: Record<RowKey, LabelEntry> = {};
      for (const cat of initialData) for (const e of cat.entries) map[rk(e.category, e.key)] = { ...e };
      return map;
    });
    setDirty(new Set());
  }

  // ── Aggregates ──
  const totals = useMemo(() => {
    let labels = 0, active = 0;
    for (const cat of initialData) {
      labels += cat.entries.length;
      for (const e of cat.entries) {
        const r = rows[rk(e.category, e.key)];
        if (r?.isActive ?? true) active++;
      }
    }
    return { labels, active, groups: initialData.length, modules: 3 };
  }, [initialData, rows]);

  // ── Module tab counts ──
  const moduleCounts = useMemo(() => {
    const c: Record<string, number> = { all: 0 };
    for (const cat of initialData) {
      const mod = MODULE_OF[cat.category] ?? "all";
      c[mod] = (c[mod] ?? 0) + cat.entries.length;
      c.all += cat.entries.length;
    }
    return c;
  }, [initialData]);

  // ── Filter + sort visible groups ──
  const visible = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    return initialData
      .filter((cat) => activeModule === "all" || MODULE_OF[cat.category] === activeModule)
      .map((cat) => {
        const entries = cat.entries
          .filter((e) => {
            if (!q) return true;
            const r = rows[rk(e.category, e.key)] ?? e;
            return r.label.toLowerCase().includes(q) || e.key.toLowerCase().includes(q);
          })
          .map((e) => rows[rk(e.category, e.key)] ?? e)
          .sort((a, b) => sortAZ ? a.label.localeCompare(b.label) : b.label.localeCompare(a.label));
        return { ...cat, entries };
      })
      .filter((cat) => cat.entries.length > 0);
  }, [initialData, rows, activeModule, searchQ, sortAZ]);

  const visibleCount = useMemo(() => visible.reduce((s, c) => s + c.entries.length, 0), [visible]);

  // ── Editing modal state ──
  const editingRow = editing ? rows[editing] : null;
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setEditing(null); }
    if (editing) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />

      {/* Page head */}
      <div className="page-head" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 22 }}>
        <div>
          <h1>{t("systemLabels.title") || "System Labels"}</h1>
          <p>Quản lý nhãn và thẻ được dùng xuyên suốt các module trong workspace.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div className="sl-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
            <input type="text" placeholder="Tìm nhãn…" value={searchQ} onChange={(e) => setSearchQ(e.target.value)} />
          </div>
          <button className="abtn primary" style={{ gap: 7 }} onClick={saveAll} disabled={dirty.size === 0 || saving}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" width="14" height="14"><path d="M5 12l5 5L20 6"/></svg>
            {saving ? t("common.saving") || "Đang lưu…" : dirty.size > 0 ? `${t("systemLabels.saveAll") || "Lưu tất cả"} (${dirty.size})` : t("systemLabels.saveAll") || "Lưu tất cả"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="sl-stats">
        {[
          { c: "#3B5BDB", v: totals.labels, l: "Nhãn hệ thống", svg: <><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></> },
          { c: "#7c3aed", v: totals.groups, l: "Nhóm nhãn", svg: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></> },
          { c: "#059669", v: totals.modules, l: "Modules", svg: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></> },
          { c: "#d97706", v: totals.active, l: "Đang hiển thị", svg: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></> },
        ].map((s, i) => (
          <div key={i} className="sl-stat">
            <span className="si" style={{ background: `${s.c}22`, color: s.c }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{s.svg}</svg>
            </span>
            <div>
              <div className="sv">{s.v}</div>
              <div className="sl">{s.l}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Module tabs */}
      <div className="mod-tabs">
        {MODULES.map((m) => (
          <button key={m.id} className={`mod-tab${activeModule === m.id ? " on" : ""}`} onClick={() => setActiveModule(m.id)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">{m.svg}</svg>
            {m.name}
            <span className="mc">{moduleCounts[m.id] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="sl-tools">
        <button className="fchip" onClick={() => setSortAZ((v) => !v)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M3 6h18M7 12h10M11 18h2"/></svg>
          Sắp xếp: {sortAZ ? "A–Z" : "Z–A"}
        </button>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: ".82rem", color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>{visibleCount} nhãn</span>
      </div>

      {/* Groups */}
      <div>
        {visible.length === 0 ? (
          <div className="lb-empty">Không tìm thấy nhãn nào phù hợp.</div>
        ) : visible.map((cat) => {
          const g = GROUP_META[cat.category] ?? { color: "#64748b", svg: <circle cx="12" cy="12" r="9"/> };
          const isCollapsed = collapsed.has(cat.category);
          return (
            <div key={cat.category} className={`lb-group${isCollapsed ? " collapsed" : ""}`}>
              <div className="lb-group-head" onClick={() => setCollapsed((p) => { const n = new Set(p); if (n.has(cat.category)) n.delete(cat.category); else n.add(cat.category); return n; })}>
                <span className="gh-ico" style={{ background: `${g.color}22`, color: g.color }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{g.svg}</svg>
                </span>
                <span className="gh-name">{cat.meta.title}</span>
                <span className="gh-ct">{cat.entries.length}</span>
                <span className="gh-chev">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                </span>
              </div>
              <div className="lb-grid">
                {cat.entries.map((e) => {
                  const key = rk(e.category, e.key);
                  const isDirty = dirty.has(key);
                  return (
                    <div key={key} className={`lb-card${isDirty ? " dirty" : ""}${!e.isActive ? " off" : ""}`} onClick={() => setEditing(key)}>
                      <span className="lb-dot" style={{ background: dotColor(e.color) }} />
                      <span className="lb-name">{e.label}</span>
                      <code className="lb-key">{e.key}</code>
                      <div className="lb-actions" onClick={(ev) => ev.stopPropagation()}>
                        <button className="lb-act" title="Sửa" onClick={() => setEditing(key)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
                        </button>
                        <button className="lb-act" title={t("systemLabels.reset") || "Đặt lại"} onClick={() => resetRow(key)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4v6h6"/><path d="M3.5 15a9 9 0 1 0 2.1-9.4L1 10"/></svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit modal */}
      {editing && editingRow && (
        <EditModal
          row={editingRow}
          onChange={(patch) => updateRow(editing, patch)}
          onClose={() => setEditing(null)}
        />
      )}

      {/* Sticky save bar */}
      {dirty.size > 0 && (
        <div className="sl-bottombar">
          <span style={{ fontSize: ".84rem", color: "var(--text-3)" }}>
            {t("systemLabels.unsavedChanges").replace("{n}", String(dirty.size))}
          </span>
          <button className="abtn ghost" onClick={discardAll} disabled={saving}>{t("systemLabels.cancel") || "Huỷ"}</button>
          <button className="abtn primary" onClick={saveAll} disabled={saving} style={{ gap: 7 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" width="13" height="13"><path d="M5 12l5 5L20 6"/></svg>
            {saving ? t("common.saving") || "Đang lưu…" : t("systemLabels.saveAll") || "Lưu tất cả"}
          </button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`sl-toast ${toast.type}`}>{toast.msg}</div>
      )}
    </>
  );
}

// ── Edit Modal ────────────────────────────────────────────────

function EditModal({
  row, onChange, onClose,
}: {
  row: LabelEntry;
  onChange: (patch: Partial<LabelEntry>) => void;
  onClose: () => void;
}) {
  const { t } = useLocale();
  return (
    <div className="lm-modal open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="lm-scrim" onClick={onClose} />
      <div className="lm-card" role="dialog" aria-label="Sửa nhãn">
        <h2>Sửa nhãn</h2>
        <button className="lm-close" onClick={onClose} aria-label="Đóng">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="15" height="15"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>

        <div className="lf">
          <label>Enum key</label>
          <code style={{ fontFamily: "var(--font-mono)", fontSize: ".82rem", background: "var(--content)", padding: "6px 10px", borderRadius: 8, color: "var(--text-3)", display: "inline-block", width: "fit-content" }}>
            {row.category} · {row.key}
          </code>
        </div>

        <div className="lf">
          <label>Tên hiển thị *</label>
          <input type="text" value={row.label} onChange={(e) => onChange({ label: e.target.value })} placeholder={row.defaultLabel} autoFocus />
        </div>

        <div className="lf">
          <label>{t("systemLabels.selectColor") || "Chọn màu"}</label>
          <div className="swatch-pick">
            {COLOR_PRESETS.map((p) => (
              <span
                key={p.value}
                className={`sw${row.color === p.value ? " on" : ""}`}
                style={{ background: dotColor(p.value) }}
                title={p.name}
                onClick={() => onChange({ color: p.value })}
              />
            ))}
          </div>
          <span className={`preview ${row.color}`}>{row.label || row.defaultLabel}</span>
        </div>

        <div className="lf" style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <label style={{ margin: 0 }}>Hiển thị</label>
          <button
            type="button"
            className={`sl-toggle${row.isActive ? " on" : ""}`}
            onClick={() => onChange({ isActive: !row.isActive })}
            title={row.isActive ? t("systemLabels.showing") || "Đang hiển thị" : t("systemLabels.hidden") || "Ẩn"}
          >
            <span />
          </button>
        </div>

        <div className="lm-foot">
          <button className="abtn ghost" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
}

// ── Style ─────────────────────────────────────────────────────

const STYLE = `
.sl-search{display:flex;align-items:center;gap:8px;height:38px;padding:0 12px;background:var(--elev);border:1px solid var(--border);border-radius:9px;color:var(--text-3);min-width:220px}
.sl-search svg{width:14px;height:14px;flex-shrink:0}
.sl-search input{background:none;border:none;outline:none;font-family:inherit;font-size:.86rem;color:var(--text);width:100%}
.sl-search input::placeholder{color:var(--text-3)}

.sl-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px}
.sl-stat{background:var(--elev);border:1px solid var(--border);border-radius:var(--r-lg);padding:14px 16px;display:flex;align-items:center;gap:12px}
.sl-stat .si{width:38px;height:38px;border-radius:10px;display:grid;place-items:center;flex-shrink:0}
.sl-stat .si svg{width:18px;height:18px}
.sl-stat .sv{font-size:1.5rem;font-weight:800;letter-spacing:-.02em;color:var(--text);line-height:1}
.sl-stat .sl{font-size:.78rem;color:var(--text-3);margin-top:3px}
@media(max-width:900px){.sl-stats{grid-template-columns:1fr 1fr}}

.mod-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px}
.mod-tab{display:inline-flex;align-items:center;gap:7px;height:34px;padding:0 14px;border-radius:100px;font-size:.83rem;font-weight:500;color:var(--text-2);background:var(--elev);border:1px solid var(--border);cursor:pointer;font-family:inherit;transition:all .15s}
.mod-tab:hover{border-color:var(--accent);color:var(--accent-ink)}
.mod-tab.on{background:var(--accent);border-color:var(--accent);color:#fff}
.mod-tab .mc{font-family:var(--font-mono);font-size:.7rem;background:rgba(255,255,255,.18);border-radius:99px;padding:1px 7px}
.mod-tab:not(.on) .mc{background:var(--content);border:1px solid var(--border);color:var(--text-3)}

.sl-tools{display:flex;align-items:center;gap:10px;margin-bottom:16px}
.fchip{display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 12px;border-radius:9px;border:1px solid var(--border);background:var(--elev);color:var(--text-2);font-family:inherit;font-size:.82rem;font-weight:500;cursor:pointer;transition:all .15s}
.fchip:hover{border-color:var(--border-2);color:var(--text)}

.lb-group{background:var(--elev);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden;margin-bottom:16px}
.lb-group-head{display:flex;align-items:center;gap:10px;padding:13px 16px;border-bottom:1px solid var(--border);cursor:pointer;user-select:none;transition:background .12s}
.lb-group-head:hover{background:var(--content)}
.lb-group-head .gh-ico{width:28px;height:28px;border-radius:8px;display:grid;place-items:center;flex-shrink:0}
.lb-group-head .gh-ico svg{width:14px;height:14px}
.lb-group-head .gh-name{font-weight:700;font-size:.9rem;color:var(--text)}
.lb-group-head .gh-ct{font-family:var(--font-mono);font-size:.72rem;color:var(--text-3);background:var(--content);border:1px solid var(--border);border-radius:99px;padding:2px 8px}
.lb-group-head .gh-chev{margin-left:auto;color:var(--text-3);transition:transform .18s}
.lb-group-head .gh-chev svg{width:15px;height:15px}
.lb-group.collapsed .gh-chev{transform:rotate(-90deg)}
.lb-group.collapsed .lb-grid{display:none}
.lb-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px;padding:14px}

.lb-card{display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--content);border:1px solid var(--border);border-radius:10px;transition:border-color .15s,transform .15s;cursor:pointer;position:relative;min-width:0}
.lb-card:hover{border-color:var(--border-2);transform:translateY(-1px)}
.lb-card.dirty{border-color:var(--accent);background:var(--accent-soft)}
.lb-card.off{opacity:.55}
.lb-dot{width:12px;height:12px;border-radius:50%;flex-shrink:0}
.lb-name{font-weight:600;font-size:.86rem;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--text)}
.lb-key{font-family:var(--font-mono);font-size:.66rem;color:var(--text-3);background:var(--elev);border:1px solid var(--border);border-radius:99px;padding:1px 7px;white-space:nowrap;flex-shrink:0}
.lb-actions{display:none;gap:3px;position:absolute;right:8px;top:50%;transform:translateY(-50%);background:var(--content);border-radius:7px;padding:2px}
.lb-card:hover .lb-actions{display:flex}
.lb-card:hover .lb-key{opacity:0}
.lb-act{width:26px;height:26px;border-radius:6px;display:grid;place-items:center;color:var(--text-3);transition:background .12s,color .12s;border:none;background:none;cursor:pointer;font-family:inherit}
.lb-act:hover{background:var(--elev);color:var(--text)}
.lb-act svg{width:13px;height:13px}

.lb-empty{padding:48px;text-align:center;color:var(--text-3);font-size:.86rem;background:var(--elev);border:1px solid var(--border);border-radius:var(--r-lg)}

.lm-modal{position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;pointer-events:none;transition:opacity .2s}
.lm-modal.open{opacity:1;pointer-events:auto}
.lm-scrim{position:absolute;inset:0;background:rgba(4,8,18,.6);backdrop-filter:blur(3px)}
.lm-card{position:relative;z-index:1;background:var(--elev);border:1px solid var(--border-2);border-radius:var(--r-lg);width:100%;max-width:440px;padding:24px;display:flex;flex-direction:column;gap:14px;box-shadow:0 30px 80px rgba(0,0,0,.6)}
.lm-card h2{font-size:1rem;font-weight:800;color:var(--text);margin:0}
.lm-close{position:absolute;top:12px;right:12px;width:28px;height:28px;border-radius:7px;display:grid;place-items:center;color:var(--text-3);border:none;background:none;cursor:pointer;font-family:inherit}
.lm-close:hover{background:var(--content);color:var(--text)}
.lf{display:flex;flex-direction:column;gap:6px}
.lf label{font-size:.75rem;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em}
.lf input,.lf select,.lf textarea{background:var(--content);border:1.5px solid var(--border-2);border-radius:9px;padding:9px 12px;font-family:inherit;font-size:.88rem;color:var(--text);outline:none;transition:border-color .15s,box-shadow .15s;width:100%}
.lf input::placeholder{color:var(--text-3)}
.lf input:focus,.lf select:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.lf .preview{display:inline-flex;align-items:center;gap:8px;padding:5px 13px;border-radius:99px;font-size:.82rem;font-weight:600;margin-top:6px;width:fit-content}
.lm-foot{display:flex;justify-content:flex-end;gap:8px;padding-top:6px;border-top:1px solid var(--border);margin-top:4px}

.swatch-pick{display:flex;gap:5px;flex-wrap:wrap}
.sw{width:24px;height:24px;border-radius:7px;cursor:pointer;border:2px solid transparent;transition:transform .12s,border-color .12s;flex-shrink:0}
.sw:hover{transform:scale(1.15)}
.sw.on{border-color:var(--text)}

.sl-toggle{position:relative;width:38px;height:22px;border-radius:99px;background:var(--border);border:none;cursor:pointer;transition:background .15s;flex-shrink:0;padding:0}
.sl-toggle.on{background:var(--accent)}
.sl-toggle span{position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:#fff;transition:transform .18s var(--ease);display:block}
.sl-toggle.on span{transform:translateX(16px)}

.sl-bottombar{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:14px;background:var(--elev);border:1px solid var(--border-2);box-shadow:0 20px 60px rgba(0,0,0,.5);padding:10px 14px;border-radius:14px;z-index:50}

.sl-toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);background:var(--elev);border:1px solid var(--border-2);border-radius:10px;padding:12px 22px;font-size:.86rem;font-weight:500;color:var(--text);box-shadow:0 20px 60px rgba(0,0,0,.4);z-index:500}
.sl-toast.ok{border-left:3px solid var(--ok)}
.sl-toast.err{border-left:3px solid var(--danger)}
`;
