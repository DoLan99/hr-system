"use client";

import Link from "next/link";
import { useState, useMemo } from "react";

type Org = {
  id: string; name: string; slug: string; plan: string; status: string;
  seatLimit: number; trialEndsAt: string | null; createdAt: string;
  _count: { employees: number; tasks: number; timeLogs: number };
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

function daysLeft(iso: string) { return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000); }

export function WorkspacesClient({ orgs, initialStatus }: { orgs: Org[]; initialStatus?: string }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(initialStatus ?? "");
  const [plan, setPlan] = useState("");
  const [sort, setSort] = useState<"createdAt"|"name"|"employees"|"tasks">("createdAt");

  const filtered = useMemo(() => {
    let list = orgs;
    if (search) { const q = search.toLowerCase(); list = list.filter(o => o.name.toLowerCase().includes(q) || o.slug.toLowerCase().includes(q)); }
    if (status) list = list.filter(o => o.status === status);
    if (plan) list = list.filter(o => o.plan === plan);
    return [...list].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "employees") return b._count.employees - a._count.employees;
      if (sort === "tasks") return b._count.tasks - a._count.tasks;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [orgs, search, status, plan, sort]);

  return (
    <div>
      {/* Filter bar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 200px", minWidth: 180 }}>
          <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth={2} width={14} height={14}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm tên, slug…" style={{ width: "100%", background: "var(--elev)", border: "1px solid var(--border)", borderRadius: 9, padding: "8px 12px 8px 32px", fontSize: 13, color: "var(--text)", outline: "none", boxSizing: "border-box" }} />
        </div>
        {[
          { value: status, onChange: (v: string) => setStatus(v), opts: [["","Tất cả trạng thái"],["ACTIVE","ACTIVE"],["TRIAL","TRIAL"],["SUSPENDED","SUSPENDED"],["CANCELLED","CANCELLED"]] },
          { value: plan,   onChange: (v: string) => setPlan(v),   opts: [["","Tất cả gói"],["FREE","FREE"],["STARTER","STARTER"],["TEAM","TEAM"]] },
          { value: sort,   onChange: (v: string) => setSort(v as typeof sort), opts: [["createdAt","Mới nhất"],["name","Tên A→Z"],["employees","Nhiều NV"],["tasks","Nhiều task"]] },
        ].map((s, i) => (
          <select key={i} value={s.value} onChange={e => s.onChange(e.target.value)} style={{ background: "var(--elev)", border: "1px solid var(--border)", borderRadius: 9, padding: "8px 12px", fontSize: 13, color: "var(--text)", outline: "none", cursor: "pointer" }}>
            {s.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        ))}
        <span style={{ fontSize: 12, color: "var(--text-3)", marginLeft: "auto", whiteSpace: "nowrap" }}>{filtered.length} / {orgs.length} workspace</span>
      </div>

      {/* Table */}
      <div style={{ background: "var(--elev)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--content)" }}>
              {["Workspace","Gói","Trạng thái","NV","Tasks","TimeLogs","Trial","Tạo ngày",""].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "9px 14px", fontSize: 11, color: "var(--text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: "32px", textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>Không có workspace nào</td></tr>
            ) : filtered.map(o => {
              const sc = STATUS_COLOR[o.status] ?? STATUS_COLOR.CANCELLED;
              const pc = PLAN_COLOR[o.plan] ?? PLAN_COLOR.FREE;
              const dl = o.status === "TRIAL" && o.trialEndsAt ? daysLeft(o.trialEndsAt) : null;
              return (
                <tr key={o.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ fontWeight: 600, color: "var(--text)" }}>{o.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "monospace" }}>{o.slug}</div>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: pc.color, background: pc.bg, borderRadius: 6, padding: "2px 7px" }}>{o.plan}</span>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: sc.color, background: sc.bg, borderRadius: 6, padding: "2px 7px" }}>{o.status}</span>
                  </td>
                  <td style={{ padding: "10px 14px", color: "var(--text-2)", fontSize: 12 }}>
                    <span style={{ color: o._count.employees >= o.seatLimit ? "#f59e0b" : "var(--text-2)", fontWeight: o._count.employees >= o.seatLimit ? 700 : 400 }}>{o._count.employees}</span>/{o.seatLimit}
                  </td>
                  <td style={{ padding: "10px 14px", color: "var(--text-2)", fontSize: 12 }}>{o._count.tasks}</td>
                  <td style={{ padding: "10px 14px", color: "var(--text-2)", fontSize: 12 }}>{o._count.timeLogs}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12 }}>
                    {dl !== null ? <span style={{ color: dl <= 3 ? "#ef4444" : dl <= 7 ? "#f59e0b" : "var(--text-2)", fontWeight: dl <= 7 ? 700 : 400 }}>{dl}d</span> : "—"}
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 11, color: "var(--text-3)", whiteSpace: "nowrap" }}>{new Date(o.createdAt).toLocaleDateString("vi-VN")}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <Link href={`/system/workspaces/${o.id}`} style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none", fontWeight: 600, background: "var(--accent-soft)", borderRadius: 7, padding: "4px 10px", display: "inline-block" }}>Xem →</Link>
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
