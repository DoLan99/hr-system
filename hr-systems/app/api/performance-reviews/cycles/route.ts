import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, requireManager } from "@/lib/api-auth";
import { seedReviewsForCycle, quarterDates, annualDates } from "@/lib/performance-reviews";

const createSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  periodType: z.enum(["QUARTERLY", "ANNUAL", "CUSTOM"]),
  year: z.number().int().min(2020).max(2100),
  quarter: z.number().int().min(1).max(4).optional(),
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
  selfDueDate: z.string().optional(),
  managerDueDate: z.string().optional(),
});

export const GET = withContext(async (_req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const cycles = await prisma.reviewCycle.findMany({
    where: { organizationId: auth.orgId },
    include: {
      createdBy: { select: { id: true, fullName: true } },
      _count: { select: { reviews: true } },
    },
    orderBy: [{ periodEnd: "desc" }],
  });

  const cycleIds = cycles.map(c => c.id);
  const counts = await prisma.performanceReview.groupBy({
    by: ["cycleId", "status"],
    where: { organizationId: auth.orgId, cycleId: { in: cycleIds } },
    _count: { _all: true },
  });

  const statusByCycle = new Map<number, Record<string, number>>();
  for (const c of counts) {
    const m = statusByCycle.get(c.cycleId) ?? { PENDING: 0, SELF_DONE: 0, COMPLETED: 0 };
    m[c.status] = c._count._all;
    statusByCycle.set(c.cycleId, m);
  }

  return NextResponse.json({
    data: cycles.map(c => ({
      ...c,
      statusCounts: statusByCycle.get(c.id) ?? { PENDING: 0, SELF_DONE: 0, COMPLETED: 0 },
    })),
  });
});

export const POST = withContext(async (req: NextRequest) => {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { periodType, year, quarter } = parsed.data;
  let periodStart: Date, periodEnd: Date, name: string;

  if (periodType === "QUARTERLY") {
    if (!quarter) return NextResponse.json({ error: "quarter required for QUARTERLY" }, { status: 422 });
    const dates = quarterDates(year, quarter as 1 | 2 | 3 | 4);
    periodStart = dates.start;
    periodEnd = dates.end;
    name = parsed.data.name ?? `Q${quarter} ${year}`;
  } else if (periodType === "ANNUAL") {
    const dates = annualDates(year);
    periodStart = dates.start;
    periodEnd = dates.end;
    name = parsed.data.name ?? `Annual ${year}`;
  } else {
    if (!parsed.data.periodStart || !parsed.data.periodEnd) {
      return NextResponse.json({ error: "periodStart + periodEnd required for CUSTOM" }, { status: 422 });
    }
    periodStart = new Date(parsed.data.periodStart);
    periodEnd = new Date(parsed.data.periodEnd);
    name = parsed.data.name ?? `Custom ${year}`;
  }

  const cycle = await prisma.reviewCycle.create({
    data: {
      organizationId: auth.orgId,
      name,
      periodType,
      periodStart,
      periodEnd,
      selfDueDate: parsed.data.selfDueDate ? new Date(parsed.data.selfDueDate) : null,
      managerDueDate: parsed.data.managerDueDate ? new Date(parsed.data.managerDueDate) : null,
      status: "OPEN",
      openedAt: new Date(),
      createdById: auth.actorId,
    },
  });

  const created = await seedReviewsForCycle(auth.orgId, cycle.id, {
    type: periodType,
    start: periodStart,
    end: periodEnd,
  });

  return NextResponse.json({ data: cycle, reviewsCreated: created });
});
