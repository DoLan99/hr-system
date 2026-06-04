import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/current-user";
import { MANAGER_ROLES } from "@/lib/api-auth";
import { SummaryClient } from "./_components/summary-client";

export const dynamic = "force-dynamic";

export default async function SummaryPage() {
  const { employee, organization, role } = await requireAuth();
  const userId = employee.id;
  const isManager = MANAGER_ROLES.includes(role.name);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const where: any = {
    organizationId: organization.id,
    month, year,
  };
  if (!isManager) where.employeeId = userId;

  const summaries = await prisma.salarySummary.findMany({
    where,
    include: {
      employee: {
        select: {
          id: true, fullName: true, department: true,
          payType: true, hourlyRate: true, monthlySalary: true,
        },
      },
      confirmedBy: { select: { id: true, fullName: true } },
    },
    orderBy: { employee: { fullName: "asc" } },
  });

  return (
    <SummaryClient
      initialSummaries={JSON.parse(JSON.stringify(summaries))}
      initialMonth={month}
      initialYear={year}
      employeeId={userId}
    />
  );
}
