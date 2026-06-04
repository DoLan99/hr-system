import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { ADMIN_ROLES, SUB_MANAGER_ROLES, getManagedEmployeeIds } from "@/lib/managed-scope";
import { requireApiAuth } from "@/lib/api-auth";

const ALLOWED_STATUS = ["OPEN", "ACKNOWLEDGED", "RESOLVED", "DISMISSED"] as const;

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
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const severity = searchParams.get("severity");
  const employeeId = searchParams.get("employeeId");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(200, Math.max(10, Number(searchParams.get("limit") ?? "50")));

  const where: Record<string, unknown> = {};

  if (!isAdmin && isSubManager) {
    const managed = await getManagedEmployeeIds(userId, role);
    if (managed !== null) where.employeeId = { in: [...managed, userId] };
  }

  if (status && ALLOWED_STATUS.includes(status as (typeof ALLOWED_STATUS)[number])) {
    where.status = status;
  }
  if (type) where.type = type;
  if (severity) where.severity = severity;
  if (employeeId) where.employeeId = Number(employeeId);

  const [rows, total, counts] = await prisma.$transaction([
    prisma.anomalyAlert.findMany({
      where,
      include: {
        employee: { select: { id: true, fullName: true, avatarUrl: true } },
        acknowledgedBy: { select: { id: true, fullName: true } },
      },
      orderBy: [{ status: "asc" }, { severity: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.anomalyAlert.count({ where }),
    prisma.anomalyAlert.groupBy({
      by: ["status"],
      where: !isAdmin && isSubManager ? where : {},
      _count: true,
    }),
  ]);

  const byStatus: Record<string, number> = {};
  for (const c of counts) byStatus[c.status] = c._count;

  return NextResponse.json({
    data: rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    byStatus,
  });
});
