import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { PlansClient } from "./_components/plans-client";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const session = await getAdminSession();
  if (!session || session.type !== "SUPER_ADMIN") redirect("/system/upgrade-requests");

  const plans = await prisma.planConfig.findMany({ orderBy: { sortOrder: "asc" } });
  return <PlansClient initialPlans={JSON.parse(JSON.stringify(plans))} />;
}
