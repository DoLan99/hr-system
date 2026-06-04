import { requireAuth } from "@/lib/current-user";
import { MANAGER_ROLES } from "@/lib/api-auth";
import { redirect } from "next/navigation";
import { CapacityClient } from "./_components/capacity-client";

export const dynamic = "force-dynamic";

export default async function CapacityPage() {
  const { role } = await requireAuth();
  if (!MANAGER_ROLES.includes(role.name)) {
    redirect("/dashboard");
  }

  return <CapacityClient />;
}
