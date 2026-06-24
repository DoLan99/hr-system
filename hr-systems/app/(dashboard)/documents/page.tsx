import { requireAuth } from "@/lib/current-user";
import { MANAGER_ROLES } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { DocumentsShell } from "./_components/documents-shell";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const { organization, role } = await requireAuth();
  const isManager = MANAGER_ROLES.includes(role.name);

  const token = await prisma.microsoftToken.findUnique({
    where: { organizationId: organization.id },
    select: { msUserEmail: true, msUserName: true },
  });

  return (
    <div className="doc-page-wrap">
      <DocumentsShell isManager={isManager} oneDriveConnected={!!token} />
    </div>
  );
}
