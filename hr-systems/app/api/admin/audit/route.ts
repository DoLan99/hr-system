import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { ADMIN_ROLES, SUB_MANAGER_ROLES, getManagedEmployeeIds } from "@/lib/managed-scope";
import { requireApiAuth } from "@/lib/api-auth";

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
  const employeeId = searchParams.get("employeeId");
  const tableName = searchParams.get("tableName");
  const action = searchParams.get("action");
  const recordIdParam = searchParams.get("recordId");
  const requestId = searchParams.get("requestId");
  const sessionId = searchParams.get("sessionId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(200, Math.max(10, Number(searchParams.get("limit") ?? "50")));

  const where: Record<string, unknown> = {};

  if (!isAdmin && isSubManager) {
    const managed = await getManagedEmployeeIds(userId, role);
    if (managed !== null) {
      where.changedById = { in: [...managed, userId] };
    }
  }

  if (employeeId) {
    const reqId = Number(employeeId);
    if (!isAdmin && isSubManager) {
      const managed = await getManagedEmployeeIds(userId, role);
      if (managed !== null && reqId !== userId && !managed.includes(reqId)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    where.changedById = reqId;
  }

  if (tableName) where.tableName = tableName;
  if (action) where.action = action;
  if (recordIdParam) where.recordId = Number(recordIdParam);
  if (requestId) where.requestId = requestId;
  if (sessionId) where.sessionId = sessionId;
  if (from || to) {
    where.changedAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  const [rows, total, byActionRaw] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      include: { changedBy: { select: { id: true, fullName: true, avatarUrl: true } } },
      orderBy: { changedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.groupBy({ by: ["action"], where, _count: true }),
  ]);

  const byAction: Record<string, number> = {};
  for (const r of byActionRaw) byAction[r.action] = r._count;

  return NextResponse.json({
    data: rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    byAction,
  });
});
