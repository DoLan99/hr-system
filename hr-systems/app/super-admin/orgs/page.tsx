import Link from "next/link";
import { rawPrisma } from "@/lib/prisma";
import { daysUntilTrialEnds } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function OrgsListPage() {
  const orgs = await rawPrisma.organization.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { _count: { select: { employees: true, tasks: true } } },
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Organizations</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{orgs.length} workspaces</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <tr>
              <th className="text-left px-5 py-2.5">Workspace</th>
              <th className="text-left px-5 py-2.5">Plan</th>
              <th className="text-left px-5 py-2.5">Status</th>
              <th className="text-left px-5 py-2.5">Members</th>
              <th className="text-left px-5 py-2.5">Tasks</th>
              <th className="text-left px-5 py-2.5">Trial / Expires</th>
              <th className="text-left px-5 py-2.5">Created</th>
              <th className="px-5 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {orgs.map((o) => (
              <tr key={o.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-5 py-2.5">
                  <div className="font-medium text-slate-900 dark:text-slate-100">{o.name}</div>
                  <code className="text-xs text-slate-500 dark:text-slate-400">{o.slug}</code>
                </td>
                <td className="px-5 py-2.5 font-medium">{o.plan}</td>
                <td className="px-5 py-2.5">
                  <StatusBadge status={o.status} />
                </td>
                <td className="px-5 py-2.5">{o._count.employees}/{o.seatLimit}</td>
                <td className="px-5 py-2.5">{o._count.tasks}</td>
                <td className="px-5 py-2.5 text-xs">
                  {o.trialEndsAt
                    ? `${new Date(o.trialEndsAt).toLocaleDateString("vi-VN")} (${daysUntilTrialEnds(o.trialEndsAt)}d)`
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

function StatusBadge({ status }: { status: string }) {
  const color = status === "ACTIVE" ? "bg-emerald-100 text-emerald-700"
    : status === "TRIAL" ? "bg-amber-100 text-amber-700"
    : status === "SUSPENDED" ? "bg-red-100 text-red-700"
    : "bg-slate-100 text-slate-700";
  return <span className={`text-xs px-2 py-0.5 rounded font-medium ${color}`}>{status}</span>;
}
