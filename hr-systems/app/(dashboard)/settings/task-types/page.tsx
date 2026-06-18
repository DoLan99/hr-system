import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/current-user";
import { ADMIN_ROLES } from "@/lib/managed-scope";
import { TaskTypesClient } from "./_components/task-types-client";
import { redirect } from "next/navigation";

export const metadata = { title: "Loại Task — Cài đặt" };

export default async function TaskTypesPage() {
  const { organization, role } = await requireAuth();
  if (!ADMIN_ROLES.includes(role.name)) redirect("/settings");

  const types = await prisma.taskTypeConfig.findMany({
    where: { organizationId: organization.id },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return <TaskTypesClient initialTypes={types} />;
}
