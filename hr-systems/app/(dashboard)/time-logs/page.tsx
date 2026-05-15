import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ADMIN_ROLES, SUB_MANAGER_ROLES, getManagedEmployeeIds } from "@/lib/managed-scope";
import { TimeLogsClient } from "./_components/time-logs-client";

export const metadata = { title: "Time Logs — HR System" };

type SearchParams = { taskId?: string; date?: string };

export default async function TimeLogsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = Number(session.user.id);
  const userRole = session.user.role;
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
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const where: any = {
    date: { gte: startOfDay, lt: endOfDay },
  };
  if (employeeScopeIds) where.employeeId = { in: employeeScopeIds };
  if (searchParams.taskId) where.taskId = Number(searchParams.taskId);

  const [logs, openTasks] = await Promise.all([
    prisma.timeLog.findMany({
      where,
      include: {
        employee: { select: { id: true, fullName: true, avatarUrl: true } },
        task: {
          select: {
            id: true,
            code: true,
            title: true,
            taskType: true,
            estimatedTime: true,
            actualTimeTotal: true,
            requiresVideo: true,
            billable: true,
            status: true,
            customer: { select: { id: true, customerName: true, businessName: true } },
          },
        },
        approvedBy: { select: { id: true, fullName: true } },
      },
      orderBy: [{ date: "desc" }, { id: "desc" }],
    }),
    // Tasks user can log against
    prisma.task.findMany({
      where: {
        status: { in: ["BACKLOG", "IN_PROGRESS", "BLOCKED", "REVIEW"] },
        assignedToId: isAdmin ? undefined : { in: employeeScopeIds! },
      },
      select: {
        id: true,
        code: true,
        title: true,
        taskType: true,
        estimatedTime: true,
        actualTimeTotal: true,
        requiresVideo: true,
        status: true,
        assignedTo: { select: { id: true, fullName: true } },
      },
      orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
      take: 200,
    }),
  ]);

  return (
    <TimeLogsClient
      initialItems={logs as any}
      tasks={openTasks as any}
      initialDate={startOfDay.toISOString().slice(0, 10)}
      initialTaskId={searchParams.taskId ? Number(searchParams.taskId) : null}
      currentUserId={userId}
      isManager={isManager}
    />
  );
}
