import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { ADMIN_ROLES, SUB_MANAGER_ROLES, getManagedEmployeeIds } from "@/lib/managed-scope";
import { requireApiAuth } from "@/lib/api-auth";

/**
 * GET /api/activity/sessions?employeeId=X|all&days=7&limit=40
 *
 * Recent UserSession entries.
 * - Admin: org-wide when employeeId omitted or "all"
 * - Sub-manager: limited to managed scope
 * - Otherwise: self only
 */
export const GET = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const role = auth.roleName;
  const userId = auth.actorId;
  const isAdmin = ADMIN_ROLES.includes(role);
  const isSubManager = SUB_MANAGER_ROLES.includes(role);

  const { searchParams } = new URL(req.url);
  const employeeIdParam = searchParams.get("employeeId");
  const days = Math.min(90, Math.max(1, Number(searchParams.get("days") ?? "7") || 7));
  const limit = Math.min(200, Math.max(10, Number(searchParams.get("limit") ?? "40") || 40));

  let whereEmployeeId: number | { in: number[] } | undefined;

  if (!employeeIdParam || employeeIdParam === "all") {
    if (isAdmin) {
      whereEmployeeId = undefined;
    } else if (isSubManager) {
      const managed = await getManagedEmployeeIds(userId, role);
      whereEmployeeId = managed === null ? undefined : { in: [...managed, userId] };
    } else {
      whereEmployeeId = userId;
    }
  } else {
    const reqId = Number(employeeIdParam);
    if (reqId !== userId && !isAdmin) {
      if (isSubManager) {
        const managed = await getManagedEmployeeIds(userId, role);
        if (managed !== null && !managed.includes(reqId)) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    whereEmployeeId = reqId;
  }

  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - days + 1);

  const rows = await prisma.userSession.findMany({
    where: {
      organizationId: auth.orgId,
      loginAt: { gte: since },
      ...(whereEmployeeId !== undefined ? { employeeId: whereEmployeeId } : {}),
    },
    select: {
      id: true,
      employeeId: true,
      loginAt: true,
      logoutAt: true,
      lastActivityAt: true,
      ipAddress: true,
      device: true,
      browser: true,
      os: true,
      city: true,
      country: true,
      loginMethod: true,
      logoutReason: true,
      employee: { select: { id: true, fullName: true, department: true, avatarUrl: true } },
    },
    orderBy: { loginAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ data: rows });
});
