import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { VaultClient } from "./_components/vault-client";

export const dynamic = "force-dynamic";

export default async function VaultPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const isManager = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"].includes((session.user as any).role);

  const [vaults, employees, customers] = await Promise.all([
    prisma.passwordVault.findMany({
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
      where: { status: "ACTIVE" },
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
    }),
    prisma.customer.findMany({
      where: { status: { not: "INACTIVE" } },
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
