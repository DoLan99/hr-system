"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useCurrentUser } from "@/lib/contexts/current-user-context";
import { format } from "date-fns";
import { vi as viLocale } from "date-fns/locale";
import { LeaveFormModal, LEAVE_TYPES } from "./leave-form-modal";
import { LeaveReviewModal } from "./leave-review-modal";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];

interface Employee { id: number; fullName: string; department?: string | null; avatarUrl?: string | null }

interface LeaveItem {
  id: number;
  date: string;
  type: string;
  shiftType: "FULL_DAY" | "MORNING" | "AFTERNOON";
  requestedHours: number | string;
  reason?: string | null;
  evidenceLink?: string | null;
  status: string;
  approverId?: number | null;
  approver?: { id: number; fullName: string } | null;
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

interface TabCounts { ALL: number; PENDING: number; APPROVED: number; REJECTED: number }

interface Props {
  initialLeaves: LeaveItem[];
  viewedMonth: number;
  viewedYear: number;
  viewedPage: number;
  pageSize: number;
  totalInView: number;
  statusFilter: string | null;
  tabCounts: TabCounts;
  employees: Employee[];
  currentUserId: number;
  todayLeaves: LeaveItem[];
  kpis: Kpis;
}

function initials(name: string) {
  return name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
}

function statusLabel(s: string) {
  return { PENDING: "Chờ duyệt", APPROVED: "Đã duyệt", REJECTED: "Từ chối" }[s] ?? s;
}

function shiftLabel(s: string) {
  return { FULL_DAY: "Cả ngày", MORNING: "Sáng", AFTERNOON: "Chiều" }[s] ?? s;
}

export function LeaveClient({
  initialLeaves, viewedMonth, viewedYear, viewedPage, pageSize, totalInView,
  statusFilter, tabCounts, employees, currentUserId, todayLeaves, kpis,
}: Props) {
  const user = useCurrentUser();
  const isManager = MANAGER_ROLES.includes(user.role.name);
  const router = useRouter();
  const pathname = usePathname();

  const [creating, setCreating] = useState(false);
  const [reviewingItem, setReviewingItem] = useState<LeaveItem | null>(null);

  const leaves = initialLeaves;
  const totalPages = Math.max(1, Math.ceil(totalInView / pageSize));
  const currentTab: "ALL" | "PENDING" | "APPROVED" | "REJECTED" = (statusFilter as any) ?? "ALL";

  function buildUrl(next: { month?: number; year?: number; page?: number; status?: string | null }) {
    const params = new URLSearchParams();
    params.set("month", String(next.month ?? viewedMonth));
    params.set("year", String(next.year ?? viewedYear));
    const p = next.page ?? 1;
    if (p > 1) params.set("page", String(p));
    const s = "status" in next ? next.status : statusFilter;
    if (s && s !== "ALL") params.set("status", s);
    return `${pathname}?${params.toString()}`;
  }

  function go(next: Parameters<typeof buildUrl>[0]) { router.push(buildUrl(next)); }

  function changeMonth(delta: number) {
    let m = viewedMonth + delta, y = viewedYear;
    if (m < 1) { m = 12; y--; } else if (m > 12) { m = 1; y++; }
    go({ month: m, year: y, page: 1 });
  }

  async function handleDelete(id: number) {
    if (!confirm("Hủy đơn nghỉ này?")) return;
    await fetch(`/api/leave/${id}`, { method: "DELETE" });
    router.refresh();
  }

  const tabs: { k: "PENDING" | "APPROVED" | "REJECTED" | "ALL"; l: string }[] = [
    { k: "PENDING", l: "Chờ duyệt" },
    { k: "APPROVED", l: "Đã duyệt" },
    { k: "REJECTED", l: "Từ chối" },
    { k: "ALL", l: "Tất cả" },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .lv-layout{display:grid;grid-template-columns:1fr 300px;gap:20px;align-items:start}
        @media(max-width:1050px){.lv-layout{grid-template-columns:1fr}}
        .lv-bar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:18px 0}
        .lv-tabs{display:flex;gap:4px;flex-wrap:wrap}
        .lv-tab{height:32px;padding:0 13px;border-radius:99px;border:1.5px solid var(--border);background:var(--elev);font-size:.8rem;font-weight:600;color:var(--text-2);cursor:pointer;font-family:inherit;transition:all .15s;display:inline-flex;align-items:center;gap:6px}
        .lv-tab:hover{border-color:var(--border-2);color:var(--text)}
        .lv-tab.on{border-color:var(--accent);background:var(--accent-soft);color:var(--accent-ink)}
        .lv-tab .tcnt{font-family:var(--font-mono);font-size:.62rem;padding:1px 5px;border-radius:99px;background:rgba(255,255,255,.07)}
        .lv-tab.on .tcnt{background:var(--accent-soft-2)}
        .req-list{display:flex;flex-direction:column;gap:10px}
        .req-card{background:var(--elev);border:1.5px solid var(--border);border-radius:var(--r-lg);overflow:hidden;transition:border-color .15s,box-shadow .15s}
        .req-card:hover{border-color:var(--border-2);box-shadow:0 4px 16px rgba(0,0,30,.2)}
        .req-card.pending{border-left:3px solid var(--warn)}
        .req-card-body{padding:14px 16px;display:flex;align-items:flex-start;gap:12px}
        .req-av{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#8b7bff,#4f7aff);display:grid;place-items:center;color:#fff;font-size:.82rem;font-weight:700;flex-shrink:0}
        .req-main{flex:1;min-width:0}
        .req-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px}
        .req-name{font-size:.9rem;font-weight:700;color:var(--text)}
        .lt-badge{display:inline-flex;align-items:center;gap:5px;font-size:.7rem;font-weight:700;padding:2px 9px;border-radius:99px}
        .lt-dot{width:6px;height:6px;border-radius:50%}
        .att-code{font-family:var(--font-mono);font-size:.65rem;font-weight:800;padding:1px 5px;border-radius:4px;opacity:.85}
        .req-dates{display:flex;align-items:center;gap:7px;font-size:.82rem;color:var(--text);font-weight:600;margin-bottom:3px;flex-wrap:wrap}
        .dur-pill{font-family:var(--font-mono);font-size:.7rem;font-weight:700;padding:2px 7px;border-radius:99px;background:var(--content);border:1px solid var(--border);color:var(--text-2)}
        .shift-pill{font-size:.68rem;font-weight:600;padding:2px 7px;border-radius:99px;background:var(--content);color:var(--text-3)}
        .req-reason{font-size:.8rem;color:var(--text-3);line-height:1.5;margin-top:3px}
        .req-meta{display:flex;align-items:center;gap:12px;margin-top:8px;font-size:.72rem;color:var(--text-3);font-family:var(--font-mono);flex-wrap:wrap}
        .req-approver{font-size:.72rem;color:var(--text-3);display:flex;align-items:center;gap:4px;margin-top:2px}
        .req-side{display:flex;flex-direction:column;align-items:flex-end;gap:8px;flex-shrink:0}
        .lv-status{display:inline-flex;align-items:center;gap:4px;font-family:var(--font-mono);font-size:.66rem;font-weight:700;padding:3px 10px;border-radius:99px}
        .lv-status.APPROVED{background:var(--ok-soft);color:var(--ok)}
        .lv-status.PENDING{background:var(--warn-soft);color:var(--warn)}
        .lv-status.REJECTED{background:var(--danger-soft);color:var(--danger)}
        .req-actions{display:flex;gap:6px;flex-wrap:wrap}
        .req-btn{height:28px;padding:0 10px;border-radius:7px;font-size:.75rem;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;border:1px solid transparent;display:inline-flex;align-items:center;gap:4px}
        .req-btn.approve{background:var(--ok-soft);color:var(--ok)}
        .req-btn.approve:hover{background:rgba(74,222,128,.2)}
        .req-btn.reject{background:var(--danger-soft);color:var(--danger)}
        .req-btn.reject:hover{background:rgba(255,107,107,.18)}
        .req-btn.neutral{background:var(--content);color:var(--text-3);border-color:var(--border)}
        .req-btn.neutral:hover{background:var(--border)}
        .req-empty{text-align:center;padding:44px 20px;color:var(--text-3);background:var(--elev);border:1px solid var(--border);border-radius:var(--r-lg)}
        .lv-right{display:flex;flex-direction:column;gap:14px}
        .side-card{background:var(--elev);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden}
        .side-card-h{display:flex;align-items:center;justify-content:space-between;padding:12px 15px;border-bottom:1px solid var(--border)}
        .side-card-h h3{font-size:.85rem;font-weight:700}
        .side-card-h .sub{font-size:.7rem;color:var(--text-3);font-family:var(--font-mono)}
        .side-card-b{padding:10px 14px}
        .who-out{display:flex;align-items:center;gap:9px;padding:8px 0;border-bottom:1px solid var(--border)}
        .who-out:last-child{border-bottom:none}
        .wo-av{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#8b7bff,#4f7aff);display:grid;place-items:center;color:#fff;font-size:.62rem;font-weight:700;flex-shrink:0}
        .wo-info{flex:1;min-width:0}
        .wo-name{font-size:.81rem;font-weight:600;color:var(--text)}
        .wo-when{font-size:.7rem;color:var(--text-3);font-family:var(--font-mono)}
        .month-nav{display:inline-flex;align-items:center;gap:5px;background:var(--elev);border:1px solid var(--border);border-radius:9px;padding:3px}
        .mn-btn{width:28px;height:28px;border-radius:7px;border:none;background:transparent;color:var(--text-2);cursor:pointer;display:grid;place-items:center;font-family:inherit;transition:all .15s}
        .mn-btn:hover:not(:disabled){background:var(--content);color:var(--text)}
        .mn-btn:disabled{opacity:.35;cursor:not-allowed}
        .mn-label{font-family:var(--font-mono);font-size:.78rem;font-weight:700;color:var(--text);padding:0 8px;min-width:105px;text-align:center}
        .lv-page{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:12px;padding:10px 14px;background:var(--elev);border:1px solid var(--border);border-radius:var(--r-lg);flex-wrap:wrap}
        .lv-page-info{font-size:.8rem;color:var(--text-3)}
        .lv-page-info b{color:var(--text);font-weight:700;font-family:var(--font-mono)}
        .lv-page-ctrl{display:inline-flex;align-items:center;gap:4px}
      ` }} />

      <div className="page-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px", flexWrap: "wrap", marginBottom: "18px" }}>
        <div>
          <h1>Nghỉ phép</h1>
          <p>Quản lý đơn xin nghỉ · <b>{kpis.pendingCount}</b> đơn chờ duyệt · Tháng {viewedMonth}/{viewedYear}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div className="month-nav">
            <button type="button" className="mn-btn" onClick={() => changeMonth(-1)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" width="13" height="13"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <span className="mn-label">Tháng {String(viewedMonth).padStart(2, "0")}/{viewedYear}</span>
            <button type="button" className="mn-btn" onClick={() => changeMonth(1)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" width="13" height="13"><path d="M9 6l6 6-6 6" /></svg>
            </button>
          </div>
          <button className="abtn primary" onClick={() => setCreating(true)} style={{ gap: "6px" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" width="14" height="14"><path d="M12 5v14M5 12h14" /></svg>
            Tạo đơn nghỉ
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpis">
        {[
          { ico: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" /></>, lab: "Chờ duyệt", val: kpis.pendingCount, chg: "cần xử lý", cls: kpis.pendingCount > 0 ? "warn" : "flat" },
          { ico: <><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>, lab: "Duyệt tháng này", val: `${kpis.approvedMonthHours}h`, chg: `${kpis.approvedMonthCount} đơn`, cls: "up" },
          { ico: <><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" /></>, lab: "Đang nghỉ hôm nay", val: kpis.onLeaveToday, chg: "thành viên", cls: kpis.onLeaveToday > 0 ? "warn" : "flat" },
          { ico: <path d="M9 11l3 3L22 4" />, lab: "Tổng đơn", val: kpis.totalRequests, chg: "tất cả trạng thái", cls: "flat" },
        ].map((k, i) => (
          <div key={i} className="kpi">
            <div className="kt"><span className="ki"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{k.ico}</svg></span>{k.lab}</div>
            <div className="kv">{k.val}</div>
            <div className={`kc ${k.cls}`}>{k.chg}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="lv-bar">
        <div className="lv-tabs">
          {tabs.map(t => (
            <button key={t.k} className={`lv-tab${currentTab === t.k ? " on" : ""}`} onClick={() => go({ status: t.k === "ALL" ? null : t.k, page: 1 })}>
              {t.l}<span className="tcnt">{tabCounts[t.k]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="lv-layout">
        {/* LEFT */}
        <div>
          <div className="req-list">
            {leaves.length === 0 ? (
              <div className="req-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 44, height: 44, margin: "0 auto 12px", opacity: .3 }}>
                  <rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p style={{ fontSize: ".9rem", fontWeight: 600, color: "var(--text-2)" }}>Không có đơn nào</p>
                <span style={{ fontSize: ".82rem" }}>Không có đơn nghỉ nào trong tháng {viewedMonth}/{viewedYear}.</span>
              </div>
            ) : (
              leaves.map((item: LeaveItem) => {
                const typeInfo = LEAVE_TYPES[item.type] ?? LEAVE_TYPES.OTHER;
                const canReview = (isManager || item.approverId === user.employeeId || item.approver?.id === user.employeeId) && item.status === "PENDING";
                const canCancel = item.status === "PENDING" && (isManager || item.employee.id === currentUserId);
                const ini = initials(item.employee.fullName);
                const dateStr = format(new Date(item.date), "dd/MM/yyyy", { locale: viLocale });
                return (
                  <div key={item.id} className={`req-card${item.status === "PENDING" ? " pending" : ""}`}>
                    <div className="req-card-body">
                      <div className="req-av">{ini}</div>
                      <div className="req-main">
                        <div className="req-top">
                          <span className="req-name">{item.employee.fullName}</span>
                          <span className="lt-badge" style={{ background: `${typeInfo.color}18`, color: typeInfo.color }}>
                            <span className="lt-dot" style={{ background: typeInfo.color }}></span>
                            {typeInfo.label}
                          </span>
                          <span className="att-code" style={{ background: `${typeInfo.color}18`, color: typeInfo.color }}>{typeInfo.attendanceCode}</span>
                        </div>
                        <div className="req-dates">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13, color: "var(--text-3)", flexShrink: 0 }}>
                            <rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                          </svg>
                          {dateStr}
                          <span className="dur-pill">{Number(item.requestedHours)}h</span>
                          <span className="shift-pill">{shiftLabel(item.shiftType ?? "FULL_DAY")}</span>
                        </div>
                        {item.approver && (
                          <div className="req-approver">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 11, height: 11 }}><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
                            Người duyệt: <b style={{ color: "var(--text-2)" }}>{item.approver.fullName}</b>
                          </div>
                        )}
                        {item.reason && <div className="req-reason">{item.reason}</div>}
                        {item.approvalNote && (
                          <div className="req-reason" style={{ color: item.status === "REJECTED" ? "var(--danger)" : "var(--ok)", marginTop: 4 }}>
                            {item.status === "REJECTED" ? "✗" : "✓"} {item.approvalNote}
                          </div>
                        )}
                        <div className="req-meta">
                          <span>#{item.id}</span>
                          {item.employee.department && <span>· {item.employee.department}</span>}
                          {item.approvedBy && <span>· duyệt bởi {item.approvedBy.fullName}</span>}
                        </div>
                      </div>
                      <div className="req-side">
                        <span className={`lv-status ${item.status}`}>{statusLabel(item.status)}</span>
                        <div className="req-actions">
                          {canReview && (
                            <button className="req-btn approve" onClick={() => setReviewingItem(item)}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="11" height="11"><path d="M5 13l4 4L19 7" /></svg>
                              Duyệt
                            </button>
                          )}
                          {canCancel && (
                            <button className="req-btn neutral" onClick={() => handleDelete(item.id)}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="11" height="11"><path d="M6 6l12 12M18 6L6 18" /></svg>
                              Hủy
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {totalPages > 1 && (
            <div className="lv-page">
              <span className="lv-page-info">
                <b>{(viewedPage - 1) * pageSize + 1}</b>–<b>{Math.min(viewedPage * pageSize, totalInView)}</b> / {totalInView}
              </span>
              <div className="lv-page-ctrl">
                <button type="button" className="mn-btn" disabled={viewedPage <= 1} onClick={() => go({ page: viewedPage - 1 })}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" width="13" height="13"><path d="M15 18l-6-6 6-6" /></svg>
                </button>
                <span className="mn-label" style={{ minWidth: 60 }}>{viewedPage} / {totalPages}</span>
                <button type="button" className="mn-btn" disabled={viewedPage >= totalPages} onClick={() => go({ page: viewedPage + 1 })}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" width="13" height="13"><path d="M9 6l6 6-6 6" /></svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="lv-right">
          <div className="side-card">
            <div className="side-card-h">
              <h3>Đang nghỉ hôm nay</h3>
              <span className="sub">{todayLeaves.length} người</span>
            </div>
            <div className="side-card-b">
              {todayLeaves.length === 0 ? (
                <div style={{ fontSize: ".8rem", color: "var(--text-3)", textAlign: "center", padding: "6px 0" }}>Không có ai nghỉ.</div>
              ) : todayLeaves.map(r => {
                const ti = LEAVE_TYPES[r.type] ?? LEAVE_TYPES.OTHER;
                return (
                  <div key={r.id} className="who-out">
                    <div className="wo-av">{initials(r.employee.fullName)}</div>
                    <div className="wo-info">
                      <div className="wo-name">{r.employee.fullName}</div>
                      <div className="wo-when">{format(new Date(r.date), "dd/MM/yyyy", { locale: viLocale })} · {ti.label}</div>
                    </div>
                    <span className="att-code" style={{ background: `${ti.color}18`, color: ti.color }}>{ti.attendanceCode}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="side-card">
            <div className="side-card-h"><h3>Mã trạng thái công</h3></div>
            <div className="side-card-b">
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { code: "X", label: "Đi làm cả ngày", color: "#22c55e" },
                  { code: "P", label: "Nghỉ phép (có lương)", color: "#3B5BDB" },
                  { code: "P/2", label: "Nghỉ nửa ngày (có lương)", color: "#818cf8" },
                  { code: "L", label: "Nghỉ lễ, Tết", color: "#a78bfa" },
                  { code: "CĐ", label: "Nghỉ chế độ", color: "#f97316" },
                  { code: "TS", label: "Nghỉ thai sản", color: "#ec4899" },
                  { code: "U", label: "Nghỉ không lương", color: "#94a3b8" },
                  { code: "--", label: "Không phải ngày công", color: "#475569" },
                ].map(s => (
                  <div key={s.code} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: ".76rem" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: ".68rem", padding: "1px 6px", borderRadius: 4, background: `${s.color}18`, color: s.color, minWidth: 34, textAlign: "center" }}>{s.code}</span>
                    <span style={{ color: "var(--text-2)" }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {creating && (
        <LeaveFormModal
          item={null}
          employees={employees}
          isManager={isManager}
          currentUserId={currentUserId}
          onClose={() => setCreating(false)}
          onSaved={() => { setCreating(false); router.refresh(); }}
        />
      )}

      {reviewingItem && (
        <LeaveReviewModal
          item={reviewingItem}
          onClose={() => setReviewingItem(null)}
          onSaved={() => { setReviewingItem(null); router.refresh(); }}
        />
      )}
    </>
  );
}
