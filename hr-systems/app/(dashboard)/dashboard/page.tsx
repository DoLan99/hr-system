import { requireAuth } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { employee, organization, role } = await requireAuth();

  // Low-stock widget data
  const allItems = await prisma.inventoryItem.findMany({
    where: { organizationId: organization.id, minQuantity: { gt: 0 } },
    select: { id: true, name: true, quantity: true, minQuantity: true, unit: true },
  });
  const lowStockItems = allItems.filter((i) => i.quantity <= i.minQuantity).slice(0, 5);

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

      {/* Low-stock widget */}
      {lowStockItems.length > 0 && (
        <div className="border border-orange-200 dark:border-orange-900 rounded-xl p-5 bg-orange-50 dark:bg-orange-950/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <h2 className="font-semibold text-orange-700 dark:text-orange-400 text-sm">
                Tồn kho thấp — {lowStockItems.length} mặt hàng
              </h2>
            </div>
            <Link href="/inventory" className="text-xs text-orange-600 dark:text-orange-400 hover:underline">
              Xem tất cả →
            </Link>
          </div>
          <ul className="space-y-1.5">
            {lowStockItems.map((item) => (
              <li key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-700 dark:text-slate-300 truncate max-w-[60%]">{item.name}</span>
                <span className="font-medium text-orange-600 dark:text-orange-400">
                  {item.quantity}/{item.minQuantity} {item.unit}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
