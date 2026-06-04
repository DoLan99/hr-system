import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { calcActualWorked } from "@/lib/office-time";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, MANAGER_ROLES } from "@/lib/api-auth";

const clockSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkpoint: z.enum([
    "startWork1", "startLunch", "startWork2",
    "startAfternoonBreak", "startWork3", "endWorkday",
  ]),
  timeStr: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  employeeId: z.number().int().optional(),
});

export const GET = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const month = Number(searchParams.get("month") ?? new Date().getMonth() + 1);
  const year = Number(searchParams.get("year") ?? new Date().getFullYear());
  const empId = searchParams.get("employeeId");

  const isManager = MANAGER_ROLES.includes(auth.roleName);
  const targetId = isManager && empId ? Number(empId) : auth.actorId;

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const records = await prisma.officeTime.findMany({
    where: { employeeId: targetId, date: { gte: start, lt: end } },
    include: { approvedBy: { select: { fullName: true } } },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({ data: records });
});

export const POST = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const parsed = clockSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { date, checkpoint, timeStr, employeeId: bodyEmpId } = parsed.data;

  const isManager = MANAGER_ROLES.includes(auth.roleName);
  const targetId = isManager && bodyEmpId ? bodyEmpId : auth.actorId;

  if (!isManager && bodyEmpId && bodyEmpId !== auth.actorId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const dateStart = new Date(date + "T00:00:00");
  let checkpointTime: Date;
  if (timeStr) {
    const [h, m] = timeStr.split(":").map(Number);
    checkpointTime = new Date(dateStart);
    checkpointTime.setHours(h, m, 0, 0);
  } else {
    checkpointTime = new Date();
  }

  const existing = await prisma.officeTime.findFirst({
    where: { date: dateStart, employeeId: targetId },
  });

  let record;
  if (existing) {
    record = await prisma.officeTime.update({
      where: { id: existing.id },
      data: {
        [checkpoint]: checkpointTime,
        ...(targetId === auth.actorId && !isManager && { approvalStatus: "PENDING", approvedById: null, approvedAt: null }),
      },
    });
  } else {
    record = await prisma.officeTime.create({
      data: { date: dateStart, employeeId: targetId, [checkpoint]: checkpointTime },
    });
  }

  const actualWorked = calcActualWorked(record);
  const delta = actualWorked > 0 ? record.timeLogsTotal - actualWorked : null;

  const updated = await prisma.officeTime.update({
    where: { id: record.id },
    data: { actualWorked, delta },
    include: { approvedBy: { select: { fullName: true } } },
  });

  return NextResponse.json({ data: updated }, { status: 201 });
});
