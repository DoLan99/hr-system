import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, MANAGER_ROLES } from "@/lib/api-auth";
import { triggerWorkflow } from "@/lib/workflow-engine";

const createSchema = z.object({
  date: z.string().min(1),
  type: z.enum(["VACATION", "HOLIDAY", "ILLNESS", "OTHER"]),
  requestedHours: z.number().min(0.5).max(24),
  reason: z.string().optional(),
  evidenceLink: z.string().optional(),
  employeeId: z.number().int().optional(),
});

export const GET = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") ? Number(searchParams.get("month")) : null;
  const year = searchParams.get("year") ? Number(searchParams.get("year")) : null;
  const status = searchParams.get("status");
  const empId = searchParams.get("employeeId");

  const isManager = MANAGER_ROLES.includes(auth.roleName);

  const where: any = {};
  if (!isManager) where.employeeId = auth.actorId;
  else if (empId) where.employeeId = Number(empId);

  if (status) where.status = status;

  if (month && year) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    where.date = { gte: start, lt: end };
  } else if (year) {
    where.date = { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) };
  }

  const leaves = await prisma.leave.findMany({
    where,
    include: {
      employee: { select: { id: true, fullName: true, department: true } },
      approvedBy: { select: { id: true, fullName: true } },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ data: leaves });
});

export const POST = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;
  const isManager = MANAGER_ROLES.includes(auth.roleName);
  const employeeId = isManager && d.employeeId ? d.employeeId : auth.actorId;

  const leave = await prisma.leave.create({
    data: {
      date: new Date(d.date),
      employeeId,
      type: d.type,
      requestedHours: d.requestedHours,
      reason: d.reason,
      evidenceLink: d.evidenceLink,
      status: "PENDING",
    },
    include: {
      employee: { select: { id: true, fullName: true, department: true } },
      approvedBy: { select: { id: true, fullName: true } },
    },
  });

  // Tự động khởi động workflow nếu org có template LEAVE
  void triggerWorkflow({
    orgId: auth.orgId,
    targetType: "LEAVE",
    targetId: String(leave.id),
    initiatorId: auth.actorId,
  });

  return NextResponse.json({ data: leave }, { status: 201 });
});
