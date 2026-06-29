"use client";

import { useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useCurrentUser } from "@/lib/contexts/current-user-context";
import { format } from "date-fns";
import { LeaveFormModal, LEAVE_TYPES } from "./leave-form-modal";
import { LeaveReviewModal } from "./leave-review-modal";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD", "HR"];
const AVCOLORS = ["#3B5BDB","#2196f3","#7c3aed","#0891b2","#059669","#d97706","#dc2626","#be185d","#0f766e","#b45309","#1d4ed8","#6d28d9"];

interface Employee { id: number; fullName: string; department?: string | null; avatarUrl?: string | null }
interface LeaveItem {
  id: number; date: string; type: string;
  shiftType: "FULL_DAY" | "MORNING" | "AFTERNOON";
  requestedHours: number | string; reason?: string | null;
  status: string; approverId?: number | null;
  approver?: { id: number; fullName: string } | null;
  approvedHours?: number | string | null; approvalNote?: string | null;
  approvedAt?: string | null;
  employee: Employee;
  approvedBy?: { fullName: string } | null;
}
interface Kpis { pendingCount: number; approvedMonthCount: number; approvedMonthHours: number; onLeaveToday: number; totalRequests: number }
interface TabCounts { ALL: number; PENDING: number; APPROVED: number; REJECTED: number }
interface Props {
  initialLeaves: LeaveItem[]; viewedMonth: number; viewedYear: number;
  viewedPage: number; pageSize: number; totalInView: number;
  statusFilter: string | null; tabCounts: TabCounts;
  employees: Employee[]; currentUserId: number;
  todayLeaves: LeaveItem[]; kpis: Kpis;
}

function initials(name: string) {
  const p = name.trim().split(/\s+/);
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[p.length - 2][0] + p[p.length - 1][0]).toUpperCase();
}
function colorIdx(s: string) {
  let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffffffff;
  return Math.abs(h) % AVCOLORS.length;
}
function fmtDate(d: string) {
  try { return format(new Date(d + "T12:00:00"), "dd/MM/yyyy"); } catch { return d; }
}
function pad(n: number) { return String(n).padStart(2, "0"); }

const TYPE_LBL: Record<string, string> = {
  ANNUAL: "Phép năm", SICK: "Nghỉ ốm", MARRIAGE: "Nghỉ cưới",
  UNPAID: "Không lương", MATERNITY: "Thai sản", COMPENSATE: "Bù công",
  PATERNITY: "Nghỉ hậu sản", BEREAVEMENT: "Tang lễ", OTHER: "Khác",
};
const TYPE_CLS: Record<string, string> = {
  ANNUAL: "lt-year", SICK: "lt-sick", MARRIAGE: "lt-marriage",
  UNPAID: "lt-unpaid", MATERNITY: "lt-maternity", COMPENSATE: "lt-compensate",
  PATERNITY: "lt-maternity", BEREAVEMENT: "lt-sick", OTHER: "lt-unpaid",
};

const PAGE_CSS = `
.lv-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px}
@media(max-width:900px){.lv-stats{grid-template-columns:1fr 1fr}}
.lv-stat{background:var(--elev);border:1px solid var(--border);border-radius:var(--r-lg);padding:15px 17px;display:flex;align-items:center;gap:13px}
.lv-stat .lsi{width:40px;height:40px;border-radius:11px;display:grid;place-items:center;flex-shrink:0}
.lv-stat .lsi svg{width:18px;height:18px}
.lv-stat .lsv{font-size:1.5rem;font-weight:800;letter-spacing:-.02em}
.lv-stat .lsl{font-size:.78rem;color:var(--text-3);margin-top:1px}
.lv-stat .lsd{font-size:.74rem;font-weight:600;margin-top:2px}
.lsd.ok{color:var(--ok)}.lsd.warn{color:var(--warn)}.lsd.danger{color:var(--danger)}
.lv-tabs{display:flex;gap:4px;margin-bottom:18px}
.lv-tab{font-size:.85rem;font-weight:500;padding:8px 16px;border-radius:9px;color:var(--text-2);cursor:pointer;transition:all .15s;border:1px solid transparent;background:none;font-family:inherit}
.lv-tab:hover{color:var(--text);background:var(--elev);border-color:var(--border)}
.lv-tab.on{background:var(--accent-soft);color:var(--accent-ink);font-weight:600;border-color:var(--accent-soft-2)}
.filter-bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding:12px 14px;background:var(--elev);border:1px solid var(--border);border-radius:var(--r-lg);margin-bottom:16px}
.fb-sel{background:var(--content);border:1px solid var(--border-2);border-radius:9px;padding:7px 12px;font-family:inherit;font-size:.83rem;color:var(--text);outline:none;height:38px;transition:border-color .15s}
.fb-sel:focus{border-color:var(--accent)}
.fb-search{display:flex;align-items:center;gap:8px;background:var(--content);border:1.5px solid var(--border-2);border-radius:9px;padding:0 12px;height:38px;flex:1;min-width:180px;transition:border-color .15s,box-shadow .15s}
.fb-search:focus-within{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.fb-search svg{width:14px;height:14px;color:var(--text-3);flex-shrink:0}
.fb-search input{background:none;border:none;outline:none;font-family:inherit;font-size:.84rem;color:var(--text);width:100%}
.fb-search input::placeholder{color:var(--text-3)}
.lv-table{width:100%;border-collapse:collapse;font-size:.84rem}
.lv-table th{text-align:left;padding:10px 14px;font-family:var(--font-mono);font-size:.68rem;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--text-3);border-bottom:1px solid var(--border);background:var(--content);white-space:nowrap}
.lv-table td{padding:11px 14px;border-bottom:1px solid var(--border);color:var(--text-2);vertical-align:middle}
.lv-table tbody tr:last-child td{border-bottom:none}
.lv-table tbody tr:hover{background:var(--content);cursor:pointer}
.lv-av{display:flex;align-items:center;gap:9px}
.lv-av .av-s{width:28px;height:28px;border-radius:8px;display:grid;place-items:center;font-size:.62rem;font-weight:700;color:#fff;flex-shrink:0}
.lv-type{display:inline-flex;align-items:center;gap:5px;font-size:.78rem;font-weight:600;padding:3px 10px;border-radius:99px}
.lt-year{background:var(--accent-soft);color:var(--accent-ink)}
.lt-sick{background:rgba(239,68,68,.1);color:#ef4444}
.lt-marriage{background:rgba(190,24,93,.1);color:#be185d}
.lt-unpaid{background:var(--border);color:var(--text-2)}
.lt-maternity{background:rgba(124,58,237,.1);color:#7c3aed}
.lt-compensate{background:rgba(8,145,178,.1);color:#0891b2}
.lv-status{display:inline-flex;align-items:center;gap:4px;font-family:var(--font-mono);font-size:.68rem;font-weight:600;padding:3px 9px;border-radius:99px}
.ls-pending{background:var(--warn-soft);color:var(--warn)}
.ls-approved{background:var(--ok-soft);color:var(--ok)}
.ls-rejected{background:var(--danger-soft);color:var(--danger)}
.ls-cancelled{background:var(--border);color:var(--text-3)}
.lv-days{font-family:var(--font-mono);font-weight:700;color:var(--text)}
.lv-actions{display:flex;gap:6px}
.lv-btn{height:28px;padding:0 11px;border-radius:7px;font-family:inherit;font-size:.76rem;font-weight:600;display:inline-flex;align-items:center;gap:4px;cursor:pointer;transition:background .12s,color .12s;border:1px solid}
.lv-btn.approve{background:var(--ok-soft);color:var(--ok);border-color:rgba(34,197,94,.25)}
.lv-btn.approve:hover{background:rgba(34,197,94,.2)}
.lv-btn.reject{background:var(--danger-soft);color:var(--danger);border-color:rgba(239,68,68,.25)}
.lv-btn.reject:hover{background:rgba(239,68,68,.2)}
.lv-btn.view{background:var(--content);color:var(--text-2);border-color:var(--border-2)}
.lv-btn.view:hover{border-color:var(--accent);color:var(--accent-ink)}
.lp{background:var(--elev);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden}
.lp-head{display:flex;align-items:center;justify-content:space-between;padding:13px 17px;border-bottom:1px solid var(--border)}
.lp-head h3{font-size:.9rem;font-weight:700;display:flex;align-items:center;gap:8px;margin:0}
.lp-head h3 svg{width:15px;height:15px;color:var(--accent-ink)}
.bal-list{display:flex;flex-direction:column}
.bal-row{display:flex;align-items:center;gap:12px;padding:11px 17px;border-bottom:1px solid var(--border);cursor:pointer;transition:background .12s}
.bal-row:last-child{border-bottom:none}
.bal-row:hover{background:var(--content)}
.bal-av{width:30px;height:30px;border-radius:8px;display:grid;place-items:center;font-size:.68rem;font-weight:700;color:#fff;flex-shrink:0}
.bal-name{font-weight:600;font-size:.85rem;flex:1;min-width:0}
.bal-role{font-size:.74rem;color:var(--text-3)}
.bal-types{display:flex;gap:6px;flex-wrap:wrap}
.bal-chip{display:flex;flex-direction:column;align-items:center;padding:5px 10px;border-radius:9px;background:var(--content);border:1px solid var(--border);min-width:52px}
.bal-chip .bc-v{font-family:var(--font-mono);font-size:.9rem;font-weight:800;color:var(--text)}
.bal-chip .bc-l{font-size:.62rem;color:var(--text-3);margin-top:1px;text-align:center}
.lv-detail{position:fixed;top:0;right:0;bottom:0;width:440px;max-width:94vw;background:var(--elev);border-left:1px solid var(--border);display:flex;flex-direction:column;z-index:60;transform:translateX(110%);transition:transform .32s cubic-bezier(.22,1,.36,1);box-shadow:-20px 0 60px rgba(0,0,0,.35)}
.lv-detail.open{transform:translateX(0)}
.ld-head{display:flex;align-items:center;gap:12px;padding:15px 17px;border-bottom:1px solid var(--border);flex-shrink:0}
.ld-body{flex:1;overflow-y:auto;padding:18px;display:flex;flex-direction:column;gap:16px}
.ld-row{display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;border-bottom:1px solid var(--border);font-size:.85rem;gap:16px}
.ld-row:last-child{border-bottom:none}
.ld-row .ll{color:var(--text-3);flex-shrink:0;min-width:120px}
.ld-row .lv{color:var(--text);font-weight:500;text-align:right}
.ld-sect-h{font-family:var(--font-mono);font-size:.68rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--text-3);margin-bottom:8px}
.lv-scrim{position:fixed;inset:0;background:rgba(0,0,0,.38);z-index:59;opacity:0;pointer-events:none;transition:opacity .25s}
.lv-scrim.on{opacity:1;pointer-events:auto}
.lv-empty{text-align:center;padding:44px 20px;color:var(--text-3);font-size:.86rem}
.mn-nav{display:inline-flex;align-items:center;gap:4px;background:var(--elev);border:1px solid var(--border);border-radius:9px;padding:3px}
.mn-btn2{width:28px;height:28px;border-radius:7px;border:none;background:transparent;color:var(--text-2);cursor:pointer;display:grid;place-items:center;font-family:inherit;transition:all .15s}
.mn-btn2:hover:not(:disabled){background:var(--content);color:var(--text)}
.mn-btn2:disabled{opacity:.35;cursor:not-allowed}
.mn-btn2 svg{width:13px;height:13px}
.mn-lbl2{font-family:var(--font-mono);font-size:.78rem;font-weight:700;color:var(--text);padding:0 8px;min-width:105px;text-align:center}
@media(max-width:700px){.lv-stats{grid-template-columns:1fr 1fr}.lv-detail{width:100vw}}
`;

type TabKey = "requests" | "balance" | "calendar";
type StatusKey = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

export function LeaveClient({
  initialLeaves, viewedMonth, viewedYear, viewedPage, pageSize, totalInView,
  statusFilter, tabCounts, employees, currentUserId, todayLeaves, kpis,
}: Props) {
  const user = useCurrentUser();
  const isManager = MANAGER_ROLES.includes(user.role.name);
  const router = useRouter();
  const pathname = usePathname();

  const [tab, setTab] = useState<TabKey>("requests");
  const [search, setSearch] = useState("");
  const [fType, setFType] = useState("");
  const [fStatus, setFStatus] = useState(statusFilter ?? "");
  const [creating, setCreating] = useState(false);
  const [reviewingItem, setReviewingItem] = useState<LeaveItem | null>(null);
  const [detailItem, setDetailItem] = useState<LeaveItem | null>(null);

  const leaves = initialLeaves;
  const totalPages = Math.max(1, Math.ceil(totalInView / pageSize));

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

  function openReview(item: LeaveItem, defaultStatus?: "APPROVED" | "REJECTED") {
    setDetailItem(null);
    setReviewingItem(item);
    setPendingReviewStatus(defaultStatus ?? "APPROVED");
  }

  const [pendingReviewStatus, setPendingReviewStatus] = useState<"APPROVED" | "REJECTED">("APPROVED");

  // Client-side filter on search + type
  const filtered = useMemo(() => {
    let list = leaves;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(l => l.employee.fullName.toLowerCase().includes(q) || (l.reason ?? "").toLowerCase().includes(q));
    }
    if (fType) list = list.filter(l => l.type === fType);
    if (fStatus && fStatus !== "ALL") list = list.filter(l => l.status === fStatus);
    return list;
  }, [leaves, search, fType, fStatus]);

  // Balance: compute from all leaves
  const balData = useMemo(() => {
    const map = new Map<number, { emp: Employee; used: number; pending: number }>();
    for (const l of leaves) {
      if (!map.has(l.employee.id)) map.set(l.employee.id, { emp: l.employee, used: 0, pending: 0 });
      const e = map.get(l.employee.id)!;
      if (l.status === "APPROVED") e.used += Number(l.requestedHours) / 8;
      if (l.status === "PENDING") e.pending += Number(l.requestedHours) / 8;
    }
    // Include employees with no leaves
    for (const emp of employees) {
      if (!map.has(emp.id)) map.set(emp.id, { emp, used: 0, pending: 0 });
    }
    const TOTAL = 12;
    return Array.from(map.values()).map(e => ({
      emp: e.emp, used: Math.round(e.used * 10) / 10,
      pending: Math.round(e.pending * 10) / 10,
      total: TOTAL, remain: Math.max(0, TOTAL - e.used - e.pending),
    })).sort((a, b) => a.emp.fullName.localeCompare(b.emp.fullName, "vi"));
  }, [leaves, employees]);

  // Team calendar
  const daysInMonth = new Date(viewedYear, viewedMonth, 0).getDate();
  const calLeaveMap = useMemo(() => {
    const m = new Map<string, Map<number, string>>(); // day -> empId -> type
    for (const l of leaves) {
      if (l.status !== "APPROVED") continue;
      const day = parseInt(l.date.slice(8));
      const mo = parseInt(l.date.slice(5, 7));
      if (mo !== viewedMonth) continue;
      const key = String(day);
      if (!m.has(key)) m.set(key, new Map());
      m.get(key)!.set(l.employee.id, l.type);
    }
    return m;
  }, [leaves, viewedMonth]);

  const shiftLabel = (s: string) => ({ FULL_DAY: "Cả ngày", MORNING: "Sáng", AFTERNOON: "Chiều" }[s] ?? s);
  const statusCls = (s: string) => ({ PENDING: "ls-pending", APPROVED: "ls-approved", REJECTED: "ls-rejected" }[s] ?? "ls-cancelled");
  const statusLbl = (s: string) => ({ PENDING: "Chờ duyệt", APPROVED: "Đã duyệt", REJECTED: "Từ chối" }[s] ?? s);

  const typeLbl = (t: string) => TYPE_LBL[t] ?? (LEAVE_TYPES[t]?.label ?? t);
  const typeCls = (t: string) => TYPE_CLS[t] ?? "lt-unpaid";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />

      {/* Scrim for detail panel */}
      <div className={`lv-scrim${detailItem ? " on" : ""}`} onClick={() => setDetailItem(null)} />

      {/* Page head */}
      <div className="page-head" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1>Nghỉ phép</h1>
          <p>Quản lý đơn xin nghỉ phép, số ngày phép và lịch nghỉ của team.</p>
        </div>
        <button className="abtn primary" onClick={() => setCreating(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" width="14" height="14"><path d="M12 5v14M5 12h14" /></svg>
          Tạo đơn nghỉ phép
        </button>
      </div>

      {/* Stats */}
      <div className="lv-stats">
        {[
          { c: "#f59e0b", ico: <><path d="M9 11l3 3 8-8" strokeLinecap="round" /><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" strokeLinecap="round" /></>, v: kpis.pendingCount, l: "Chờ duyệt", d: "Cần xử lý", dc: kpis.pendingCount > 0 ? "warn" : "" },
          { c: "#22c55e", ico: <path d="M5 12l5 5L20 6" strokeLinecap="round" />, v: kpis.approvedMonthCount, l: "Đã duyệt tháng này", d: `${kpis.approvedMonthHours}h`, dc: "ok" },
          { c: "#3B5BDB", ico: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" /></>, v: kpis.onLeaveToday, l: "Đang nghỉ hôm nay", d: "thành viên", dc: kpis.onLeaveToday > 0 ? "warn" : "" },
          { c: "#7c3aed", ico: <><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeLinecap="round" /><path d="M16 4a3 3 0 0 1 0 6M21 20a5 5 0 0 0-4-5" strokeLinecap="round" /></>, v: employees.length || 1, l: "Thành viên", d: "", dc: "" },
        ].map((s, i) => (
          <div key={i} className="lv-stat">
            <span className="lsi" style={{ background: `${s.c}22`, color: s.c }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">{s.ico}</svg>
            </span>
            <div>
              <div className="lsv">{s.v}</div>
              <div className="lsl">{s.l}</div>
              <div className={`lsd${s.dc ? ` ${s.dc}` : ""}`}>{s.d}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="lv-tabs">
        {([["requests", "Đơn nghỉ phép"], ["balance", "Số dư phép"], ["calendar", "Lịch nghỉ tháng"]] as [TabKey, string][]).map(([k, l]) => (
          <button key={k} className={`lv-tab${tab === k ? " on" : ""}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {/* ── Tab: Requests ── */}
      {tab === "requests" && (
        <>
          <div className="filter-bar">
            <div className="fb-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
              <input placeholder="Tìm nhân viên…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="fb-sel" value={fType} onChange={e => setFType(e.target.value)}>
              <option value="">Tất cả loại</option>
              <option value="ANNUAL">Phép năm</option>
              <option value="SICK">Nghỉ ốm</option>
              <option value="MARRIAGE">Nghỉ cưới</option>
              <option value="UNPAID">Không lương</option>
              <option value="COMPENSATE">Bù công</option>
              <option value="MATERNITY">Thai sản</option>
            </select>
            <select className="fb-sel" value={fStatus} onChange={e => { setFStatus(e.target.value); go({ status: e.target.value || null, page: 1 }); }}>
              <option value="">Mọi trạng thái</option>
              <option value="PENDING">Chờ duyệt</option>
              <option value="APPROVED">Đã duyệt</option>
              <option value="REJECTED">Từ chối</option>
            </select>
            <div className="mn-nav">
              <button type="button" className="mn-btn2" onClick={() => changeMonth(-1)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <span className="mn-lbl2">T{pad(viewedMonth)}/{viewedYear}</span>
              <button type="button" className="mn-btn2" onClick={() => changeMonth(1)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: ".78rem", color: "var(--text-3)" }}>{filtered.length} đơn</span>
            <button className="abtn ghost" style={{ height: 36, fontSize: ".8rem" }} onClick={() => { setSearch(""); setFType(""); setFStatus(""); go({ status: null, page: 1 }); }}>Xóa lọc</button>
          </div>

          <div className="lp">
            {filtered.length === 0 ? (
              <div className="lv-empty">Không có đơn nghỉ nào.</div>
            ) : (
              <table className="lv-table">
                <thead>
                  <tr>
                    <th>Nhân viên</th><th>Loại phép</th><th>Ngày</th><th>Ca</th>
                    <th>Giờ</th><th>Lý do</th><th>Trạng thái</th><th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(l => {
                    const col = AVCOLORS[colorIdx(l.employee.fullName)];
                    const ini = initials(l.employee.fullName);
                    const canReview = isManager && l.status === "PENDING";
                    const canCancel = l.status === "PENDING" && (isManager || l.employee.id === currentUserId);
                    return (
                      <tr key={l.id} onClick={() => setDetailItem(l)}>
                        <td>
                          <div className="lv-av">
                            <span className="av-s" style={{ background: col }}>{ini}</span>
                            <div>
                              <div style={{ fontWeight: 600, color: "var(--text)", fontSize: ".86rem" }}>{l.employee.fullName}</div>
                              {l.employee.department && <div style={{ fontSize: ".74rem", color: "var(--text-3)" }}>{l.employee.department}</div>}
                            </div>
                          </div>
                        </td>
                        <td><span className={`lv-type ${typeCls(l.type)}`}>{typeLbl(l.type)}</span></td>
                        <td style={{ fontFamily: "var(--font-mono)", fontSize: ".8rem" }}>{fmtDate(l.date)}</td>
                        <td style={{ fontSize: ".8rem" }}>{shiftLabel(l.shiftType)}</td>
                        <td className="lv-days">{Number(l.requestedHours)}h</td>
                        <td style={{ maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.reason ?? "—"}</td>
                        <td><span className={`lv-status ${statusCls(l.status)}`}>{statusLbl(l.status)}</span></td>
                        <td onClick={e => e.stopPropagation()}>
                          <div className="lv-actions">
                            {canReview && (<>
                              <button className="lv-btn approve" onClick={() => openReview(l, "APPROVED")}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" width="11" height="11"><path d="M5 12l5 5L20 6" /></svg>
                                Duyệt
                              </button>
                              <button className="lv-btn reject" onClick={() => openReview(l, "REJECTED")}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" width="11" height="11"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                Từ chối
                              </button>
                            </>)}
                            {!canReview && <button className="lv-btn view" onClick={() => setDetailItem(l)}>Chi tiết</button>}
                            {canCancel && (
                              <button className="lv-btn reject" onClick={() => handleDelete(l.id)}>Hủy</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, padding: "10px 14px", background: "var(--elev)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)" }}>
              <span style={{ fontSize: ".8rem", color: "var(--text-3)" }}>
                <b style={{ color: "var(--text)", fontFamily: "var(--font-mono)" }}>{(viewedPage - 1) * pageSize + 1}</b>–
                <b style={{ color: "var(--text)", fontFamily: "var(--font-mono)" }}>{Math.min(viewedPage * pageSize, totalInView)}</b> / {totalInView}
              </span>
              <div style={{ display: "inline-flex", gap: 4 }}>
                <button className="mn-btn2" disabled={viewedPage <= 1} onClick={() => go({ page: viewedPage - 1 })}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
                </button>
                <span className="mn-lbl2" style={{ minWidth: 60 }}>{viewedPage} / {totalPages}</span>
                <button className="mn-btn2" disabled={viewedPage >= totalPages} onClick={() => go({ page: viewedPage + 1 })}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Tab: Balance ── */}
      {tab === "balance" && (
        <div className="lp">
          <div className="lp-head">
            <h3>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
              Số dư ngày phép {viewedYear} — từng nhân viên
            </h3>
          </div>
          {balData.length === 0 ? (
            <div className="lv-empty">Không có dữ liệu.</div>
          ) : (
            <div className="bal-list">
              {balData.map(b => {
                const col = AVCOLORS[colorIdx(b.emp.fullName)];
                return (
                  <div key={b.emp.id} className="bal-row">
                    <span className="bal-av" style={{ background: col }}>{initials(b.emp.fullName)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="bal-name">{b.emp.fullName}</div>
                      <div className="bal-role">{b.emp.department ?? ""}</div>
                    </div>
                    <div className="bal-types">
                      <div className="bal-chip"><span className="bc-v">{b.remain}</span><span className="bc-l">Còn lại</span></div>
                      <div className="bal-chip"><span className="bc-v" style={{ color: "var(--ok)" }}>{b.used}</span><span className="bc-l">Đã dùng</span></div>
                      <div className="bal-chip"><span className="bc-v" style={{ color: "var(--warn)" }}>{b.pending}</span><span className="bc-l">Đang xin</span></div>
                      <div className="bal-chip"><span className="bc-v" style={{ color: "var(--text-3)" }}>{b.total}</span><span className="bc-l">Tổng</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Calendar ── */}
      {tab === "calendar" && (
        <div className="lp">
          <div className="lp-head">
            <h3>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
              Lịch nghỉ team — Tháng {pad(viewedMonth)}/{viewedYear}
            </h3>
            <div style={{ display: "flex", gap: 6, fontSize: ".78rem", flexWrap: "wrap" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: "var(--accent-soft)", display: "inline-block", border: "1px solid var(--accent-soft-2)" }} />Phép năm</span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: "rgba(239,68,68,.12)", display: "inline-block" }} />Nghỉ ốm / khác</span>
            </div>
          </div>
          <div style={{ padding: 18, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600, fontSize: ".8rem" }}>
              <thead>
                <tr>
                  <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: "1px solid var(--border)", background: "var(--content)", fontWeight: 700 }}>Thành viên</th>
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
                    const wd = new Date(viewedYear, viewedMonth - 1, d).getDay();
                    const isWE = wd === 0 || wd === 6;
                    return (
                      <th key={d} style={{ padding: "6px 3px", textAlign: "center", borderBottom: "1px solid var(--border)", background: isWE ? "color-mix(in srgb,var(--accent-soft) 50%,var(--content))" : "var(--content)", fontFamily: "var(--font-mono)", fontSize: ".64rem", fontWeight: 600, color: "var(--text-3)", minWidth: 26 }}>{d}</th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {(employees.length > 0 ? employees : leaves.map(l => l.employee).filter((e, i, a) => a.findIndex(x => x.id === e.id) === i)).map(emp => {
                  const col = AVCOLORS[colorIdx(emp.fullName)];
                  return (
                    <tr key={emp.id}>
                      <td style={{ padding: "9px 10px", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 24, height: 24, borderRadius: 6, background: col, display: "grid", placeItems: "center", fontSize: ".58rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>{initials(emp.fullName)}</span>
                          <span style={{ fontWeight: 600, fontSize: ".83rem" }}>{emp.fullName.split(" ").slice(-1)[0]}</span>
                        </div>
                      </td>
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
                        const wd = new Date(viewedYear, viewedMonth - 1, d).getDay();
                        const isWE = wd === 0 || wd === 6;
                        const lType = calLeaveMap.get(String(d))?.get(emp.id);
                        const isAnnual = lType === "ANNUAL";
                        const bg = lType ? (isAnnual ? "var(--accent-soft)" : "rgba(239,68,68,.12)") : undefined;
                        const clr = lType ? (isAnnual ? "var(--accent-ink)" : "#ef4444") : undefined;
                        return (
                          <td key={d} style={{ padding: "4px 2px", textAlign: "center", borderBottom: "1px solid var(--border)", background: isWE ? "color-mix(in srgb,var(--accent-soft) 30%,transparent)" : "transparent" }}>
                            {lType && <div style={{ background: bg, color: clr, borderRadius: 5, width: 22, height: 22, display: "grid", placeItems: "center", fontWeight: 800, fontSize: ".68rem", margin: "0 auto" }}>P</div>}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Detail slide panel ── */}
      <aside className={`lv-detail${detailItem ? " open" : ""}`}>
        {detailItem && (() => {
          const l = detailItem;
          const col = AVCOLORS[colorIdx(l.employee.fullName)];
          return (
            <>
              <div className="ld-head">
                <span className={`lv-type ${typeCls(l.type)}`} style={{ padding: "5px 12px" }}>{typeLbl(l.type)}</span>
                <div style={{ marginLeft: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: ".92rem" }}>{l.employee.fullName}</div>
                  <div style={{ fontSize: ".76rem", color: "var(--text-3)" }}>#{l.id}</div>
                </div>
                <button onClick={() => setDetailItem(null)} style={{ marginLeft: "auto", width: 30, height: 30, borderRadius: 8, display: "grid", placeItems: "center", color: "var(--text-3)", border: "none", background: "transparent", cursor: "pointer" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="ld-body">
                <div>
                  <div className="ld-sect-h">Thông tin đơn</div>
                  {[
                    ["Nhân viên", <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ width: 26, height: 26, borderRadius: 7, background: col, display: "grid", placeItems: "center", fontSize: ".58rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>{initials(l.employee.fullName)}</span><span>{l.employee.fullName}</span></div>],
                    ["Loại phép", <span className={`lv-type ${typeCls(l.type)}`}>{typeLbl(l.type)}</span>],
                    ["Ngày nghỉ", <span style={{ fontFamily: "var(--font-mono)" }}>{fmtDate(l.date)}</span>],
                    ["Ca", shiftLabel(l.shiftType)],
                    ["Số giờ", <span style={{ fontFamily: "var(--font-mono)", fontSize: "1.1rem" }}>{Number(l.requestedHours)}h</span>],
                    ["Lý do", l.reason ?? "—"],
                    ["Người duyệt", l.approver?.fullName ?? "—"],
                    ["Trạng thái", <span className={`lv-status ${statusCls(l.status)}`}>{statusLbl(l.status)}</span>],
                  ].map(([label, val], i) => (
                    <div key={i} className="ld-row">
                      <span className="ll">{label}</span>
                      <span className="lv" style={{ textAlign: "right" }}>{val as any}</span>
                    </div>
                  ))}
                  {l.approvalNote && (
                    <div className="ld-row">
                      <span className="ll">Ghi chú</span>
                      <span className="lv" style={{ color: l.status === "REJECTED" ? "var(--danger)" : "var(--ok)" }}>{l.approvalNote}</span>
                    </div>
                  )}
                </div>
                {l.status === "PENDING" && isManager && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button className="abtn primary" style={{ height: 32, fontSize: ".8rem" }} onClick={() => openReview(l, "APPROVED")}>✓ Duyệt đơn</button>
                    <button className="abtn ghost" style={{ height: 32, fontSize: ".8rem", color: "var(--danger)", borderColor: "var(--danger-soft)" }} onClick={() => openReview(l, "REJECTED")}>✗ Từ chối</button>
                  </div>
                )}
              </div>
            </>
          );
        })()}
      </aside>

      {creating && (
        <LeaveFormModal item={null} employees={employees} isManager={isManager} currentUserId={currentUserId}
          onClose={() => setCreating(false)} onSaved={() => { setCreating(false); router.refresh(); }} />
      )}
      {reviewingItem && (
        <LeaveReviewModal item={reviewingItem} defaultStatus={pendingReviewStatus} onClose={() => setReviewingItem(null)}
          onSaved={() => { setReviewingItem(null); router.refresh(); }} />
      )}
    </>
  );
}
