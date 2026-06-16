"use client";

import { useState, useMemo } from "react";
import { useCurrentUser } from "@/lib/contexts/current-user-context";
import { format } from "date-fns";
import { vi as viLocale } from "date-fns/locale";
import { LeaveFormModal } from "./leave-form-modal";
import { LeaveReviewModal } from "./leave-review-modal";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];

interface Employee { id: number; fullName: string; department?: string | null }

interface LeaveItem {
  id: number;
  date: string;
  type: string;
  requestedHours: number | string;
  reason?: string | null;
  evidenceLink?: string | null;
  status: string;
  approvedHours?: number | string | null;
  approvalNote?: string | null;
  money?: number | string | null;
  approvedAt?: string | null;
  employee: Employee;
  approvedBy?: { fullName: string } | null;
}

interface Kpis {
  pendingCount: number;
  approvedMonthCount: number;
  approvedMonthHours: number;
  onLeaveToday: number;
  totalRequests: number;
}

interface Props {
  initialLeaves: LeaveItem[];
  initialMonth: number;
  initialYear: number;
  employees: Employee[];
  currentUserId: number;
  todayLeaves: LeaveItem[];
  kpis: Kpis;
}

const LEAVE_TYPES: Record<string, { label: string; cls: string; color: string }> = {
  VACATION:  { label: "Nghỉ phép năm",  cls: "lt-annual",   color: "#3B5BDB" },
  ILLNESS:   { label: "Nghỉ ốm",        cls: "lt-sick",     color: "#fbbf24" },
  HOLIDAY:   { label: "Nghỉ lễ",        cls: "lt-personal", color: "#a78bfa" },
  OTHER:     { label: "Khác",           cls: "lt-unpaid",   color: "#94a3b8" },
};

function initials(name: string) {
  return name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
}

function statusLabel(s: string) {
  return { PENDING: "Chờ duyệt", APPROVED: "Đã duyệt", REJECTED: "Từ chối" }[s] ?? s;
}

export function LeaveClient({
  initialLeaves, initialMonth, initialYear, employees,
  currentUserId, todayLeaves, kpis,
}: Props) {
  const user = useCurrentUser();
  const isManager = MANAGER_ROLES.includes(user.role.name);

  const [leaves, setLeaves] = useState<LeaveItem[]>(initialLeaves);
  const [tab, setTab] = useState<string>("PENDING");
  const [creating, setCreating] = useState(false);
  const [editingItem, setEditingItem] = useState<LeaveItem | null>(null);
  const [reviewingItem, setReviewingItem] = useState<LeaveItem | null>(null);

  function upsert(item: LeaveItem) {
    setLeaves(prev => {
      const idx = prev.findIndex(l => l.id === item.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = item; return next; }
      return [item, ...prev];
    });
  }

  async function handleDelete(id: number) {
    if (!confirm("Xóa đơn nghỉ này?")) return;
    await fetch(`/api/leave/${id}`, { method: "DELETE" });
    setLeaves(prev => prev.filter(l => l.id !== id));
  }

  const counts = useMemo(() => ({
    ALL: leaves.length,
    PENDING: leaves.filter(l => l.status === "PENDING").length,
    APPROVED: leaves.filter(l => l.status === "APPROVED").length,
    REJECTED: leaves.filter(l => l.status === "REJECTED").length,
  }), [leaves]);

  const filtered = useMemo(() =>
    tab === "ALL" ? leaves : leaves.filter(l => l.status === tab),
    [leaves, tab]
  );

  const tabs = [
    { k: "PENDING", l: "Chờ duyệt" },
    { k: "APPROVED", l: "Đã duyệt" },
    { k: "REJECTED", l: "Từ chối" },
    { k: "ALL", l: "Tất cả" },
  ];

  return (
    <>
      <style>{`
        .lv-layout{display:grid;grid-template-columns:1fr 320px;gap:20px;align-items:start}
        @media(max-width:1050px){.lv-layout{grid-template-columns:1fr}}
        .lt-annual{--c:#3B5BDB;--cs:rgba(59,91,219,.13)}
        .lt-sick{--c:#fbbf24;--cs:rgba(251,191,36,.13)}
        .lt-unpaid{--c:#94a3b8;--cs:rgba(148,163,184,.14)}
        .lt-personal{--c:#a78bfa;--cs:rgba(167,139,250,.14)}
        .lv-bar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:16px}
        .lv-tabs{display:flex;gap:4px;flex-wrap:wrap}
        .lv-tab{height:34px;padding:0 14px;border-radius:99px;border:1.5px solid var(--border);background:var(--elev);font-size:.82rem;font-weight:600;color:var(--text-2);cursor:pointer;font-family:inherit;transition:all .15s;display:inline-flex;align-items:center;gap:7px;white-space:nowrap}
        .lv-tab:hover{border-color:var(--border-2);color:var(--text)}
        .lv-tab.on{border-color:var(--accent);background:var(--accent-soft);color:var(--accent-ink)}
        .lv-tab .tcnt{font-family:var(--font-mono);font-size:.64rem;padding:1px 6px;border-radius:99px;background:rgba(255,255,255,.07)}
        .lv-tab.on .tcnt{background:var(--accent-soft-2)}
        .req-list{display:flex;flex-direction:column;gap:12px}
        .req-card{background:var(--elev);border:1.5px solid var(--border);border-radius:var(--r-lg);padding:0;overflow:hidden;transition:border-color .18s,box-shadow .15s;position:relative}
        .req-card:hover{border-color:var(--border-2);box-shadow:0 6px 20px rgba(0,0,30,.25)}
        .req-card.pending{border-left:3px solid var(--warn)}
        .req-card-body{padding:16px 18px;display:flex;align-items:flex-start;gap:14px}
        .req-av{width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#8b7bff,#4f7aff);display:grid;place-items:center;color:#fff;font-size:.88rem;font-weight:700;flex-shrink:0}
        .req-main{flex:1;min-width:0}
        .req-top{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:5px}
        .req-name{font-size:.92rem;font-weight:700;color:var(--text)}
        .lt-badge{display:inline-flex;align-items:center;gap:6px;font-size:.72rem;font-weight:700;padding:3px 10px;border-radius:99px;background:var(--cs);color:var(--c)}
        .lt-badge .ld{width:7px;height:7px;border-radius:50%;background:var(--c)}
        .req-dates{display:flex;align-items:center;gap:8px;font-size:.84rem;color:var(--text);font-weight:600;margin-bottom:4px;flex-wrap:wrap}
        .req-dates .dur-pill{font-family:var(--font-mono);font-size:.72rem;font-weight:700;padding:2px 8px;border-radius:99px;background:var(--content);border:1px solid var(--border);color:var(--text-2);white-space:nowrap}
        .req-reason{font-size:.82rem;color:var(--text-3);line-height:1.5;margin-top:4px}
        .req-meta{display:flex;align-items:center;gap:14px;margin-top:10px;font-size:.74rem;color:var(--text-3);font-family:var(--font-mono);flex-wrap:wrap}
        .req-meta span{display:inline-flex;align-items:center;gap:5px}
        .req-side{display:flex;flex-direction:column;align-items:flex-end;gap:10px;flex-shrink:0}
        .lv-status{display:inline-flex;align-items:center;gap:5px;font-family:var(--font-mono);font-size:.68rem;font-weight:700;padding:4px 11px;border-radius:99px;white-space:nowrap}
        .lv-status.APPROVED{background:var(--ok-soft);color:var(--ok)}
        .lv-status.PENDING{background:var(--warn-soft);color:var(--warn)}
        .lv-status.REJECTED{background:var(--danger-soft);color:var(--danger)}
        .req-actions{display:flex;gap:7px}
        .req-btn{height:30px;padding:0 12px;border-radius:8px;font-size:.78rem;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;border:1px solid transparent;display:inline-flex;align-items:center;gap:5px}
        .req-btn.approve{background:var(--ok-soft);color:var(--ok);border-color:rgba(74,222,128,.25)}
        .req-btn.approve:hover{background:rgba(74,222,128,.22);transform:translateY(-1px)}
        .req-btn.reject{background:var(--danger-soft);color:var(--danger);border-color:rgba(255,107,107,.2)}
        .req-btn.reject:hover{background:rgba(255,107,107,.2);transform:translateY(-1px)}
        .req-empty{text-align:center;padding:50px 20px;color:var(--text-3);background:var(--elev);border:1px solid var(--border);border-radius:var(--r-lg)}
        .lv-right{display:flex;flex-direction:column;gap:16px}
        .side-card{background:var(--elev);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden}
        .side-card-h{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid var(--border)}
        .side-card-h h3{font-size:.88rem;font-weight:700}
        .side-card-h .sub{font-size:.72rem;color:var(--text-3);font-family:var(--font-mono)}
        .side-card-b{padding:14px 16px}
        .who-out{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)}
        .who-out:last-child{border-bottom:none}
        .who-out .wo-av{width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#8b7bff,#4f7aff);display:grid;place-items:center;color:#fff;font-size:.68rem;font-weight:700;flex-shrink:0;position:relative}
        .who-out .wo-dot{position:absolute;bottom:-1px;right:-1px;width:11px;height:11px;border-radius:50%;border:2px solid var(--elev)}
        .who-out .wo-info{flex:1;min-width:0}
        .who-out .wo-name{font-size:.83rem;font-weight:600;color:var(--text)}
        .who-out .wo-when{font-size:.72rem;color:var(--text-3);font-family:var(--font-mono)}
        .who-out .wo-tag{font-size:.66rem;font-weight:700;padding:2px 8px;border-radius:99px;flex-shrink:0}
      `}</style>

      {/* Page head */}
      <div className="page-head" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"16px", flexWrap:"wrap", marginBottom:"22px" }}>
        <div>
          <h1>Leave</h1>
          <p>Quản lý nghỉ phép · <b>{kpis.pendingCount}</b> đơn chờ duyệt · Tháng {initialMonth}/{initialYear}</p>
        </div>
        <button className="abtn primary" onClick={() => setCreating(true)} style={{ gap:"7px" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" width="15" height="15"><path d="M12 5v14M5 12h14"/></svg>
          Tạo đơn nghỉ
        </button>
      </div>

      {/* KPIs */}
      <div className="kpis">
        {[
          {
            ico: <><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M12 14v3M10.5 15.5h3" strokeLinecap="round" strokeLinejoin="round"/></>,
            lab: "Chờ duyệt", val: kpis.pendingCount, chg: "cần xử lý", cls: kpis.pendingCount > 0 ? "warn" : "flat",
          },
          {
            ico: <><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></>,
            lab: "Duyệt tháng này", val: `${kpis.approvedMonthHours}h`, chg: `${kpis.approvedMonthCount} đơn`, cls: "up",
          },
          {
            ico: <><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round"/></>,
            lab: "Đang nghỉ hôm nay", val: kpis.onLeaveToday, chg: "thành viên", cls: kpis.onLeaveToday > 0 ? "warn" : "flat",
          },
          {
            ico: <path d="M9 11l3 3L22 4"/>,
            lab: "Tổng đơn", val: kpis.totalRequests, chg: "tất cả trạng thái", cls: "flat",
          },
        ].map((k, i) => (
          <div key={i} className="kpi">
            <div className="kt">
              <span className="ki">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{k.ico}</svg>
              </span>
              {k.lab}
            </div>
            <div className="kv">{k.val}</div>
            <div className={`kc ${k.cls}`}>{k.chg}</div>
          </div>
        ))}
      </div>

      {/* Layout */}
      <div className="lv-layout">
        {/* LEFT: requests */}
        <div>
          <div className="lv-bar">
            <div className="lv-tabs">
              {tabs.map(t => (
                <button key={t.k} className={`lv-tab${tab === t.k ? " on" : ""}`} onClick={() => setTab(t.k)}>
                  {t.l}<span className="tcnt">{counts[t.k as keyof typeof counts]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="req-list">
            {filtered.length === 0 ? (
              <div className="req-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width:46, height:46, margin:"0 auto 14px", opacity:.3 }}>
                  <rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p style={{ fontSize:".92rem", fontWeight:600, color:"var(--text-2)" }}>Không có đơn nào</p>
                <span style={{ fontSize:".83rem" }}>Mọi đơn nghỉ phép đã được xử lý.</span>
              </div>
            ) : (
              filtered.map(item => {
                const t = LEAVE_TYPES[item.type] ?? LEAVE_TYPES.OTHER;
                const canEdit = item.status === "PENDING" && (isManager || item.employee.id === currentUserId);
                const canReview = isManager && item.status === "PENDING";
                const ini = initials(item.employee.fullName);
                const dateStr = format(new Date(item.date), "dd/MM/yyyy", { locale: viLocale });
                return (
                  <div key={item.id} className={`req-card ${t.cls}${item.status === "PENDING" ? " pending" : ""}`}>
                    <div className="req-card-body">
                      <div className="req-av">{ini}</div>
                      <div className="req-main">
                        <div className="req-top">
                          <span className="req-name">{item.employee.fullName}</span>
                          <span className="lt-badge"><span className="ld"></span>{t.label}</span>
                        </div>
                        <div className="req-dates">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:15,height:15,color:"var(--text-3)",flexShrink:0}}>
                            <rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                          </svg>
                          {dateStr}
                          <span className="dur-pill">{Number(item.requestedHours)}h</span>
                        </div>
                        {item.reason && <div className="req-reason">{item.reason}</div>}
                        <div className="req-meta">
                          <span>#{item.id}</span>
                          {item.employee.department && <span>· {item.employee.department}</span>}
                          {item.approvedBy && <span>· duyệt bởi {item.approvedBy.fullName}</span>}
                        </div>
                      </div>
                      <div className="req-side">
                        <span className={`lv-status ${item.status}`}>{statusLabel(item.status)}</span>
                        {(canReview || canEdit || isManager) && (
                          <div className="req-actions">
                            {canReview && (
                              <button className="req-btn approve" onClick={() => setReviewingItem(item)}>✓ Duyệt</button>
                            )}
                            {canEdit && (
                              <button className="req-btn reject" onClick={() => setEditingItem(item)}>✎ Sửa</button>
                            )}
                            {(isManager || (item.status === "PENDING" && item.employee.id === currentUserId)) && (
                              <button className="req-btn reject" onClick={() => handleDelete(item.id)}>✗</button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div className="lv-right">
          {/* Who's out today */}
          <div className="side-card">
            <div className="side-card-h">
              <h3>Đang nghỉ hôm nay</h3>
              <span className="sub">{todayLeaves.length} người</span>
            </div>
            <div className="side-card-b">
              {todayLeaves.length === 0 ? (
                <div style={{ fontSize:".82rem", color:"var(--text-3)", textAlign:"center", padding:"8px 0" }}>Không có ai nghỉ.</div>
              ) : (
                todayLeaves.map(r => {
                  const t = LEAVE_TYPES[r.type] ?? LEAVE_TYPES.OTHER;
                  return (
                    <div key={r.id} className="who-out">
                      <div className="wo-av">
                        {initials(r.employee.fullName)}
                        <span className="wo-dot" style={{ background:"var(--warn)" }}></span>
                      </div>
                      <div className="wo-info">
                        <div className="wo-name">{r.employee.fullName}</div>
                        <div className="wo-when">{format(new Date(r.date), "dd/MM/yyyy", { locale: viLocale })} · đang nghỉ</div>
                      </div>
                      <span className={`lt-badge ${t.cls}`} style={{ fontSize:".64rem", padding:"2px 8px" }}>
                        <span className="ld"></span>{t.label}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Leave type legend */}
          <div className="side-card">
            <div className="side-card-h"><h3>Loại nghỉ</h3></div>
            <div className="side-card-b">
              <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
                {Object.entries(LEAVE_TYPES).map(([k, v]) => (
                  <span key={k} style={{ display:"inline-flex", alignItems:"center", gap:"6px", fontSize:".74rem", color:"var(--text-3)" }}>
                    <span style={{ width:10, height:10, borderRadius:"50%", background:v.color, display:"inline-block" }}></span>
                    {v.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {(creating || editingItem) && (
        <LeaveFormModal
          item={editingItem ? {
            id: editingItem.id,
            date: editingItem.date,
            type: editingItem.type,
            requestedHours: editingItem.requestedHours,
            reason: editingItem.reason,
            evidenceLink: editingItem.evidenceLink,
            employeeId: editingItem.employee.id,
          } : null}
          employees={employees}
          isManager={isManager}
          currentUserId={currentUserId}
          onClose={() => { setCreating(false); setEditingItem(null); }}
          onSaved={item => { upsert(item); setCreating(false); setEditingItem(null); }}
        />
      )}

      {reviewingItem && (
        <LeaveReviewModal
          item={reviewingItem}
          onClose={() => setReviewingItem(null)}
          onSaved={item => { upsert(item); setReviewingItem(null); }}
        />
      )}
    </>
  );
}
