import { requireAuth } from "@/lib/current-user";
import { MANAGER_ROLES } from "@/lib/api-auth";
import { redirect } from "next/navigation";
import { WorkflowBuilder } from "./_components/workflow-builder";

export const dynamic = "force-dynamic";

export default async function WorkflowsPage() {
  const { role } = await requireAuth();

  if (!MANAGER_ROLES.includes(role.name)) redirect("/approvals");

  return <WorkflowBuilder />;
}
