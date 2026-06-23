import { prisma } from "@/lib/prisma";
import { UpgradeRequestsClient } from "./_components/upgrade-requests-client";

export const dynamic = "force-dynamic";

export default async function UpgradeRequestsPage() {
  const requests = await prisma.upgradeRequest.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
  return <UpgradeRequestsClient initialRequests={JSON.parse(JSON.stringify(requests))} />;
}
