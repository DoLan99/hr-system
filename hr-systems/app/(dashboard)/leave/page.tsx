import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/current-user";
import { MANAGER_ROLES } from "@/lib/api-auth";
import { LeaveClient } from "./_components/leave-client";

export const dynamic = "force-dynamic";

export default async function LeavePage() {
  const { employee, organization, role } = await requireAuth();
  const userId = employee.id;
  const isManager = MANAGER_ROLES.includes(role.name);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const where: any = {
    organizationId: organization.id,
    date: { gte: start, lt: end },
  };
  if (!isManager) where.employeeId = userId;

  const [leaves, employees] = await Promise.all([
    prisma.leave.findMany({
      where,
      include: {
        employee: { select: { id: true, fullName: true, department: true } },
        approvedBy: { select: { id: true, fullName: true } },
      },
      orderBy: { date: "desc" },
    }),
    isManager
      ? prisma.employee.findMany({
          where: { organizationId: organization.id, status: "ACTIVE" },
          select: { id: true, fullName: true, department: true },
          orderBy: { fullName: "asc" },
        })
      : [],
  ]);

  return (
    <LeaveClient
      initialLeaves={JSON.parse(JSON.stringify(leaves))}
      initialMonth={month}
      initialYear={year}
      employees={employees}
      currentUserId={userId}
    />
  );
}
