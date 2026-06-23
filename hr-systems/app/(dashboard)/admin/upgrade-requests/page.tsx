import { requireAuth } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { UpgradeRequestsClient } from "./_components/upgrade-requests-client";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN"];

export default async function UpgradeRequestsPage() {
  const { role } = await requireAuth();
  if (!ADMIN_ROLES.includes(role.name)) {
    return <div style={{ padding: 40, color: "var(--text-3)" }}>Không có quyền truy cập.</div>;
  }

  const requests = await prisma.upgradeRequest.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return <UpgradeRequestsClient initialRequests={JSON.parse(JSON.stringify(requests))} />;
}
