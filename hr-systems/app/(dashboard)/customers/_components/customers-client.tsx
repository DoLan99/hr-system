"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/contexts/current-user-context";
import { useLocale } from "@/lib/i18n/context";
import { CustomerFormModal } from "./customer-form-modal";
import { CustomerDetailDrawer } from "./customer-detail-drawer";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];

interface Employee { id: number; fullName: string }
interface CustomerItem {
  id: number;
  customerName?: string | null;
  businessName?: string | null;
  custId?: string | null;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  website?: string | null;
  status: string;
  responsibleStaffId?: number | null;
  notes?: string | null;
  responsibleStaff?: { id: number; fullName: string } | null;
  _count?: { tasks: number };
}

interface Props {
  initialCustomers: CustomerItem[];
  employees: Employee[];
}

const GRADIENTS = [
  "linear-gradient(135deg,#3B5BDB,#5275e6)",
  "linear-gradient(135deg,#a78bfa,#8b5cf6)",
  "linear-gradient(135deg,#4ADE80,#16a34a)",
  "linear-gradient(135deg,#fbbf24,#d97706)",
  "linear-gradient(135deg,#f472b6,#db2777)",
  "linear-gradient(135deg,#22d3ee,#0891b2)",
];

const STATUS_META: Record<string, { cls: string; bg: string; color: string }> = {
  ACTIVE:   { cls: "active",   bg: "var(--ok-soft)",     color: "var(--ok)" },
  PROSPECT: { cls: "prospect", bg: "var(--accent-soft)", color: "var(--accent-ink)" },
  INACTIVE: { cls: "inactive", bg: "var(--border)",      color: "var(--text-3)" },
};

function initials(name: string) {
  return name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
}

function gradFor(i: number) {
  return GRADIENTS[i % GRADIENTS.length];
}

export function CustomersClient({ initialCustomers, employees }: Props) {
  const user = useCurrentUser();
  const { t } = useLocale();
  const router = useRouter();
  const isManager = MANAGER_ROLES.includes(user.role.name);

  const [customers, setCustomers] = useState<CustomerItem[]>(initialCustomers);
  const [search, setSearch] = useState("");
  const [segTab, setSegTab] = useState("ALL");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [creating, setCreating] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerItem | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<{ id: number; gradient: string } | null>(null);

  function openDetail(c: CustomerItem, idx: number) {
    setViewingCustomer({ id: c.id, gradient: gradFor(idx) });
  }

  const filtered = useMemo(() => customers.filter(c => {
    if (segTab !== "ALL" && c.status !== segTab) return false;
    if (search) {
      const q = search.toLowerCase();
      return (c.customerName?.toLowerCase().includes(q) ?? false) ||
        (c.businessName?.toLowerCase().includes(q) ?? false) ||
        (c.custId?.toLowerCase().includes(q) ?? false) ||
        (c.contactPerson?.toLowerCase().includes(q) ?? false) ||
        (c.phone?.includes(q) ?? false);
    }
    return true;
  }), [customers, search, segTab]);

  function upsert(c: CustomerItem) {
    setCustomers(prev => {
      const idx = prev.findIndex(x => x.id === c.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = c; return next; }
      return [c, ...prev];
    });
  }

  const counts = useMemo(() => ({
    ALL: customers.length,
    ACTIVE: customers.filter(c => c.status === "ACTIVE").length,
    PROSPECT: customers.filter(c => c.status === "PROSPECT").length,
    INACTIVE: customers.filter(c => c.status === "INACTIVE").length,
  }), [customers]);

  const totalTasks = useMemo(
    () => customers.reduce((s, c) => s + (c._count?.tasks ?? 0), 0),
    [customers]
  );

  const tabs: { k: string; l: string }[] = [
    { k: "ALL",      l: t("common.all") || "Tất cả" },
    { k: "ACTIVE",   l: t("customerStatus.ACTIVE") || "Đang dùng" },
    { k: "PROSPECT", l: t("customerStatus.PROSPECT") || "Tiềm năng" },
    { k: "INACTIVE", l: t("customerStatus.INACTIVE") || "Ngừng" },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .cust-bar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:20px 0 18px}
        .seg-tabs{display:flex;gap:4px;flex-wrap:wrap}
        .seg-tab{height:34px;padding:0 14px;border-radius:99px;border:1.5px solid var(--border);background:var(--elev);font-size:.82rem;font-weight:600;color:var(--text-2);cursor:pointer;font-family:inherit;transition:all .15s;display:inline-flex;align-items:center;gap:7px;white-space:nowrap}
        .seg-tab:hover{border-color:var(--border-2);color:var(--text)}
        .seg-tab.on{border-color:var(--accent);background:var(--accent-soft);color:var(--accent-ink)}
        .seg-tab .tcnt{font-family:var(--font-mono);font-size:.64rem;padding:1px 6px;border-radius:99px;background:rgba(255,255,255,.07)}
        .seg-tab.on .tcnt{background:var(--accent-soft-2)}
        .cust-search{display:flex;align-items:center;gap:8px;height:34px;padding:0 12px;background:var(--elev);border:1px solid var(--border);border-radius:9px;color:var(--text-3);min-width:200px}
        .cust-search svg{width:14px;height:14px;flex-shrink:0}
        .cust-search input{background:none;border:none;outline:none;font-family:inherit;font-size:.82rem;color:var(--text);width:100%}
        .cust-search input::placeholder{color:var(--text-3)}
        .view-toggle{display:inline-flex;background:var(--elev);border:1px solid var(--border);border-radius:9px;padding:3px;gap:2px}
        .view-toggle button{width:32px;height:30px;border-radius:6px;display:grid;place-items:center;color:var(--text-3);border:none;background:none;cursor:pointer;font-family:inherit;transition:background .15s,color .15s}
        .view-toggle button svg{width:16px;height:16px}
        .view-toggle button.on{background:var(--accent-soft);color:var(--accent-ink)}

        .cust-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
        @media(max-width:1100px){.cust-grid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:680px){.cust-grid{grid-template-columns:1fr}}
        .cust-card{background:var(--elev);border:1.5px solid var(--border);border-radius:var(--r-lg);padding:18px;cursor:pointer;transition:border-color .18s var(--ease),transform .18s var(--ease),box-shadow .15s;position:relative;overflow:hidden;display:flex;flex-direction:column;gap:14px}
        .cust-card:hover{border-color:var(--accent);transform:translateY(-3px);box-shadow:0 12px 36px rgba(0,0,50,.32)}
        .cust-card.inactive{opacity:.62}
        .cust-card-top{display:flex;align-items:flex-start;gap:12px}
        .cust-logo{width:46px;height:46px;border-radius:12px;display:grid;place-items:center;font-weight:800;font-size:1.05rem;color:#fff;flex-shrink:0;letter-spacing:.02em}
        .cust-name{font-size:.95rem;font-weight:700;color:var(--text);line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
        .cust-ind{font-size:.74rem;color:var(--text-3);font-family:var(--font-mono);margin-top:3px;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden}
        .status-badge{display:inline-flex;align-items:center;gap:5px;font-family:var(--font-mono);font-size:.64rem;font-weight:700;padding:3px 9px;border-radius:99px;white-space:nowrap;text-transform:uppercase;letter-spacing:.04em}
        .cust-rows{display:flex;flex-direction:column;gap:7px}
        .cust-rowi{display:flex;align-items:center;gap:8px;font-size:.8rem;color:var(--text-2);min-width:0}
        .cust-rowi svg{width:13px;height:13px;color:var(--text-3);flex-shrink:0}
        .cust-rowi a{color:var(--accent-ink);text-decoration:none}
        .cust-rowi a:hover{text-decoration:underline}
        .cust-rowi .trunc{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;flex:1}
        .cust-foot{display:flex;align-items:center;gap:10px;padding-top:12px;border-top:1px solid var(--border);font-size:.74rem;color:var(--text-3)}
        .cust-foot .csm{display:inline-flex;align-items:center;gap:6px;font-size:.76rem;color:var(--text-2)}
        .cust-foot .csm-av{width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,#8b7bff,#4f7aff);display:grid;place-items:center;color:#fff;font-size:.6rem;font-weight:700;flex-shrink:0}
        .cust-foot .tasks{margin-left:auto;font-family:var(--font-mono);font-weight:700;color:var(--text-2)}
        .edit-btn{position:absolute;top:14px;right:14px;width:28px;height:28px;border-radius:7px;border:1px solid transparent;background:transparent;color:var(--text-3);cursor:pointer;display:grid;place-items:center;transition:all .15s;font-family:inherit}
        .cust-card:hover .edit-btn{border-color:var(--border);background:var(--content)}
        .edit-btn:hover{color:var(--text);border-color:var(--border-2)!important}
        .edit-btn svg{width:13px;height:13px}

        .cust-table-wrap{background:var(--elev);border:1px solid var(--border);border-radius:var(--r-lg);overflow-x:auto}
        .cust-table{width:100%;border-collapse:collapse;min-width:760px}
        .cust-table th{text-align:left;padding:11px 16px;font-family:var(--font-mono);font-size:.64rem;text-transform:uppercase;letter-spacing:.05em;color:var(--text-3);font-weight:600;background:var(--content);border-bottom:1px solid var(--border);white-space:nowrap}
        .cust-table th.r,.cust-table td.r{text-align:right}
        .cust-table td{padding:13px 16px;border-bottom:1px solid var(--border);vertical-align:middle;white-space:nowrap;font-size:.84rem;color:var(--text-2)}
        .cust-table tbody tr:last-child td{border-bottom:none}
        .cust-table tbody tr{transition:background .12s}
        .cust-table tbody tr:hover{background:var(--content)}
        .cust-table .name-cell{font-size:.87rem;font-weight:600;color:var(--text)}
        .cust-table .sub-cell{font-size:.72rem;color:var(--text-3);font-family:var(--font-mono);margin-top:2px}

        .empty-state{text-align:center;padding:50px 20px;color:var(--text-3);background:var(--elev);border:1px solid var(--border);border-radius:var(--r-lg)}
      ` }} />

      {/* Page head */}
      <div className="page-head" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"16px", flexWrap:"wrap", marginBottom:"22px" }}>
        <div>
          <h1>{t("customers.title") || "Customers"}</h1>
          <p>
            <b>{counts.ALL}</b> khách hàng · <b>{counts.ACTIVE}</b> đang dùng · <b>{counts.PROSPECT}</b> tiềm năng
          </p>
        </div>
        {isManager && (
          <button className="abtn primary" onClick={() => setCreating(true)} style={{ gap:"7px" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" width="15" height="15"><path d="M12 5v14M5 12h14"/></svg>
            {t("customers.addCustomer") || "Thêm khách hàng"}
          </button>
        )}
      </div>

      {/* KPIs */}
      <div className="kpis">
        {[
          {
            ico: <><circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeLinecap="round"/><path d="M16 4a3.5 3.5 0 0 1 0 7M22 20a5 5 0 0 0-4-5" strokeLinecap="round"/></>,
            lab: "Tổng khách hàng", val: counts.ALL, chg: "tất cả trạng thái", cls: "flat",
          },
          {
            ico: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>,
            lab: "Đang dùng", val: counts.ACTIVE, chg: "khách hàng active", cls: counts.ACTIVE > 0 ? "up" : "flat",
          },
          {
            ico: <><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2" strokeLinecap="round"/></>,
            lab: "Tiềm năng", val: counts.PROSPECT, chg: "đang đàm phán", cls: counts.PROSPECT > 0 ? "up" : "flat",
          },
          {
            ico: <><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" strokeLinecap="round"/></>,
            lab: "Tổng task", val: totalTasks, chg: "công việc liên kết", cls: "flat",
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

      {/* Toolbar */}
      <div className="cust-bar">
        <div className="seg-tabs">
          {tabs.map(tab => (
            <button
              key={tab.k}
              className={`seg-tab${segTab === tab.k ? " on" : ""}`}
              onClick={() => setSegTab(tab.k)}
            >
              {tab.l}<span className="tcnt">{counts[tab.k as keyof typeof counts]}</span>
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <div className="cust-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t("customers.searchPlaceholder") || "Tìm khách hàng, SĐT…"}
          />
        </div>
        <div className="view-toggle">
          <button
            className={view === "grid" ? "on" : ""}
            onClick={() => setView("grid")}
            aria-label="Lưới"
            title="Lưới"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          </button>
          <button
            className={view === "list" ? "on" : ""}
            onClick={() => setView("list")}
            aria-label="Danh sách"
            title="Danh sách"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
          </button>
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width:46, height:46, margin:"0 auto 14px", opacity:.3 }}>
            <circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeLinecap="round"/>
          </svg>
          <p style={{ fontSize:".92rem", fontWeight:600, color:"var(--text-2)" }}>{t("customers.noCustomers") || "Không tìm thấy khách hàng"}</p>
          <span style={{ fontSize:".83rem" }}>Thử đổi bộ lọc hoặc từ khóa tìm kiếm.</span>
        </div>
      ) : view === "grid" ? (
        <div className="cust-grid">
          {filtered.map((c, idx) => {
            const statusMeta = STATUS_META[c.status] ?? STATUS_META.INACTIVE;
            const statusLabel = t(`customerStatus.${c.status}`) || c.status;
            const displayName = c.customerName || c.businessName || c.custId || "—";
            const subName = c.businessName && c.customerName ? c.businessName : c.custId || "";
            return (
              <div
                key={c.id}
                className={`cust-card${c.status === "INACTIVE" ? " inactive" : ""}`}
                onClick={() => openDetail(c, idx)}
              >
                <div className="cust-card-top">
                  <div className="cust-logo" style={{ background: gradFor(idx) }}>{initials(displayName)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="cust-name">{displayName}</div>
                    {subName && <div className="cust-ind">{subName}</div>}
                  </div>
                  <span className="status-badge" style={{ background: statusMeta.bg, color: statusMeta.color }}>
                    {statusLabel}
                  </span>
                </div>

                <div className="cust-rows">
                  {c.contactPerson && (
                    <div className="cust-rowi">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="8" r="3.5"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                      </svg>
                      <span className="trunc">{c.contactPerson}</span>
                    </div>
                  )}
                  {c.phone && (
                    <div className="cust-rowi">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.4-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>
                      </svg>
                      <span className="trunc">{c.phone}</span>
                    </div>
                  )}
                  {c.email && (
                    <div className="cust-rowi">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 6l10 7L22 6"/>
                      </svg>
                      <span className="trunc">{c.email}</span>
                    </div>
                  )}
                  {c.website && (
                    <div className="cust-rowi">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                      </svg>
                      <a href={c.website} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="trunc">
                        {c.website.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  )}
                </div>

                {(c.responsibleStaff || (c._count?.tasks ?? 0) > 0) && (
                  <div className="cust-foot">
                    {c.responsibleStaff && (
                      <span className="csm">
                        <span className="csm-av">{initials(c.responsibleStaff.fullName)}</span>
                        {c.responsibleStaff.fullName}
                      </span>
                    )}
                    {(c._count?.tasks ?? 0) > 0 && (
                      <span className="tasks">{c._count!.tasks} task</span>
                    )}
                  </div>
                )}

                {isManager && (
                  <button
                    className="edit-btn"
                    onClick={e => { e.stopPropagation(); setEditingCustomer(c); }}
                    aria-label="Chỉnh sửa"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/>
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="cust-table-wrap">
          <table className="cust-table">
            <thead>
              <tr>
                <th>Khách hàng</th>
                <th>Liên hệ</th>
                <th>SĐT / Email</th>
                <th>NV phụ trách</th>
                <th className="r">Task</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, idx) => {
                const statusMeta = STATUS_META[c.status] ?? STATUS_META.INACTIVE;
                const statusLabel = t(`customerStatus.${c.status}`) || c.status;
                const displayName = c.customerName || c.businessName || c.custId || "—";
                return (
                  <tr
                    key={c.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => openDetail(c, idx)}
                  >
                    <td>
                      <div style={{ display:"flex", alignItems:"center", gap:11 }}>
                        <div className="cust-logo" style={{ width:34, height:34, fontSize:".82rem", borderRadius:9, background: gradFor(idx) }}>
                          {initials(displayName)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div className="name-cell">{displayName}</div>
                          {c.custId && <div className="sub-cell">{c.custId}</div>}
                        </div>
                      </div>
                    </td>
                    <td>{c.contactPerson || "—"}</td>
                    <td>
                      {c.phone || "—"}
                      {c.email && <div className="sub-cell">{c.email}</div>}
                    </td>
                    <td>
                      {c.responsibleStaff ? (
                        <span style={{ display:"inline-flex", alignItems:"center", gap:7 }}>
                          <span className="cust-logo" style={{ width:24, height:24, fontSize:".6rem", borderRadius:"50%", background:"linear-gradient(135deg,#8b7bff,#4f7aff)" }}>
                            {initials(c.responsibleStaff.fullName)}
                          </span>
                          {c.responsibleStaff.fullName}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="r" style={{ fontFamily:"var(--font-mono)", fontWeight:700, color:"var(--text-2)" }}>
                      {c._count?.tasks ?? 0}
                    </td>
                    <td>
                      <span className="status-badge" style={{ background: statusMeta.bg, color: statusMeta.color }}>
                        {statusLabel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {(creating || editingCustomer) && (
        <CustomerFormModal
          customer={editingCustomer}
          employees={employees}
          onClose={() => { setCreating(false); setEditingCustomer(null); }}
          onSaved={c => { upsert(c); setCreating(false); setEditingCustomer(null); router.refresh(); }}
        />
      )}

      {viewingCustomer && (
        <CustomerDetailDrawer
          customerId={viewingCustomer.id}
          gradient={viewingCustomer.gradient}
          isManager={isManager}
          onClose={() => setViewingCustomer(null)}
          onEdit={(c) => {
            setEditingCustomer(c);
            setViewingCustomer(null);
          }}
          onChanged={() => router.refresh()}
        />
      )}
    </>
  );
}
