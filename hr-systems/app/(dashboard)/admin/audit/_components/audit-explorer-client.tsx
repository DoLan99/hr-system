"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────

interface Employee { id: number; fullName: string; department: string | null }

interface AuditRow {
  id: number;
  tableName: string;
  recordId: number | null;
  action: string;
  changedAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  sessionId: string | null;
  requestId: string | null;
  endpoint: string | null;
  method: string | null;
  oldData: unknown;
  newData: unknown;
  changedBy: { id: number; fullName: string; avatarUrl: string | null } | null;
}

interface AuditResponse {
  data: AuditRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  byAction?: Record<string, number>;
}

interface Props { employees: Employee[]; currentUserId: number }

// ── Helpers ───────────────────────────────────────────────────

const AVCOLORS = ["#3B5BDB", "#2196f3", "#7c3aed", "#0891b2", "#059669", "#d97706", "#dc2626", "#0f766e", "#b45309", "#1d4ed8", "#6d28d9", "#be185d"];

function initials(name: string): string {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}
function avColor(id: number): string {
  return AVCOLORS[Math.abs(id) % AVCOLORS.length];
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}
function fmtFull(iso: string): string {
  return `${fmtDate(iso)} ${String(new Date(iso).getHours()).padStart(2, "0")}:${String(new Date(iso).getMinutes()).padStart(2, "0")}:${String(new Date(iso).getSeconds()).padStart(2, "0")}`;
}

const ACTION_LABEL: Record<string, string> = {
  CREATE: "Tạo mới", UPDATE: "Cập nhật", DELETE: "Xoá",
  INSERT: "Tạo mới", APPROVE: "Duyệt", REJECT: "Từ chối",
  LOGIN: "Đăng nhập", LOGOUT: "Đăng xuất", VIEW: "Xem", EXPORT: "Export",
};
function actionLabel(a: string): string {
  return ACTION_LABEL[a.toUpperCase()] ?? a;
}
function actionClass(a: string): string {
  const k = a.toLowerCase();
  if (k === "create" || k === "insert" || k === "approve") return "ac-create";
  if (k === "update") return "ac-update";
  if (k === "delete" || k === "reject") return "ac-delete";
  if (k === "login") return "ac-login";
  if (k === "logout") return "ac-logout";
  if (k === "view") return "ac-view";
  if (k === "export") return "ac-export";
  return "ac-update";
}

const TABLE_LABEL: Record<string, string> = {
  task: "Tasks", time_log: "Time Logs", employee: "Nhân sự", customer: "Khách hàng",
  message: "Tin nhắn", inventory_item: "Kho", inventory_transaction: "Kho",
  leave: "Nghỉ phép", payment: "Lương", performance_review: "Đánh giá",
  password_vault: "Vault", department: "Phòng ban", team: "Team", role: "Phân quyền",
  workflow_template: "Workflow", system_label: "Hệ thống", office_time: "Chấm công",
};
function tableLabel(t: string): string {
  return TABLE_LABEL[t] ?? t.replace(/_/g, " ");
}

const TABLE_OPTIONS = [
  "Employee", "Role", "Department", "Team",
  "Task", "TaskTemplate", "TimeLog", "OfficeTime",
  "Customer", "Leave", "Payment", "SalarySummary",
  "PasswordVault", "WorkRule", "SystemLabel",
  "TemplateSuggestion", "EstimateFlag",
];

// ── Main client ───────────────────────────────────────────────

export function AuditExplorerClient({ employees, currentUserId }: Props) {
  const [employeeId, setEmployeeId] = useState<number | "">("");
  const [tableName, setTableName] = useState("");
  const [action, setAction] = useState("");
  const [search, setSearch] = useState("");
  const [days, setDays] = useState<string>("7");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState<AuditRow | null>(null);

  const { from, to } = useMemo(() => {
    if (days === "all") return { from: "", to: "" };
    const now = new Date();
    const f = new Date(now);
    if (days === "today") {
      f.setHours(0, 0, 0, 0);
    } else {
      f.setDate(f.getDate() - Number(days));
    }
    return { from: f.toISOString(), to: "" };
  }, [days]);

  const queryString = useMemo(() => {
    const sp = new URLSearchParams();
    if (employeeId) sp.set("employeeId", String(employeeId));
    if (tableName) sp.set("tableName", tableName);
    if (action) sp.set("action", action);
    if (from) sp.set("from", from);
    if (to) sp.set("to", to);
    sp.set("page", String(page));
    sp.set("limit", "50");
    return sp.toString();
  }, [employeeId, tableName, action, from, to, page]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/audit?${queryString}`)
      .then((r) => r.json())
      .then((j) => setData(j))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [queryString]);

  useEffect(() => { setPage(1); }, [employeeId, tableName, action, from, to]);

  function downloadCsv() {
    const sp = new URLSearchParams();
    if (employeeId) sp.set("employeeId", String(employeeId));
    if (tableName) sp.set("tableName", tableName);
    if (action) sp.set("action", action);
    if (from) sp.set("from", from);
    if (to) sp.set("to", to);
    window.location.href = `/api/admin/audit/export?${sp.toString()}`;
  }

  function clearFilters() {
    setEmployeeId(""); setTableName(""); setAction(""); setSearch(""); setDays("7"); setPage(1);
  }

  // Client-side filter by search (table label + actor name + endpoint)
  const filteredRows = useMemo(() => {
    if (!search.trim() || !data) return data?.data ?? [];
    const q = search.toLowerCase();
    return data.data.filter((r) => {
      const actor = r.changedBy?.fullName.toLowerCase() ?? "";
      const tbl = tableLabel(r.tableName).toLowerCase();
      const ep = r.endpoint?.toLowerCase() ?? "";
      return actor.includes(q) || tbl.includes(q) || ep.includes(q) || r.tableName.toLowerCase().includes(q);
    });
  }, [data, search]);

  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const byAction = data?.byAction ?? {};
  const creates = (byAction.CREATE ?? 0) + (byAction.INSERT ?? 0);
  const updates = byAction.UPDATE ?? 0;
  const deletes = byAction.DELETE ?? 0;

  const start = (page - 1) * 50;
  const end = Math.min(start + (data?.data.length ?? 0), total);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />

      {/* Page head */}
      <div className="page-head" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 22 }}>
        <div>
          <h1>Audit Log</h1>
          <p>Toàn bộ hành động trong hệ thống — ai làm gì, khi nào, ở đâu.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/admin/audit/timeline" className="abtn ghost" style={{ gap: 7 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
            Timeline
          </Link>
          <button className="abtn ghost" style={{ gap: 7 }} onClick={downloadCsv}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="al-stats">
        {[
          { c: "#3B5BDB", v: total.toLocaleString("vi-VN"), l: "Tổng sự kiện",   svg: <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z"/> },
          { c: "#059669", v: creates.toLocaleString("vi-VN"), l: "Tạo mới",       svg: <path d="M12 5v14M5 12h14" strokeLinecap="round"/> },
          { c: "#0891b2", v: updates.toLocaleString("vi-VN"), l: "Cập nhật",      svg: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/></> },
          { c: "#dc2626", v: deletes.toLocaleString("vi-VN"), l: "Xoá dữ liệu",   svg: <><path d="M3 6h18M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></> },
        ].map((s, i) => (
          <div key={i} className="al-stat">
            <span className="asi" style={{ background: `${s.c}22`, color: s.c }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{s.svg}</svg>
            </span>
            <div>
              <div className="asv">{loading ? "…" : s.v}</div>
              <div className="asl">{s.l}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="fb-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
          <input type="text" placeholder="Tìm người dùng, hành động, đối tượng…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="fb-select" value={tableName} onChange={(e) => setTableName(e.target.value)}>
          <option value="">Tất cả module</option>
          {TABLE_OPTIONS.map((tn) => <option key={tn} value={tn}>{tn}</option>)}
        </select>
        <select className="fb-select" value={action} onChange={(e) => setAction(e.target.value)}>
          <option value="">Tất cả hành động</option>
          <option value="CREATE">Tạo mới</option>
          <option value="UPDATE">Cập nhật</option>
          <option value="DELETE">Xoá</option>
        </select>
        <select className="fb-select" value={String(employeeId)} onChange={(e) => setEmployeeId(e.target.value ? Number(e.target.value) : "")}>
          <option value="">Tất cả thành viên</option>
          <option value={currentUserId}>(Tôi)</option>
          {employees.filter((e) => e.id !== currentUserId).map((emp) => (
            <option key={emp.id} value={emp.id}>{emp.fullName}</option>
          ))}
        </select>
        <select className="fb-select" value={days} onChange={(e) => setDays(e.target.value)}>
          <option value="today">Hôm nay</option>
          <option value="7">7 ngày qua</option>
          <option value="30">30 ngày qua</option>
          <option value="90">90 ngày qua</option>
          <option value="all">Tất cả</option>
        </select>
        <span className="fb-count">{total.toLocaleString("vi-VN")} sự kiện</span>
        <button className="abtn ghost" style={{ height: 36, fontSize: ".8rem" }} onClick={clearFilters}>Xoá lọc</button>
      </div>

      {/* Table */}
      <div className="audit-wrap">
        <table className="audit-table">
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Người dùng</th>
              <th>Hành động</th>
              <th>Đối tượng</th>
              <th>Module</th>
              <th>IP</th>
              <th>Endpoint</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: 48, color: "var(--text-3)" }}>Đang tải…</td></tr>
            ) : filteredRows.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: 48, color: "var(--text-3)" }}>Không có log nào khớp.</td></tr>
            ) : filteredRows.map((r) => (
              <tr key={r.id} className={selectedRow?.id === r.id ? "selected" : ""} onClick={() => setSelectedRow(r)}>
                <td>
                  <span className="at-time">{fmtTime(r.changedAt)}</span>
                  <span className="at-date">{fmtDate(r.changedAt)}</span>
                </td>
                <td>
                  <div className="at-user">
                    <span className="at-av" style={{ background: avColor(r.changedBy?.id ?? 0) }}>{initials(r.changedBy?.fullName ?? "?")}</span>
                    <span className="at-uname">{r.changedBy?.fullName ?? "—"}</span>
                  </div>
                </td>
                <td>
                  <span className={`at-action-chip ${actionClass(r.action)}`}>{actionLabel(r.action)}</span>
                </td>
                <td style={{ maxWidth: 260, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--text)" }}>
                  <code style={{ fontFamily: "var(--font-mono)", fontSize: ".78rem" }}>{r.tableName}{r.recordId ? ` #${r.recordId}` : ""}</code>
                </td>
                <td><span className="at-module">{tableLabel(r.tableName)}</span></td>
                <td><span className="at-ip">{r.ipAddress ?? "—"}</span></td>
                <td>
                  <code style={{ fontFamily: "var(--font-mono)", fontSize: ".72rem", color: "var(--text-3)" }}>
                    {r.method ?? ""} {r.endpoint ?? "—"}
                  </code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pager */}
        {total > 0 && (
          <div className="pager">
            <span className="pager-info">{(start + 1).toLocaleString("vi-VN")}–{end.toLocaleString("vi-VN")} / {total.toLocaleString("vi-VN")} sự kiện</span>
            <div className="pager-btns">
              <button className="pg nav" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading} aria-label="Trước">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              {renderPagerNumbers(page, totalPages, setPage)}
              <button className="pg nav" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages || loading} aria-label="Sau">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selectedRow && (
        <DetailDrawer row={selectedRow} onClose={() => setSelectedRow(null)} />
      )}
    </>
  );
}

function renderPagerNumbers(page: number, totalPages: number, setPage: (n: number) => void) {
  const out: React.ReactNode[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
      out.push(
        <button key={i} className={`pg${i === page ? " on" : ""}`} onClick={() => setPage(i)}>{i}</button>
      );
    } else if (Math.abs(i - page) === 2) {
      out.push(<span key={`e${i}`} className="pg" style={{ pointerEvents: "none", opacity: .4 }}>…</span>);
    }
  }
  return out;
}

// ── Detail drawer ─────────────────────────────────────────────

function DetailDrawer({ row, onClose }: { row: AuditRow; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div className="scrim on" onClick={onClose} />
      <aside className="audit-detail open" role="dialog" aria-label="Chi tiết hành động">
        <div className="ad-head">
          <h3>{actionLabel(row.action)}</h3>
          <button className="ad-close" onClick={onClose} aria-label="Đóng">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="ad-body">
          <div>
            <div className="ad-sect-h">Tổng quan sự kiện</div>
            <div className="ad-row"><span className="lbl">ID</span><span className="val mono">#{row.id}</span></div>
            <div className="ad-row"><span className="lbl">Thời gian</span><span className="val mono">{fmtFull(row.changedAt)}</span></div>
            <div className="ad-row"><span className="lbl">Hành động</span><span className="val"><span className={`at-action-chip ${actionClass(row.action)}`}>{actionLabel(row.action)}</span></span></div>
            <div className="ad-row"><span className="lbl">Module</span><span className="val"><span className="at-module">{tableLabel(row.tableName)}</span></span></div>
            <div className="ad-row"><span className="lbl">Bảng</span><span className="val mono">{row.tableName}{row.recordId ? ` #${row.recordId}` : ""}</span></div>
          </div>

          <div>
            <div className="ad-sect-h">Người thực hiện</div>
            {row.changedBy ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <span style={{ width: 42, height: 42, borderRadius: 12, background: avColor(row.changedBy.id), display: "grid", placeItems: "center", fontSize: ".9rem", fontWeight: 700, color: "#fff" }}>
                  {initials(row.changedBy.fullName)}
                </span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: ".95rem", color: "var(--text)" }}>{row.changedBy.fullName}</div>
                  <div style={{ fontSize: ".76rem", color: "var(--text-3)" }}>id={row.changedBy.id}</div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: ".84rem", color: "var(--text-3)", marginBottom: 12 }}>Hệ thống</div>
            )}
            <div className="ad-row"><span className="lbl">IP</span><span className="val mono">{row.ipAddress ?? "—"}</span></div>
            <div className="ad-row"><span className="lbl">Endpoint</span><span className="val mono" style={{ fontSize: ".78rem" }}>{row.method ?? ""} {row.endpoint ?? "—"}</span></div>
            <div className="ad-row"><span className="lbl">Session</span><span className="val mono" style={{ fontSize: ".74rem" }}>{row.sessionId ?? "—"}</span></div>
            <div className="ad-row"><span className="lbl">Request</span><span className="val mono" style={{ fontSize: ".74rem" }}>{row.requestId ?? "—"}</span></div>
            {row.userAgent && (
              <div className="ad-row"><span className="lbl">User-Agent</span><span className="val" style={{ fontSize: ".74rem", wordBreak: "break-all" }}>{row.userAgent}</span></div>
            )}
          </div>

          {row.oldData != null && (
            <div>
              <div className="ad-sect-h">Trước thay đổi</div>
              <pre className="ad-payload">{JSON.stringify(row.oldData, null, 2)}</pre>
            </div>
          )}

          {row.newData != null && (
            <div>
              <div className="ad-sect-h">Sau thay đổi</div>
              <pre className="ad-payload">{JSON.stringify(row.newData, null, 2)}</pre>
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="abtn ghost"
              style={{ height: 32, fontSize: ".8rem", gap: 6 }}
              onClick={() => {
                const payload = { id: row.id, action: row.action, tableName: row.tableName, recordId: row.recordId, changedAt: row.changedAt, oldData: row.oldData, newData: row.newData };
                navigator.clipboard?.writeText(JSON.stringify(payload, null, 2));
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Copy JSON
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

// ── Style ─────────────────────────────────────────────────────

const STYLE = `
.al-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px}
.al-stat{background:var(--elev);border:1px solid var(--border);border-radius:var(--r-lg);padding:14px 16px;display:flex;align-items:center;gap:12px}
.al-stat .asi{width:38px;height:38px;border-radius:10px;display:grid;place-items:center;flex-shrink:0}
.al-stat .asi svg{width:17px;height:17px}
.al-stat .asv{font-size:1.4rem;font-weight:800;letter-spacing:-.02em;color:var(--text);line-height:1.1}
.al-stat .asl{font-size:.78rem;color:var(--text-3);margin-top:3px}

.filter-bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding:14px 16px;background:var(--elev);border:1px solid var(--border);border-radius:var(--r-lg);margin-bottom:16px}
.fb-select{background:var(--content);border:1px solid var(--border-2);border-radius:9px;padding:7px 12px;font-family:inherit;font-size:.83rem;color:var(--text);outline:none;transition:border-color .15s;cursor:pointer}
.fb-select:focus{border-color:var(--accent)}
.fb-search{display:flex;align-items:center;gap:8px;background:var(--content);border:1.5px solid var(--border-2);border-radius:9px;padding:0 12px;height:38px;flex:1;min-width:220px;transition:border-color .15s,box-shadow .15s}
.fb-search:focus-within{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.fb-search svg{width:14px;height:14px;color:var(--text-3);flex-shrink:0}
.fb-search input{background:none;border:none;outline:none;font-family:inherit;font-size:.84rem;color:var(--text);width:100%}
.fb-search input::placeholder{color:var(--text-3)}
.fb-count{font-family:var(--font-mono);font-size:.78rem;color:var(--text-3)}

.audit-wrap{background:var(--elev);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden}
.audit-table{width:100%;border-collapse:collapse;font-size:.84rem}
.audit-table thead th{text-align:left;padding:10px 14px;font-family:var(--font-mono);font-size:.64rem;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--text-3);border-bottom:1px solid var(--border);background:var(--content);white-space:nowrap;user-select:none}
.audit-table td{padding:11px 14px;border-bottom:1px solid var(--border);vertical-align:middle;color:var(--text-2)}
.audit-table tbody tr{cursor:pointer;transition:background .12s}
.audit-table tbody tr:last-child td{border-bottom:none}
.audit-table tbody tr:hover{background:var(--content)}
.audit-table tbody tr.selected{background:var(--accent-soft)}

.at-time{font-family:var(--font-mono);font-size:.78rem;white-space:nowrap;color:var(--text)}
.at-date{font-size:.68rem;color:var(--text-3);display:block;margin-top:1px;font-family:var(--font-mono)}
.at-user{display:flex;align-items:center;gap:8px}
.at-av{width:26px;height:26px;border-radius:7px;display:grid;place-items:center;font-size:.6rem;font-weight:700;color:#fff;flex-shrink:0}
.at-uname{font-weight:600;font-size:.84rem;color:var(--text);white-space:nowrap}
.at-action-chip{display:inline-flex;align-items:center;gap:5px;font-family:var(--font-mono);font-size:.66rem;font-weight:700;padding:3px 9px;border-radius:99px;white-space:nowrap;text-transform:uppercase;letter-spacing:.04em}
.ac-create{background:rgba(34,197,94,.12);color:#22c55e}
.ac-update{background:var(--accent-soft);color:var(--accent-ink)}
.ac-delete{background:var(--danger-soft);color:var(--danger)}
.ac-login{background:var(--ok-soft);color:var(--ok)}
.ac-logout{background:var(--border);color:var(--text-3)}
.ac-view{background:rgba(8,145,178,.12);color:#0891b2}
.ac-export{background:rgba(217,119,6,.12);color:#d97706}
.at-module{display:inline-flex;align-items:center;gap:5px;font-size:.74rem;font-weight:500;padding:2px 9px;border-radius:99px;background:var(--content);color:var(--text-2);border:1px solid var(--border);white-space:nowrap}
.at-ip{font-family:var(--font-mono);font-size:.72rem;color:var(--text-3)}

.audit-detail{position:fixed;top:0;right:0;bottom:0;width:460px;max-width:94vw;background:var(--elev);border-left:1px solid var(--border-2);display:flex;flex-direction:column;z-index:101;transform:translateX(110%);transition:transform .3s cubic-bezier(.22,1,.36,1);box-shadow:-30px 0 60px rgba(0,0,0,.45)}
.audit-detail.open{transform:translateX(0)}
.ad-head{display:flex;align-items:center;gap:12px;padding:16px 18px;border-bottom:1px solid var(--border);flex-shrink:0}
.ad-head h3{font-size:.96rem;font-weight:700;margin:0;color:var(--text)}
.ad-close{width:30px;height:30px;border-radius:8px;display:grid;place-items:center;color:var(--text-3);margin-left:auto;border:none;background:none;cursor:pointer;font-family:inherit}
.ad-close:hover{background:var(--content);color:var(--text)}
.ad-body{flex:1;overflow-y:auto;padding:18px;display:flex;flex-direction:column;gap:18px}
.ad-sect-h{font-family:var(--font-mono);font-size:.65rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--text-3);margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid var(--border)}
.ad-row{display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;border-bottom:1px solid var(--border);font-size:.85rem;gap:16px}
.ad-row:last-child{border-bottom:none}
.ad-row .lbl{color:var(--text-3);flex-shrink:0;width:110px;font-size:.78rem}
.ad-row .val{color:var(--text);font-weight:500;text-align:right;word-break:break-all}
.ad-row .val.mono{font-family:var(--font-mono);font-size:.82rem}
.ad-payload{background:var(--content);border:1px solid var(--border);border-radius:10px;padding:13px;font-family:var(--font-mono);font-size:.74rem;color:var(--text-2);line-height:1.6;white-space:pre-wrap;word-break:break-all;max-height:240px;overflow-y:auto;margin:0}

.pager{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;border-top:1px solid var(--border);flex-wrap:wrap}
.pager-info{font-size:.78rem;color:var(--text-3);font-family:var(--font-mono)}
.pager-btns{display:flex;gap:4px}
.pg{width:32px;height:32px;border-radius:8px;display:grid;place-items:center;font-size:.78rem;font-weight:600;color:var(--text-2);border:1px solid var(--border);background:var(--content);cursor:pointer;transition:all .12s;font-family:inherit}
.pg:hover:not(:disabled){border-color:var(--accent);color:var(--accent-ink)}
.pg:disabled{opacity:.3;cursor:not-allowed}
.pg.on{background:var(--accent);border-color:var(--accent);color:#fff}
.pg.nav svg{width:14px;height:14px}

.scrim{position:fixed;inset:0;background:rgba(4,8,18,.6);backdrop-filter:blur(3px);z-index:100;opacity:0;pointer-events:none;transition:opacity .22s}
.scrim.on{opacity:1;pointer-events:auto}

@media(max-width:900px){.al-stats{grid-template-columns:1fr 1fr}.audit-detail{width:100vw}.audit-table th:nth-child(5),.audit-table td:nth-child(5),.audit-table th:nth-child(7),.audit-table td:nth-child(7){display:none}}
@media(max-width:600px){.al-stats{grid-template-columns:1fr 1fr}}
`;
