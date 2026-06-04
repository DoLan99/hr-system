import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { ADMIN_ROLES, SUB_MANAGER_ROLES, getManagedEmployeeIds } from "@/lib/managed-scope";
import { requireApiAuth } from "@/lib/api-auth";

export const GET = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date");
  const employeeIdParam = searchParams.get("employeeId");

  if (!dateStr) {
    return NextResponse.json({ error: "Thiếu tham số ?date=YYYY-MM-DD" }, { status: 422 });
  }

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

  const dayStart = new Date(dateStr);
  if (Number.isNaN(dayStart.getTime())) {
    return NextResponse.json({ error: "date không hợp lệ" }, { status: 422 });
  }
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const sessions = await prisma.userSession.findMany({
    where: {
      employeeId: targetEmployeeId,
      OR: [
        { loginAt: { gte: dayStart, lt: dayEnd } },
        { lastActivityAt: { gte: dayStart, lt: dayEnd } },
      ],
    },
    select: {
      id: true, loginAt: true, logoutAt: true, lastActivityAt: true,
      ipAddress: true, device: true, browser: true,
    },
    orderBy: { loginAt: "asc" },
  });

  const activities = await prisma.userActivity.findMany({
    where: { employeeId: targetEmployeeId, date: dayStart },
    select: {
      sessionId: true, activeSeconds: true, idleSeconds: true,
      firstActivityAt: true, lastActivityAt: true,
    },
  });

  const activeSeconds = activities.reduce((s, a) => s + a.activeSeconds, 0);
  const idleSeconds = activities.reduce((s, a) => s + a.idleSeconds, 0);

  const firstLoginAt = sessions[0]?.loginAt ?? null;
  const lastActivityAt =
    sessions.length > 0
      ? sessions.reduce<Date>((max, s) => (s.lastActivityAt > max ? s.lastActivityAt : max), sessions[0].lastActivityAt)
      : null;

  const actualWorkedMinutes = Math.round(activeSeconds / 60);

  return NextResponse.json({
    data: {
      date: dayStart.toISOString().slice(0, 10),
      employeeId: targetEmployeeId,
      suggestion: { startWork1: firstLoginAt, endWorkday: lastActivityAt, actualWorked: actualWorkedMinutes },
      stats: { sessionCount: sessions.length, activeSeconds, idleSeconds },
      sessions,
    },
  });
});
