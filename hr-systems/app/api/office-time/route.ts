import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { calcActualWorked } from "@/lib/office-time";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, MANAGER_ROLES } from "@/lib/api-auth";
import { computeDayStatus } from "@/lib/attendance-status";
import { eachDayOfInterval, format, getDay, startOfDay } from "date-fns";

const clockSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkpoint: z.enum([
    "startWork1", "startLunch", "startWork2",
    "startAfternoonBreak", "startWork3", "endWorkday",
  ]),
  timeStr: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  employeeId: z.number().int().optional(),
});

/** Payroll period: 26th of prev month → 25th of current month */
function getPayrollPeriod(month: number, year: number): { start: Date; end: Date } {
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  return {
    start: new Date(prevYear, prevMonth - 1, 26, 0, 0, 0),
    end: new Date(year, month - 1, 25, 23, 59, 59),
  };
}

export const GET = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const month = Number(searchParams.get("month") ?? new Date().getMonth() + 1);
  const year = Number(searchParams.get("year") ?? new Date().getFullYear());
  const empId = searchParams.get("employeeId");
  const view = searchParams.get("view") ?? "calendar"; // "calendar" | "summary"

  const isManager = MANAGER_ROLES.includes(auth.roleName);
  const targetId = isManager && empId ? Number(empId) : auth.actorId;

  const { start, end } = getPayrollPeriod(month, year);

  const [records, leaveRecords] = await Promise.all([
    prisma.officeTime.findMany({
      where: { employeeId: targetId, organizationId: auth.orgId, date: { gte: start, lte: end } },
      include: { approvedBy: { select: { fullName: true } } },
      orderBy: { date: "asc" },
    }),
    prisma.leave.findMany({
      where: {
        employeeId: targetId,
        organizationId: auth.orgId,
        date: { gte: start, lte: end },
        status: "APPROVED",
      },
    }),
  ]);

  // Build leave map
  const leaveMap = new Map<string, { type: string; shiftType: string }>();
  for (const lv of leaveRecords) {
    leaveMap.set(format(lv.date, "yyyy-MM-dd"), { type: lv.type, shiftType: lv.shiftType });
  }

  // Build record map
  const recordMap = new Map<string, (typeof records)[0]>();
  for (const r of records) {
    recordMap.set(format(r.date, "yyyy-MM-dd"), r);
  }

  // Build daily grid for the payroll period
  const days = eachDayOfInterval({ start, end });
  const today = startOfDay(new Date());

  const grid = days.map(date => {
    const dateKey = format(date, "yyyy-MM-dd");
    const dow = getDay(date); // 0=Sun, 6=Sat
    const isWeekend = dow === 0;
    const isSaturday = dow === 6;
    const isWorkDay = !isWeekend && !isSaturday;
    const record = recordMap.get(dateKey);
    const leave = leaveMap.get(dateKey);

    const { code, workUnit, leaveUnit } = computeDayStatus({
      date,
      checkIn: record?.startWork1 ?? null,
      checkOut: record?.endWorkday ?? null,
      leaveType: leave?.type ?? null,
      leaveShift: (leave?.shiftType as any) ?? null,
      isHoliday: false,
      isWeekend,
      isSaturday,
    });

    return {
      date: dateKey,
      dow,
      isWorkDay,
      isWeekend,
      isSaturday,
      isFuture: date > today,
      code,
      workUnit,
      leaveUnit,
      checkIn: record?.startWork1 ?? null,
      checkOut: record?.endWorkday ?? null,
      explanation: record?.explanation ?? null,
      isManualTime: record?.isManualTime ?? false,
      leaveType: leave?.type ?? null,
      leaveShift: leave?.shiftType ?? null,
    };
  });

  // Summary
  const summary = {
    standardDays: grid.filter(d => d.isWorkDay && !d.isFuture).length,
    actualDays: grid.reduce((s, d) => s + d.workUnit, 0),
    payrollDays: 0,
    paidLeaveDays: 0,
    unpaidLeaveDays: 0,
    holidayDays: 0,
    specialLeaveDays: 0,
    maternityDays: 0,
    lateCount: 0,
  };

  for (const d of grid) {
    switch (d.code) {
      case "X": case "X/2": summary.payrollDays += d.workUnit; break;
      case "P": case "P/2": summary.paidLeaveDays += d.leaveUnit; summary.payrollDays += d.leaveUnit; break;
      case "L": case "L/2": summary.holidayDays += d.leaveUnit; summary.payrollDays += d.leaveUnit; break;
      case "CĐ": case "CĐ/2": summary.specialLeaveDays += d.leaveUnit; summary.payrollDays += d.leaveUnit; break;
      case "TS": case "TS/2": summary.maternityDays += d.leaveUnit; break;
      case "U": case "U/2": summary.unpaidLeaveDays += d.leaveUnit; break;
      case "XP": summary.payrollDays += 0.5; summary.paidLeaveDays += 0.5; break;
      case "XU": summary.payrollDays += 0.5; summary.unpaidLeaveDays += 0.5; break;
    }
  }

  return NextResponse.json({
    data: records,
    grid,
    summary,
    period: { start: format(start, "yyyy-MM-dd"), end: format(end, "yyyy-MM-dd"), month, year },
  });
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
    where: { date: dateStart, employeeId: targetId, organizationId: auth.orgId },
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
      data: {
        date: dateStart,
        employeeId: targetId,
        organizationId: auth.orgId,
        [checkpoint]: checkpointTime,
      },
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
