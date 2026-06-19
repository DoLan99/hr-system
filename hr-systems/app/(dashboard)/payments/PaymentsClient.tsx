"use client";

import { useState, useMemo, useCallback } from "react";

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "tr";
  if (n >= 1_000) return Math.round(n / 1_000) + "k";
  return n.toLocaleString("vi-VN");
}
function fmtFull(n: number) { return n.toLocaleString("vi-VN") + "đ"; }
function viDate(d: string) {
  const p = d.slice(0, 10).split("-");
  return `${p[2]}/${p[1]}/${p[0]}`;
}

const TYPE_META: Record<string, { label: string; dir: "in" | "out"; cls: string; svg: string }> = {
  SALARY:    { label: "Lương nhân viên",    dir: "out", cls: "salary",    svg: '<path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>' },
  BONUS:     { label: "Thưởng",             dir: "in",  cls: "client",    svg: '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6" strokeLinecap="round" strokeLinejoin="round"/>' },
  ADVANCE:   { label: "Tạm ứng",            dir: "out", cls: "vendor",    svg: '<path d="M3 9l1-5h16l1 5M4 9v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9M9 13h6" strokeLinecap="round" strokeLinejoin="round"/>' },
  DEDUCTION: { label: "Khấu trừ",           dir: "out", cls: "refund",    svg: '<path d="M3 7v6h6M3 13a9 9 0 1 0 3-7" strokeLinecap="round" strokeLinejoin="round"/>' },
  OTHER:     { label: "Khác",               dir: "in",  cls: "reimburse", svg: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4" strokeLinecap="round"/>' },
};
const METHOD_META: Record<string, { label: string; svg: string }> = {
  BANK:  { label: "Chuyển khoản", svg: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18" strokeLinecap="round"/>' },
  CASH:  { label: "Tiền mặt",     svg: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>' },
  OTHER: { label: "Khác",         svg: '<circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 3" strokeLinecap="round"/>' },
};
const STATUS_LABEL: Record<string, string> = {
  PENDING: "Chờ xử lý", COMPLETED: "Hoàn tất", CANCELLED: "Đã hủy",
  pending: "Chờ xử lý", completed: "Hoàn tất", cancelled: "Đã hủy", scheduled: "Đã lên lịch", failed: "Thất bại",
};
const STATUS_CLS: Record<string, string> = {
  PENDING: "pending", COMPLETED: "completed", CANCELLED: "failed",
};

interface Employee { id: number; fullName: string; department?: string | null }
interface PaymentItem {
  id: number; date: string; employeeId: number; type: string;
  amount: number | string; notes?: string | null;
  summaryMonth?: number | null; summaryYear?: number | null;
  status?: string | null; method?: string | null;
  employee: Employee; createdBy?: { fullName: string } | null;
}
interface Props {
  initialPayments: PaymentItem[]; initialMonth: number; initialYear: number;
  employees: Employee[]; totalIn: number; totalOut: number; pendingCount: number;
}
type Tab = "all" | "in" | "out" | "pending";

export function PaymentsClient({ initialPayments, initialMonth, initialYear, employees, totalIn, totalOut, pendingCount }: Props) {
  const [payments, setPayments] = useState<PaymentItem[]>(initialPayments);
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [drawer, setDrawer] = useState<PaymentItem | null>(null);
  const [showModal, setShowModal] = useState(false);

  const filtered = useMemo(() => {
    return payments.filter(p => {
      const meta = TYPE_META[p.type] ?? TYPE_META.OTHER;
      if (tab === "in" && meta.dir !== "in") return false;
      if (tab === "out" && meta.dir !== "out") return false;
      if (tab === "pending" && p.status !== "PENDING") return false;
      if (search) {
        const q = search.toLowerCase();
        return p.employee.fullName.toLowerCase().includes(q) ||
          String(p.id).includes(q) ||
          (p.notes ?? "").toLowerCase().includes(q);
      }
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [payments, tab, search]);

  const tabCounts = useMemo(() => ({
    all: payments.length,
    in: payments.filter(p => (TYPE_META[p.type]?.dir ?? "out") === "in").length,
    out: payments.filter(p => (TYPE_META[p.type]?.dir ?? "out") === "out").length,
    pending: payments.filter(p => p.status === "PENDING").length,
  }), [payments]);

  const compIn = payments.filter(p => (TYPE_META[p.type]?.dir ?? "out") === "in" && p.status === "COMPLETED");
  const compOut = payments.filter(p => (TYPE_META[p.type]?.dir ?? "out") === "out" && p.status === "COMPLETED");
  const realIn = compIn.reduce((a, p) => a + Number(p.amount), 0);
  const realOut = compOut.reduce((a, p) => a + Number(p.amount), 0);

  const TABS = [
    { k: "all" as Tab, label: "Tất cả", dot: "var(--text-3)" },
    { k: "in" as Tab, label: "Tiền vào", dot: "var(--ok)" },
    { k: "out" as Tab, label: "Tiền ra", dot: "var(--danger)" },
    { k: "pending" as Tab, label: "Chờ xử lý", dot: "var(--warn)" },
  ];

  return (
    <>
      {/* ── Page head ── */}
      <div className="page-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 22 }}>
        <div>
          <h1>Payments</h1>
          <p>Dòng tiền &amp; giao dịch · Tháng {initialMonth}/{initialYear} · <b>{pendingCount}</b> giao dịch chờ xử lý</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="abtn ghost" style={{ gap: 7 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={15} height={15}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Xuất sổ quỹ
          </button>
          <button className="abtn primary" style={{ gap: 7 }} onClick={() => setShowModal(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" width={15} height={15}><path d="M12 5v14M5 12h14"/></svg>
            Tạo giao dịch
          </button>
        </div>
      </div>

      {/* ── Balance hero ── */}
      <div className="bal-hero">
        <div className="bal-main">
          <div className="blab">Tổng dòng tiền tháng {initialMonth}/{initialYear}</div>
          <div className="bval">{fmtFull(realIn + realOut)}</div>
          <div className="bsub">
            <div className="bi">Tiền vào tháng này<b>+{fmt(realIn)}</b></div>
            <div className="bi">Tiền ra tháng này<b>−{fmt(realOut)}</b></div>
          </div>
        </div>
        <div className="bal-side">
          <div className="bsl">
            <span className="bsi in">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
            </span>Đã thu
          </div>
          <div className="bsv" style={{ color: "var(--ok)" }}>{fmt(realIn)}</div>
          <div className="bsc">{compIn.length} giao dịch thu</div>
        </div>
        <div className="bal-side">
          <div className="bsl">
            <span className="bsi out">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
            </span>Đã chi
          </div>
          <div className="bsv">{fmt(realOut)}</div>
          <div className="bsc">{compOut.length} giao dịch chi</div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="pay-bar">
        <div className="pay-tabs">
          {TABS.map(t => (
            <button key={t.k} className={`pay-tab${tab === t.k ? " on" : ""}`} onClick={() => setTab(t.k)}>
              <span className="tdot" style={{ background: t.dot }} />
              {t.label}
              <span className="tcnt">{tabCounts[t.k]}</span>
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <div className="pay-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
          <input type="text" placeholder="Tìm đối tác, mã GD…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="pay-table-wrap">
        <table className="pay-table">
          <thead>
            <tr>
              <th>Giao dịch</th>
              <th>Mã GD</th>
              <th>Phương thức</th>
              <th>Ngày</th>
              <th className="r">Số tiền</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 48, color: "var(--text-3)" }}>Không có giao dịch nào.</td></tr>
            ) : filtered.map(p => {
              const meta = TYPE_META[p.type] ?? TYPE_META.OTHER;
              const method = METHOD_META[p.method ?? "OTHER"] ?? METHOD_META.OTHER;
              const dir = meta.dir;
              const amt = Number(p.amount);
              const status = p.status ?? "COMPLETED";
              return (
                <tr key={p.id} onClick={() => setDrawer(p)}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                      <div className={`txn-ico ${meta.cls}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} dangerouslySetInnerHTML={{ __html: meta.svg }} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className="txn-name">{p.employee.fullName}</div>
                        <div className="txn-cat">{meta.label}{p.notes ? ` · ${p.notes.slice(0, 40)}` : ""}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="txn-id">PAY-{String(p.id).padStart(4, "0")}</span></td>
                  <td>
                    <span className="txn-method">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={14} height={14} dangerouslySetInnerHTML={{ __html: method.svg }} />
                      {method.label}
                    </span>
                  </td>
                  <td><span className="txn-date">{viDate(p.date)}</span></td>
                  <td className="r"><span className={`txn-amt ${dir}`}>{dir === "in" ? "+" : "−"}{fmtFull(amt)}</span></td>
                  <td><span className={`pst ${STATUS_CLS[status] ?? "pending"}`}>{STATUS_LABEL[status] ?? status}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Detail drawer ── */}
      <div className={`pd-back${drawer ? " open" : ""}`} onClick={() => setDrawer(null)} />
      <div className={`pd-drawer${drawer ? " open" : ""}`}>
        {drawer && (() => {
          const meta = TYPE_META[drawer.type] ?? TYPE_META.OTHER;
          const method = METHOD_META[drawer.method ?? "OTHER"] ?? METHOD_META.OTHER;
          const dir = meta.dir;
          const amt = Number(drawer.amount);
          const status = drawer.status ?? "COMPLETED";
          const statusCls = STATUS_CLS[status] ?? "pending";
          const amtColor = dir === "in" ? "var(--ok)" : status === "CANCELLED" ? "var(--danger)" : "var(--text)";

          const steps =
            status === "COMPLETED" ? [
              { l: "Tạo giao dịch", m: viDate(drawer.date) + " · hệ thống", s: "done" },
              { l: "Phê duyệt", m: drawer.createdBy?.fullName ?? "Manager", s: "done" },
              { l: "Hoàn tất chuyển khoản", m: viDate(drawer.date) + " · " + method.label, s: "done" },
            ] : status === "PENDING" ? [
              { l: "Tạo giao dịch", m: "hệ thống", s: "done" },
              { l: "Đang xử lý", m: "chờ xác nhận", s: "active" },
              { l: "Hoàn tất", m: "chưa thực hiện", s: "todo" },
            ] : [
              { l: "Tạo giao dịch", m: "hệ thống", s: "done" },
              { l: "Thực hiện", m: "thất bại / đã hủy", s: "done" },
              { l: "Cần xử lý lại", m: "chờ thao tác", s: "active" },
            ];

          return (
            <>
              <div className="pd-head">
                <div className={`txn-ico ${meta.cls}`} style={{ width: 38, height: 38 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} dangerouslySetInnerHTML={{ __html: meta.svg }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: ".98rem", fontWeight: 700, color: "var(--text)" }}>{drawer.employee.fullName}</div>
                  <div style={{ fontSize: ".74rem", color: "var(--text-3)", fontFamily: "var(--font-mono)", marginTop: 2 }}>
                    PAY-{String(drawer.id).padStart(4, "0")} · {meta.label}
                  </div>
                </div>
                <button className="pd-close" onClick={() => setDrawer(null)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
                </button>
              </div>

              <div className="pd-body">
                {/* Amount hero */}
                <div className="amt-hero">
                  <div className={`ah-ico ${meta.cls}`} style={{ background: dir === "in" ? "var(--ok-soft)" : "var(--accent-soft)" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke={amtColor} strokeWidth={2} dangerouslySetInnerHTML={{ __html: meta.svg }} />
                  </div>
                  <div className="ah-amt" style={{ color: amtColor }}>{dir === "in" ? "+" : "−"}{fmtFull(amt)}</div>
                  <div className="ah-lbl">
                    {dir === "in" ? "Tiền vào" : "Tiền ra"} ·{" "}
                    <span className={`pst ${statusCls}`} style={{ marginLeft: 4 }}>{STATUS_LABEL[status] ?? status}</span>
                  </div>
                </div>

                {/* Details */}
                <div className="dsec">Chi tiết giao dịch</div>
                <div className="dcard">
                  <div className="drow"><span className="dl">Mã giao dịch</span><span className="dv" style={{ fontFamily: "var(--font-mono)" }}>PAY-{String(drawer.id).padStart(4, "0")}</span></div>
                  <div className="drow"><span className="dl">Loại</span><span className="dv">{meta.label}</span></div>
                  <div className="drow"><span className="dl">Phương thức</span>
                    <span className="dv">
                      <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth={2} width={15} height={15} dangerouslySetInnerHTML={{ __html: method.svg }} />
                      {method.label}
                    </span>
                  </div>
                  <div className="drow"><span className="dl">Nhân viên</span><span className="dv">{drawer.employee.fullName}</span></div>
                  <div className="drow"><span className="dl">Ngày</span><span className="dv">{viDate(drawer.date)}</span></div>
                  {drawer.summaryMonth && <div className="drow"><span className="dl">Tháng lương</span><span className="dv" style={{ fontFamily: "var(--font-mono)" }}>T{drawer.summaryMonth}/{drawer.summaryYear}</span></div>}
                </div>

                {drawer.notes && (
                  <>
                    <div className="dsec">Ghi chú</div>
                    <div style={{ fontSize: ".88rem", color: "var(--text-2)", lineHeight: 1.6, padding: 14, background: "var(--content)", border: "1px solid var(--border)", borderRadius: 10, marginBottom: 20 }}>
                      {drawer.notes}
                    </div>
                  </>
                )}

                {/* Timeline */}
                <div className="dsec">Tiến trình</div>
                <div className="tl-steps">
                  {steps.map((st, i) => (
                    <div key={i} className={`tl-step${st.s === "done" ? " done" : ""}`}>
                      <div className={`tl-dot ${st.s}`}>
                        {st.s === "done" && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" width={13} height={13}><path d="M5 12l5 5L20 6"/></svg>}
                        {st.s === "active" && "●"}
                      </div>
                      <div className="tl-info">
                        <div className={`tlt${st.s === "todo" ? " todo" : ""}`}>{st.l}</div>
                        <div className="tlm">{st.m}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pd-foot">
                {status === "PENDING" && (
                  <button className="abtn primary" style={{ flex: 1 }}>✓ Xác nhận hoàn tất</button>
                )}
                <button className="abtn ghost" style={{ flex: 1 }}>📄 Xuất chứng từ PDF</button>
              </div>
            </>
          );
        })()}
      </div>

      {/* ── Create modal ── */}
      {showModal && <CreateModal employees={employees} onClose={() => setShowModal(false)} onSaved={p => { setPayments(prev => [p, ...prev]); setShowModal(false); }} />}
    </>
  );
}

function CreateModal({ employees, onClose, onSaved }: { employees: Employee[]; onClose: () => void; onSaved: (p: PaymentItem) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    employeeId: String(employees[0]?.id ?? ""),
    type: "SALARY",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    method: "BANK",
    notes: "",
  });
  const s = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.amount || !form.date) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/payments", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: Number(form.employeeId), type: form.type, amount: Number(form.amount), date: form.date, method: form.method, notes: form.notes || undefined }),
      });
      const text = await res.text().catch(() => "");
      const json = text ? JSON.parse(text) : {};
      if (!res.ok) { setError(json.error ?? "Lỗi tạo giao dịch"); return; }
      onSaved(json.data);
    } finally { setLoading(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(4,8,18,.6)", backdropFilter: "blur(3px)" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <form className="pm-modal" onSubmit={save}>
        <div className="pm-head">
          <div className="ico"><svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" width={17} height={17}><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
          <h3>Tạo giao dịch mới</h3>
          <button type="button" className="x" onClick={onClose}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={17} height={17}><path d="M6 6l12 12M18 6L6 18"/></svg></button>
        </div>
        <div className="pm-body">
          {error && <div style={{ background: "var(--danger-soft)", color: "var(--danger)", borderRadius: 9, padding: "10px 14px", fontSize: ".84rem" }}>{error}</div>}
          <div className="pm-field">
            <label>Nhân viên *</label>
            <select value={form.employeeId} onChange={e => s("employeeId", e.target.value)}>
              {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
            </select>
          </div>
          <div className="pm-row">
            <div className="pm-field">
              <label>Loại *</label>
              <select value={form.type} onChange={e => s("type", e.target.value)}>
                {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div className="pm-field">
              <label>Phương thức</label>
              <select value={form.method} onChange={e => s("method", e.target.value)}>
                <option value="BANK">Chuyển khoản</option>
                <option value="CASH">Tiền mặt</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>
          </div>
          <div className="pm-row">
            <div className="pm-field">
              <label>Số tiền (đ) *</label>
              <input type="number" min={0} step={1000} placeholder="vd. 5000000" value={form.amount} onChange={e => s("amount", e.target.value)} required />
            </div>
            <div className="pm-field">
              <label>Ngày *</label>
              <input type="date" value={form.date} onChange={e => s("date", e.target.value)} required />
            </div>
          </div>
          <div className="pm-field">
            <label>Ghi chú</label>
            <textarea rows={2} placeholder="Mô tả giao dịch…" value={form.notes} onChange={e => s("notes", e.target.value)} style={{ resize: "vertical", minHeight: 60 }} />
          </div>
        </div>
        <div className="pm-foot">
          <button type="button" className="abtn ghost" onClick={onClose}>Hủy</button>
          <button type="submit" className="abtn primary" disabled={loading}>{loading ? "Đang lưu…" : "Tạo giao dịch"}</button>
        </div>
      </form>
    </div>
  );
}
