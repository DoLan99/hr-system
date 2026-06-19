import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { getActorId } from "@/lib/request-context";
import { requireApiAuth, MANAGER_ROLES } from "@/lib/api-auth";

export const GET = withContext(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const actorId = getActorId();
  const empId = Number(params.id);
  const isManager = MANAGER_ROLES.includes(auth.roleName);
  if (!isManager && actorId !== empId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
  const quarterStart = new Date(now.getFullYear(), quarterMonth, 1);

  const [tasksDone, leaveDays, latestReview] = await Promise.all([
    prisma.task.count({
      where: {
        assigneeId: empId,
        status: "DONE",
        updatedAt: { gte: quarterStart },
      },
    }),
    prisma.leave.aggregate({
      where: {
        employeeId: empId,
        status: "APPROVED",
        date: { gte: yearStart },
      },
      _sum: { requestedHours: true },
    }),
    prisma.performanceReview.findFirst({
      where: { employeeId: empId },
      orderBy: { updatedAt: "desc" },
      select: { mgrTotalScore: true, selfTotalScore: true, status: true },
    }),
  ]);

  const leaveHours = Number(leaveDays._sum.requestedHours ?? 0);
  const leaveDaysCount = Math.round(leaveHours / 8);

  const score = latestReview?.mgrTotalScore
    ? Number(latestReview.mgrTotalScore).toFixed(1)
    : latestReview?.selfTotalScore
    ? Number(latestReview.selfTotalScore).toFixed(1)
    : null;

  const quarter = `Q${Math.floor(now.getMonth() / 3) + 1}·${now.getFullYear()}`;

  return NextResponse.json({ tasksDone, leaveDays: leaveDaysCount, score, quarter });
});
