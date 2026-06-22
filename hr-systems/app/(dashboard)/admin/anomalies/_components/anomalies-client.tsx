"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "@/lib/hooks/use-toast";

// ── Types ─────────────────────────────────────────────────────

type Severity = "INFO" | "WARNING" | "CRITICAL";
type Status = "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "DISMISSED";

interface Alert {
  id: number;
  type: string;
  severity: Severity;
  status: Status;
  title: string;
  description: string;
  metadata: Record<string, unknown> | null;
  auditLogId: number | null;
  sessionId: string | null;
  apiAccessLogId: string | null;
  notes: string | null;
  createdAt: string;
  acknowledgedAt: string | null;
  employee: { id: number; fullName: string; avatarUrl: string | null } | null;
  acknowledgedBy: { id: number; fullName: string } | null;
}

interface ListResponse {
  data: Alert[];
  total: number;
  page: number;
  totalPages: number;
  byStatus: Record<string, number>;
}

// ── Meta ──────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  UNUSUAL_IP: "IP lạ",
  OFF_HOURS_VAULT: "Vault ngoài giờ",
  BULK_DELETE: "Xoá hàng loạt",
  TIMELOG_OVER_ESTIMATE: "Vượt estimate",
  FAILED_API_SPIKE: "Spike lỗi API",
  LATE_LOGIN: "Login trễ",
  NO_ACTIVITY_LONG: "Không hoạt động lâu",
  CONCURRENT_SESSIONS: "Session đồng thời",
};

const SEVERITY_TO_VISUAL: Record<Severity, "critical" | "high" | "info"> = {
  CRITICAL: "critical",
  WARNING: "high",
  INFO: "info",
};

const SEV_VISUAL_LABEL: Record<"critical" | "high" | "info", string> = {
  critical: "Critical",
  high: "High",
  info: "Info",
};

const STATUS_VISUAL: Record<Status, "open" | "investigating" | "resolved" | "ignored"> = {
  OPEN: "open",
  ACKNOWLEDGED: "investigating",
  RESOLVED: "resolved",
  DISMISSED: "ignored",
};

const STATUS_LABEL: Record<"open" | "investigating" | "resolved" | "ignored", string> = {
  open: "Đang mở",
  investigating: "Đang điều tra",
  resolved: "Đã giải quyết",
  ignored: "Đã bỏ qua",
};

const SEV_COLOR: Record<"critical" | "high" | "info", string> = {
  critical: "#ef4444",
  high: "#f59e0b",
  info: "#3B5BDB",
};

// SVG paths per severity
const SEV_ICON: Record<"critical" | "high" | "info", React.ReactNode> = {
  critical: <><path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z"/><path d="M12 8v4M12 16h.01" strokeLinecap="round"/></>,
  high:     <><path d="M10.3 3.9l-7 12A2 2 0 0 0 5 19h14a2 2 0 0 0 1.7-3l-7-12a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01" strokeLinecap="round"/></>,
  info:     <><circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01" strokeLinecap="round"/></>,
};

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
  const d = new Date(iso);
  return `${fmtDate(iso)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

// ── Main client ───────────────────────────────────────────────

export function AnomaliesClient({ canRefresh }: { canRefresh: boolean }) {
  const [status, setStatus] = useState<string>("");
  const [severity, setSeverity] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [openId, setOpenId] = useState<number | null>(null);
  const [drawerNote, setDrawerNote] = useState("");

  const query = useMemo(() => {
    const sp = new URLSearchParams();
    if (status) sp.set("status", status);
    if (severity) sp.set("severity", severity);
    if (type) sp.set("type", type);
    sp.set("page", String(page));
    sp.set("limit", "100");
    return sp.toString();
  }, [status, severity, type, page]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/anomalies?${query}`)
      .then((r) => r.json())
      .then((j: ListResponse) => setData(j))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [query]);

  useEffect(() => { setPage(1); }, [status, severity, type]);

  async function runRefresh() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/anomalies/refresh?hours=24", { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        const r2 = await fetch(`/api/admin/anomalies?${query}`);
        setData(await r2.json());
        toast({ variant: "success", title: "Quét hoàn tất", description: `${json.data.created} alert mới · ${json.data.skipped} đã tồn tại` });
      } else {
        toast({ variant: "error", title: "Lỗi quét", description: json.error });
      }
    } finally { setRefreshing(false); }
  }

  async function changeStatus(id: number, newStatus: Status, notes?: string) {
    const res = await fetch(`/api/admin/anomalies/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, notes }),
    });
    if (res.ok) {
      const j = await res.json();
      setData((prev) => prev ? {
        ...prev,
        data: prev.data.map((a) => (a.id === id ? { ...a, ...j.data } : a)),
        byStatus: recountByStatus(prev.data.map((a) => (a.id === id ? { ...a, ...j.data } : a))),
      } : prev);
    } else {
      const j = await res.json().catch(() => ({}));
      toast({ variant: "error", title: "Không cập nhật được", description: j.error });
    }
  }

  async function resolveAllOpen() {
    if (!data) return;
    const open = data.data.filter((a) => a.status === "OPEN");
    if (open.length === 0) {
      toast({ title: "Không có cảnh báo nào đang mở" });
      return;
    }
    if (!confirm(`Giải quyết tất cả ${open.length} cảnh báo đang mở?`)) return;
    await Promise.all(open.map((a) => changeStatus(a.id, "RESOLVED")));
  }

  // ── Filter (client-side search) ──
  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data.data;
    return data.data.filter((a) =>
      a.title.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      (a.employee?.fullName.toLowerCase().includes(q) ?? false)
    );
  }, [data, search]);

  // ── Group by status ──
  const grouped = useMemo(() => {
    const order: Status[] = ["OPEN", "ACKNOWLEDGED", "RESOLVED", "DISMISSED"];
    const out: { status: Status; items: Alert[] }[] = [];
    for (const s of order) {
      const items = filtered.filter((a) => a.status === s);
      if (items.length > 0) out.push({ status: s, items });
    }
    return out;
  }, [filtered]);

  // ── Stats ──
  const stats = useMemo(() => {
    const all = data?.data ?? [];
    const open = all.filter((a) => a.status === "OPEN").length;
    const critical = all.filter((a) => a.severity === "CRITICAL").length;
    const investigating = all.filter((a) => a.status === "ACKNOWLEDGED").length;
    const resolved = all.filter((a) => a.status === "RESOLVED").length;
    return { open, critical, investigating, resolved };
  }, [data]);

  function clearFilters() {
    setStatus(""); setSeverity(""); setType(""); setSearch("");
  }

  const total = filtered.length;
  const selected = openId ? data?.data.find((a) => a.id === openId) : null;
  useEffect(() => { setDrawerNote(selected?.notes ?? ""); }, [selected]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />

      {/* Page head */}
      <div className="page-head" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 22 }}>
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: 10 }}>
            Anomaly Alerts <span className="live-dot" title="Phát hiện realtime" />
          </h1>
          <p>Phát hiện hành động bất thường trong workspace — đăng nhập lạ, truy cập ngoài giờ, hành động rủi ro cao.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="abtn ghost" style={{ gap: 7 }} onClick={resolveAllOpen} disabled={stats.open === 0}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" width="14" height="14"><path d="M5 12l5 5L20 6"/></svg>
            Giải quyết tất cả
          </button>
          {canRefresh && (
            <button className="abtn primary" style={{ gap: 7 }} onClick={runRefresh} disabled={refreshing}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.5 9A9 9 0 0 1 20.5 15M20.5 15A9 9 0 0 1 3.5 9"/></svg>
              {refreshing ? "Đang quét…" : "Quét lại (24h)"}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="an-stats">
        {[
          { c: "#dc2626", v: stats.open,          l: "Đang mở",         svg: <><path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z"/><path d="M12 8v4M12 16h.01" strokeLinecap="round"/></> },
          { c: "#ef4444", v: stats.critical,      l: "Critical",        svg: <><path d="M10.3 3.9l-7 12A2 2 0 0 0 5 19h14a2 2 0 0 0 1.7-3l-7-12a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01" strokeLinecap="round"/></> },
          { c: "#f59e0b", v: stats.investigating, l: "Đang điều tra",  svg: <><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01" strokeLinecap="round"/></> },
          { c: "#22c55e", v: stats.resolved,      l: "Đã giải quyết",  svg: <path d="M5 12l5 5L20 6" strokeLinecap="round" strokeLinejoin="round"/> },
        ].map((s, i) => (
          <div key={i} className="an-stat">
            <span className="ani" style={{ background: `${s.c}22`, color: s.c }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{s.svg}</svg>
            </span>
            <div>
              <div className="anv">{loading ? "…" : s.v}</div>
              <div className="anl">{s.l}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="fb-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
          <input type="text" placeholder="Tìm cảnh báo, thành viên…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="fb-sel" value={severity} onChange={(e) => setSeverity(e.target.value)}>
          <option value="">Mọi mức độ</option>
          <option value="CRITICAL">Critical</option>
          <option value="WARNING">Warning</option>
          <option value="INFO">Info</option>
        </select>
        <select className="fb-sel" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Mọi trạng thái</option>
          <option value="OPEN">Đang mở</option>
          <option value="ACKNOWLEDGED">Đang điều tra</option>
          <option value="RESOLVED">Đã giải quyết</option>
          <option value="DISMISSED">Đã bỏ qua</option>
        </select>
        <select className="fb-sel" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Mọi loại</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: ".78rem", color: "var(--text-3)" }}>{total} cảnh báo</span>
        <button className="abtn ghost" style={{ height: 36, fontSize: ".8rem" }} onClick={clearFilters}>Xoá lọc</button>
      </div>

      {/* Alert list */}
      <div>
        {loading ? (
          <div style={{ textAlign: "center", padding: 48, color: "var(--text-3)" }}>Đang tải…</div>
        ) : grouped.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48, color: "var(--text-3)", fontSize: ".88rem" }}>
            Không có cảnh báo nào — hệ thống bình thường.
          </div>
        ) : grouped.map((sec) => {
          const v = STATUS_VISUAL[sec.status];
          return (
            <div key={sec.status} className="alert-section">
              <div className="alert-section-h">
                <span className={`ac-status st-${v}`}>{STATUS_LABEL[v]}</span>
                <span style={{ color: "var(--text-3)" }}>{sec.items.length}</span>
              </div>
              {sec.items.map((a) => (
                <AlertCardRow
                  key={a.id}
                  alert={a}
                  selected={openId === a.id}
                  onOpen={() => setOpenId(a.id)}
                  onChange={changeStatus}
                />
              ))}
            </div>
          );
        })}
      </div>

      {selected && (
        <>
          <div className="scrim on" onClick={() => setOpenId(null)} />
          <aside className="an-detail open">
            <DrawerHeader alert={selected} onClose={() => setOpenId(null)} />
            <div className="and-body">
              <div>
                <div className="ad-sect-h">Chi tiết cảnh báo</div>
                <div className="ad-row"><span className="lbl">ID</span><span className="val mono">#{selected.id}</span></div>
                <div className="ad-row"><span className="lbl">Loại</span><span className="val">{TYPE_LABELS[selected.type] ?? selected.type}</span></div>
                <div className="ad-row"><span className="lbl">Mức độ</span><span className="val"><span className={`sev sev-${SEVERITY_TO_VISUAL[selected.severity]}`}>{SEV_VISUAL_LABEL[SEVERITY_TO_VISUAL[selected.severity]]}</span></span></div>
                <div className="ad-row"><span className="lbl">Thời gian</span><span className="val mono">{fmtFull(selected.createdAt)}</span></div>
              </div>

              {selected.employee && (
                <div>
                  <div className="ad-sect-h">Người liên quan</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    <span style={{ width: 40, height: 40, borderRadius: 12, background: avColor(selected.employee.id), display: "grid", placeItems: "center", fontSize: ".88rem", fontWeight: 700, color: "#fff" }}>
                      {initials(selected.employee.fullName)}
                    </span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: ".92rem", color: "var(--text)" }}>{selected.employee.fullName}</div>
                      <div style={{ fontSize: ".74rem", color: "var(--text-3)" }}>id={selected.employee.id}</div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <div className="ad-sect-h">Mô tả</div>
                <p style={{ fontSize: ".86rem", color: "var(--text-2)", lineHeight: 1.5, margin: 0 }}>{selected.description}</p>
              </div>

              {selected.metadata && Object.keys(selected.metadata).length > 0 && (
                <div>
                  <div className="ad-sect-h">Metadata</div>
                  <pre className="ad-payload">{JSON.stringify(selected.metadata, null, 2)}</pre>
                </div>
              )}

              <div>
                <div className="ad-sect-h">Timeline điều tra</div>
                <div className="inv-timeline">
                  <div className="it-item">
                    <div className="it-dot" style={{ background: "#ef4444" }} />
                    <div className="it-content">
                      <div className="it-title">Phát hiện tự động</div>
                      <div className="it-sub">Hệ thống · {fmtTime(selected.createdAt)}</div>
                    </div>
                    <div className="it-time">{fmtDate(selected.createdAt)}</div>
                  </div>
                  {selected.acknowledgedAt && (
                    <div className="it-item">
                      <div className="it-dot" style={{ background: "#f59e0b" }} />
                      <div className="it-content">
                        <div className="it-title">Bắt đầu điều tra</div>
                        <div className="it-sub">{selected.acknowledgedBy?.fullName ?? "—"}</div>
                      </div>
                      <div className="it-time">{fmtDate(selected.acknowledgedAt)} · {fmtTime(selected.acknowledgedAt)}</div>
                    </div>
                  )}
                  {selected.status === "RESOLVED" && selected.acknowledgedAt && (
                    <div className="it-item">
                      <div className="it-dot" style={{ background: "#22c55e" }} />
                      <div className="it-content">
                        <div className="it-title">Đã giải quyết</div>
                        <div className="it-sub">{selected.acknowledgedBy?.fullName ?? "—"}</div>
                      </div>
                    </div>
                  )}
                  {selected.status === "DISMISSED" && (
                    <div className="it-item">
                      <div className="it-dot" style={{ background: "var(--text-3)" }} />
                      <div className="it-content">
                        <div className="it-title">Đã bỏ qua</div>
                        <div className="it-sub">{selected.acknowledgedBy?.fullName ?? "—"}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="ad-sect-h">Ghi chú điều tra</div>
                <div className="comment-box">
                  <textarea
                    placeholder="Thêm ghi chú về sự kiện này…"
                    value={drawerNote}
                    onChange={(e) => setDrawerNote(e.target.value)}
                  />
                  <div className="cb-foot">
                    <button
                      className="abtn primary"
                      style={{ height: 30, fontSize: ".8rem", gap: 6 }}
                      onClick={() => changeStatus(selected.id, selected.status, drawerNote)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" width="12" height="12"><path d="M5 12l5 5L20 6"/></svg>
                      Lưu
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {selected.status === "OPEN" && (
                  <button className="abtn primary" style={{ height: 32, fontSize: ".8rem" }} onClick={() => changeStatus(selected.id, "ACKNOWLEDGED", drawerNote || undefined)}>
                    Bắt đầu điều tra
                  </button>
                )}
                {selected.status !== "RESOLVED" && (
                  <button className="abtn ghost" style={{ height: 32, fontSize: ".8rem", color: "var(--ok)", borderColor: "rgba(34,197,94,.3)", gap: 6 }} onClick={() => changeStatus(selected.id, "RESOLVED", drawerNote || undefined)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" width="12" height="12"><path d="M5 12l5 5L20 6"/></svg>
                    Đánh dấu giải quyết
                  </button>
                )}
                {selected.status !== "DISMISSED" && (
                  <button className="abtn ghost" style={{ height: 32, fontSize: ".8rem" }} onClick={() => changeStatus(selected.id, "DISMISSED", drawerNote || undefined)}>
                    Bỏ qua
                  </button>
                )}
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
}

function recountByStatus(list: Alert[]): Record<string, number> {
  const c: Record<string, number> = { OPEN: 0, ACKNOWLEDGED: 0, RESOLVED: 0, DISMISSED: 0 };
  for (const a of list) c[a.status] = (c[a.status] ?? 0) + 1;
  return c;
}

// ── Drawer header ─────────────────────────────────────────────

function DrawerHeader({ alert, onClose }: { alert: Alert; onClose: () => void }) {
  const sv = SEVERITY_TO_VISUAL[alert.severity];
  const stv = STATUS_VISUAL[alert.status];
  return (
    <div className="and-head">
      <div className="ac-ico" style={{ width: 36, height: 36, borderRadius: 10, background: `${SEV_COLOR[sv]}22`, color: SEV_COLOR[sv] }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{SEV_ICON[sv]}</svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: ".95rem", color: "var(--text)" }}>{alert.title}</div>
        <div style={{ display: "flex", gap: 7, marginTop: 4 }}>
          <span className={`sev sev-${sv}`}>{SEV_VISUAL_LABEL[sv]}</span>
          <span className={`ac-status st-${stv}`}>{STATUS_LABEL[stv]}</span>
        </div>
      </div>
      <button className="and-close" onClick={onClose} aria-label="Đóng">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
  );
}

// ── Alert card row ────────────────────────────────────────────

function AlertCardRow({
  alert, selected, onOpen, onChange,
}: {
  alert: Alert;
  selected: boolean;
  onOpen: () => void;
  onChange: (id: number, status: Status, notes?: string) => void;
}) {
  const sv = SEVERITY_TO_VISUAL[alert.severity];
  const stv = STATUS_VISUAL[alert.status];
  const isMuted = alert.status === "RESOLVED" || alert.status === "DISMISSED";
  const sc = SEV_COLOR[sv];

  return (
    <div className={`alert-card${selected ? " selected" : ""}${isMuted ? " resolved" : ""}`} onClick={onOpen}>
      <div className={`sev-bar ${sv}`} />
      <div className="ac-ico" style={{ background: `${sc}22`, color: sc }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{SEV_ICON[sv]}</svg>
      </div>
      <div className="ac-body">
        <div className="ac-top">
          <span className={`sev sev-${sv}`}>{SEV_VISUAL_LABEL[sv]}</span>
          <span className="ac-title">{alert.title}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: ".7rem", color: "var(--text-3)", padding: "1px 7px", background: "var(--content)", borderRadius: 99, border: "1px solid var(--border)" }}>
            {TYPE_LABELS[alert.type] ?? alert.type}
          </span>
        </div>
        <div className="ac-desc">{alert.description}</div>
        <div className="ac-meta">
          {alert.employee && (
            <span className="ac-meta-item">
              <span className="av-xs" style={{ background: avColor(alert.employee.id) }}>{initials(alert.employee.fullName)}</span>
              {alert.employee.fullName}
            </span>
          )}
          <span className="ac-meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
            {fmtTime(alert.createdAt)}
          </span>
        </div>

        {(alert.status === "OPEN" || alert.status === "ACKNOWLEDGED") && (
          <div className="ac-actions" onClick={(e) => e.stopPropagation()}>
            {alert.status === "OPEN" && (
              <button className="ac-btn inv" onClick={() => onChange(alert.id, "ACKNOWLEDGED")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
                Điều tra
              </button>
            )}
            <button className="ac-btn resolve" onClick={() => onChange(alert.id, "RESOLVED")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 6"/></svg>
              Giải quyết
            </button>
            <button className="ac-btn ignore" onClick={() => onChange(alert.id, "DISMISSED")}>Bỏ qua</button>
          </div>
        )}
      </div>
      <div className="ac-right">
        <span className="ac-time">{fmtDate(alert.createdAt)}<br />{fmtTime(alert.createdAt)}</span>
        <span className={`ac-status st-${stv}`}>{STATUS_LABEL[stv]}</span>
      </div>
    </div>
  );
}

// ── Style ─────────────────────────────────────────────────────

const STYLE = `
.an-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px}
.an-stat{background:var(--elev);border:1px solid var(--border);border-radius:var(--r-lg);padding:14px 16px;display:flex;align-items:center;gap:12px}
.an-stat .ani{width:38px;height:38px;border-radius:10px;display:grid;place-items:center;flex-shrink:0}
.an-stat .ani svg{width:17px;height:17px}
.an-stat .anv{font-size:1.5rem;font-weight:800;letter-spacing:-.02em;color:var(--text);line-height:1.1}
.an-stat .anl{font-size:.78rem;color:var(--text-3);margin-top:3px}

.filter-bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding:12px 14px;background:var(--elev);border:1px solid var(--border);border-radius:var(--r-lg);margin-bottom:16px}
.fb-sel{background:var(--content);border:1px solid var(--border-2);border-radius:9px;padding:7px 12px;font-family:inherit;font-size:.83rem;color:var(--text);outline:none;transition:border-color .15s;cursor:pointer;height:38px}
.fb-sel:focus{border-color:var(--accent)}
.fb-search{display:flex;align-items:center;gap:8px;background:var(--content);border:1.5px solid var(--border-2);border-radius:9px;padding:0 12px;height:38px;flex:1;min-width:180px;transition:border-color .15s,box-shadow .15s}
.fb-search:focus-within{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.fb-search svg{width:14px;height:14px;color:var(--text-3);flex-shrink:0}
.fb-search input{background:none;border:none;outline:none;font-family:inherit;font-size:.84rem;color:var(--text);width:100%}

.sev{display:inline-flex;align-items:center;gap:5px;font-family:var(--font-mono);font-size:.66rem;font-weight:700;padding:3px 9px;border-radius:99px;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap}
.sev-critical{background:rgba(239,68,68,.14);color:#ef4444;border:1px solid rgba(239,68,68,.25)}
.sev-high{background:rgba(245,158,11,.12);color:#f59e0b;border:1px solid rgba(245,158,11,.22)}
.sev-info{background:var(--accent-soft);color:var(--accent-ink);border:1px solid var(--accent-soft-2)}

.alert-section{margin-bottom:20px}
.alert-section-h{display:flex;align-items:center;gap:8px;margin-bottom:10px;font-size:.78rem;font-family:var(--font-mono);font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--text-3)}

.alert-card{background:var(--elev);border:1px solid var(--border);border-radius:var(--r-lg);padding:16px 18px 16px 22px;margin-bottom:10px;display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:start;cursor:pointer;transition:border-color .15s,box-shadow .15s,transform .15s;position:relative}
.alert-card:hover{border-color:var(--border-2);transform:translateY(-1px)}
.alert-card.resolved{opacity:.55}
.alert-card.selected{border-color:var(--accent);background:var(--accent-soft)}

.sev-bar{width:4px;height:100%;border-radius:99px;position:absolute;left:0;top:0;bottom:0}
.sev-bar.critical{background:#ef4444}
.sev-bar.high{background:#f59e0b}
.sev-bar.info{background:var(--accent)}

.ac-ico{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;flex-shrink:0;margin-top:1px}
.ac-ico svg{width:18px;height:18px}
.ac-body{min-width:0}
.ac-top{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:6px}
.ac-title{font-weight:700;font-size:.92rem;color:var(--text)}
.ac-desc{font-size:.84rem;color:var(--text-2);line-height:1.45;margin-bottom:8px}
.ac-meta{display:flex;align-items:center;gap:12px;flex-wrap:wrap;font-size:.74rem;color:var(--text-3);font-family:var(--font-mono)}
.ac-meta .av-xs{width:20px;height:20px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:.56rem;font-weight:700;color:#fff;flex-shrink:0}
.ac-meta-item{display:flex;align-items:center;gap:5px}
.ac-meta-item svg{width:12px;height:12px}
.ac-right{display:flex;flex-direction:column;align-items:flex-end;gap:8px;flex-shrink:0}
.ac-time{font-family:var(--font-mono);font-size:.7rem;color:var(--text-3);white-space:nowrap;text-align:right;line-height:1.4}
.ac-status{display:inline-flex;align-items:center;gap:5px;font-family:var(--font-mono);font-size:.66rem;font-weight:600;padding:3px 9px;border-radius:99px;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap}
.st-open{background:var(--danger-soft);color:var(--danger)}
.st-investigating{background:var(--warn-soft);color:var(--warn)}
.st-resolved{background:var(--ok-soft);color:var(--ok)}
.st-ignored{background:var(--border);color:var(--text-3)}

.ac-actions{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}
.ac-btn{height:26px;padding:0 10px;border-radius:7px;font-size:.74rem;font-weight:600;display:inline-flex;align-items:center;gap:5px;transition:background .12s,color .12s;cursor:pointer;font-family:inherit;border:1px solid;background:none}
.ac-btn.resolve{background:var(--ok-soft);color:var(--ok);border-color:rgba(34,197,94,.25)}
.ac-btn.resolve:hover{background:rgba(34,197,94,.2)}
.ac-btn.inv{background:var(--warn-soft);color:var(--warn);border-color:rgba(217,119,6,.22)}
.ac-btn.inv:hover{background:rgba(217,119,6,.2)}
.ac-btn.ignore{background:var(--border);color:var(--text-3);border-color:var(--border-2)}
.ac-btn.ignore:hover{background:var(--border-2);color:var(--text)}
.ac-btn svg{width:11px;height:11px}

.an-detail{position:fixed;top:0;right:0;bottom:0;width:460px;max-width:94vw;background:var(--elev);border-left:1px solid var(--border-2);display:flex;flex-direction:column;z-index:101;transform:translateX(110%);transition:transform .32s cubic-bezier(.22,1,.36,1);box-shadow:-30px 0 60px rgba(0,0,0,.45)}
.an-detail.open{transform:translateX(0)}
.and-head{display:flex;align-items:center;gap:12px;padding:15px 17px;border-bottom:1px solid var(--border);flex-shrink:0}
.and-close{width:30px;height:30px;border-radius:8px;display:grid;place-items:center;color:var(--text-3);margin-left:auto;border:none;background:none;cursor:pointer;font-family:inherit}
.and-close:hover{background:var(--content);color:var(--text)}
.and-body{flex:1;overflow-y:auto;padding:18px;display:flex;flex-direction:column;gap:18px}
.ad-sect-h{font-family:var(--font-mono);font-size:.65rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--text-3);margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid var(--border)}
.ad-row{display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;border-bottom:1px solid var(--border);font-size:.85rem;gap:16px}
.ad-row:last-child{border-bottom:none}
.ad-row .lbl{color:var(--text-3);flex-shrink:0;width:110px;font-size:.78rem}
.ad-row .val{color:var(--text);font-weight:500;text-align:right;word-break:break-all}
.ad-row .val.mono{font-family:var(--font-mono);font-size:.82rem}
.ad-payload{background:var(--content);border:1px solid var(--border);border-radius:10px;padding:13px;font-family:var(--font-mono);font-size:.74rem;color:var(--text-2);line-height:1.6;white-space:pre-wrap;word-break:break-all;max-height:240px;overflow-y:auto;margin:0}

.inv-timeline{display:flex;flex-direction:column;gap:0}
.it-item{display:flex;gap:12px;padding:10px 0;border-bottom:1px dashed var(--border);align-items:flex-start}
.it-item:last-child{border-bottom:none}
.it-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;margin-top:5px}
.it-content{flex:1;min-width:0}
.it-content .it-title{font-size:.84rem;font-weight:500;color:var(--text)}
.it-content .it-sub{font-size:.72rem;color:var(--text-3);margin-top:2px}
.it-time{font-family:var(--font-mono);font-size:.7rem;color:var(--text-3);margin-left:auto;white-space:nowrap;flex-shrink:0}

@keyframes pulseDot{0%,100%{opacity:1}50%{opacity:.4}}
.live-dot{width:8px;height:8px;border-radius:50%;background:var(--danger);display:inline-block;animation:pulseDot 1.6s ease-in-out infinite}

.comment-box{background:var(--content);border:1.5px solid var(--border-2);border-radius:10px;padding:10px 12px}
.comment-box textarea{width:100%;background:none;border:none;outline:none;font-family:inherit;font-size:.84rem;color:var(--text);resize:none;min-height:58px}
.comment-box textarea::placeholder{color:var(--text-3)}
.comment-box .cb-foot{display:flex;justify-content:flex-end;margin-top:6px}

.scrim{position:fixed;inset:0;background:rgba(4,8,18,.6);backdrop-filter:blur(3px);z-index:100;opacity:0;pointer-events:none;transition:opacity .22s}
.scrim.on{opacity:1;pointer-events:auto}

@media(max-width:900px){.an-stats{grid-template-columns:1fr 1fr}.an-detail{width:100vw}.alert-card{grid-template-columns:auto 1fr}}
`;
