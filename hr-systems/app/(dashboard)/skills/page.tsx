import { requireAuth } from "@/lib/current-user";
import { MANAGER_ROLES } from "@/lib/api-auth";
import { SkillsClient } from "./_components/skills-client";

export const dynamic = "force-dynamic";

export default async function SkillsPage() {
  const { employee, role } = await requireAuth();
  const isManager = MANAGER_ROLES.includes(role.name);
  return <SkillsClient isManager={isManager} currentEmployeeId={employee.id} />;
}
