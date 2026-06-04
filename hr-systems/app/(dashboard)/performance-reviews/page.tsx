import { requireAuth } from "@/lib/current-user";
import { MANAGER_ROLES } from "@/lib/api-auth";
import { PerformanceReviewsClient } from "./_components/perf-reviews-client";

export const dynamic = "force-dynamic";

export default async function PerformanceReviewsPage() {
  const { employee, role } = await requireAuth();
  const isManager = MANAGER_ROLES.includes(role.name);

  return <PerformanceReviewsClient isManager={isManager} currentEmployeeId={employee.id} />;
}
