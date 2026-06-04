import { requireAuth } from "@/lib/current-user";

export default async function DashboardPage() {
  const { employee, organization, role } = await requireAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Xin chào, {employee.fullName} 👋
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Workspace <strong>{organization.name}</strong> · Role: {role.label}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6 space-y-3 border border-slate-200 dark:border-slate-800">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          🚧 Đang migrate sang Multi-tenant SaaS
        </h2>
        <p className="text-sm text-slate-700 dark:text-slate-300">
          Các module đang chờ migrate sang flow mới (Clerk auth + tenant context):
        </p>
        <ul className="text-sm text-slate-600 dark:text-slate-400 list-disc list-inside space-y-1">
          <li>Employees, Customers, Tasks, Time Logs</li>
          <li>Office Time, Leave, Messages</li>
          <li>Summary, Payments</li>
          <li>Admin pages (audit, anomalies, activity)</li>
        </ul>
        <p className="text-xs text-slate-500 dark:text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-800">
          Foundation OK: Clerk auth ✓ · Subdomain routing ✓ · Tenant isolation Prisma ✓ · Sidebar/Topbar ✓
        </p>
      </div>
    </div>
  );
}
