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

  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const whereAll: any = { organizationId: organization.id };
  if (!isManager) whereAll.employeeId = userId;

  const whereMonth: any = {
    organizationId: organization.id,
    date: { gte: startOfMonth, lt: endOfMonth },
  };
  if (!isManager) whereMonth.employeeId = userId;

  const whereToday: any = {
    organizationId: organization.id,
    date: { gte: today, lt: tomorrow },
    status: "APPROVED",
  };

  const [leaves, employees, todayLeaves] = await Promise.all([
    prisma.leave.findMany({
      where: whereAll,
      include: {
        employee: { select: { id: true, fullName: true, department: true } },
        approvedBy: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    isManager
      ? prisma.employee.findMany({
          where: { organizationId: organization.id, status: "ACTIVE" },
          select: { id: true, fullName: true, department: true },
          orderBy: { fullName: "asc" },
        })
      : [],
    prisma.leave.findMany({
      where: whereToday,
      include: {
        employee: { select: { id: true, fullName: true, department: true } },
      },
    }),
  ]);

  // Compute KPIs
  const pendingCount = leaves.filter((l) => l.status === "PENDING").length;
  const approvedMonth = leaves.filter(
    (l) =>
      l.status === "APPROVED" &&
      l.date >= startOfMonth &&
      l.date < endOfMonth
  );
  const approvedMonthHours = approvedMonth.reduce(
    (sum, l) => sum + Number(l.requestedHours),
    0
  );
  const onLeaveToday = todayLeaves.length;
  const totalRequests = leaves.length;

  return (
    <LeaveClient
      initialLeaves={JSON.parse(JSON.stringify(leaves))}
      initialMonth={month}
      initialYear={year}
      employees={employees}
      currentUserId={userId}
      todayLeaves={JSON.parse(JSON.stringify(todayLeaves))}
      kpis={{
        pendingCount,
        approvedMonthCount: approvedMonth.length,
        approvedMonthHours: Math.round(approvedMonthHours),
        onLeaveToday,
        totalRequests,
      }}
    />
  );
}
