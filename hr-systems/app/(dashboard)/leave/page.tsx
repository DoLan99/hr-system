import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/current-user";
import { MANAGER_ROLES } from "@/lib/api-auth";
import { LeaveClient } from "./_components/leave-client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;
const VALID_STATUS = new Set(["PENDING", "APPROVED", "REJECTED"]);

export default async function LeavePage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string; page?: string; status?: string };
}) {
  const { employee, organization, role } = await requireAuth();
  const userId = employee.id;
  const isManager = MANAGER_ROLES.includes(role.name);

  const now = new Date();
  const viewedMonth = clampMonth(Number(searchParams.month) || now.getMonth() + 1);
  const viewedYear = clampYear(Number(searchParams.year) || now.getFullYear());
  const viewedPage = Math.max(1, Number(searchParams.page) || 1);
  const statusFilter = searchParams.status && VALID_STATUS.has(searchParams.status)
    ? searchParams.status
    : null;

  const viewStart = new Date(viewedYear, viewedMonth - 1, 1);
  const viewEnd = new Date(viewedYear, viewedMonth, 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const whereScope: any = { organizationId: organization.id };
  if (!isManager) whereScope.employeeId = userId;

  const whereView: any = { ...whereScope, date: { gte: viewStart, lt: viewEnd } };
  const whereViewWithStatus = statusFilter
    ? { ...whereView, status: statusFilter }
    : whereView;

  const whereToday: any = {
    organizationId: organization.id,
    date: { gte: today, lt: tomorrow },
    status: "APPROVED",
  };

  const [
    leaves,
    totalInView,
    countsByStatus,
    approvedAgg,
    employees,
    todayLeaves,
  ] = await Promise.all([
    prisma.leave.findMany({
      where: whereViewWithStatus,
      include: {
        employee: { select: { id: true, fullName: true, department: true } },
        approvedBy: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (viewedPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.leave.count({ where: whereViewWithStatus }),
    prisma.leave.groupBy({
      by: ["status"],
      where: whereView,
      _count: { _all: true },
    }),
    prisma.leave.aggregate({
      where: { ...whereView, status: "APPROVED" },
      _sum: { requestedHours: true },
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

  const counts = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
  for (const c of countsByStatus) {
    counts[c.status as keyof typeof counts] = c._count._all;
  }
  const totalInMonth = counts.PENDING + counts.APPROVED + counts.REJECTED;
  const approvedHours = Math.round(Number(approvedAgg._sum.requestedHours ?? 0));

  return (
    <LeaveClient
      initialLeaves={JSON.parse(JSON.stringify(leaves))}
      viewedMonth={viewedMonth}
      viewedYear={viewedYear}
      viewedPage={viewedPage}
      pageSize={PAGE_SIZE}
      totalInView={totalInView}
      statusFilter={statusFilter}
      tabCounts={{ ALL: totalInMonth, ...counts }}
      employees={employees}
      currentUserId={userId}
      todayLeaves={JSON.parse(JSON.stringify(todayLeaves))}
      kpis={{
        pendingCount: counts.PENDING,
        approvedMonthCount: counts.APPROVED,
        approvedMonthHours: approvedHours,
        onLeaveToday: todayLeaves.length,
        totalRequests: totalInMonth,
      }}
    />
  );
}

function clampMonth(m: number) {
  if (!Number.isFinite(m) || m < 1 || m > 12) return new Date().getMonth() + 1;
  return Math.floor(m);
}
function clampYear(y: number) {
  if (!Number.isFinite(y) || y < 2000 || y > 2100) return new Date().getFullYear();
  return Math.floor(y);
}
