import { requireAuth } from "@/lib/current-user";
import { MANAGER_ROLES } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { InventoryClient } from "./_components/inventory-client";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const { organization, role } = await requireAuth();
  const isManager = MANAGER_ROLES.includes(role.name);

  const [categories, employees, report] = await Promise.all([
    prisma.inventoryCategory.findMany({
      where: { organizationId: organization.id },
      include: { _count: { select: { items: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.employee.findMany({
      where: { organizationId: organization.id, status: "ACTIVE" },
      select: { id: true, fullName: true, department: true },
      orderBy: { fullName: "asc" },
    }),
    prisma.inventoryItem.findMany({
      where: { organizationId: organization.id },
      select: { quantity: true, minQuantity: true, costPrice: true },
    }),
  ]);

  const totalItems = report.length;
  const lowStockCount = report.filter((i) => i.minQuantity > 0 && i.quantity <= i.minQuantity).length;
  const totalValue = report.reduce((s, i) => s + i.quantity * Number(i.costPrice ?? 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Kho</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Theo dõi tồn kho, nhập xuất và gán thiết bị cho nhân viên
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Tổng mặt hàng</p>
          <p className="text-2xl font-bold mt-1">{totalItems}</p>
        </div>
        <div className={`border rounded-xl p-4 ${lowStockCount > 0 ? "border-orange-300 bg-orange-50 dark:bg-orange-950/20" : ""}`}>
          <p className="text-xs text-muted-foreground">Tồn kho thấp</p>
          <p className={`text-2xl font-bold mt-1 ${lowStockCount > 0 ? "text-orange-600" : ""}`}>{lowStockCount}</p>
        </div>
        <div className="border rounded-xl p-4 col-span-2 sm:col-span-1">
          <p className="text-xs text-muted-foreground">Giá trị tồn kho</p>
          <p className="text-2xl font-bold mt-1">{totalValue.toLocaleString("vi-VN")}₫</p>
        </div>
      </div>

      <InventoryClient initialCategories={categories} employees={employees} isManager={isManager} />
    </div>
  );
}
