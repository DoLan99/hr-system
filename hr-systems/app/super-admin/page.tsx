import Link from "next/link";
import { rawPrisma } from "@/lib/prisma";
import { formatVnd, PLANS, daysUntilTrialEnds } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function SuperAdminDashboard() {
  const [orgs, totalEmployees, totalTasks] = await Promise.all([
    rawPrisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { employees: true } } },
    }),
    rawPrisma.employee.count(),
    rawPrisma.task.count(),
  ]);

  const byPlan = orgs.reduce<Record<string, number>>((acc, o) => {
    acc[o.plan] = (acc[o.plan] ?? 0) + 1;
    return acc;
  }, {});

  const byStatus = orgs.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});

  const mrr = orgs.reduce((sum, o) => {
    if (o.status === "ACTIVE" && o.plan !== "FREE") {
      return sum + PLANS[o.plan as keyof typeof PLANS].priceVnd;
    }
    return sum;
  }, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Overview</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Tổng quan tất cả workspaces trên jobihome.vn
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Orgs" value={orgs.length} />
        <StatCard label="Total Employees" value={totalEmployees} />
        <StatCard label="Total Tasks" value={totalTasks} />
        <StatCard label="MRR (paying)" value={formatVnd(mrr)} highlight />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Panel title="By Plan">
          {(["FREE", "STARTER", "TEAM"] as const).map((p) => (
            <Row key={p} label={PLANS[p].name} value={byPlan[p] ?? 0} />
          ))}
        </Panel>
        <Panel title="By Status">
          {(["TRIAL", "ACTIVE", "SUSPENDED", "CANCELLED"] as const).map((s) => (
            <Row key={s} label={s} value={byStatus[s] ?? 0} />
          ))}
        </Panel>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Recent Organizations</h2>
          <Link href="/super-admin/orgs" className="text-xs text-blue-600 hover:underline">Xem tất cả →</Link>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <tr>
              <th className="text-left px-5 py-2">Workspace</th>
              <th className="text-left px-5 py-2">Plan</th>
              <th className="text-left px-5 py-2">Status</th>
              <th className="text-left px-5 py-2">Members</th>
              <th className="text-left px-5 py-2">Trial</th>
              <th className="text-left px-5 py-2">Created</th>
              <th className="px-5 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {orgs.slice(0, 20).map((o) => (
              <tr key={o.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-5 py-2.5">
                  <div className="font-medium text-slate-900 dark:text-slate-100">{o.name}</div>
                  <code className="text-xs text-slate-500 dark:text-slate-400">{o.slug}.jobihome.vn</code>
                </td>
                <td className="px-5 py-2.5">
                  <PlanBadge plan={o.plan} />
                </td>
                <td className="px-5 py-2.5">
                  <StatusBadge status={o.status} />
                </td>
                <td className="px-5 py-2.5">{o._count.employees} / {o.seatLimit}</td>
                <td className="px-5 py-2.5 text-xs">
                  {o.status === "TRIAL" && o.trialEndsAt
                    ? `${daysUntilTrialEnds(o.trialEndsAt)}d left`
                    : "—"}
                </td>
                <td className="px-5 py-2.5 text-xs text-slate-500">
                  {new Date(o.createdAt).toLocaleDateString("vi-VN")}
                </td>
                <td className="px-5 py-2.5">
                  <Link
                    href={`/super-admin/orgs/${o.id}`}
                    className="text-blue-600 hover:underline text-xs font-medium"
                  >
                    Manage →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: number | string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"}`}>
      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${highlight ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-slate-100"}`}>
        {typeof value === "number" ? value.toLocaleString("vi-VN") : value}
      </p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-2">
      <h3 className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-sm py-1">
      <span className="text-slate-700 dark:text-slate-300">{label}</span>
      <span className="font-semibold text-slate-900 dark:text-slate-100">{value}</span>
    </div>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const color = plan === "FREE" ? "bg-slate-100 text-slate-700" : plan === "STARTER" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700";
  return <span className={`text-xs px-2 py-0.5 rounded font-medium ${color}`}>{plan}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const color = status === "ACTIVE" ? "bg-emerald-100 text-emerald-700"
    : status === "TRIAL" ? "bg-amber-100 text-amber-700"
    : status === "SUSPENDED" ? "bg-red-100 text-red-700"
    : "bg-slate-100 text-slate-700";
  return <span className={`text-xs px-2 py-0.5 rounded font-medium ${color}`}>{status}</span>;
}
