import Link from "next/link";
import { rawPrisma } from "@/lib/prisma";
import { PLANS, daysUntilTrialEnds } from "@/lib/pricing";

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

export default async function SystemOverviewPage() {
  const [orgs, totalEmployees, totalTasks, totalTimeLogs, recentOrgs, pendingUpgrades] = await Promise.all([
    rawPrisma.organization.findMany({
      include: { _count: { select: { employees: true, tasks: true } } },
    }),
    rawPrisma.employee.count(),
    rawPrisma.task.count(),
    rawPrisma.timeLog.count(),
    rawPrisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { _count: { select: { employees: true } } },
    }),
    rawPrisma.upgradeRequest.count({ where: { status: "PENDING" } }),
  ]);

  const byPlan = orgs.reduce<Record<string, number>>((acc, o) => { acc[o.plan] = (acc[o.plan] ?? 0) + 1; return acc; }, {});
  const byStatus = orgs.reduce<Record<string, number>>((acc, o) => { acc[o.status] = (acc[o.status] ?? 0) + 1; return acc; }, {});
  const mrr = orgs.reduce((sum, o) => {
    if (o.status === "ACTIVE" && o.plan !== "FREE") return sum + PLANS[o.plan as keyof typeof PLANS].priceVnd;
    return sum;
  }, 0);
  const trialExpiringSoon = orgs.filter(o => o.status === "TRIAL" && o.trialEndsAt && daysUntilTrialEnds(o.trialEndsAt) <= 3).length;

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: 0 }}>Tổng quan hệ thống</h1>
        <p style={{ fontSize: 13, color: "var(--text-3)", marginTop: 4 }}>Dữ liệu tổng hợp toàn nền tảng jobihome.vn</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Workspaces", value: orgs.length, sub: `${byStatus["ACTIVE"] ?? 0} active`, accent: false },
          { label: "Nhân viên", value: totalEmployees.toLocaleString("vi-VN"), sub: "trên tất cả org", accent: false },
          { label: "Tasks", value: totalTasks.toLocaleString("vi-VN"), sub: "toàn hệ thống", accent: false },
          { label: "MRR", value: `${(mrr / 1_000_000).toFixed(1)}M đ`, sub: "paying orgs", accent: true },
        ].map(s => (
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

      {/* Alerts */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {pendingUpgrades > 0 && (
          <div style={{ background: "rgba(59,91,219,.08)", border: "1px solid rgba(59,91,219,.2)", borderRadius: 12, padding: "11px 16px", display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#6582ff" strokeWidth={2} strokeLinecap="round" width={15} height={15}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span style={{ color: "#6582ff", fontWeight: 600 }}>{pendingUpgrades} yêu cầu nâng cấp đang chờ</span>
            <Link href="/system/upgrade-requests" style={{ marginLeft: 4, color: "#6582ff", fontSize: 12, textDecoration: "underline" }}>Xử lý →</Link>
          </div>
        )}
        {trialExpiringSoon > 0 && (
          <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", borderRadius: 12, padding: "11px 16px", display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2} strokeLinecap="round" width={15} height={15}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span style={{ color: "#ef4444", fontWeight: 600 }}>{trialExpiringSoon} workspace sắp hết trial (≤ 3 ngày)</span>
            <Link href="/system/workspaces?status=TRIAL" style={{ marginLeft: 4, color: "#ef4444", fontSize: 12, textDecoration: "underline" }}>Xem →</Link>
          </div>
        )}
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
        {/* By plan */}
        <div style={{ background: "var(--elev)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 14, textTransform: "uppercase", letterSpacing: ".05em" }}>Theo gói</div>
          {(["FREE","STARTER","TEAM"] as const).map(p => {
            const c = PLAN_COLOR[p];
            const count = byPlan[p] ?? 0;
            const pct = orgs.length ? Math.round(count / orgs.length * 100) : 0;
            return (
              <div key={p} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ width: 58, fontSize: 11, fontWeight: 700, color: c.color, background: c.bg, borderRadius: 6, padding: "2px 6px", textAlign: "center" }}>{PLANS[p].name}</span>
                <div style={{ flex: 1, height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: c.color, borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", width: 20, textAlign: "right" }}>{count}</span>
              </div>
            );
          })}
        </div>

        {/* By status */}
        <div style={{ background: "var(--elev)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 14, textTransform: "uppercase", letterSpacing: ".05em" }}>Theo trạng thái</div>
          {(["ACTIVE","TRIAL","SUSPENDED","CANCELLED"] as const).map(s => {
            const c = STATUS_COLOR[s];
            const count = byStatus[s] ?? 0;
            const pct = orgs.length ? Math.round(count / orgs.length * 100) : 0;
            return (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ width: 78, fontSize: 11, fontWeight: 600, color: c.color, background: c.bg, borderRadius: 6, padding: "2px 6px", textAlign: "center" }}>{s}</span>
                <div style={{ flex: 1, height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: c.color, borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", width: 20, textAlign: "right" }}>{count}</span>
              </div>
            );
          })}
        </div>

        {/* Quick numbers */}
        <div style={{ background: "var(--elev)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", textTransform: "uppercase", letterSpacing: ".05em" }}>Hoạt động</div>
          {[
            { label: "Time Logs", value: totalTimeLogs.toLocaleString("vi-VN") },
            { label: "Avg tasks / org", value: orgs.length ? Math.round(totalTasks / orgs.length) : 0 },
            { label: "Avg members / org", value: orgs.length ? Math.round(totalEmployees / orgs.length) : 0 },
            { label: "Seat utilization", value: orgs.length ? `${Math.round(orgs.reduce((s, o) => s + (o._count.employees / o.seatLimit), 0) / orgs.length * 100)}%` : "—" },
          ].map(r => (
            <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "var(--text-3)" }}>{r.label}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent orgs */}
      <div style={{ background: "var(--elev)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Workspace mới nhất</span>
          <Link href="/system/workspaces" style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none" }}>Xem tất cả →</Link>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--content)" }}>
              {["Workspace","Gói","Trạng thái","Thành viên","Tasks","Tạo ngày",""].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "9px 16px", fontSize: 11, color: "var(--text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentOrgs.map(o => {
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
                  <td style={{ padding: "10px 16px", color: "var(--text-2)" }}>{o._count.employees}</td>
                  <td style={{ padding: "10px 16px", fontSize: 12, color: "var(--text-3)" }}>{new Date(o.createdAt).toLocaleDateString("vi-VN")}</td>
                  <td style={{ padding: "10px 16px" }}>
                    <Link href={`/system/workspaces/${o.id}`} style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>Xem →</Link>
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
