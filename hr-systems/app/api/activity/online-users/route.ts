import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { ADMIN_ROLES, SUB_MANAGER_ROLES, getManagedEmployeeIds } from "@/lib/managed-scope";
import { requireApiAuth } from "@/lib/api-auth";

/**
 * GET /api/activity/online-users
 *
 * List employees with a currently-active session (no logoutAt and
 * lastActivityAt within the last 10 minutes). Returns top 20.
 */
export const GET = withContext(async () => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const role = auth.roleName;
  const userId = auth.actorId;
  const isAdmin = ADMIN_ROLES.includes(role);
  const isSubManager = SUB_MANAGER_ROLES.includes(role);

  if (!isAdmin && !isSubManager) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let employeeIdFilter: { in: number[] } | undefined;
  if (!isAdmin && isSubManager) {
    const managed = await getManagedEmployeeIds(userId, role);
    if (managed !== null) employeeIdFilter = { in: [...managed, userId] };
  }

  const cutoff = new Date(Date.now() - 10 * 60 * 1000);

  const sessions = await prisma.userSession.findMany({
    where: {
      organizationId: auth.orgId,
      logoutAt: null,
      lastActivityAt: { gte: cutoff },
      ...(employeeIdFilter ? { employeeId: employeeIdFilter } : {}),
    },
    select: {
      id: true,
      employeeId: true,
      loginAt: true,
      lastActivityAt: true,
      device: true,
      browser: true,
      ipAddress: true,
      employee: { select: { id: true, fullName: true, avatarUrl: true, department: true } },
    },
    orderBy: { lastActivityAt: "desc" },
    take: 50,
  });

  // Dedup per employee: keep newest session
  const seen = new Set<number>();
  const out = sessions.filter((s) => {
    if (seen.has(s.employeeId)) return false;
    seen.add(s.employeeId);
    return true;
  }).slice(0, 20);

  return NextResponse.json({ data: out });
});
