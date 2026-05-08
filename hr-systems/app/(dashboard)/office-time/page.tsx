import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { OfficeTimeClient } from "./_components/office-time-client";

export const metadata = { title: "Office Time — HR System" };

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];

interface Props {
  searchParams: { month?: string; year?: string; employeeId?: string };
}

export default async function OfficeTimePage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = Number(session.user.id);
  const role = session.user.role;
  const isManager = MANAGER_ROLES.includes(role);

  const now = new Date();
  const month = Number(searchParams.month ?? now.getMonth() + 1);
  const year = Number(searchParams.year ?? now.getFullYear());

  const targetId =
    isManager && searchParams.employeeId ? Number(searchParams.employeeId) : userId;

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const [records, employees, targetEmployee] = await Promise.all([
    prisma.officeTime.findMany({
      where: { employeeId: targetId, date: { gte: start, lt: end } },
      include: { approvedBy: { select: { fullName: true } } },
      orderBy: { date: "asc" },
    }),

    isManager
      ? prisma.employee.findMany({
          where: { status: "ACTIVE" },
          select: { id: true, fullName: true, department: true },
          orderBy: { fullName: "asc" },
        })
      : null,

    targetId !== userId
      ? prisma.employee.findUnique({ where: { id: targetId }, select: { fullName: true } })
      : null,
  ]);

  const title = targetEmployee
    ? `Office Time — ${targetEmployee.fullName}`
    : "Office Time";

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description="Chấm công & theo dõi giờ làm hằng ngày"
      />
      <OfficeTimeClient
        initialRecords={records as any}
        initialMonth={month}
        initialYear={year}
        employeeId={targetId}
        employees={employees ?? undefined}
      />
    </div>
  );
}
