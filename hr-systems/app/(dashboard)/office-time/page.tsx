import { prisma, rawPrisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/current-user";
import { MANAGER_ROLES } from "@/lib/api-auth";
import { OfficeTimeClient } from "./_components/office-time-client";
import { computeDayStatus } from "@/lib/attendance-status";
import { eachDayOfInterval, format, getDay, startOfDay } from "date-fns";

export const metadata = { title: "Chấm công — HR System" };
export const dynamic = "force-dynamic";

interface Props {
  searchParams: { month?: string; year?: string; employeeId?: string };
}

function getPayrollPeriod(month: number, year: number) {
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  return {
    start: new Date(prevYear, prevMonth - 1, 26, 0, 0, 0),
    end: new Date(year, month - 1, 25, 23, 59, 59),
  };
}

export default async function OfficeTimePage({ searchParams }: Props) {
  const { employee, organization, role } = await requireAuth();
  const userId = employee.id;
  const isManager = MANAGER_ROLES.includes(role.name);

  const now = new Date();
  const month = Number(searchParams.month ?? now.getMonth() + 1);
  const year = Number(searchParams.year ?? now.getFullYear());

  const targetId = isManager && searchParams.employeeId
    ? Number(searchParams.employeeId)
    : userId;

  const { start, end } = getPayrollPeriod(month, year);

  const [records, leaveRecords, employees, targetEmp, orgSettings] = await Promise.all([
    prisma.officeTime.findMany({
      where: { organizationId: organization.id, employeeId: targetId, date: { gte: start, lte: end } },
      include: { approvedBy: { select: { fullName: true } } },
      orderBy: { date: "asc" },
    }),
    prisma.leave.findMany({
      where: {
        organizationId: organization.id,
        employeeId: targetId,
        date: { gte: start, lte: end },
        status: "APPROVED",
      },
    }),
    isManager
      ? prisma.employee.findMany({
          where: { organizationId: organization.id, status: "ACTIVE" },
          select: { id: true, fullName: true, department: true, avatarUrl: true },
          orderBy: { fullName: "asc" },
        })
      : Promise.resolve([] as { id: number; fullName: string; department: string | null; avatarUrl: string | null }[]),
    prisma.employee.findFirst({
      where: { organizationId: organization.id, id: targetId },
      select: {
        id: true,
        employeeCode: true,
        fullName: true,
        department: true,
        startDate: true,
        status: true,
        role: { select: { name: true } },
      },
    }),
    rawPrisma.organization.findUnique({
      where: { id: organization.id },
      select: { workMode: true },
    }),
  ]);

  const leaveMap = new Map<string, { type: string; shiftType: string }>();
  for (const lv of leaveRecords) {
    leaveMap.set(format(lv.date, "yyyy-MM-dd"), { type: lv.type, shiftType: lv.shiftType });
  }

  const recordMap = new Map<string, (typeof records)[0]>();
  for (const r of records) {
    recordMap.set(format(r.date, "yyyy-MM-dd"), r);
  }

  const today = startOfDay(new Date());
  const days = eachDayOfInterval({ start, end });

  const grid = days.map(date => {
    const dateKey = format(date, "yyyy-MM-dd");
    const dow = getDay(date);
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
      checkIn: record?.startWork1?.toISOString() ?? null,
      checkOut: record?.endWorkday?.toISOString() ?? null,
      explanation: record?.explanation ?? null,
      isManualTime: record?.isManualTime ?? false,
      leaveType: leave?.type ?? null,
      leaveShift: leave?.shiftType ?? null,
    };
  });

  const summary = {
    standardDays: grid.filter(d => d.isWorkDay && !d.isFuture).length,
    actualDays: 0,
    payrollDays: 0,
    paidLeaveDays: 0,
    unpaidLeaveDays: 0,
    holidayDays: 0,
    specialLeaveDays: 0,
    maternityDays: 0,
    lateCount: 0,
  };

  for (const d of grid) {
    summary.actualDays += d.workUnit;
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

  const period = {
    start: format(start, "yyyy-MM-dd"),
    end: format(end, "yyyy-MM-dd"),
    month,
    year,
  };

  return (
    <OfficeTimeClient
      initialGrid={grid}
      initialSummary={summary}
      initialPeriod={period}
      initialMonth={month}
      initialYear={year}
      employeeId={targetId}
      employees={isManager ? employees : []}
      viewingName={targetEmp?.fullName ?? null}
      workMode={orgSettings?.workMode ?? "OFFLINE"}
      employeeInfo={targetEmp ? {
        employeeCode: targetEmp.employeeCode ?? "--",
        fullName: targetEmp.fullName,
        department: targetEmp.department ?? "--",
        position: targetEmp.role?.name ?? "--",
        startDate: targetEmp.startDate ? format(targetEmp.startDate, "dd/MM/yyyy") : "--",
        status: targetEmp.status,
      } : null}
    />
  );
}
