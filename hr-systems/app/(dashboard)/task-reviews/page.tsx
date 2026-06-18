import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/current-user";
import { ADMIN_ROLES, SUB_MANAGER_ROLES, getManagedEmployeeIds } from "@/lib/managed-scope";
import { TaskReviewsClient } from "./_components/task-reviews-client";

export const metadata = { title: "Task Reviews — HR System" };

export default async function TaskReviewsPage() {
  const { employee, organization, role } = await requireAuth();
  const userId = employee.id;
  const userRole = role.name;
  const isAdmin = ADMIN_ROLES.includes(userRole);
  const isSubManager = SUB_MANAGER_ROLES.includes(userRole);
  const isManager = isAdmin || isSubManager;

  const managedIds = isManager ? await getManagedEmployeeIds(userId, userRole) : [];

  // Show REVIEW tasks — managers see their team's, admins see all
  const taskWhere: any = { organizationId: organization.id, status: "REVIEW" };
  if (!isAdmin && isSubManager && managedIds && managedIds.length) {
    taskWhere.assignedToId = { in: [...(managedIds ?? []), userId] };
  } else if (!isManager) {
    // Regular employees only see tasks assigned to them or assigned by them
    taskWhere.OR = [{ assignedToId: userId }, { assignedById: userId }];
  }

  const tasks = await prisma.task.findMany({
    where: taskWhere,
    orderBy: [{ dueDate: "asc" }, { lastUpdate: "desc" }],
    include: {
      assignedTo: { select: { id: true, fullName: true, avatarUrl: true } },
      assignedBy: { select: { id: true, fullName: true } },
      template: { select: { id: true, code: true, title: true, defaultChecklist: true } },
      sprint: { select: { id: true, name: true } },
      checklistItems: { select: { id: true, content: true, checked: true }, orderBy: { order: "asc" } },
    },
  });

  return (
    <TaskReviewsClient
      initialTasks={tasks as any}
      isManager={isManager}
      currentUserId={userId}
    />
  );
}
