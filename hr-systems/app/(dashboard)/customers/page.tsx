import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/current-user";
import { MANAGER_ROLES } from "@/lib/api-auth";
import { CustomersClient } from "./_components/customers-client";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const { organization, role } = await requireAuth();
  const isManager = MANAGER_ROLES.includes(role.name);

  const [customers, employees] = await Promise.all([
    prisma.customer.findMany({
      where: { organizationId: organization.id },
      include: {
        responsibleStaff: { select: { id: true, fullName: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: { customerName: "asc" },
    }),
    isManager
      ? prisma.employee.findMany({
          where: { organizationId: organization.id, status: "ACTIVE" },
          select: { id: true, fullName: true },
          orderBy: { fullName: "asc" },
        })
      : [],
  ]);

  return (
    <CustomersClient
      initialCustomers={JSON.parse(JSON.stringify(customers))}
      employees={employees}
    />
  );
}
