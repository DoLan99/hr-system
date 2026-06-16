"use client";

import { useState, useMemo } from "react";

/* ── helpers ── */
function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "tr";
  if (n >= 1_000) return Math.round(n / 1_000) + "k";
  return n.toLocaleString("vi-VN");
}

const STATUS_LABEL: Record<string, string> = {
  paid: "Đã trả",
  approved: "Đã duyệt",
  processing: "Đang xử lý",
  draft: "Nháp",
  PAID: "Đã trả",
  APPROVED: "Đã duyệt",
  PROCESSING: "Đang xử lý",
  DRAFT: "Nháp",
  CONFIRMED: "Đã duyệt",
};

function statusKey(s: string): string {
  const map: Record<string, string> = {
    PAID: "paid",
    APPROVED: "approved",
    CONFIRMED: "approved",
    PROCESSING: "processing",
    DRAFT: "draft",
  };
  return map[s] ?? s.toLowerCase();
}

interface SummaryItem {
  id: number;
  employeeId: number;
  month: number;
  year: number;
  creditedHours?: number | string | null;
  workHoursReal?: number | string | null;
  salaryCalc?: number | string | null;
  bonusCalc?: number | string | null;
  totalCalc?: number | string | null;
  salaryPaid?: number | string | null;
  moneyReceived?: number | string | null;
  totalScore?: number | string | null;
  totalTasks?: number;
  confirmedAt?: string | null;
  confirmedById?: number | null;
  status?: string | null;
  employee: {
    id: number;
    fullName: string;
    department: string | null;
    payType: string;
    hourlyRate: any;
    monthlySalary: any;
  };
  confirmedBy?: { fullName: string } | null;
}

type StatusTab = "all" | "paid" | "approved" | "processing" | "draft";

interface Props {
  initialSummaries: SummaryItem[];
  initialMonth: number;
  initialYear: number;
  employeeId: number;
}

export function SummaryClient({ initialSummaries, initialMonth, initialYear }: Props) {
  const [summaries] = useState<SummaryItem[]>(initialSummaries);
  const [statusTab, setStatusTab] = useState<StatusTab>("all");

  const filtered = useMemo(() => {
    if (statusTab === "all") return summaries;
    return summaries.filter((s) => statusKey(s.status ?? "draft") === statusTab);
  }, [summaries, statusTab]);

  /* KPI calculations */
  const totalNet = summaries.reduce((a, s) => a + Number(s.moneyReceived ?? s.totalCalc ?? 0), 0);
  const paidItems = summaries.filter((s) => statusKey(s.status ?? "draft") === "paid");
  const paidAmt = paidItems.reduce((a, s) => a + Number(s.moneyReceived ?? s.totalCalc ?? 0), 0);
  const pendingCount = summaries.filter((s) => statusKey(s.status ?? "draft") === "approved").length;
  const totalGross = summaries.reduce((a, s) => a + Number(s.salaryCalc ?? s.totalCalc ?? 0), 0);

  const tabCounts: Record<StatusTab, number> = {
    all: summaries.length,
    paid: summaries.filter((s) => statusKey(s.status ?? "draft") === "paid").length,
    approved: summaries.filter((s) => statusKey(s.status ?? "draft") === "approved").length,
    processing: summaries.filter((s) => statusKey(s.status ?? "draft") === "processing").length,
    draft: summaries.filter((s) => statusKey(s.status ?? "draft") === "draft").length,
  };

  const STATUS_TABS: { k: StatusTab; label: string }[] = [
    { k: "all",        label: "Tất cả" },
    { k: "paid",       label: "Đã trả" },
    { k: "approved",   label: "Đã duyệt" },
    { k: "processing", label: "Đang xử lý" },
    { k: "draft",      label: "Nháp" },
  ];

  const KPI_CARDS = [
    {
      icon: '<path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
      label: "Quỹ lương (net)",
      value: fmt(totalNet),
      change: "tổng thực lĩnh",
      cls: "flat",
    },
    {
      icon: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
      label: "Đã thanh toán",
      value: fmt(paidAmt),
      change: `${paidItems.length} người`,
      cls: "up",
    },
    {
      icon: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round"/>',
      label: "Chờ thanh toán",
      value: String(pendingCount),
      change: "đã duyệt, chưa trả",
      cls: pendingCount > 0 ? "warn" : "flat",
    },
    {
      icon: '<path d="M3 3v18h18"/><rect x="7" y="11" width="3" height="6"/><rect x="12" y="7" width="3" height="10"/><rect x="17" y="13" width="3" height="4"/>',
      label: "Gross tháng này",
      value: fmt(totalGross),
      change: "trước khấu trừ",
      cls: "flat",
    },
  ];

  /* footer totals */
  const totBase = filtered.reduce((a, s) => a + Number(s.salaryCalc ?? 0), 0);
  const totGross = filtered.reduce((a, s) => a + Number(s.salaryCalc ?? s.totalCalc ?? 0), 0);
  const totNet = filtered.reduce((a, s) => a + Number(s.moneyReceived ?? s.totalCalc ?? 0), 0);

  return (
    <>
      {/* Page head */}
      <div className="page-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 22 }}>
        <div>
          <h1>Salary Summary</h1>
          <p>Bảng lương · <b>Tháng {initialMonth}/{initialYear}</b> · Quỹ lương: <b>{fmt(totalNet)}</b></p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
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

      {/* KPIs */}
      <div className="kpis">
        {KPI_CARDS.map((k, i) => (
          <div key={i} className="kpi">
            <div className="kt">
              <span className="ki">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} dangerouslySetInnerHTML={{ __html: k.icon }} />
              </span>
              {k.label}
            </div>
            <div className="kv">{k.value}</div>
            <div className={`kc ${k.cls}`}>{k.change}</div>
          </div>
        ))}
      </div>

      {/* Status tabs */}
      <div className="stabs">
        {STATUS_TABS.map((t) => (
          <button
            key={t.k}
            className={`stab${statusTab === t.k ? " on" : ""}`}
            onClick={() => setStatusTab(t.k)}
          >
            {t.label}
            <span className="sc">{tabCounts[t.k]}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table className="dtable" style={{ minWidth: 900 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Nhân sự</th>
              <th style={{ textAlign: "right" }}>Lương CB</th>
              <th style={{ textAlign: "right" }}>OT</th>
              <th style={{ textAlign: "right" }}>Phụ cấp</th>
              <th style={{ textAlign: "right" }}>Thưởng</th>
              <th style={{ textAlign: "right" }}>Gross</th>
              <th style={{ textAlign: "right" }}>Khấu trừ</th>
              <th style={{ textAlign: "right", color: "var(--text)" }}>Thực lĩnh</th>
              <th style={{ textAlign: "center" }}>Ngày làm</th>
              <th style={{ textAlign: "left" }}>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: "center", padding: 48, color: "var(--text-3)" }}>
                  Không có dữ liệu.
                </td>
              </tr>
            ) : (
              filtered.map((s) => {
                const base = Number(s.salaryCalc ?? 0);
                const gross = Number(s.salaryCalc ?? s.totalCalc ?? 0);
                const net = Number(s.moneyReceived ?? s.totalCalc ?? 0);
                const bonus = Number(s.bonusCalc ?? 0);
                const deduct = Math.max(0, gross - net);
                const creditedHrs = Number(s.creditedHours ?? 0);
                const workHrs = Number(s.workHoursReal ?? creditedHrs);
                const sk = statusKey(s.status ?? "draft");

                return (
                  <tr key={s.id}>
                    <td>
                      <div className="td-av">
                        <span className="av" style={{ width: 26, height: 26, fontSize: "0.66rem", flexShrink: 0 }}>
                          {s.employee.fullName.slice(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <div className="td-bold">{s.employee.fullName}</div>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
                            {s.employee.department ?? s.employee.payType}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--text-2)" }}>
                      {fmt(base)}
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>
                      {creditedHrs > workHrs ? (
                        <span style={{ color: "var(--warn)" }}>+{fmt((creditedHrs - workHrs) * (base / 160))}</span>
                      ) : "—"}
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--text-2)" }}>
                      —
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--ok)" }}>
                      {bonus > 0 ? "+" + fmt(bonus) : "—"}
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "0.85rem", fontWeight: 600, color: "var(--text)" }}>
                      {fmt(gross)}
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "rgba(255,107,107,.8)" }}>
                      {deduct > 0 ? "−" + fmt(deduct) : "—"}
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "0.9rem", fontWeight: 800, color: "var(--text)" }}>
                      {fmt(net)}
                    </td>
                    <td style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--text-2)" }}>
                      {workHrs > 0 ? Math.round(workHrs / 8) : "—"}ngày
                    </td>
                    <td>
                      <span className={`badge ${sk}`}>
                        {STATUS_LABEL[s.status ?? "draft"] ?? sk}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot>
            <tr>
              <td style={{ textAlign: "left", color: "var(--text-3)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, fontFamily: "var(--font-mono)", padding: "12px 16px", borderTop: "2px solid var(--border-2)" }}>
                Tổng {filtered.length} người
              </td>
              <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "0.82rem", fontWeight: 700, padding: "12px 16px", borderTop: "2px solid var(--border-2)" }}>{fmt(totBase)}</td>
              <td style={{ padding: "12px 16px", borderTop: "2px solid var(--border-2)" }}>—</td>
              <td style={{ padding: "12px 16px", borderTop: "2px solid var(--border-2)" }}>—</td>
              <td style={{ padding: "12px 16px", borderTop: "2px solid var(--border-2)" }}>—</td>
              <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "0.82rem", fontWeight: 700, color: "var(--text)", padding: "12px 16px", borderTop: "2px solid var(--border-2)" }}>{fmt(totGross)}</td>
              <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "0.82rem", fontWeight: 700, color: "var(--danger)", padding: "12px 16px", borderTop: "2px solid var(--border-2)" }}>—</td>
              <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "0.95rem", fontWeight: 700, color: "var(--ok)", padding: "12px 16px", borderTop: "2px solid var(--border-2)" }}>{fmt(totNet)}</td>
              <td style={{ padding: "12px 16px", borderTop: "2px solid var(--border-2)" }} />
              <td style={{ padding: "12px 16px", borderTop: "2px solid var(--border-2)" }} />
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}
