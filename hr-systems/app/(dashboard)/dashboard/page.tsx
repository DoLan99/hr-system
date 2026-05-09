import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/lib/utils";
import DashboardClient from "./_components/dashboard-client";

const ADMIN_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN];
const SUB_MANAGER_ROLES = [ROLES.MANAGER, ROLES.TEAM_LEAD];

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const user = session.user as any;
  const userId = Number(user.id);
  const isAdmin = ADMIN_ROLES.includes(user.role);
  const isSubManager = SUB_MANAGER_ROLES.includes(user.role);
  const isManager = isAdmin || isSubManager;

  let teams: { id: number; name: string }[] = [];
  let handlers: { id: number; name: string }[] = [];

  if (isAdmin) {
    teams = await prisma.team.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  } else if (user.role === ROLES.TEAM_LEAD) {
    const myTeam = await prisma.team.findFirst({
      where: { leadId: userId, isActive: true },
      select: {
        employees: {
          where: { status: "ACTIVE" },
          select: { id: true, fullName: true },
          orderBy: { fullName: "asc" },
        },
      },
    });
    handlers = (myTeam?.employees ?? []).map((e) => ({ id: e.id, name: e.fullName }));
  } else if (user.role === ROLES.MANAGER) {
    const subs = await prisma.employee.findMany({
      where: { managerId: userId, status: "ACTIVE" },
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
    });
    handlers = subs.map((e) => ({ id: e.id, name: e.fullName }));
  }

  return (
    <DashboardClient
      userName={user.name ?? ""}
      isManager={isManager}
      isAdmin={isAdmin}
      teams={teams}
      handlers={handlers}
    />
  );
}
