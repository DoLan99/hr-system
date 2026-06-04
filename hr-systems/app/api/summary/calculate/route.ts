import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calcSalary, calcTotalScore } from "@/lib/salary";
import { z } from "zod";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, MANAGER_ROLES } from "@/lib/api-auth";

const schema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020),
  employeeId: z.number().int().optional(),
});

const CREDITED_STATUSES = ["AUTO_APPROVED", "APPROVED"] as const;

export const POST = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const isManager = MANAGER_ROLES.includes(auth.roleName);
  const selfId = auth.actorId;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { month, year, employeeId } = parsed.data;

  let empIds: number[];
  if (isManager && !employeeId) {
    const emps = await prisma.employee.findMany({
      where: { status: "ACTIVE" },
      select: { id: true },
    });
    empIds = emps.map((e) => e.id);
  } else {
    empIds = [employeeId ?? selfId];
  }

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const results = await Promise.all(empIds.map((empId) => calculateOne(auth.orgId, empId, month, year, start, end)));

  return NextResponse.json({ data: results.filter(Boolean), count: results.filter(Boolean).length });
});

async function calculateOne(orgId: string, empId: number, month: number, year: number, start: Date, end: Date) {
  const emp = await prisma.employee.findFirst({
    where: { id: empId },
    select: {
      payType: true, hourlyRate: true, monthlySalary: true,
      bonusMPct: true, bonusAPct: true, bonusTPct: true,
    },
  });
  if (!emp) return null;

  const creditedAgg = await prisma.timeLog.aggregate({
    where: {
      employeeId: empId,
      date: { gte: start, lt: end },
      approvalStatus: { in: [...CREDITED_STATUSES] },
    },
    _sum: { creditedMinutes: true, durationMinutes: true },
  });
  const creditedMinutes = creditedAgg._sum.creditedMinutes ?? 0;
  const totalActualMinutes = creditedAgg._sum.durationMinutes ?? 0;

  const learnLogs = await prisma.timeLog.findMany({
    where: {
      employeeId: empId,
      date: { gte: start, lt: end },
      task: { taskType: "LEARNING" },
    },
    select: { durationMinutes: true, creditedMinutes: true, approvalStatus: true },
  });
  const learnMinutes = learnLogs
    .filter((l) => CREDITED_STATUSES.includes(l.approvalStatus as any))
    .reduce((s, l) => s + (l.creditedMinutes ?? l.durationMinutes), 0);

  const billableLogs = await prisma.timeLog.findMany({
    where: {
      employeeId: empId,
      date: { gte: start, lt: end },
      approvalStatus: { in: [...CREDITED_STATUSES] },
      task: { billable: true },
    },
    select: {
      creditedMinutes: true,
      task: { select: { hourlyRateOverride: true } },
    },
  });
  const billableMinutes = billableLogs.reduce((s, l) => s + (l.creditedMinutes ?? 0), 0);
  const empRate = emp.hourlyRate ? Number(emp.hourlyRate) : 0;
  const billableAmount = billableLogs.reduce((s, l) => {
    const rate = l.task.hourlyRateOverride ? Number(l.task.hourlyRateOverride) : empRate;
    return s + ((l.creditedMinutes ?? 0) / 60) * rate;
  }, 0);

  const otAgg = await prisma.officeTime.aggregate({
    where: { employeeId: empId, date: { gte: start, lt: end } },
    _sum: { actualWorked: true },
  });
  const workHoursRealMinutes = otAgg._sum.actualWorked ?? 0;

  const [totalTasks, completedTasks, openTasks, overdueTasks, byType] = await Promise.all([
    prisma.task.count({ where: { assignedToId: empId, status: { not: "CANCELLED" } } }),
    prisma.task.count({ where: { assignedToId: empId, status: "DONE" } }),
    prisma.task.count({
      where: { assignedToId: empId, status: { in: ["BACKLOG", "IN_PROGRESS", "BLOCKED", "REVIEW"] } },
    }),
    prisma.task.count({
      where: { assignedToId: empId, isOverdue: true, status: { notIn: ["DONE", "CANCELLED"] } },
    }),
    prisma.task.groupBy({
      by: ["taskType"],
      where: { assignedToId: empId, status: { not: "CANCELLED" } },
      _count: { _all: true },
    }),
  ]);

  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const totalActualTimeH = totalActualMinutes / 60;
  const totalCreditedTimeH = creditedMinutes / 60;
  const tasksByType = byType.reduce<Record<string, number>>((acc, b) => {
    acc[b.taskType] = b._count._all;
    return acc;
  }, {});

  const salaryResult = calcSalary({
    payType: emp.payType,
    hourlyRate: emp.hourlyRate ? Number(emp.hourlyRate) : null,
    monthlySalary: emp.monthlySalary ? Number(emp.monthlySalary) : null,
    bonusMPct: Number(emp.bonusMPct),
    bonusAPct: Number(emp.bonusAPct),
    bonusTPct: Number(emp.bonusTPct),
    creditedMinutes,
    learnMinutes,
    billableMinutes,
    billableAmount,
  });

  const deltaHours = workHoursRealMinutes / 60 - salaryResult.creditedHours;

  const existing = await prisma.salarySummary.findFirst({
    where: { employeeId: empId, month, year },
  });

  const totalScore = existing
    ? calcTotalScore({
        scoreWorkSpeed: existing.scoreWorkSpeed ? Number(existing.scoreWorkSpeed) : null,
        scoreQuality: existing.scoreQuality ? Number(existing.scoreQuality) : null,
        scoreLearning: existing.scoreLearning ? Number(existing.scoreLearning) : null,
        scoreDeadlines: existing.scoreDeadlines ? Number(existing.scoreDeadlines) : null,
        scoreInitiative: existing.scoreInitiative ? Number(existing.scoreInitiative) : null,
      })
    : null;

  const data = {
    creditedHours: salaryResult.creditedHours,
    workHoursReal: workHoursRealMinutes / 60,
    learnHours: salaryResult.learnHours,
    billableHours: salaryResult.billableHours,
    billableAmount: salaryResult.billableAmount,
    deltaHours,
    salaryCalc: salaryResult.salaryCalc,
    bonusCalc: salaryResult.bonusCalc,
    totalCalc: salaryResult.totalCalc,
    totalTasks,
    completedTasks,
    openTasks,
    overdueTasks,
    totalActualTimeH,
    totalCreditedTimeH,
    completionRate,
    tasksByType,
    ...(totalScore !== null && { totalScore }),
  };

  if (existing) {
    return prisma.salarySummary.update({
      where: { id: existing.id },
      data,
      include: {
        employee: {
          select: { id: true, fullName: true, department: true, payType: true, hourlyRate: true, monthlySalary: true },
        },
        confirmedBy: { select: { id: true, fullName: true } },
      },
    });
  }

  return prisma.salarySummary.create({
    data: { employeeId: empId, month, year, ...data },
    include: {
      employee: {
        select: { id: true, fullName: true, department: true, payType: true, hourlyRate: true, monthlySalary: true },
      },
      confirmedBy: { select: { id: true, fullName: true } },
    },
  });
}
