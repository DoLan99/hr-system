import Link from "next/link";
import { rawPrisma } from "@/lib/prisma";
import { formatVnd, PLANS, daysUntilTrialEnds } from "@/lib/pricing";

export const dynamic = "force-dynamic";

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

export default async function SuperAdminDashboard() {
  const [orgs, totalEmployees, totalTasks] = await Promise.all([
    rawPrisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { employees: true, tasks: true } } },
    }),
    rawPrisma.employee.count(),
    rawPrisma.task.count(),
  ]);

  const byPlan = orgs.reduce<Record<string, number>>((acc, o) => {
    acc[o.plan] = (acc[o.plan] ?? 0) + 1; return acc;
  }, {});
  const byStatus = orgs.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1; return acc;
  }, {});
  const mrr = orgs.reduce((sum, o) => {
    if (o.status === "ACTIVE" && o.plan !== "FREE") return sum + PLANS[o.plan as keyof typeof PLANS].priceVnd;
    return sum;
  }, 0);
  const trialExpiringSoon = orgs.filter(o => o.status === "TRIAL" && o.trialEndsAt && daysUntilTrialEnds(o.trialEndsAt) <= 3).length;

  const stats = [
    { label: "Tổng workspaces", value: orgs.length, sub: `${byStatus["ACTIVE"] ?? 0} active`, accent: false },
    { label: "Nhân viên", value: totalEmployees, sub: `trên ${orgs.length} org`, accent: false },
    { label: "Tasks", value: totalTasks.toLocaleString("vi-VN"), sub: "tất cả org", accent: false },
    { label: "MRR", value: formatVnd(mrr), sub: "paying orgs only", accent: true },
  ];

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: 0 }}>Tổng quan hệ thống</h1>
        <p style={{ fontSize: 13, color: "var(--text-3)", marginTop: 4 }}>Tất cả workspaces trên jobihome.vn</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
        {stats.map(s => (
          <div key={s.label} style={{
            background: s.accent ? "rgba(245,158,11,.08)" : "var(--elev)",
            border: `1px solid ${s.accent ? "rgba(245,158,11,.25)" : "var(--border)"}`,
            borderRadius: 14, padding: "18px 20px",
          }}>
            <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.accent ? "#f59e0b" : "var(--text)" }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 3 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {trialExpiringSoon > 0 && (
        <div style={{
          background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)",
          borderRadius: 12, padding: "12px 16px", marginBottom: 20,
          display: "flex", alignItems: "center", gap: 10, fontSize: 13,
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2} strokeLinecap="round" width={16} height={16}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span style={{ color: "#ef4444", fontWeight: 600 }}>{trialExpiringSoon} workspace sắp hết trial (≤ 3 ngày)</span>
          <Link href="/super-admin/orgs?status=TRIAL" style={{ marginLeft: "auto", color: "#ef4444", fontSize: 12, textDecoration: "underline" }}>Xem ngay →</Link>
        </div>
      )}

      {/* By plan / status */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
        <div style={{ background: "var(--elev)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 14, textTransform: "uppercase", letterSpacing: ".05em" }}>Theo gói</div>
          {(["FREE","STARTER","TEAM"] as const).map(p => {
            const c = PLAN_COLOR[p];
            const count = byPlan[p] ?? 0;
            const pct = orgs.length ? Math.round(count / orgs.length * 100) : 0;
            return (
              <div key={p} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ width: 60, fontSize: 12, fontWeight: 600, color: c.color, background: c.bg, borderRadius: 6, padding: "2px 7px", textAlign: "center" }}>{PLANS[p].name}</span>
                <div style={{ flex: 1, height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: c.color, borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", width: 24, textAlign: "right" }}>{count}</span>
              </div>
            );
          })}
        </div>
        <div style={{ background: "var(--elev)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 14, textTransform: "uppercase", letterSpacing: ".05em" }}>Theo trạng thái</div>
          {(["ACTIVE","TRIAL","SUSPENDED","CANCELLED"] as const).map(s => {
            const c = STATUS_COLOR[s];
            const count = byStatus[s] ?? 0;
            const pct = orgs.length ? Math.round(count / orgs.length * 100) : 0;
            return (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ width: 80, fontSize: 11, fontWeight: 600, color: c.color, background: c.bg, borderRadius: 6, padding: "2px 7px", textAlign: "center" }}>{s}</span>
                <div style={{ flex: 1, height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: c.color, borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", width: 24, textAlign: "right" }}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent orgs */}
      <div style={{ background: "var(--elev)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Workspace gần đây</span>
          <Link href="/super-admin/orgs" style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none" }}>Xem tất cả →</Link>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--content)" }}>
              {["Workspace","Gói","Trạng thái","Thành viên","Tasks","Trial","Tạo ngày",""].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "9px 16px", fontSize: 11, color: "var(--text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orgs.slice(0, 15).map(o => {
              const sc = STATUS_COLOR[o.status] ?? STATUS_COLOR.CANCELLED;
              const pc = PLAN_COLOR[o.plan] ?? PLAN_COLOR.FREE;
              return (
                <tr key={o.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ padding: "10px 16px" }}>
                    <div style={{ fontWeight: 600, color: "var(--text)" }}>{o.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "monospace" }}>{o.slug}</div>
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: pc.color, background: pc.bg, borderRadius: 6, padding: "2px 8px" }}>{o.plan}</span>
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: sc.color, background: sc.bg, borderRadius: 6, padding: "2px 8px" }}>{o.status}</span>
                  </td>
                  <td style={{ padding: "10px 16px", color: "var(--text-2)" }}>{o._count.employees}/{o.seatLimit}</td>
                  <td style={{ padding: "10px 16px", color: "var(--text-2)" }}>{o._count.tasks}</td>
                  <td style={{ padding: "10px 16px", fontSize: 12, color: "var(--text-2)" }}>
                    {o.status === "TRIAL" && o.trialEndsAt ? `${daysUntilTrialEnds(o.trialEndsAt)}d` : "—"}
                  </td>
                  <td style={{ padding: "10px 16px", fontSize: 12, color: "var(--text-3)", whiteSpace: "nowrap" }}>
                    {new Date(o.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <Link href={`/super-admin/orgs/${o.id}`} style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>Quản lý →</Link>
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
