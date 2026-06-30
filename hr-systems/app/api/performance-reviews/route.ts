import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, MANAGER_ROLES } from "@/lib/api-auth";

export const GET = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const isManager = MANAGER_ROLES.includes(auth.roleName);
  const url = new URL(req.url);
  const cycleId = url.searchParams.get("cycleId");
  const status = url.searchParams.get("status");

  const where: any = { organizationId: auth.orgId };
  if (!isManager) where.employeeId = auth.actorId;
  if (cycleId) where.cycleId = Number(cycleId);
  if (status) where.status = status;

  const reviews = await prisma.performanceReview.findMany({
    where,
    include: {
      cycle: { select: { id: true, name: true, periodType: true, periodStart: true, periodEnd: true, status: true, selfDueDate: true, managerDueDate: true } },
      employee: { select: { id: true, fullName: true, department: true, avatarUrl: true } },
      mgrReviewer: { select: { id: true, fullName: true } },
    },
    orderBy: [{ cycle: { periodEnd: "desc" } }, { status: "asc" } ],
  });

  return NextResponse.json({ data: reviews });
});
