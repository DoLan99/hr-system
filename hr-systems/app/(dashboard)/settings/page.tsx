import { requireAuth } from "@/lib/current-user";
import { ADMIN_ROLES } from "@/lib/managed-scope";
import { rawPrisma } from "@/lib/prisma";
import { SettingsClient } from "./_components/settings-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { role, organization } = await requireAuth();
  const isAdmin = ADMIN_ROLES.includes(role.name);

  const org = await rawPrisma.organization.findUnique({
    where: { id: organization.id },
    select: { workMode: true },
  });

  return <SettingsClient isAdmin={isAdmin} workMode={org?.workMode ?? "OFFLINE"} />;
}
