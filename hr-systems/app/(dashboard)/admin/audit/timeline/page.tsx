import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/current-user";
import { TimelineClient } from "./_components/timeline-client";

const ALLOWED = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD", "HR"];

export const dynamic = "force-dynamic";

export default async function AuditTimelinePage() {
  const { employee, organization, role, clerkUser } = await requireAuth();
  if (!ALLOWED.includes(role.name)) redirect("/dashboard?error=forbidden");

  const employees = await prisma.employee.findMany({
    where: { organizationId: organization.id, status: { not: "INACTIVE" } },
    select: { id: true, fullName: true, department: true },
    orderBy: { fullName: "asc" },
  });

  return (
    <TimelineClient
      employees={employees}
      currentUserId={employee.id}
      currentUserName={employee.fullName || clerkUser.firstName || ""}
    />
  );
}
