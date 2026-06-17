import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/current-user";
import { ADMIN_ROLES, SUB_MANAGER_ROLES } from "@/lib/managed-scope";
import { SprintsClient } from "./SprintsClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sprint — HR System" };

export default async function SprintsPage() {
  const { employee, organization, role } = await requireAuth();
  const isManager = ADMIN_ROLES.includes(role.name) || SUB_MANAGER_ROLES.includes(role.name);

  const [sprints, tasks] = await Promise.all([
    prisma.sprint.findMany({
      where: { organizationId: organization.id },
      include: { _count: { select: { tasks: true } } },
      orderBy: [{ status: "asc" }, { startDate: "asc" }],
    }),
    prisma.task.findMany({
      where: { organizationId: organization.id, status: { notIn: ["DONE", "CANCELLED"] } },
      select: {
        id: true, code: true, title: true, status: true, priority: true, sprintId: true,
        assignedTo: { select: { id: true, fullName: true } },
        _count: { select: { subTasks: true } },
      },
      orderBy: [{ priority: "asc" }, { dateCreated: "desc" }],
      take: 500,
    }),
  ]);

  return (
    <SprintsClient
      sprints={sprints as any}
      tasks={tasks as any}
      isManager={isManager}
      currentEmployeeId={employee.id}
    />
  );
}
