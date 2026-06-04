import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { ADMIN_ROLES, SUB_MANAGER_ROLES, getManagedEmployeeIds } from "@/lib/managed-scope";
import { requireApiAuth } from "@/lib/api-auth";

/**
 * GET /api/activity/heatmap?employeeId=X&days=30
 *
 * Tạo heatmap "hoạt động theo giờ trong ngày × ngày" cho 1 nhân viên.
 * Nguồn dữ liệu: ApiAccessLog (mỗi heartbeat = 1 request, đảm bảo có ít
 * nhất ~60 request/giờ khi user active liên tục). Đếm số request rồi
 * normalize làm cường độ heatmap.
 *
 * Response shape:
 *  {
 *    data: {
 *      employeeId, days,
 *      cells: [{ date: "YYYY-MM-DD", hour: 0..23, count: number }],
 *      max: number
 *    }
 *  }
 */
export const GET = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const employeeIdParam = searchParams.get("employeeId");
  const daysParam = searchParams.get("days") ?? "30";
  const days = Math.min(90, Math.max(1, Number(daysParam) || 30));

  const userId = auth.actorId;
  const role = auth.roleName;
  const targetEmployeeId = employeeIdParam ? Number(employeeIdParam) : userId;

  if (targetEmployeeId !== userId) {
    if (!ADMIN_ROLES.includes(role)) {
      if (SUB_MANAGER_ROLES.includes(role)) {
        const managed = await getManagedEmployeeIds(userId, role);
        if (managed !== null && !managed.includes(targetEmployeeId)) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
  }

  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - days + 1);

  // Gom theo ngày + giờ. Cast tránh BigInt return type.
  const rows = await prisma.$queryRaw<{ day: Date; hour: number; cnt: bigint }[]>`
    SELECT
      date_trunc('day', "createdAt") AS day,
      EXTRACT(HOUR FROM "createdAt")::int AS hour,
      COUNT(*)::bigint AS cnt
    FROM api_access_log
    WHERE "employeeId" = ${targetEmployeeId}
      AND "createdAt" >= ${since}
    GROUP BY 1, 2
    ORDER BY 1, 2
  `;

  const cells = rows.map((r) => ({
    date: new Date(r.day).toISOString().slice(0, 10),
    hour: Number(r.hour),
    count: Number(r.cnt),
  }));
  const max = cells.reduce((m, c) => Math.max(m, c.count), 0);

  return NextResponse.json({
    data: {
      employeeId: targetEmployeeId,
      days,
      cells,
      max,
    },
  });
});
