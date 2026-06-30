import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireManager } from "@/lib/api-auth";
import { snapshotKpiForPeriod } from "@/lib/performance-reviews";

export const POST = withContext(async (
  _req: NextRequest,
  { params }: { params: { id: string } },
) => {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;

  const cycleId = Number(params.id);
  const cycle = await prisma.reviewCycle.findFirst({
    where: { id: cycleId, organizationId: auth.orgId },
  });
  if (!cycle) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const reviews = await prisma.performanceReview.findMany({
    where: { cycleId, organizationId: auth.orgId },
    select: { id: true, employeeId: true },
  });

  const period = {
    type: cycle.periodType as "QUARTERLY" | "ANNUAL" | "CUSTOM",
    start: cycle.periodStart,
    end: cycle.periodEnd,
  };

  let updated = 0;
  for (const review of reviews) {
    const snapshot = await snapshotKpiForPeriod(auth.orgId, review.employeeId, period);
    await prisma.performanceReview.update({
      where: { id: review.id },
      data: { kpiSnapshot: snapshot as any },
    });
    updated++;
  }

  return NextResponse.json({ updated });
});
