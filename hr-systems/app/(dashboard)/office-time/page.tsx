import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/current-user";
import { MANAGER_ROLES } from "@/lib/api-auth";
import { OfficeTimeClient } from "./_components/office-time-client";

export const metadata = { title: "Office Time — HR System" };

interface Props {
  searchParams: { month?: string; year?: string; employeeId?: string };
}

export default async function OfficeTimePage({ searchParams }: Props) {
  const { employee, organization, role } = await requireAuth();
  const userId = employee.id;
  const isManager = MANAGER_ROLES.includes(role.name);

  const now = new Date();
  const month = Number(searchParams.month ?? now.getMonth() + 1);
  const year = Number(searchParams.year ?? now.getFullYear());

  const targetId =
    isManager && searchParams.employeeId ? Number(searchParams.employeeId) : userId;

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const [records, employees, targetEmployee] = await Promise.all([
    prisma.officeTime.findMany({
      where: {
        organizationId: organization.id,
        employeeId: targetId,
        date: { gte: start, lt: end },
      },
      include: { approvedBy: { select: { fullName: true } } },
      orderBy: { date: "asc" },
    }),

    isManager
      ? prisma.employee.findMany({
          where: { organizationId: organization.id, status: "ACTIVE" },
          select: { id: true, fullName: true, department: true },
          orderBy: { fullName: "asc" },
        })
      : null,

    targetId !== userId
      ? prisma.employee.findFirst({
          where: { organizationId: organization.id, id: targetId },
          select: { fullName: true },
        })
      : null,
  ]);

  return (
    <OfficeTimeClient
      initialRecords={records as any}
      initialMonth={month}
      initialYear={year}
      employeeId={targetId}
      employees={employees ?? undefined}
      viewingName={targetEmployee?.fullName ?? null}
    />
  );
}
