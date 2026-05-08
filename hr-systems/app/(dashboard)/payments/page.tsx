import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PaymentsClient } from "./_components/payments-client";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const userId = Number(session.user.id);
  const isManager = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"].includes((session.user as any).role);

  const where: any = { summaryMonth: month, summaryYear: year };
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
          where: { status: { not: "INACTIVE" } },
          select: { id: true, fullName: true, department: true },
          orderBy: { fullName: "asc" },
        })
      : [],
  ]);

  return (
    <PaymentsClient
      initialPayments={JSON.parse(JSON.stringify(payments))}
      initialMonth={month}
      initialYear={year}
      employees={employees}
    />
  );
}
