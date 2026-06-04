import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/current-user";
import { AnomaliesClient } from "./_components/anomalies-client";

const ALLOWED = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD", "HR"];

export const dynamic = "force-dynamic";

export default async function AnomaliesPage() {
  const { role } = await requireAuth();
  if (!ALLOWED.includes(role.name)) redirect("/dashboard?error=forbidden");

  const isAdmin = ["SUPER_ADMIN", "ADMIN"].includes(role.name);

  return <AnomaliesClient canRefresh={isAdmin} />;
}
