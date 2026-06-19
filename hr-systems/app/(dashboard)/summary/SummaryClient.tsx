"use client";

import { useState, useMemo, useCallback, useEffect } from "react";

/* ── helpers ── */
function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "tr";
  if (n >= 1_000) return Math.round(n / 1_000) + "k";
  return n.toLocaleString("vi-VN");
}
function fmtFull(n: number): string {
  return n.toLocaleString("vi-VN") + "đ";
}

const STATUS_MAP: Record<string, string> = {
  PAID: "paid", APPROVED: "approved", CONFIRMED: "approved",
  PROCESSING: "processing", DRAFT: "draft",
};
function sk(s: string | null | undefined): string {
  return STATUS_MAP[s?.toUpperCase() ?? ""] ?? (s?.toLowerCase() ?? "draft");
}
const STATUS_LABEL: Record<string, string> = {
  paid: "Đã trả", approved: "Đã duyệt", processing: "Đang xử lý", draft: "Nháp",
};

interface SummaryItem {
  id: number;
  employeeId: number;
  month: number; year: number;
  creditedHours?: any; workHoursReal?: any;
  salaryCalc?: any; bonusCalc?: any; totalCalc?: any;
  salaryPaid?: any; moneyReceived?: any;
  totalScore?: any; totalTasks?: number;
  confirmedAt?: string | null; confirmedById?: number | null;
  status?: string | null;
  employee: { id: number; fullName: string; department: string | null; payType: string; hourlyRate: any; monthlySalary: any };
  confirmedBy?: { fullName: string } | null;
}

type StatusTab = "all" | "paid" | "approved" | "processing" | "draft";

interface Props {
  initialSummaries: SummaryItem[];
  initialMonth: number;
  initialYear: number;
  employeeId: number;
}

function initials(name: string) {
  return name.split(" ").slice(-2).map(w => w[0]).join("").toUpperCase();
}

export function SummaryClient({ initialSummaries, initialMonth, initialYear }: Props) {
  const [summaries, setSummaries] = useState<SummaryItem[]>(initialSummaries);
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [loading, setLoading] = useState(false);
  const [statusTab, setStatusTab] = useState<StatusTab>("all");
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [drawer, setDrawer] = useState<SummaryItem | null>(null);

  /* fetch when month/year changes */
  const fetchData = useCallback(async (m: number, y: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/summary?month=${m}&year=${y}`);
      const json = await res.json().catch(() => ({}));
      if (res.ok) setSummaries(json.data ?? []);
    } finally { setLoading(false); }
  }, []);

  function prevMonth() {
    let m = month - 1, y = year;
    if (m < 1) { m = 12; y--; }
    setMonth(m); setYear(y); setChecked(new Set()); fetchData(m, y);
  }
  function nextMonth() {
    let m = month + 1, y = year;
    if (m > 12) { m = 1; y++; }
    setMonth(m); setYear(y); setChecked(new Set()); fetchData(m, y);
  }

  const filtered = useMemo(() => {
    if (statusTab === "all") return summaries;
    return summaries.filter(s => sk(s.status) === statusTab);
  }, [summaries, statusTab]);

  /* KPIs */
  const totalNet = summaries.reduce((a, s) => a + Number(s.moneyReceived ?? s.totalCalc ?? 0), 0);
  const paidItems = summaries.filter(s => sk(s.status) === "paid");
  const paidAmt = paidItems.reduce((a, s) => a + Number(s.moneyReceived ?? s.totalCalc ?? 0), 0);
  const pendingCount = summaries.filter(s => sk(s.status) === "approved").length;
  const totalGross = summaries.reduce((a, s) => a + Number(s.salaryCalc ?? s.totalCalc ?? 0), 0);

  const tabCounts: Record<StatusTab, number> = {
    all: summaries.length,
    paid: summaries.filter(s => sk(s.status) === "paid").length,
    approved: summaries.filter(s => sk(s.status) === "approved").length,
    processing: summaries.filter(s => sk(s.status) === "processing").length,
    draft: summaries.filter(s => sk(s.status) === "draft").length,
  };

  /* footer */
  const totBase = filtered.reduce((a, s) => a + Number(s.salaryCalc ?? 0), 0);
  const totGross = filtered.reduce((a, s) => a + Number(s.salaryCalc ?? s.totalCalc ?? 0), 0);
  const totNet = filtered.reduce((a, s) => a + Number(s.moneyReceived ?? s.totalCalc ?? 0), 0);
  const totDeduct = Math.max(0, totGross - totNet);

  /* checkbox */
  function toggleAll(val: boolean) {
    setChecked(val ? new Set(filtered.map(s => s.id)) : new Set());
  }
  function toggleOne(id: number) {
    setChecked(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  /* drawer row data */
  function rowNums(s: SummaryItem) {
    const base = Number(s.salaryCalc ?? 0);
    const gross = Number(s.salaryCalc ?? s.totalCalc ?? 0);
    const net = Number(s.moneyReceived ?? s.totalCalc ?? 0);
    const bonus = Number(s.bonusCalc ?? 0);
    const deduct = Math.max(0, gross - net);
    const creditedHrs = Number(s.creditedHours ?? 0);
    const workHrs = Number(s.workHoursReal ?? creditedHrs);
    const otAmt = creditedHrs > workHrs && base > 0 ? (creditedHrs - workHrs) * (base / 160) : 0;
    const workDays = workHrs > 0 ? Math.round(workHrs / 8) : 0;
    return { base, gross, net, bonus, deduct, otAmt, workDays };
  }

  const STATUS_TABS: { k: StatusTab; label: string }[] = [
    { k: "all", label: "Tất cả" },
    { k: "paid", label: "Đã trả" },
    { k: "approved", label: "Đã duyệt" },
    { k: "processing", label: "Đang xử lý" },
    { k: "draft", label: "Nháp" },
  ];

  /* dummy 6-month chart data derived from current total */
  const chartBase = totalNet || 50_000_000;
  const CHART_DATA = [-14, -8, -11, -5, -2, 0].map(d => Math.round(chartBase * (1 + d / 100) / 1_000_000));
  const chartMax = Math.max(...CHART_DATA);

  return (
    <>
      {/* ── Page head ── */}
      <div className="page-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 22 }}>
        <div>
          <h1>Salary Summary</h1>
          <p>Bảng lương · <b>Tháng {month}/{year}</b> · Quỹ lương: <b>{fmt(totalNet)}</b></p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Month nav */}
          <div className="month-nav">
            <button onClick={prevMonth} disabled={loading}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" width={16} height={16}><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <span className="mval">Tháng {month} / {year}</span>
            <button onClick={nextMonth} disabled={loading}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" width={16} height={16}><path d="M9 6l6 6-6 6"/></svg>
            </button>
          </div>
          <button className="abtn ghost" style={{ gap: 7 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={15} height={15}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Xuất Excel
          </button>
          <button className="abtn primary" style={{ gap: 7 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={15} height={15}><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            Chạy bảng lương
          </button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="kpis">
        {[
          { ico: '<path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>', label: "Quỹ lương (net)", value: fmt(totalNet), chg: "tổng thực lĩnh", cls: "flat" },
          { ico: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>', label: "Đã thanh toán", value: fmt(paidAmt), chg: `${paidItems.length} người`, cls: "up" },
          { ico: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round"/>', label: "Chờ thanh toán", value: String(pendingCount), chg: "đã duyệt, chưa trả", cls: pendingCount > 0 ? "warn" : "flat" },
          { ico: '<path d="M3 3v18h18"/><rect x="7" y="11" width="3" height="6"/><rect x="12" y="7" width="3" height="10"/><rect x="17" y="13" width="3" height="4"/>', label: "Gross tháng này", value: fmt(totalGross), chg: "trước khấu trừ", cls: "flat" },
        ].map((k, i) => (
          <div key={i} className="kpi">
            <div className="kt"><span className="ki"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} dangerouslySetInnerHTML={{ __html: k.ico }} /></span>{k.label}</div>
            <div className="kv">{k.value}</div>
            <div className={`kc ${k.cls}`}>{k.chg}</div>
          </div>
        ))}
      </div>

      {/* ── sal-top-grid: tabs + chart ── */}
      <div className="sal-top-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 10, justifyContent: "flex-end" }}>
          {/* Status tabs */}
          <div className="sal-tabs">
            {STATUS_TABS.map(t => (
              <button key={t.k} className={`sal-tab${statusTab === t.k ? " on" : ""}`} onClick={() => { setStatusTab(t.k); setChecked(new Set()); }}>
                {t.label}
                <span className="tcnt">{tabCounts[t.k]}</span>
              </button>
            ))}
          </div>
          {/* Bulk action bar */}
          {checked.size > 0 && (
            <div className="bulk-bar">
              <span><b>{checked.size}</b> bản ghi được chọn</span>
              <button className="abtn primary" style={{ height: 32, fontSize: ".8rem" }}>✓ Duyệt tất cả</button>
              <button className="abtn ghost" style={{ height: 32, fontSize: ".8rem" }}>💸 Thanh toán</button>
            </div>
          )}
        </div>

        {/* Mini 6-month bar chart */}
        <div style={{ background: "var(--elev)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: 14 }}>
          <div style={{ fontSize: ".76rem", fontWeight: 700, color: "var(--text-3)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Quỹ lương 6 tháng</div>
          <div className="sal-chart">
            {CHART_DATA.map((v, i) => {
              const pct = Math.round(v / chartMax * 100);
              const isActive = i === 5;
              return (
                <div key={i} className="sc-col">
                  <div className="sc-bar" style={{
                    height: `${pct}%`,
                    background: isActive ? undefined : v >= chartMax * 0.9 ? "rgba(74,222,128,.25)" : "rgba(59,91,219,.2)",
                  }} className={`sc-bar${isActive ? " active" : ""}`} title={`${v}tr`} />
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: ".62rem", color: "var(--text-3)", marginTop: 6 }}>
            {["T1","T2","T3","T4","T5"].map(l => <span key={l}>{l}</span>)}
            <span style={{ color: "var(--accent-ink)", fontWeight: 700 }}>T{month > 6 ? month : 6}</span>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="sal-table-wrap">
        <table className="sal-table">
          <thead>
            <tr>
              <th style={{ width: 32 }}>
                <input type="checkbox" checked={filtered.length > 0 && checked.size === filtered.length} onChange={e => toggleAll(e.target.checked)} style={{ accentColor: "var(--accent)", cursor: "pointer" }} />
              </th>
              <th style={{ textAlign: "left" }}>Nhân sự</th>
              <th>Lương CB</th>
              <th>OT</th>
              <th>Phụ cấp</th>
              <th>Thưởng</th>
              <th>Gross</th>
              <th>Khấu trừ</th>
              <th style={{ color: "var(--text)" }}>Thực lĩnh</th>
              <th>Ngày làm</th>
              <th style={{ textAlign: "left" }}>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={11} style={{ textAlign: "center", padding: 48, color: "var(--text-3)" }}>Đang tải…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={11} style={{ textAlign: "center", padding: 48, color: "var(--text-3)" }}>Không có dữ liệu.</td></tr>
            ) : filtered.map(s => {
              const { base, gross, net, bonus, deduct, otAmt, workDays } = rowNums(s);
              const status = sk(s.status);
              return (
                <tr key={s.id} onClick={() => setDrawer(s)} style={{ cursor: "pointer" }}>
                  <td onClick={e => { e.stopPropagation(); toggleOne(s.id); }}>
                    <input type="checkbox" checked={checked.has(s.id)} onChange={() => toggleOne(s.id)} style={{ accentColor: "var(--accent)", cursor: "pointer" }} />
                  </td>
                  <td style={{ textAlign: "left" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg,#8b7bff,#4f7aff)", display: "grid", placeItems: "center", color: "#fff", fontSize: ".66rem", fontWeight: 700, flexShrink: 0 }}>
                        {initials(s.employee.fullName)}
                      </span>
                      <div>
                        <div style={{ fontSize: ".87rem", fontWeight: 600, color: "var(--text)" }}>{s.employee.fullName}</div>
                        <div style={{ fontSize: ".72rem", color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>{s.employee.department ?? s.employee.payType}</div>
                      </div>
                    </div>
                  </td>
                  <td className="money base">{fmt(base)}</td>
                  <td className="money">{otAmt > 0 ? <span style={{ color: "var(--warn)" }}>+{fmt(otAmt)}</span> : "—"}</td>
                  <td className="money" style={{ color: "var(--text-2)" }}>—</td>
                  <td className="money bonus">{bonus > 0 ? "+" + fmt(bonus) : "—"}</td>
                  <td className="money" style={{ fontWeight: 600 }}>{fmt(gross)}</td>
                  <td className="money deduct">{deduct > 0 ? "−" + fmt(deduct) : "—"}</td>
                  <td className="money net">{fmt(net)}</td>
                  <td className="days-cell" style={{ textAlign: "center" }}>{workDays > 0 ? `${workDays}ngày` : "—"}</td>
                  <td style={{ textAlign: "left" }}>
                    <span className={`sal-status ${status}`}>{STATUS_LABEL[status] ?? status}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td />
              <td style={{ textAlign: "left" }}>Tổng {filtered.length} người</td>
              <td>{fmt(totBase)}</td>
              <td>—</td><td>—</td><td>—</td>
              <td style={{ color: "var(--text)" }}>{fmt(totGross)}</td>
              <td style={{ color: "var(--danger)" }}>−{fmt(totDeduct)}</td>
              <td style={{ color: "var(--ok)", fontSize: ".95rem" }}>{fmt(totNet)}</td>
              <td /><td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── Payslip drawer ── */}
      <div className={`ps-back${drawer ? " open" : ""}`} onClick={() => setDrawer(null)} />
      <div className={`ps-drawer${drawer ? " open" : ""}`}>
        {drawer && (() => {
          const { base, gross, net, bonus, deduct, otAmt, workDays } = rowNums(drawer);
          const status = sk(drawer.status);
          const bhxh = Math.round(base * 0.08);
          const bhyt = Math.round(base * 0.015);
          const pit = Math.max(0, deduct - bhxh - bhyt);
          return (
            <>
              <div className="ps-head">
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#8b7bff,#4f7aff)", display: "grid", placeItems: "center", color: "#fff", fontSize: ".84rem", fontWeight: 700, flexShrink: 0 }}>
                  {initials(drawer.employee.fullName)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: ".98rem", fontWeight: 700, color: "var(--text)" }}>{drawer.employee.fullName}</div>
                  <div style={{ fontSize: ".74rem", color: "var(--text-3)", fontFamily: "var(--font-mono)", marginTop: 2 }}>{drawer.employee.department ?? drawer.employee.payType} · Tháng {month}/{year}</div>
                </div>
                <button className="ps-close" onClick={() => setDrawer(null)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
                </button>
              </div>
              <div className="ps-body">
                <div className="payslip-card">
                  <div className="pc-header">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <h3>Phiếu lương · Tháng {month}/{year}</h3>
                        <div className="pch-sub">{drawer.employee.fullName} · {drawer.employee.department ?? drawer.employee.payType}</div>
                      </div>
                      <span className={`sal-status ${status}`} style={{ background: "rgba(255,255,255,.2)", color: "#fff" }}>{STATUS_LABEL[status] ?? status}</span>
                    </div>
                    <div className="pch-net">{fmtFull(net)}</div>
                    <div className="pch-netlbl">Thực lĩnh (sau khấu trừ)</div>
                  </div>

                  {/* Thu nhập */}
                  <div className="ps-section-head"><span>Thu nhập</span></div>
                  <div className="ps-row">
                    <span className="prl"><span className="dot" style={{ background: "var(--accent-ink)" }} />Lương cơ bản</span>
                    <span className="prv">{fmtFull(base)}</span>
                  </div>
                  {otAmt > 0 && (
                    <div className="ps-row">
                      <span className="prl"><span className="dot" style={{ background: "var(--warn)" }} />Làm thêm giờ</span>
                      <span className="prv" style={{ color: "var(--warn)" }}>+{fmtFull(otAmt)}</span>
                    </div>
                  )}
                  <div className="ps-row">
                    <span className="prl"><span className="dot" style={{ background: "var(--text-3)" }} />Phụ cấp</span>
                    <span className="prv">—</span>
                  </div>
                  {bonus > 0 && (
                    <div className="ps-row">
                      <span className="prl"><span className="dot" style={{ background: "var(--ok)" }} />Thưởng</span>
                      <span className="prv" style={{ color: "var(--ok)" }}>+{fmtFull(bonus)}</span>
                    </div>
                  )}
                  <div className="ps-total-row">
                    <span className="ptl">Tổng thu nhập (Gross)</span>
                    <span className="ptv">{fmtFull(gross)}</span>
                  </div>

                  {/* Khấu trừ */}
                  <div className="ps-section-head"><span>Khấu trừ</span></div>
                  <div className="ps-row">
                    <span className="prl"><span className="dot" style={{ background: "var(--danger)" }} />BHXH (8%)</span>
                    <span className="prv" style={{ color: "rgba(255,107,107,.8)" }}>−{fmtFull(bhxh)}</span>
                  </div>
                  <div className="ps-row">
                    <span className="prl"><span className="dot" style={{ background: "var(--danger)" }} />BHYT (1.5%)</span>
                    <span className="prv" style={{ color: "rgba(255,107,107,.8)" }}>−{fmtFull(bhyt)}</span>
                  </div>
                  <div className="ps-row">
                    <span className="prl"><span className="dot" style={{ background: "var(--danger)" }} />Thuế TNCN</span>
                    <span className="prv" style={{ color: "rgba(255,107,107,.8)" }}>−{fmtFull(pit)}</span>
                  </div>
                  <div className="ps-total-row">
                    <span className="ptl">Tổng khấu trừ</span>
                    <span className="ptv" style={{ color: "var(--danger)" }}>−{fmtFull(deduct)}</span>
                  </div>

                  {/* Net */}
                  <div style={{ padding: "16px 18px", background: "linear-gradient(90deg,rgba(59,91,219,.08),transparent)", borderTop: "2px solid var(--accent-soft-2)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text)" }}>Thực lĩnh</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "1.3rem", fontWeight: 800, color: "var(--ok)" }}>{fmtFull(net)}</span>
                    </div>
                    <div style={{ display: "flex", gap: 16, marginTop: 10, fontFamily: "var(--font-mono)", fontSize: ".72rem", color: "var(--text-3)" }}>
                      <span>Ngày làm: <b style={{ color: "var(--text)" }}>{workDays} ngày</b></span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="ps-actions">
                  {status === "processing" && (
                    <button className="abtn primary" style={{ gap: 7 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" width={14} height={14}><path d="M5 12l5 5L20 6"/></svg>
                      Phê duyệt
                    </button>
                  )}
                  {status === "approved" && (
                    <button className="abtn primary" style={{ gap: 7, background: "var(--ok)", boxShadow: "0 6px 16px rgba(74,222,128,.3)" }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={14} height={14}><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                      Thanh toán ngay
                    </button>
                  )}
                  <button className="abtn ghost">📄 Xuất payslip PDF</button>
                </div>
              </div>
            </>
          );
        })()}
      </div>
    </>
  );
}
