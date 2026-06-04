import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/current-user";
import { ADMIN_ROLES, SUB_MANAGER_ROLES } from "@/lib/managed-scope";
import { TaskTemplatesClient } from "./_components/task-templates-client";

export const metadata = { title: "Task Templates — HR System" };

export default async function TaskTemplatesPage() {
  const { organization, role } = await requireAuth();
  const canManage = ADMIN_ROLES.includes(role.name) || SUB_MANAGER_ROLES.includes(role.name);

  const items = await prisma.taskTemplate.findMany({
    where: { organizationId: organization.id },
    orderBy: [{ isActive: "desc" }, { usageCount: "desc" }, { code: "asc" }],
    include: { _count: { select: { tasks: true } } },
  });

  return <TaskTemplatesClient initialItems={items as any} canManage={canManage} />;
}
