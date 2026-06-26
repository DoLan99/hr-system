"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
function daysUntilTrialEnds(iso: string): number {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
}

type Org = {
  id: string; name: string; slug: string; plan: string; status: string;
  seatLimit: number; trialEndsAt: string | null; createdAt: string;
  _count: { employees: number; tasks: number };
};

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  ACTIVE:    { bg: "rgba(34,197,94,.12)",  color: "#22c55e" },
  TRIAL:     { bg: "rgba(245,158,11,.12)", color: "#f59e0b" },
  SUSPENDED: { bg: "rgba(239,68,68,.12)",  color: "#ef4444" },
  CANCELLED: { bg: "rgba(148,163,184,.12)",color: "#94a3b8" },
};
const PLAN_COLOR: Record<string, { bg: string; color: string }> = {
  FREE:    { bg: "rgba(148,163,184,.12)", color: "#94a3b8" },
  STARTER: { bg: "rgba(59,91,219,.12)",   color: "#6582ff" },
  TEAM:    { bg: "rgba(167,139,250,.12)", color: "#a78bfa" },
};

export function OrgsClient({ orgs, initialStatus }: { orgs: Org[]; initialStatus?: string }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(initialStatus ?? "");
  const [plan, setPlan] = useState("");
  const [sort, setSort] = useState<"createdAt" | "name" | "employees" | "tasks">("createdAt");

  const filtered = useMemo(() => {
    let list = orgs;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(o => o.name.toLowerCase().includes(q) || o.slug.toLowerCase().includes(q));
    }
    if (status) list = list.filter(o => o.status === status);
    if (plan) list = list.filter(o => o.plan === plan);
    list = [...list].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "employees") return b._count.employees - a._count.employees;
      if (sort === "tasks") return b._count.tasks - a._count.tasks;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return list;
  }, [orgs, search, status, plan, sort]);

  return (
    <div>
      {/* Filter bar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 200px", minWidth: 180 }}>
          <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth={2} width={15} height={15}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên, slug…"
            style={{ width: "100%", background: "var(--elev)", border: "1px solid var(--border)", borderRadius: 9, padding: "8px 12px 8px 32px", fontSize: 13, color: "var(--text)", outline: "none", boxSizing: "border-box" }}
          />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)} style={selStyle}>
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="TRIAL">TRIAL</option>
          <option value="SUSPENDED">SUSPENDED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
        <select value={plan} onChange={e => setPlan(e.target.value)} style={selStyle}>
          <option value="">Tất cả gói</option>
          <option value="FREE">FREE</option>
          <option value="STARTER">STARTER</option>
          <option value="TEAM">TEAM</option>
        </select>
        <select value={sort} onChange={e => setSort(e.target.value as typeof sort)} style={selStyle}>
          <option value="createdAt">Mới nhất</option>
          <option value="name">Tên A→Z</option>
          <option value="employees">Nhiều thành viên</option>
          <option value="tasks">Nhiều task</option>
        </select>
        <span style={{ fontSize: 12, color: "var(--text-3)", marginLeft: "auto", whiteSpace: "nowrap" }}>{filtered.length} / {orgs.length} workspace</span>
      </div>

      {/* Table */}
      <div style={{ background: "var(--elev)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--content)" }}>
              {["Workspace","Gói","Trạng thái","Thành viên","Tasks","Trial","Tạo ngày",""].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "9px 16px", fontSize: 11, color: "var(--text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>Không có workspace nào</td></tr>
            ) : filtered.map(o => {
              const sc = STATUS_COLOR[o.status] ?? STATUS_COLOR.CANCELLED;
              const pc = PLAN_COLOR[o.plan] ?? PLAN_COLOR.FREE;
              const daysLeft = o.status === "TRIAL" && o.trialEndsAt ? daysUntilTrialEnds(o.trialEndsAt) : null;
              return (
                <tr key={o.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ padding: "11px 16px" }}>
                    <div style={{ fontWeight: 600, color: "var(--text)" }}>{o.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "monospace" }}>{o.slug}</div>
                  </td>
                  <td style={{ padding: "11px 16px" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: pc.color, background: pc.bg, borderRadius: 6, padding: "2px 8px" }}>{o.plan}</span>
                  </td>
                  <td style={{ padding: "11px 16px" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: sc.color, background: sc.bg, borderRadius: 6, padding: "2px 8px" }}>{o.status}</span>
                  </td>
                  <td style={{ padding: "11px 16px", color: "var(--text-2)" }}>
                    <span style={{ fontWeight: o._count.employees >= o.seatLimit ? 700 : 400, color: o._count.employees >= o.seatLimit ? "#f59e0b" : "var(--text-2)" }}>
                      {o._count.employees}
                    </span>
                    <span style={{ color: "var(--text-3)" }}>/{o.seatLimit}</span>
                  </td>
                  <td style={{ padding: "11px 16px", color: "var(--text-2)" }}>{o._count.tasks}</td>
                  <td style={{ padding: "11px 16px", fontSize: 12 }}>
                    {daysLeft !== null ? (
                      <span style={{ color: daysLeft <= 3 ? "#ef4444" : daysLeft <= 7 ? "#f59e0b" : "var(--text-2)", fontWeight: daysLeft <= 7 ? 700 : 400 }}>
                        {daysLeft}d
                      </span>
                    ) : "—"}
                  </td>
                  <td style={{ padding: "11px 16px", fontSize: 12, color: "var(--text-3)", whiteSpace: "nowrap" }}>
                    {new Date(o.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td style={{ padding: "11px 16px" }}>
                    <Link href={`/super-admin/orgs/${o.id}`} style={{
                      fontSize: 12, color: "var(--accent)", textDecoration: "none", fontWeight: 600,
                      background: "var(--accent-soft)", borderRadius: 7, padding: "4px 10px",
                      display: "inline-block",
                    }}>Quản lý →</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const selStyle: React.CSSProperties = {
  background: "var(--elev)", border: "1px solid var(--border)", borderRadius: 9,
  padding: "8px 12px", fontSize: 13, color: "var(--text)", outline: "none", cursor: "pointer",
};
