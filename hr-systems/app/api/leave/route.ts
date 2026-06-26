import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, MANAGER_ROLES } from "@/lib/api-auth";
import { triggerWorkflow } from "@/lib/workflow-engine";

const ALL_LEAVE_TYPES = [
  "PAID_LEAVE", "UNPAID_LEAVE", "INSURANCE_LEAVE", "SICK_LEAVE_PAID",
  "PERSONAL_TIME_PAID", "HALF_DAY_PAID", "HALF_DAY_UNPAID", "COMPENSATORY_LEAVE",
  "SPECIAL_LEAVE", "OUT_OF_OFFICE_WORK", "RESIGNATION", "MATERNITY_LEAVE",
  "CHILD_CARE_LEAVE", "VACATION", "HOLIDAY", "ILLNESS", "OTHER",
] as const;

const createSchema = z.object({
  dates: z.array(z.object({
    date: z.string().min(1),
    shiftType: z.enum(["FULL_DAY", "MORNING", "AFTERNOON"]).default("FULL_DAY"),
  })).min(1),
  type: z.enum(ALL_LEAVE_TYPES),
  reason: z.string().optional(),
  evidenceLink: z.string().optional(),
  approverId: z.number().int().optional(),
  employeeId: z.number().int().optional(),
});

function hoursForShift(shift: "FULL_DAY" | "MORNING" | "AFTERNOON"): number {
  return shift === "FULL_DAY" ? 8 : 4;
}

export const GET = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") ? Number(searchParams.get("month")) : null;
  const year = searchParams.get("year") ? Number(searchParams.get("year")) : null;
  const status = searchParams.get("status");
  const empId = searchParams.get("employeeId");

  const isManager = MANAGER_ROLES.includes(auth.roleName);

  const where: any = { organizationId: auth.orgId };
  if (!isManager) where.employeeId = auth.actorId;
  else if (empId) where.employeeId = Number(empId);

  if (status && status !== "ALL") where.status = status;

  if (month && year) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    where.date = { gte: start, lt: end };
  } else if (year) {
    where.date = { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) };
  }

  const [leaves, total] = await Promise.all([
    prisma.leave.findMany({
      where,
      include: {
        employee: { select: { id: true, fullName: true, department: true, avatarUrl: true } },
        approvedBy: { select: { id: true, fullName: true } },
        approver: { select: { id: true, fullName: true } },
      },
      orderBy: { date: "desc" },
    }),
    prisma.leave.count({ where }),
  ]);

  return NextResponse.json({ data: leaves, total });
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

  // Check for duplicate dates
  const datesToCreate = d.dates.map(dt => new Date(dt.date + "T00:00:00"));
  const existingLeaves = await prisma.leave.findMany({
    where: {
      organizationId: auth.orgId,
      employeeId,
      date: { in: datesToCreate },
      status: { not: "REJECTED" },
    },
  });

  if (existingLeaves.length > 0) {
    const dupeDate = existingLeaves[0].date.toISOString().slice(0, 10);
    return NextResponse.json(
      { error: `Ngày ${dupeDate} đã có đơn nghỉ phép. Không thể tạo đơn trùng ngày.` },
      { status: 409 }
    );
  }

  // Create one leave record per date
  const creates = d.dates.map(dt => ({
    organizationId: auth.orgId,
    date: new Date(dt.date + "T00:00:00"),
    employeeId,
    type: d.type,
    shiftType: dt.shiftType,
    requestedHours: hoursForShift(dt.shiftType),
    reason: d.reason,
    evidenceLink: d.evidenceLink,
    approverId: d.approverId ?? null,
    status: "PENDING" as const,
  }));

  const leaves = await prisma.$transaction(
    creates.map(data => prisma.leave.create({
      data,
      include: {
        employee: { select: { id: true, fullName: true, department: true } },
        approvedBy: { select: { id: true, fullName: true } },
        approver: { select: { id: true, fullName: true } },
      },
    }))
  );

  // Trigger workflow for the first leave (group)
  if (leaves.length > 0) {
    void triggerWorkflow({
      orgId: auth.orgId,
      targetType: "LEAVE",
      targetId: String(leaves[0].id),
      initiatorId: auth.actorId,
    });
  }

  return NextResponse.json({ data: leaves }, { status: 201 });
});
