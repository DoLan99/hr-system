import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/current-user";
import { ADMIN_ROLES, SUB_MANAGER_ROLES } from "@/lib/managed-scope";
import { TaskDetailPage } from "./_components/TaskDetailPage";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: { id: string } }) {
  const { employee, organization, role } = await requireAuth();
  const isManager = ADMIN_ROLES.includes(role.name) || SUB_MANAGER_ROLES.includes(role.name);

  const numId = Number(params.id);
  if (!Number.isInteger(numId) || isNaN(numId)) notFound();

  const task = await prisma.task.findFirst({
    where: { id: numId, organizationId: organization.id },
    include: {
      assignedTo: { select: { id: true, fullName: true, avatarUrl: true } },
      assignedBy: { select: { id: true, fullName: true } },
      support: { select: { id: true, fullName: true } },
      customer: { select: { id: true, customerName: true, businessName: true } },
      parentTask: { select: { id: true, code: true, title: true } },
      sprint: { select: { id: true, name: true, status: true } },
      subTasks: {
        select: {
          id: true, code: true, title: true, status: true,
          progressPct: true, priority: true,
          assignedTo: { select: { id: true, fullName: true } },
        },
        orderBy: { id: "asc" },
      },
      timeLogs: {
        select: {
          id: true, date: true, durationMinutes: true,
          approvalStatus: true, note: true,
          employee: { select: { id: true, fullName: true } },
        },
        orderBy: { date: "desc" },
        take: 20,
      },
      _count: { select: { timeLogs: true, subTasks: true } },
    },
  });

  if (!task) notFound();

  const employees = await prisma.employee.findMany({
    where: { organizationId: organization.id, status: "ACTIVE" },
    select: { id: true, fullName: true },
    orderBy: { fullName: "asc" },
  });

  return (
    <TaskDetailPage
      task={task as any}
      employees={employees}
      currentEmployeeId={employee.id}
      isManager={isManager}
    />
  );
}
