import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/current-user";
import { MANAGER_ROLES } from "@/lib/api-auth";
import { PaymentsClient } from "./PaymentsClient";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const { employee, organization, role } = await requireAuth();
  const userId = employee.id;
  const isManager = MANAGER_ROLES.includes(role.name);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const where: any = {
    organizationId: organization.id,
    summaryMonth: month,
    summaryYear: year,
  };
  if (!isManager) where.employeeId = userId;

  const [payments, employees] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        employee: { select: { id: true, fullName: true, department: true } },
        createdBy: { select: { id: true, fullName: true } },
      },
      orderBy: { date: "desc" },
    }),
    isManager
      ? prisma.employee.findMany({
          where: { organizationId: organization.id, status: { not: "INACTIVE" } },
          select: { id: true, fullName: true, department: true },
          orderBy: { fullName: "asc" },
        })
      : [],
  ]);

  const totalIn = payments
    .filter((p) => ["SALARY", "BONUS", "OTHER"].includes(p.type))
    .reduce((s, p) => s + Number(p.amount), 0);
  const totalOut = payments
    .filter((p) => ["ADVANCE", "DEDUCTION"].includes(p.type))
    .reduce((s, p) => s + Number(p.amount), 0);
  const pendingCount = payments.filter((p) => (p as any).status === "PENDING").length;

  return (
    <PaymentsClient
      initialPayments={JSON.parse(JSON.stringify(payments))}
      initialMonth={month}
      initialYear={year}
      employees={employees}
      totalIn={totalIn}
      totalOut={totalOut}
      pendingCount={pendingCount}
    />
  );
}
