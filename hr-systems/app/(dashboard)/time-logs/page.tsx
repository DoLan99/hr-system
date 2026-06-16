import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/current-user";
import { ADMIN_ROLES, SUB_MANAGER_ROLES, getManagedEmployeeIds } from "@/lib/managed-scope";
import { TimeLogsClient } from "./_components/time-logs-client";

export const metadata = { title: "Time Logs — HR System" };

type SearchParams = { taskId?: string; date?: string };

export default async function TimeLogsPage({ searchParams }: { searchParams: SearchParams }) {
  const { employee, organization, role } = await requireAuth();
  const userId = employee.id;
  const userRole = role.name;
  const isAdmin = ADMIN_ROLES.includes(userRole);
  const isSubManager = SUB_MANAGER_ROLES.includes(userRole);
  const isManager = isAdmin || isSubManager;

  const managedIds = isManager ? await getManagedEmployeeIds(userId, userRole) : [];

  const employeeScopeIds: number[] | null = isAdmin
    ? null
    : isSubManager
    ? [...(managedIds ?? []), userId]
    : [userId];

  const date = searchParams.date ? new Date(searchParams.date) : new Date();
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  // Week range (Mon–Sun)
  const dayOfWeek = startOfDay.getDay() || 7;
  const monday = new Date(startOfDay);
  monday.setDate(monday.getDate() - (dayOfWeek - 1));
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 7);

  // Today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  // Month range
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const baseWhere: any = { organizationId: organization.id };
  if (employeeScopeIds) baseWhere.employeeId = { in: employeeScopeIds };

  const [logsWeek, logsToday, openTasks, activeEmployeesToday] = await Promise.all([
    prisma.timeLog.findMany({
      where: { ...baseWhere, date: { gte: monday, lt: sunday } },
      include: {
        employee: { select: { id: true, fullName: true, avatarUrl: true } },
        task: {
          select: {
            id: true, code: true, title: true, taskType: true,
            estimatedTime: true, actualTimeTotal: true, requiresVideo: true,
            billable: true, status: true,
            customer: { select: { id: true, customerName: true, businessName: true } },
          },
        },
        approvedBy: { select: { id: true, fullName: true } },
      },
      orderBy: [{ date: "desc" }, { id: "desc" }],
    }),
    prisma.timeLog.findMany({
      where: { ...baseWhere, date: { gte: todayStart, lt: todayEnd } },
      select: { durationMinutes: true, employeeId: true, taskId: true },
    }),
    prisma.task.findMany({
      where: {
        organizationId: organization.id,
        status: { in: ["BACKLOG", "IN_PROGRESS", "BLOCKED", "REVIEW"] },
        assignedToId: isAdmin ? undefined : { in: employeeScopeIds! },
      },
      select: {
        id: true, code: true, title: true, taskType: true,
        estimatedTime: true, actualTimeTotal: true, requiresVideo: true, status: true,
        assignedTo: { select: { id: true, fullName: true } },
      },
      orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
      take: 200,
    }),
    prisma.timeLog.findMany({
      where: { ...baseWhere, date: { gte: todayStart, lt: todayEnd } },
      select: { employeeId: true },
      distinct: ["employeeId"],
    }),
  ]);

  // KPIs
  const todayMinutes = logsToday.reduce((s, l) => s + l.durationMinutes, 0);
  const todayHours = (todayMinutes / 60).toFixed(1);
  const tasksTrackedToday = new Set(logsToday.map(l => l.taskId)).size;
  const activeMembersToday = activeEmployeesToday.length;

  // Average per day this month (using week data as proxy)
  const dayCount = logsWeek.reduce((acc, l) => {
    const d = new Date(l.date).toDateString();
    acc.add(d);
    return acc;
  }, new Set<string>()).size || 1;
  const weekTotalMin = logsWeek.reduce((s, l) => s + l.durationMinutes, 0);
  const avgPerDay = dayCount > 0 ? Math.round(weekTotalMin / dayCount) : 0;

  const kpis = {
    todayHours,
    tasksTrackedToday,
    activeMembersToday,
    avgPerDay,
  };

  return (
    <TimeLogsClient
      initialItems={logsWeek as any}
      tasks={openTasks as any}
      initialDate={startOfDay.toISOString().slice(0, 10)}
      initialTaskId={searchParams.taskId ? Number(searchParams.taskId) : null}
      currentUserId={userId}
      isManager={isManager}
      kpis={kpis}
    />
  );
}
