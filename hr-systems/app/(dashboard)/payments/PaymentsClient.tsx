"use client";

import { useState, useMemo } from "react";

/* ── helpers ── */
function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "tr";
  if (n >= 1_000) return Math.round(n / 1_000) + "k";
  return n.toLocaleString("vi-VN");
}
function fmtFull(n: number): string {
  return n.toLocaleString("vi-VN") + "đ";
}
function viDate(d: string): string {
  const p = d.slice(0, 10).split("-");
  return `${p[2]}/${p[1]}/${p[0]}`;
}

/* ── types ── */
const TYPE_META: Record<string, { label: string; dir: "in" | "out"; cls: string }> = {
  SALARY:    { label: "Lương nhân viên",    dir: "out", cls: "salary" },
  BONUS:     { label: "Thưởng",             dir: "in",  cls: "client" },
  ADVANCE:   { label: "Tạm ứng",            dir: "out", cls: "vendor" },
  DEDUCTION: { label: "Khấu trừ",           dir: "out", cls: "refund" },
  OTHER:     { label: "Khác",               dir: "in",  cls: "reimburse" },
};
const METHOD_META: Record<string, string> = {
  BANK: "Chuyển khoản",
  CASH: "Tiền mặt",
  OTHER: "Khác",
};
const STATUS_META: Record<string, string> = {
  PENDING:   "Chờ xử lý",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
};

interface Employee { id: number; fullName: string; department?: string | null }
interface PaymentItem {
  id: number;
  date: string;
  employeeId: number;
  type: string;
  amount: number | string;
  notes?: string | null;
  summaryMonth?: number | null;
  summaryYear?: number | null;
  status?: string | null;
  method?: string | null;
  employee: Employee;
  createdBy?: { fullName: string } | null;
}

interface Props {
  initialPayments: PaymentItem[];
  initialMonth: number;
  initialYear: number;
  employees: Employee[];
  totalIn: number;
  totalOut: number;
  pendingCount: number;
}

type Tab = "all" | "in" | "out" | "pending";

export function PaymentsClient({
  initialPayments,
  initialMonth,
  initialYear,
  employees,
  totalIn,
  totalOut,
  pendingCount,
}: Props) {
  const [payments] = useState<PaymentItem[]>(initialPayments);
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const meta = TYPE_META[p.type] ?? TYPE_META.OTHER;
      if (tab === "in" && meta.dir !== "in") return false;
      if (tab === "out" && meta.dir !== "out") return false;
      if (tab === "pending" && p.status !== "PENDING") return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          p.employee.fullName.toLowerCase().includes(q) ||
          String(p.id).includes(q) ||
          (p.notes ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [payments, tab, search]);

  const tabCounts = useMemo(() => ({
    all: payments.length,
    in: payments.filter((p) => (TYPE_META[p.type]?.dir ?? "out") === "in").length,
    out: payments.filter((p) => (TYPE_META[p.type]?.dir ?? "out") === "out").length,
    pending: payments.filter((p) => p.status === "PENDING").length,
  }), [payments]);

  const TABS: { k: Tab; label: string; dot: string }[] = [
    { k: "all",     label: "Tất cả",    dot: "var(--text-3)" },
    { k: "in",      label: "Tiền vào",  dot: "var(--ok)" },
    { k: "out",     label: "Tiền ra",   dot: "var(--danger)" },
    { k: "pending", label: "Chờ xử lý", dot: "var(--warn)" },
  ];

  return (
    <>
      {/* Page head */}
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
        </div>
      </div>

      {/* Balance hero */}
      <div className="balance-hero" style={{ marginBottom: 22 }}>
        <div className="bh-label">Tổng thanh toán tháng này</div>
        <div className="bh-val">{fmtFull(totalIn + totalOut)}</div>
        <div className="bh-row">
          <div className="bh-item">
            <div className="bh-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
            </div>
            <div>
              <div className="bh-sub">Tiền vào tháng này</div>
              <div className="bh-amt">+{fmt(totalIn)}</div>
            </div>
          </div>
          <div className="bh-item">
            <div className="bh-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
            </div>
            <div>
              <div className="bh-sub">Tiền ra tháng này</div>
              <div className="bh-amt">−{fmt(totalOut)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="stabs">
        {TABS.map((t) => (
          <button
            key={t.k}
            className={`stab${tab === t.k ? " on" : ""}`}
            onClick={() => setTab(t.k)}
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: t.dot, display: "inline-block", flexShrink: 0 }} />
            {t.label}
            <span className="sc">{tabCounts[t.k]}</span>
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div className="tools" style={{ marginBottom: 0 }}>
          <div className="tsearch" style={{ minWidth: 200 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
            <input
              type="text"
              placeholder="Tìm đối tác, giao dịch…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table className="dtable" style={{ minWidth: 820 }}>
          <thead>
            <tr>
              <th>Giao dịch</th>
              <th>Mã GD</th>
              <th>Phương thức</th>
              <th>Ngày</th>
              <th style={{ textAlign: "right" }}>Số tiền</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 48, color: "var(--text-3)" }}>
                  Không có giao dịch nào.
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const meta = TYPE_META[p.type] ?? TYPE_META.OTHER;
                const dir = meta.dir;
                const amt = Number(p.amount);
                const status = p.status ?? "COMPLETED";
                const method = p.method ?? "BANK";

                return (
                  <tr key={p.id}>
                    <td>
                      <div className="td-av">
                        <span
                          className="av"
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background:
                              meta.cls === "salary" ? "rgba(59,91,219,.13)"
                              : meta.cls === "client" ? "rgba(74,222,128,.13)"
                              : meta.cls === "refund" ? "rgba(255,107,107,.12)"
                              : "rgba(167,139,250,.14)",
                            color:
                              meta.cls === "salary" ? "var(--accent-ink)"
                              : meta.cls === "client" ? "var(--ok)"
                              : meta.cls === "refund" ? "var(--danger)"
                              : "#a78bfa",
                            fontSize: "0.72rem",
                          }}
                        >
                          {p.employee.fullName.slice(0, 2).toUpperCase()}
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div className="td-bold">{p.employee.fullName}</div>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-3)", fontFamily: "var(--font-mono)", marginTop: 2 }}>{meta.label}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="td-id">PAY-{String(p.id).padStart(4, "0")}</span>
                    </td>
                    <td style={{ fontSize: "0.78rem", color: "var(--text-2)" }}>
                      {METHOD_META[method] ?? method}
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--text-2)" }}>
                      {viDate(p.date)}
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "0.92rem", fontWeight: 800, color: dir === "in" ? "var(--ok)" : "var(--text)" }}>
                      {dir === "in" ? "+" : "−"}{fmtFull(amt)}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          status === "COMPLETED" ? "approved"
                          : status === "PENDING" ? "pending"
                          : "inactive"
                        }`}
                      >
                        {STATUS_META[status] ?? status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
