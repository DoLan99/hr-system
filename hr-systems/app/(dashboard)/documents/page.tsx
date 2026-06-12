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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tài liệu</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Quản lý file từ Microsoft OneDrive
          </p>
        </div>
        {token && (
          <div className="text-xs text-muted-foreground text-right">
            <span className="text-green-500 font-medium">● Đã kết nối</span>
            <br />
            {token.msUserName} · {token.msUserEmail}
          </div>
        )}
      </div>

      {!token ? (
        <MicrosoftConnectBanner isManager={isManager} />
      ) : (
        <FileBrowser isManager={isManager} />
      )}
    </div>
  );
}
