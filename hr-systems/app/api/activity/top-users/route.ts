import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { ADMIN_ROLES, SUB_MANAGER_ROLES, getManagedEmployeeIds } from "@/lib/managed-scope";
import { requireApiAuth } from "@/lib/api-auth";

/**
 * GET /api/activity/top-users?days=30&limit=10
 *
 * Aggregate UserActivity rows per employee to rank by active time
 * over the past N days.
 */
export const GET = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const role = auth.roleName;
  const userId = auth.actorId;
  const isAdmin = ADMIN_ROLES.includes(role);
  const isSubManager = SUB_MANAGER_ROLES.includes(role);

  if (!isAdmin && !isSubManager) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const days = Math.min(90, Math.max(1, Number(searchParams.get("days") ?? "30") || 30));
  const limit = Math.min(50, Math.max(3, Number(searchParams.get("limit") ?? "10") || 10));

  let allowedIds: number[] | null = null;
  if (!isAdmin && isSubManager) {
    const managed = await getManagedEmployeeIds(userId, role);
    allowedIds = managed === null ? null : [...managed, userId];
  }

  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - days + 1);

  const grouped = await prisma.userActivity.groupBy({
    by: ["employeeId"],
    where: {
      organizationId: auth.orgId,
      date: { gte: since },
      ...(allowedIds ? { employeeId: { in: allowedIds } } : {}),
    },
    _sum: { activeSeconds: true },
    _count: { _all: true },
    orderBy: { _sum: { activeSeconds: "desc" } },
    take: limit,
  });

  const empIds = grouped.map((g) => g.employeeId);
  const employees = empIds.length
    ? await prisma.employee.findMany({
        where: { id: { in: empIds }, organizationId: auth.orgId },
        select: { id: true, fullName: true, avatarUrl: true, department: true },
      })
    : [];
  const empMap = new Map(employees.map((e) => [e.id, e]));

  const data = grouped.map((g) => ({
    employeeId: g.employeeId,
    fullName: empMap.get(g.employeeId)?.fullName ?? "—",
    avatarUrl: empMap.get(g.employeeId)?.avatarUrl ?? null,
    department: empMap.get(g.employeeId)?.department ?? null,
    activeSeconds: g._sum.activeSeconds ?? 0,
    daysActive: g._count._all,
  }));

  return NextResponse.json({ data, days });
});
