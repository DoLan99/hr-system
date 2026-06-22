import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { ADMIN_ROLES, SUB_MANAGER_ROLES, getManagedEmployeeIds } from "@/lib/managed-scope";
import { requireApiAuth } from "@/lib/api-auth";

/**
 * GET /api/activity/timeline?employeeId=X|all&limit=40
 *
 * Recent AuditLog entries (action / table / actor / when).
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
  const limit = Math.min(200, Math.max(10, Number(searchParams.get("limit") ?? "40") || 40));

  let whereChangedById: number | { in: number[] } | undefined;

  if (!employeeIdParam || employeeIdParam === "all") {
    if (isAdmin) {
      whereChangedById = undefined;
    } else if (isSubManager) {
      const managed = await getManagedEmployeeIds(userId, role);
      whereChangedById = managed === null ? undefined : { in: [...managed, userId] };
    } else {
      whereChangedById = userId;
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
    whereChangedById = reqId;
  }

  const rows = await prisma.auditLog.findMany({
    where: {
      organizationId: auth.orgId,
      changedById: { not: null },
      ...(whereChangedById !== undefined ? { changedById: whereChangedById } : {}),
    },
    select: {
      id: true,
      tableName: true,
      action: true,
      recordId: true,
      changedAt: true,
      changedById: true,
      endpoint: true,
      method: true,
      changedBy: { select: { id: true, fullName: true, department: true } },
    },
    orderBy: { changedAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ data: rows });
});
