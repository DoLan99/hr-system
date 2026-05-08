import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/lib/utils";
import DashboardClient from "./_components/dashboard-client";

const MANAGER_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.TEAM_LEAD];

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const user = session.user as any;
  const isManager = MANAGER_ROLES.includes(user.role);

  const teams = await prisma.team.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <DashboardClient
      userName={user.name ?? ""}
      isManager={isManager}
      teams={teams}
    />
  );
}
