import { requireAuth } from "@/lib/current-user";
import { ADMIN_ROLES } from "@/lib/managed-scope";
import { SettingsClient } from "./_components/settings-client";

export default async function SettingsPage() {
  const { role } = await requireAuth();
  const isAdmin = ADMIN_ROLES.includes(role.name);
  return <SettingsClient isAdmin={isAdmin} />;
}
