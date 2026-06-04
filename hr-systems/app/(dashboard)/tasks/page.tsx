import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/current-user";
import { getManagedEmployeeIds, ADMIN_ROLES, SUB_MANAGER_ROLES } from "@/lib/managed-scope";
import { TasksClient } from "./_components/tasks-client";
import { buildLabelConfig } from "@/lib/system-labels";

export const metadata = { title: "Tasks — HR System" };

export default async function TasksPage() {
  const { employee, organization, role } = await requireAuth();
  const userId = employee.id;
  const userRole = role.name;
  const isAdmin = ADMIN_ROLES.includes(userRole);
  const isSubManager = SUB_MANAGER_ROLES.includes(userRole);
  const isManager = isAdmin || isSubManager;

  const managedIds = isManager ? await getManagedEmployeeIds(userId, userRole) : [];

  let where: any = { organizationId: organization.id };
  if (isSubManager) {
    const ids = managedIds === null ? null : [...(managedIds ?? []), userId];
    if (ids) where.assignedToId = { in: ids };
  } else if (!isAdmin) {
    where.assignedToId = userId;
  }

  const now = new Date();
  await prisma.task.updateMany({
    where: {
      ...where,
      dueDate: { lt: now },
      status: { notIn: ["DONE", "CANCELLED"] },
      isOverdue: false,
    },
    data: { isOverdue: true },
  });

  const [tasks, employees, customers, templates, systemLabels] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, fullName: true, avatarUrl: true } },
        assignedBy: { select: { id: true, fullName: true } },
        customer: { select: { id: true, customerName: true, businessName: true } },
        template: { select: { id: true, code: true, title: true } },
        _count: { select: { timeLogs: true, subTasks: true } },
      },
      orderBy: [{ status: "asc" }, { priority: "asc" }, { dueDate: "asc" }, { dateCreated: "desc" }],
      take: 200,
    }),
    isManager
      ? prisma.employee.findMany({
          where:
            isAdmin
              ? { organizationId: organization.id, status: "ACTIVE" }
              : managedIds && managedIds.length > 0
              ? { organizationId: organization.id, id: { in: [...managedIds, userId] }, status: "ACTIVE" }
              : { organizationId: organization.id, id: userId },
          select: { id: true, fullName: true, department: true },
          orderBy: { fullName: "asc" },
        })
      : [],
    prisma.customer.findMany({
      where: { organizationId: organization.id, status: "ACTIVE" },
      select: { id: true, customerName: true, businessName: true },
      orderBy: { customerName: "asc" },
    }),
    prisma.taskTemplate.findMany({
      where: { organizationId: organization.id, isActive: true },
      select: { id: true, code: true, title: true, defaultTaskType: true, defaultEstimatedTime: true, defaultPriority: true, requiresVideo: true, department: true },
      orderBy: [{ usageCount: "desc" }, { code: "asc" }],
    }),
    prisma.systemLabel.findMany({
      where: { organizationId: organization.id },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    }),
  ]);

  const labelConfig = buildLabelConfig(systemLabels);

  return (
    <TasksClient
      initialItems={tasks as any}
      employees={employees}
      customers={customers}
      templates={templates}
      currentUserId={userId}
      isManager={isManager}
      labelConfig={labelConfig}
    />
  );
}
