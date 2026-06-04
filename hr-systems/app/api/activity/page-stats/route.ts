import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { ADMIN_ROLES, SUB_MANAGER_ROLES, getManagedEmployeeIds } from "@/lib/managed-scope";
import { requireApiAuth } from "@/lib/api-auth";

interface PageViewItem {
  path: string;
  durationSec: number;
}

/**
 * GET /api/activity/page-stats?days=30&employeeId=X
 *
 * Tổng hợp pageViews từ UserActivity → top page theo tổng thời gian xem.
 * Quyền:
 * - admin: xem tất cả hoặc 1 employeeId cụ thể
 * - manager: chỉ xem employee dưới quyền
 * - employee thường: chỉ xem của chính mình
 */
export const GET = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const employeeIdParam = searchParams.get("employeeId");
  const daysParam = searchParams.get("days") ?? "30";
  const limit = Math.min(100, Math.max(5, Number(searchParams.get("limit") ?? "20")));
  const days = Math.min(90, Math.max(1, Number(daysParam) || 30));

  const userId = auth.actorId;
  const role = auth.roleName;
  const isAdmin = ADMIN_ROLES.includes(role);
  const isSubManager = SUB_MANAGER_ROLES.includes(role);

  // Xác định employeeId được phép truy vấn
  let whereEmployeeId: number | { in: number[] } | undefined;
  if (employeeIdParam) {
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
  } else if (isAdmin) {
    whereEmployeeId = undefined; // all
  } else if (isSubManager) {
    const managed = await getManagedEmployeeIds(userId, role);
    whereEmployeeId = managed === null ? undefined : { in: [...managed, userId] };
  } else {
    whereEmployeeId = userId;
  }

  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - days + 1);

  const rows = await prisma.userActivity.findMany({
    where: {
      ...(whereEmployeeId !== undefined ? { employeeId: whereEmployeeId } : {}),
      date: { gte: since },
    },
    select: { employeeId: true, pageViews: true },
  });

  // Gộp theo path: tổng durationSec + số employee unique đã xem
  const byPath = new Map<string, { totalSec: number; employees: Set<number> }>();
  let totalSec = 0;
  for (const r of rows) {
    const pvs = Array.isArray(r.pageViews) ? (r.pageViews as unknown as PageViewItem[]) : [];
    for (const pv of pvs) {
      if (!pv?.path) continue;
      const sec = Number(pv.durationSec) || 0;
      totalSec += sec;
      let entry = byPath.get(pv.path);
      if (!entry) {
        entry = { totalSec: 0, employees: new Set() };
        byPath.set(pv.path, entry);
      }
      entry.totalSec += sec;
      entry.employees.add(r.employeeId);
    }
  }

  const topPages = Array.from(byPath.entries())
    .map(([path, { totalSec, employees }]) => ({
      path,
      totalSec,
      uniqueEmployees: employees.size,
    }))
    .sort((a, b) => b.totalSec - a.totalSec)
    .slice(0, limit);

  return NextResponse.json({
    data: {
      days,
      employeeId: typeof whereEmployeeId === "number" ? whereEmployeeId : null,
      totalSec,
      totalRows: rows.length,
      topPages,
    },
  });
});
