import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN"];
const SUB_MANAGER_ROLES = ["MANAGER", "TEAM_LEAD"];

export { ADMIN_ROLES, SUB_MANAGER_ROLES };

/**
 * Returns list of employee IDs that this user can manage/assign tasks to.
 * - Admin roles → null (no restriction)
 * - TEAM_LEAD → members of the team they lead
 * - MANAGER → direct subordinates
 * - Others → empty array
 */
export async function getManagedEmployeeIds(
  userId: number,
  role: string
): Promise<number[] | null> {
  if (ADMIN_ROLES.includes(role)) return null;

  if (!SUB_MANAGER_ROLES.includes(role)) return [];

  if (role === "TEAM_LEAD") {
    const myTeam = await prisma.team.findFirst({
      where: { leadId: userId, isActive: true },
      select: { employees: { where: { status: "ACTIVE" }, select: { id: true } } },
    });
    return myTeam?.employees.map((e) => e.id) ?? [];
  }

  // MANAGER
  const subs = await prisma.employee.findMany({
    where: { managerId: userId, status: "ACTIVE" },
    select: { id: true },
  });
  return subs.map((e) => e.id);
}

/** Build a Prisma `where` condition for assignedToId based on role scope. */
export function buildAssignedScope(
  managedIds: number[] | null,
  filterHandlerId?: number | null
): { assignedToId?: any } {
  if (managedIds === null) {
    // admin — no restriction on scope, but apply filter if given
    return filterHandlerId ? { assignedToId: filterHandlerId } : {};
  }

  if (managedIds.length === 0) {
    return { assignedToId: 0 }; // impossible ID → empty result
  }

  if (filterHandlerId && managedIds.includes(filterHandlerId)) {
    return { assignedToId: filterHandlerId };
  }

  return { assignedToId: { in: managedIds } };
}
