import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ADMIN_ROLES, SUB_MANAGER_ROLES } from "@/lib/managed-scope";
import { TaskTemplatesClient } from "./_components/task-templates-client";

export const metadata = { title: "Task Templates — HR System" };

export default async function TaskTemplatesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userRole = session.user.role;
  const canManage = ADMIN_ROLES.includes(userRole) || SUB_MANAGER_ROLES.includes(userRole);

  const items = await prisma.taskTemplate.findMany({
    orderBy: [{ isActive: "desc" }, { usageCount: "desc" }, { code: "asc" }],
    include: { _count: { select: { tasks: true } } },
  });

  return <TaskTemplatesClient initialItems={items as any} canManage={canManage} />;
}
