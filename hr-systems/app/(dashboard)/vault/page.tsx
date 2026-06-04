import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/current-user";
import { MANAGER_ROLES } from "@/lib/api-auth";
import { VaultClient } from "./_components/vault-client";

export const dynamic = "force-dynamic";

export default async function VaultPage() {
  const { organization, role } = await requireAuth();
  const isManager = MANAGER_ROLES.includes(role.name);

  const orgFilter = { organizationId: organization.id };

  const [vaults, employees, customers] = await Promise.all([
    prisma.passwordVault.findMany({
      where: orgFilter,
      select: {
        id: true, scope: true, entityName: true, customerId: true, serviceApp: true,
        loginUrl: true, username: true, emailUsed: true, twoFaMethod: true,
        ownerId: true, rotationDays: true, notes: true, lastUpdated: true,
        customer: { select: { id: true, customerName: true } },
        owner: { select: { id: true, fullName: true } },
      },
      orderBy: { lastUpdated: "desc" },
    }),
    prisma.employee.findMany({
      where: { ...orgFilter, status: "ACTIVE" },
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
    }),
    prisma.customer.findMany({
      where: { ...orgFilter, status: { not: "INACTIVE" } },
      select: { id: true, customerName: true, businessName: true },
      orderBy: { customerName: "asc" },
    }),
  ]);

  return (
    <VaultClient
      initialVaults={JSON.parse(JSON.stringify(vaults))}
      employees={employees}
      customers={customers}
      isManager={isManager}
    />
  );
}
