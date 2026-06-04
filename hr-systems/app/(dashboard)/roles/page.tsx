import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/current-user";
import { RolesClient } from "./_components/roles-client";

export const dynamic = "force-dynamic";

export default async function RolesPage() {
  const { organization } = await requireAuth();

  const roles = await prisma.role.findMany({
    where: { organizationId: organization.id },
    include: { _count: { select: { employees: true } } },
    orderBy: { id: "asc" },
  });

  return <RolesClient initialRoles={JSON.parse(JSON.stringify(roles))} />;
}
