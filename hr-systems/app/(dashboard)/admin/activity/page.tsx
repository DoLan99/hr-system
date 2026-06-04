import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/current-user";

const ALLOWED = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];

export const dynamic = "force-dynamic";

export default async function ActivityAdminPage() {
  const { employee, organization, role, clerkUser } = await requireAuth();
  if (!ALLOWED.includes(role.name)) redirect("/dashboard?error=forbidden");

  const { ActivityAdminClient } = await import("./_components/activity-admin-client");

  const employees = await prisma.employee.findMany({
    where: { organizationId: organization.id, status: { not: "INACTIVE" } },
    select: { id: true, fullName: true, department: true, avatarUrl: true },
    orderBy: { fullName: "asc" },
  });

  return (
    <ActivityAdminClient
      employees={employees}
      currentUserId={employee.id}
      currentUserName={employee.fullName || clerkUser.firstName || ""}
    />
  );
}
