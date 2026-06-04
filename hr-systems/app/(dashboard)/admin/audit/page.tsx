import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/current-user";
import { AuditExplorerClient } from "./_components/audit-explorer-client";

const ALLOWED = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD", "HR"];

export const dynamic = "force-dynamic";

export default async function AuditExplorerPage() {
  const { employee, organization, role } = await requireAuth();
  if (!ALLOWED.includes(role.name)) redirect("/dashboard?error=forbidden");

  const employees = await prisma.employee.findMany({
    where: { organizationId: organization.id, status: { not: "INACTIVE" } },
    select: { id: true, fullName: true, department: true },
    orderBy: { fullName: "asc" },
  });

  return <AuditExplorerClient employees={employees} currentUserId={employee.id} />;
}
