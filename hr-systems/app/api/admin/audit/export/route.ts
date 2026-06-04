import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { ADMIN_ROLES, SUB_MANAGER_ROLES, getManagedEmployeeIds } from "@/lib/managed-scope";
import { requireApiAuth } from "@/lib/api-auth";

const MAX_ROWS = 10_000;

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s = typeof value === "string" ? value : JSON.stringify(value);
  if (s.includes('"') || s.includes(",") || s.includes("\n")) {
    s = '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

/**
 * GET /api/admin/audit/export
 * Cùng filter như /api/admin/audit nhưng trả CSV (tối đa 10000 dòng/lần).
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
  const employeeId = searchParams.get("employeeId");
  const tableName = searchParams.get("tableName");
  const action = searchParams.get("action");
  const requestId = searchParams.get("requestId");
  const sessionId = searchParams.get("sessionId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Record<string, unknown> = {};

  if (!isAdmin && isSubManager) {
    const managed = await getManagedEmployeeIds(userId, role);
    if (managed !== null) where.changedById = { in: [...managed, userId] };
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
  if (requestId) where.requestId = requestId;
  if (sessionId) where.sessionId = sessionId;
  if (from || to) {
    where.changedAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  const rows = await prisma.auditLog.findMany({
    where,
    include: { changedBy: { select: { fullName: true } } },
    orderBy: { changedAt: "desc" },
    take: MAX_ROWS,
  });

  const header = [
    "id",
    "changedAt",
    "actor",
    "actorId",
    "table",
    "action",
    "recordId",
    "endpoint",
    "method",
    "ipAddress",
    "userAgent",
    "sessionId",
    "requestId",
    "oldData",
    "newData",
  ];
  const lines = [header.map(csvEscape).join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.id,
        r.changedAt.toISOString(),
        r.changedBy?.fullName ?? "",
        r.changedById ?? "",
        r.tableName,
        r.action,
        r.recordId ?? "",
        r.endpoint ?? "",
        r.method ?? "",
        r.ipAddress ?? "",
        r.userAgent ?? "",
        r.sessionId ?? "",
        r.requestId ?? "",
        r.oldData,
        r.newData,
      ].map(csvEscape).join(","),
    );
  }
  const csv = lines.join("\n");

  const filename = `audit-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
});
