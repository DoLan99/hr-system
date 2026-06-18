"use client";

import { useState, useMemo } from "react";
import { TemplateFormModal } from "./template-form-modal";

const ISSUE_META: Record<string, { label: string; bgColor: string; icon: React.ReactNode }> = {
  TASK:    { label: "Task",    bgColor: "#3B5BDB", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
  BUG:     { label: "Bug",     bgColor: "#ef4444", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 2l1.5 1.5M15.5 3.5L17 2M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/><path d="M12 2v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 6.3l1.4-1.4M4.9 19.1l1.4-1.4M17.7 17.7l1.4 1.4"/></svg> },
  STORY:   { label: "Story",   bgColor: "#22c55e", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
  SUBTASK: { label: "Subtask", bgColor: "#f59e0b", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
};

const PRIO_DOT: Record<string, { cls: string; label: string }> = {
  CRITICAL: { cls: "hi", label: "Khẩn cấp" },
  HIGH:     { cls: "hi", label: "Cao" },
  NORMAL:   { cls: "md", label: "Vừa" },
  LOW:      { cls: "lo", label: "Thấp" },
};

// Tabs are derived dynamically from actual data, not hardcoded

type Item = {
  id: number;
  code: string;
  title: string;
  description: string | null;
  defaultTaskType: string;
  defaultEstimatedTime: number | null;
  defaultPriority: string;
  requiresVideo: boolean | null;
  department: string | null;
  linkTemplate: string | null;
  defaultChecklist: string[] | null;
  defaultLabels: string[] | null;
  defaultAssigneeId: number | null;
  usageCount: number;
  isActive: boolean;
  _count: { tasks: number };
  createdBy?: { id: number; fullName: string } | null;
  defaultAssignee?: { id: number; fullName: string } | null;
};

type TaskTypeConfig = { id: number; key: string; label: string; color: string; iconEmoji: string; isActive: boolean };
type Employee = { id: number; fullName: string };

type Props = { initialItems: Item[]; canManage: boolean; taskTypes: TaskTypeConfig[]; employees: Employee[] };

function fmtEst(min: number | null) {
  if (!min) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? (m ? `${h}h ${m}ph` : `${h}h`) : `${m}ph`;
}


export function TaskTemplatesClient({ initialItems, canManage, taskTypes, employees }: Props) {
  const getIssueMeta = (type: string) =>
    ISSUE_META[type] ?? { label: type, bgColor: "#64748b", icon: <span>✦</span> };
  const [items, setItems] = useState<Item[]>(initialItems);
  const [search, setSearch] = useState("");
  const [selCat, setSelCat] = useState("ALL");
  const [showInactive, setShowInactive] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [drawerItem, setDrawerItem] = useState<Item | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function refresh() {
    const res = await fetch("/api/task-templates").then(r => r.json());
    const data = res.data ?? [];
    setItems(data);
    setDrawerItem(prev => prev ? (data.find((i: Item) => i.id === prev.id) ?? null) : null);
  }

  async function toggleActive(item: Item) {
    await fetch(`/api/task-templates/${item.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !item.isActive }),
    });
    refresh();
  }

  async function doDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await fetch(`/api/task-templates/${deleteId}`, { method: "DELETE" });
      if (drawerItem?.id === deleteId) setDrawerItem(null);
      refresh();
    } finally { setDeleting(false); setDeleteId(null); }
  }

  // Category tabs use department field, sourced from taskTypes list (label-based)
  const { catCounts, activeCats } = useMemo(() => {
    const map: Record<string, number> = { ALL: 0 };
    items.forEach(i => {
      if (!i.isActive && !showInactive) return;
      map.ALL = (map.ALL ?? 0) + 1;
      if (i.department) map[i.department] = (map[i.department] ?? 0) + 1;
    });
    // Show all active task types from DB as categories
    const cats = ["ALL", ...taskTypes.map(t => t.label)];
    return { catCounts: map, activeCats: cats };
  }, [items, showInactive, taskTypes]);

  const filtered = useMemo(() => items.filter(i => {
    if (!showInactive && !i.isActive) return false;
    if (selCat !== "ALL" && i.department !== selCat) return false;
    if (search) {
      const q = search.toLowerCase();
      const hay = `${i.code} ${i.title} ${i.description ?? ""} ${i.department ?? ""} ${(i.defaultLabels ?? []).join(" ")}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }), [items, search, selCat, showInactive]);

  // KPI stats
  const active = items.filter(i => i.isActive);
  const totalUsage = active.reduce((s, i) => s + i.usageCount, 0);
  const mostUsed = active.reduce<Item | null>((b, i) => (!b || i.usageCount > b.usageCount) ? i : b, null);
  const avgEst = active.length ? Math.round(active.reduce((s, i) => s + (i.defaultEstimatedTime ?? 0), 0) / active.length) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>

      {/* ── Header ── */}
      <div className="page-head" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 0 }}>
        <div>
          <h1>Task Templates</h1>
          <p>{active.length} template · {totalUsage} lần sử dụng</p>
        </div>
        {canManage && (
          <button className="abtn primary" onClick={() => { setEditing(null); setModalOpen(true); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ width: 15, height: 15 }}><path d="M12 5v14M5 12h14"/></svg>
            Tạo Template
          </button>
        )}
      </div>

      {/* ── KPI Cards ── */}
      <div className="kpis">
        <div className="kpi">
          <div className="kt"><span className="ki"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg></span>Tổng templates</div>
          <div className="kv">{active.length}</div>
          <div className="kc flat">{items.length} tổng cộng</div>
        </div>
        <div className="kpi">
          <div className="kt"><span className="ki"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></span>Tổng sử dụng</div>
          <div className="kv">{totalUsage}</div>
          <div className="kc up">lần tạo task</div>
        </div>
        <div className="kpi">
          <div className="kt"><span className="ki"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></span>Dùng nhiều nhất</div>
          <div className="kv" style={{ fontSize: "1rem" }}>{mostUsed?.title ?? "—"}</div>
          <div className="kc flat">{mostUsed ? `${mostUsed.usageCount} lần` : ""}</div>
        </div>
        <div className="kpi">
          <div className="kt"><span className="ki"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" strokeLinecap="round"/></svg></span>TB ước tính</div>
          <div className="kv">{fmtEst(avgEst) ?? "—"}</div>
          <div className="kc flat">mỗi template</div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div className="cat-tabs">
          {activeCats.map(cat => {
            const cnt = catCounts[cat] ?? 0;
            return (
              <button key={cat} className={`cat-tab${selCat === cat ? " on" : ""}`} onClick={() => setSelCat(cat)}>
                {cat === "ALL" ? `Tất cả (${cnt})` : `${cat} ${cnt}`}
              </button>
            );
          })}
        </div>

        <div style={{ flex: 1 }} />

        <div className="tt-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm template…" />
        </div>

        {canManage && (
          <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: ".83rem", color: "var(--text-3)", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}>
            <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} style={{ accentColor: "var(--accent)" }} />
            Hiện đã ẩn
          </label>
        )}
      </div>

      {/* ── Template Grid ── */}
      <div className="tpl-grid">
        {filtered.length === 0 ? (
          <div className="tpl-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            <p>Không tìm thấy template nào</p>
            <span>Thử thay đổi bộ lọc hoặc tạo template mới</span>
          </div>
        ) : filtered.map(item => {
          const m = getIssueMeta(item.defaultTaskType);
          const prio = PRIO_DOT[item.defaultPriority] ?? PRIO_DOT.NORMAL;
          const checklist = item.defaultChecklist ?? [];
          const labels = item.defaultLabels ?? [];
          const estLabel = fmtEst(item.defaultEstimatedTime);
          const previewCl = checklist.slice(0, 3);
          const moreCl = checklist.length - previewCl.length;

          return (
            <div key={item.id} className={`tpl-card${!item.isActive ? " inactive" : ""}`} onClick={() => setDrawerItem(item)}>
              <div className="tpl-card-top">
                {/* Head: icon + title + subtitle */}
                <div className="tpl-card-head">
                  <div className="tpl-type-ico" style={{ background: m.bgColor }}>
                    {m.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="tpl-card-name">{item.title}</div>
                    <div style={{ fontSize: ".75rem", color: "var(--text-3)", marginTop: 2 }}>
                      <span style={{ color: m.bgColor, fontWeight: 600 }}>{m.label}</span>
                      {item.department && <span> · {item.department}</span>}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {item.description && (
                  <div className="tpl-card-desc">{item.description}</div>
                )}

                {/* Checklist preview */}
                {checklist.length > 0 && (
                  <div className="tpl-checklist-preview">
                    {previewCl.map((cl, i) => (
                      <div key={i} className="tpl-cl-item">
                        <div className="tpl-cl-ico" />
                        <span>{cl}</span>
                      </div>
                    ))}
                    {moreCl > 0 && <div className="tpl-cl-more">+{moreCl} mục nữa</div>}
                  </div>
                )}

                {/* Labels */}
                {labels.length > 0 && (
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 6 }}>
                    {labels.map((lb, i) => (
                      <span key={i} className="lbl-chip">{lb}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="tpl-card-footer">
                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, flexWrap: "wrap" }}>
                  <span className="tpl-meta">
                    <span className={`prio-dot ${prio.cls}`} />
                    {prio.label}
                  </span>
                  {estLabel && (
                    <span className="tpl-meta">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      {estLabel} est
                    </span>
                  )}
                  {checklist.length > 0 && (
                    <span className="tpl-meta">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                      {checklist.length} bước
                    </span>
                  )}
                </div>
                <span className="tpl-usage">▶ {item.usageCount} Lần dùng</span>
              </div>

              {/* Hover actions */}
              {canManage && (
                <div className="tpl-actions" onClick={e => e.stopPropagation()}>
                  <button className="tpl-act-btn" title="Sửa" onClick={() => { setEditing(item); setModalOpen(true); }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button className="tpl-act-btn" title={item.isActive ? "Ẩn" : "Kích hoạt"} onClick={() => toggleActive(item)}>
                    {item.isActive
                      ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                  </button>
                  <button className="tpl-act-btn del" title="Xóa" onClick={() => setDeleteId(item.id)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Detail Drawer ── */}
      <div className={`td-back${drawerItem ? " open" : ""}`} onClick={() => setDrawerItem(null)} />
      <div className={`td-drawer${drawerItem ? " open" : ""}`}>
        {drawerItem && (() => {
          const m = getIssueMeta(drawerItem.defaultTaskType);
          const prio = PRIO_DOT[drawerItem.defaultPriority] ?? PRIO_DOT.NORMAL;
          const checklist = drawerItem.defaultChecklist ?? [];
          const labels = drawerItem.defaultLabels ?? [];
          const est = fmtEst(drawerItem.defaultEstimatedTime);

          return (
            <>
              <div className="td-dhead">
                <div className="tdi" style={{ background: m.bgColor }}>{m.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--text)" }}>{drawerItem.title}</h3>
                  <div style={{ fontSize: ".74rem", color: "var(--text-3)", marginTop: 3, display: "flex", gap: 6, alignItems: "center" }}>
                    <span>{m.label}</span>
                    {drawerItem.department && <><span>·</span><span>{drawerItem.department}</span></>}
                    {est && <><span>·</span><span>{est} est</span></>}
                  </div>
                </div>
                <button className="td-dclose" onClick={() => setDrawerItem(null)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 17, height: 17 }}><path d="M6 6l12 12M18 6L6 18"/></svg>
                </button>
              </div>

              <div className="td-dbody">
                {/* Description block at top */}
                {drawerItem.description && (
                  <div style={{ padding: "12px 16px", background: "var(--content)", borderRadius: 10, margin: "0 0 4px", fontSize: ".88rem", color: "var(--text-2)", lineHeight: 1.6 }}>
                    {drawerItem.description}
                  </div>
                )}

                <div className="dd-sec">Thông tin Template</div>

                <div className="dd-row">
                  <span className="drl">Loại issue</span>
                  <span className="drv">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                      <span style={{ width: 20, height: 20, borderRadius: 5, background: m.bgColor, display: "grid", placeItems: "center", flexShrink: 0 }}>
                        <span style={{ width: 12, height: 12, color: "#fff", display: "flex" }}>{m.icon}</span>
                      </span>
                      <span style={{ fontWeight: 600, fontSize: ".88rem", color: "var(--text)" }}>{m.label}</span>
                    </span>
                  </span>
                </div>

                <div className="dd-row">
                  <span className="drl">Danh mục</span>
                  <span className="drv" style={{ fontWeight: 500 }}>{drawerItem.department ?? "—"}</span>
                </div>

                <div className="dd-row">
                  <span className="drl">Ưu tiên mặc định</span>
                  <span className="drv" style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span className={`prio-dot ${prio.cls}`} />{prio.label}
                  </span>
                </div>

                <div className="dd-row">
                  <span className="drl">Ước tính</span>
                  <span className="drv" style={{ fontWeight: 600 }}>{est ?? "—"}</span>
                </div>

                <div className="dd-row">
                  <span className="drl">Labels</span>
                  <span className="drv" style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {labels.length > 0 ? labels.map((lb, i) => (
                      <span key={i} className="lbl-chip">{lb}</span>
                    )) : <span style={{ color: "var(--text-3)" }}>—</span>}
                  </span>
                </div>

                <div className="dd-row">
                  <span className="drl">Đã dùng</span>
                  <span className="drv">
                    <span style={{ fontWeight: 700, fontSize: "1rem", color: "var(--accent-ink)" }}>{drawerItem.usageCount}</span>
                    <span style={{ color: "var(--text-3)", marginLeft: 4, fontSize: ".86rem" }}>Lần</span>
                  </span>
                </div>

                {drawerItem.defaultAssignee && (
                  <div className="dd-row">
                    <span className="drl">Giao cho</span>
                    <span className="drv" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--accent)", color: "#fff", fontSize: ".7rem", fontWeight: 700, display: "grid", placeItems: "center", flexShrink: 0 }}>
                        {drawerItem.defaultAssignee.fullName?.slice(0, 2).toUpperCase()}
                      </span>
                      <span style={{ fontSize: ".86rem", color: "var(--text)" }}>{drawerItem.defaultAssignee.fullName}</span>
                    </span>
                  </div>
                )}

                {drawerItem.createdBy && (
                  <div className="dd-row">
                    <span className="drl">Tạo bởi</span>
                    <span className="drv" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--accent)", color: "#fff", fontSize: ".7rem", fontWeight: 700, display: "grid", placeItems: "center", flexShrink: 0 }}>
                        {drawerItem.createdBy.fullName?.slice(0, 2).toUpperCase()}
                      </span>
                      <span style={{ fontSize: ".86rem", color: "var(--text)" }}>{drawerItem.createdBy.fullName}</span>
                    </span>
                  </div>
                )}

                {drawerItem.requiresVideo !== null && (
                  <div className="dd-row">
                    <span className="drl">Video bắt buộc</span>
                    <span className="drv">
                      {drawerItem.requiresVideo ? "✅ Có" : "❌ Không"}
                    </span>
                  </div>
                )}

                {drawerItem.linkTemplate && (
                  <div className="dd-row">
                    <span className="drl">Link mẫu</span>
                    <span className="drv">
                      <a href={drawerItem.linkTemplate} target="_blank" rel="noreferrer" style={{ color: "var(--accent-ink)", fontSize: ".86rem" }}>Mở link ↗</a>
                    </span>
                  </div>
                )}

                {checklist.length > 0 && (
                  <>
                    <div className="dd-sec" style={{ marginTop: 8 }}>Checklist ({checklist.length} bước)</div>
                    <div className="dd-cl-list">
                      {checklist.map((cl, i) => (
                        <div key={i} className="dd-cl-row">
                          <div className="dd-cl-check" />
                          <span style={{ fontSize: ".8rem", color: "var(--text-3)", fontWeight: 600, minWidth: 20 }}>{i + 1}.</span>
                          <span className="dd-cl-text">{cl}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Footer actions */}
                <div className="td-dfoot">
                  {canManage && (
                    <button className="abtn ghost" style={{ display: "flex", alignItems: "center", gap: 7 }}
                      onClick={() => { setEditing(drawerItem); setModalOpen(true); }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 14, height: 14 }}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
                      Sửa template
                    </button>
                  )}
                  <button className="abtn primary" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ width: 14, height: 14 }}><path d="M12 5v14M5 12h14"/></svg>
                    Dùng template này
                  </button>
                </div>

              </div>
            </>
          );
        })()}
      </div>

      {/* ── Delete Confirm ── */}
      {deleteId && (
        <div className="modal-back" onClick={e => { if (e.target === e.currentTarget) setDeleteId(null); }}>
          <div className="ar-modal" style={{ maxWidth: 400 }}>
            <div className="ar-head">
              <div className="ar-ico" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ width: 17, height: 17 }}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
              </div>
              <h3>Xóa template?</h3>
              <button className="x" onClick={() => setDeleteId(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 17, height: 17 }}><path d="M6 6l12 12M18 6L6 18"/></svg>
              </button>
            </div>
            <div className="ar-body">
              <p style={{ fontSize: ".88rem", color: "var(--text-2)", lineHeight: 1.6, margin: 0 }}>
                Template này sẽ bị xóa vĩnh viễn. Các task đã tạo từ template sẽ không bị ảnh hưởng.
              </p>
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

      <TemplateFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
        onSaved={() => { setModalOpen(false); refresh(); }}
        taskTypes={taskTypes.map(t => ({ key: t.key, label: t.label, color: t.color, iconEmoji: t.iconEmoji }))}
        employees={employees}
      />
    </div>
  );
}
