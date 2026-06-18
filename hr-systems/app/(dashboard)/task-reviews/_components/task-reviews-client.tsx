"use client";

import { useState, useMemo } from "react";

type ChecklistItem = { id: number; content: string; checked: boolean };
type ReviewTask = {
  id: number;
  code: string;
  title: string;
  description: string | null;
  taskType: string;
  priority: string;
  status: string;
  estimatedTime: number | null;
  actualTimeTotal: number;
  progressPct: number;
  dueDate: string | null;
  dateCreated: string;
  lastUpdate: string;
  reasonNextAction: string | null;
  assignedTo: { id: number; fullName: string; avatarUrl?: string | null };
  assignedBy: { id: number; fullName: string };
  template: { id: number; code: string; title: string; defaultChecklist: string[] | null } | null;
  sprint: { id: number; name: string } | null;
  checklistItems: ChecklistItem[];
};

type Props = {
  initialTasks: ReviewTask[];
  isManager: boolean;
  currentUserId: number;
};

const TYPE_COLOR: Record<string, string> = {
  TASK: "#3B5BDB", BUG: "#ef4444", STORY: "#22c55e", SUBTASK: "#f59e0b",
  NORMAL: "#3B5BDB", LEARNING: "#22c55e", MEETING: "#a78bfa",
  NEW_RESEARCH: "#f59e0b", ADMIN: "#6b7280", BILLABLE_CLIENT: "#14b8a6",
};
const PRIO_COLOR: Record<string, string> = {
  CRITICAL: "var(--danger)", HIGH: "var(--danger)", NORMAL: "var(--warn)", LOW: "var(--ok)",
};
const CRITERIA = [
  { k: "quality", l: "Chất lượng code", d: "Clean, maintainable, no code smell" },
  { k: "coverage", l: "Test / kiểm tra", d: "Edge cases, test coverage" },
  { k: "docs", l: "Tài liệu / comment", d: "Mô tả rõ ràng, đầy đủ" },
  { k: "timeliness", l: "Đúng hạn / effort", d: "Hoàn thành đúng timeline cam kết" },
];

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function avgScore(scores: Record<string, number>) {
  const vals = Object.values(scores).filter(v => v > 0);
  if (!vals.length) return null;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10;
}

function scoreClass(s: number | null) {
  if (s === null) return "none";
  if (s >= 4) return "hi";
  if (s >= 2.5) return "md";
  return "lo";
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

export function TaskReviewsClient({ initialTasks, isManager, currentUserId }: Props) {
  const [tasks, setTasks] = useState(initialTasks);
  const [search, setSearch] = useState("");
  const [selAssignee, setSelAssignee] = useState("ALL");
  const [drawer, setDrawer] = useState<ReviewTask | null>(null);
  const [drawerTab, setDrawerTab] = useState<"info" | "review" | "history">("info");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [decision, setDecision] = useState<"approve" | "changes" | "reject" | null>(null);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const [reviewed, setReviewed] = useState<Record<number, { action: string; comment: string }>>({});

  function showToast(msg: string, type = "ok") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }

  async function refresh() {
    const res = await fetch("/api/tasks?status=REVIEW").then(r => r.json());
    if (res.data) setTasks(res.data);
  }

  function openDrawer(t: ReviewTask) {
    setDrawer(t);
    setDrawerTab("info");
    setScores({});
    setDecision(null);
    setComment("");
  }

  function closeDrawer() { setDrawer(null); }

  async function submitReview() {
    if (!drawer) return;
    if (!decision) { showToast("Chọn quyết định: Duyệt / Cần sửa / Từ chối", "err"); return; }
    if (!comment.trim()) { showToast("Vui lòng nhập nhận xét", "err"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${drawer.id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: decision, comment }),
      });
      if (!res.ok) { showToast("Lỗi khi gửi đánh giá", "err"); return; }
      setReviewed(p => ({ ...p, [drawer.id]: { action: decision, comment } }));
      setTasks(p => p.filter(t => t.id !== drawer.id));
      closeDrawer();
      const msgs = { approve: "Đã duyệt task ✓", changes: "Đã yêu cầu sửa đổi", reject: "Đã từ chối task" };
      showToast(msgs[decision], "ok");
    } finally { setSaving(false); }
  }

  const assignees = useMemo(() => {
    const map = new Map<number, string>();
    tasks.forEach(t => map.set(t.assignedTo.id, t.assignedTo.fullName));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [tasks]);

  const filtered = tasks.filter(t => {
    if (selAssignee !== "ALL" && t.assignedTo.id !== Number(selAssignee)) return false;
    if (search) {
      const q = search.toLowerCase();
      return t.code.toLowerCase().includes(q) || t.title.toLowerCase().includes(q) || t.assignedTo.fullName.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div>
      {/* Page head */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 22 }}>
        <div>
          <h1>Task Reviews</h1>
          <p style={{ fontSize: ".9rem", color: "var(--text-2)", marginTop: 4 }}>
            Quy trình kiểm duyệt công việc · <b>{tasks.length}</b> task đang chờ review
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="kpis" style={{ marginBottom: 24 }}>
        {[
          { ico: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>, lab: "Chờ review", val: tasks.length, cls: tasks.length > 0 ? "warn" : "flat" },
          { ico: <><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></>, lab: "Đã duyệt", val: Object.values(reviewed).filter(r => r.action === "approve").length, cls: "up" },
          { ico: <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 2l-3 0"/>, lab: "Cần sửa", val: Object.values(reviewed).filter(r => r.action === "changes").length, cls: "flat" },
          { ico: <path d="M12 2l2.6 6.3L21 9l-5 4.3L17.5 20 12 16.5 6.5 20 8 13.3 3 9l6.4-.7z"/>, lab: "Điểm TB", val: (() => { const avg2 = tasks.length ? null : null; return avg2 !== null ? avg2 + "/5" : "—"; })(), cls: "flat" },
        ].map((k, i) => (
          <div className="kpi" key={i}>
            <div className="kt">
              <span className="ki"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{k.ico}</svg></span>
              {k.lab}
            </div>
            <div className="kv">{k.val}</div>
            <div className={`kc ${k.cls}`}>&nbsp;</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="rf-bar">
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button className={`mf-chip${selAssignee === "ALL" ? " on" : ""}`} onClick={() => setSelAssignee("ALL")}>Tất cả</button>
          {assignees.map(a => (
            <button key={a.id} className={`mf-chip${selAssignee === String(a.id) ? " on" : ""}`} onClick={() => setSelAssignee(String(a.id))}>
              <span className="mf-av">{initials(a.name)}</span>{a.name}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <div className="rf-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
          <input placeholder="Lọc nhanh…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div className="rev-table-wrap">
        <table className="rev-table">
          <thead>
            <tr>
              <th>Task</th>
              <th>Người thực hiện</th>
              <th>Giao bởi</th>
              <th>Hạn</th>
              <th>Checklist</th>
              <th>Tiến độ</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="rev-empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <p>Không có task nào chờ review</p>
                    <span>Chưa có task nào ở trạng thái Review.</span>
                  </div>
                </td>
              </tr>
            ) : filtered.map(t => {
              const rowCl = t.checklistItems.length > 0
                ? t.checklistItems
                : (t.template?.defaultChecklist ?? []).map((s, i) => ({ id: i, content: s, checked: false }));
              const doneCount = rowCl.filter(c => c.checked).length;
              const totalCount = rowCl.length;
              const pct = totalCount ? Math.round(doneCount / totalCount * 100) : 0;
              return (
                <tr key={t.id} onClick={() => openDrawer(t)}>
                  <td>
                    <div className="rt-task">
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 20, height: 20, borderRadius: 5, background: TYPE_COLOR[t.taskType] ?? "#3B5BDB", display: "grid", placeItems: "center", flexShrink: 0 }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" width="11" height="11"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </span>
                        <span className="rt-id">{t.code}</span>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: PRIO_COLOR[t.priority] ?? "var(--text-3)", flexShrink: 0 }} />
                      </div>
                      <span className="rt-title" title={t.title}>{t.title}</span>
                      {t.sprint && <span className="rt-sprint">{t.sprint.name}</span>}
                    </div>
                  </td>
                  <td>
                    <div className="rt-av">
                      <span className="av-sm" style={{ width: 24, height: 24, fontSize: ".66rem" }}>{initials(t.assignedTo.fullName)}</span>
                      {t.assignedTo.fullName}
                    </div>
                  </td>
                  <td>
                    <div className="rt-av">
                      <span className="av-sm" style={{ width: 24, height: 24, fontSize: ".66rem" }}>{initials(t.assignedBy.fullName)}</span>
                      {t.assignedBy.fullName}
                    </div>
                  </td>
                  <td className="rt-date" style={{ color: t.dueDate && new Date(t.dueDate) < new Date() ? "var(--danger)" : undefined }}>
                    {fmtDate(t.dueDate)}
                  </td>
                  <td>
                    {totalCount > 0 ? (
                      <div style={{ width: 80 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: ".64rem", color: "var(--text-3)", marginBottom: 3 }}>
                          <span>{doneCount}/{totalCount}</span><span>{pct}%</span>
                        </div>
                        <div style={{ height: 5, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg,${pct === 100 ? "var(--ok)" : "var(--accent)"},#4f7aff)`, borderRadius: 99 }} />
                        </div>
                      </div>
                    ) : <span style={{ fontSize: ".74rem", color: "var(--text-3)" }}>—</span>}
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <div style={{ width: 80 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: ".64rem", color: "var(--text-3)", marginBottom: 3 }}>
                          <span>{t.progressPct}%</span>
                        </div>
                        <div style={{ height: 5, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                          <div style={{ width: `${t.progressPct}%`, height: "100%", background: "linear-gradient(90deg,var(--accent),#4f7aff)", borderRadius: 99 }} />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td><span className="rev-status pending">Chờ review</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Drawer backdrop */}
      <div className={`rd-back${drawer ? " open" : ""}`} onClick={closeDrawer} />

      {/* Review Drawer */}
      <div className={`rd-drawer${drawer ? " open" : ""}`}>
        {drawer && (() => {
          // Use DB checklist items if available, fallback to template.defaultChecklist
          const templateCl: ChecklistItem[] = (drawer.checklistItems.length === 0 && drawer.template?.defaultChecklist)
            ? drawer.template.defaultChecklist.map((t, i) => ({ id: i, content: t, checked: false }))
            : [];
          const allChecklist = drawer.checklistItems.length > 0 ? drawer.checklistItems : templateCl;
          const doneCount = allChecklist.filter(c => c.checked).length;
          const totalCount = allChecklist.length;
          const pct = totalCount ? Math.round(doneCount / totalCount * 100) : 0;
          const wasReviewed = reviewed[drawer.id];
          return (
            <>
              <div className="rd-head">
                <div className="rd-type" style={{ background: TYPE_COLOR[drawer.taskType] ?? "#3B5BDB" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: ".74rem", color: "var(--accent-ink)" }}>{drawer.code} · {drawer.taskType}</div>
                  <div style={{ fontSize: ".98rem", fontWeight: 700, color: "var(--text)", lineHeight: 1.3, marginTop: 2 }}>{drawer.title}</div>
                </div>
                <button className="rd-close" onClick={closeDrawer}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
                </button>
              </div>

              <div className="rd-tabs">
                {(["info", "review", "history"] as const).map(tab => (
                  <button key={tab} className={`rd-tab${drawerTab === tab ? " on" : ""}`} onClick={() => setDrawerTab(tab)}>
                    {tab === "info" ? "Thông tin" : tab === "review" ? "Review" : "Lịch sử"}
                  </button>
                ))}
              </div>

              <div className="rd-body">
                {/* Info pane */}
                <div className={`rd-pane${drawerTab === "info" ? " on" : ""}`}>
                  {drawer.description && (
                    <>
                      <p style={{ fontSize: ".78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-3)", marginBottom: 10 }}>Mô tả</p>
                      <div style={{ fontSize: ".9rem", color: "var(--text-2)", lineHeight: 1.65, padding: 14, background: "var(--content)", borderRadius: 10, border: "1px solid var(--border)", marginBottom: 20 }} dangerouslySetInnerHTML={{ __html: drawer.description }} />
                    </>
                  )}
                  <div className="ri-card">
                    <div className="ri-row"><span className="ri-l">Task ID</span><span className="ri-v" style={{ fontFamily: "var(--font-mono)", color: "var(--accent-ink)" }}>{drawer.code}</span></div>
                    {drawer.sprint && <div className="ri-row"><span className="ri-l">Sprint</span><span className="ri-v">{drawer.sprint.name}</span></div>}
                    <div className="ri-row">
                      <span className="ri-l">Người nộp</span>
                      <span className="ri-v" style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span className="av-sm" style={{ width: 22, height: 22, fontSize: ".62rem" }}>{initials(drawer.assignedTo.fullName)}</span>
                        {drawer.assignedTo.fullName}
                      </span>
                    </div>
                    <div className="ri-row">
                      <span className="ri-l">Reviewer</span>
                      <span className="ri-v" style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span className="av-sm" style={{ width: 22, height: 22, fontSize: ".62rem" }}>{initials(drawer.assignedBy.fullName)}</span>
                        {drawer.assignedBy.fullName}
                      </span>
                    </div>
                    <div className="ri-row"><span className="ri-l">Nộp lúc</span><span className="ri-v" style={{ fontFamily: "var(--font-mono)", fontSize: ".82rem" }}>{fmtDate(drawer.lastUpdate)}</span></div>
                    <div className="ri-row"><span className="ri-l">Trạng thái</span><span className="ri-v"><span className="rev-status pending">Chờ review</span></span></div>
                  </div>

                  {/* Checklist — always show section */}
                  <p style={{ fontSize: ".78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-3)", marginBottom: 10 }}>
                    Checklist {allChecklist.length > 0 && <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-3)", fontWeight: 400 }}>({doneCount}/{totalCount} hoàn thành)</span>}
                  </p>
                  {allChecklist.length > 0 ? (
                    <>
                      <div className="cl-prog-bar"><i style={{ width: `${pct}%` }} /></div>
                      <div className="cl-review-list">
                        {allChecklist.map(c => (
                          <div key={c.id} className={`cl-review-item${c.checked ? " done" : ""}`}>
                            <div className={`cl-checkbox${c.checked ? " done" : " todo"}`}>
                              {c.checked && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 6"/></svg>}
                            </div>
                            <span className="cli-text">{c.content}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div style={{ padding: "14px", background: "var(--content)", border: "1px solid var(--border)", borderRadius: 9, fontSize: ".84rem", color: "var(--text-3)", textAlign: "center" }}>
                      Chưa có checklist cho task này
                    </div>
                  )}
                </div>

                {/* Review pane */}
                <div className={`rd-pane${drawerTab === "review" ? " on" : ""}`}>
                  <div className="score-section">
                    <div className="score-label">Chấm điểm (1–5 mỗi tiêu chí)</div>
                    <div className="score-criteria">
                      {CRITERIA.map(c => (
                        <div className="sc-item" key={c.k}>
                          <div className="sc-name">{c.l}<div style={{ fontSize: ".68rem", color: "var(--text-3)", marginTop: 1 }}>{c.d}</div></div>
                          <div className="sc-stars">
                            {[1,2,3,4,5].map(i => (
                              <button key={i} className={`sc-star${(scores[c.k] ?? 0) >= i ? " on" : ""}`}
                                onClick={() => setScores(p => ({ ...p, [c.k]: p[c.k] === i ? 0 : i }))}>
                                {i}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="sc-total">
                      {avgScore(scores) !== null ? <>{avgScore(scores)} <span>/ 5</span></> : <span style={{ fontSize: ".88rem" }}>Chưa có điểm</span>}
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: ".72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-3)", marginBottom: 8 }}>Nhận xét</div>
                    <textarea className="rv-comment" placeholder="Nhận xét chi tiết, điểm cần cải thiện…" value={comment} onChange={e => setComment(e.target.value)} />
                  </div>

                  <div style={{ fontSize: ".72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-3)", marginBottom: 10 }}>Quyết định</div>
                  <div className="decision-row">
                    <button className={`decision-btn approve${decision === "approve" ? " on" : ""}`} onClick={() => setDecision("approve")}>
                      <div className="db-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 6"/></svg></div>
                      <div className="db-label">Duyệt</div>
                      <div className="db-sub">Task đạt yêu cầu,<br/>chuyển sang Done</div>
                    </button>
                    <button className={`decision-btn changes${decision === "changes" ? " on" : ""}`} onClick={() => setDecision("changes")}>
                      <div className="db-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 2l-3 0"/></svg></div>
                      <div className="db-label">Cần sửa</div>
                      <div className="db-sub">Có điểm cần chỉnh,<br/>trả về In Progress</div>
                    </button>
                    <button className={`decision-btn reject${decision === "reject" ? " on" : ""}`} onClick={() => setDecision("reject")}>
                      <div className="db-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg></div>
                      <div className="db-label">Từ chối</div>
                      <div className="db-sub">Không đạt, làm<br/>lại từ đầu</div>
                    </button>
                  </div>
                  <button className="abtn primary" style={{ width: "100%", marginTop: 16, height: 44 }} onClick={submitReview} disabled={saving}>
                    {saving ? "Đang gửi…" : "Gửi đánh giá"}
                  </button>
                </div>

                {/* History pane */}
                <div className={`rd-pane${drawerTab === "history" ? " on" : ""}`}>
                  <div className="rv-hist-list">
                    {drawer.reasonNextAction && (
                      <div className="rv-hist-item">
                        <div className="hav" style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)" }}>?</div>
                        <div className="hbody">
                          <div className="hmeta"><span className="hname">Ghi chú trước đó</span></div>
                          <div className="hcomment">{drawer.reasonNextAction}</div>
                        </div>
                      </div>
                    )}
                    <div className="rv-hist-item">
                      <div className="hav">{initials(drawer.assignedTo.fullName)}</div>
                      <div className="hbody">
                        <div className="hmeta">
                          <span className="hname">{drawer.assignedTo.fullName}</span>
                          <span className="hdate">{fmtDate(drawer.lastUpdate)}</span>
                        </div>
                        <div className="htext">đã chuyển task sang <b>Review</b></div>
                      </div>
                    </div>
                    <div className="rv-hist-item">
                      <div className="hav">{initials(drawer.assignedBy.fullName)}</div>
                      <div className="hbody">
                        <div className="hmeta">
                          <span className="hname">{drawer.assignedBy.fullName}</span>
                          <span className="hdate">{fmtDate(drawer.dateCreated)}</span>
                        </div>
                        <div className="htext">đã tạo task <b>{drawer.code}</b></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          );
        })()}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
          background: "var(--elev)", border: "1px solid var(--border-2)", borderRadius: 10,
          padding: "12px 22px", fontSize: ".86rem", fontWeight: 500, color: "var(--text)",
          boxShadow: "var(--shadow-lg)", zIndex: 500, whiteSpace: "nowrap",
          borderLeft: `3px solid ${toast.type === "ok" ? "var(--ok)" : "var(--danger)"}`,
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
