import { requireAuth } from "@/lib/current-user";
import { MANAGER_ROLES } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { FileBrowser } from "./_components/file-browser";
import { MicrosoftConnectBanner } from "./_components/microsoft-connect-banner";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const { organization, role } = await requireAuth();
  const isManager = MANAGER_ROLES.includes(role.name);

  const token = await prisma.microsoftToken.findUnique({
    where: { organizationId: organization.id },
    select: { msUserEmail: true, msUserName: true },
  });

  return <FileBrowser isManager={isManager} connected={!!token} />;
}
