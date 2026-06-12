import { requireAuth } from "@/lib/current-user";
import { MANAGER_ROLES } from "@/lib/api-auth";
import { redirect } from "next/navigation";
import { WorkflowBuilder } from "./_components/workflow-builder";

export const dynamic = "force-dynamic";

export default async function WorkflowsPage() {
  const { role } = await requireAuth();

  if (!MANAGER_ROLES.includes(role.name)) redirect("/approvals");

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Workflow Phê duyệt</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Thiết lập luồng duyệt cho từng loại yêu cầu trong tổ chức
        </p>
      </div>
      <WorkflowBuilder />
    </div>
  );
}
