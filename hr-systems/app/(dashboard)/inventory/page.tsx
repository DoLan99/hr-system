import { requireAuth } from "@/lib/current-user";
import { MANAGER_ROLES } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { InventoryClient } from "./_components/inventory-client";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const { organization, role } = await requireAuth();
  const isManager = MANAGER_ROLES.includes(role.name);

  const [categories, employees] = await Promise.all([
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
  ]);

  return (
    <InventoryClient
      initialCategories={categories}
      employees={employees}
      isManager={isManager}
    />
  );
}
