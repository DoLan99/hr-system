import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calcSalary, calcTotalScore } from "@/lib/salary";
import { z } from "zod";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];

const schema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020),
  employeeId: z.number().int().optional(),
});

// Approval statuses that count as "credited"
const CREDITED_STATUSES = ["AUTO_APPROVED", "APPROVED"] as const;

// POST /api/summary/calculate
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isManager = MANAGER_ROLES.includes(session.user.role);
  const selfId = Number(session.user.id);

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

  const results = await Promise.all(empIds.map((empId) => calculateOne(empId, month, year, start, end)));

  return NextResponse.json({ data: results.filter(Boolean), count: results.filter(Boolean).length });
}

async function calculateOne(empId: number, month: number, year: number, start: Date, end: Date) {
  const emp = await prisma.employee.findUnique({
    where: { id: empId },
    select: {
      payType: true,
      hourlyRate: true,
      monthlySalary: true,
      bonusMPct: true,
      bonusAPct: true,
      bonusTPct: true,
    },
  });
  if (!emp) return null;

  // 1. Credited minutes from time_logs (only auto_approved + approved)
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

  // 2. Learn minutes — duration of LEARNING task type (regardless of approval)
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

  // 3. Billable hours + amount (credited only, billable tasks)
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

  // 4. Office time
  const otAgg = await prisma.officeTime.aggregate({
    where: { employeeId: empId, date: { gte: start, lt: end } },
    _sum: { actualWorked: true },
  });
  const workHoursRealMinutes = otAgg._sum.actualWorked ?? 0;

  // 5. Task stats (current state)
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

  // 6. Salary
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

  // Preserve manual scores
  const existing = await prisma.salarySummary.findUnique({
    where: { employeeId_month_year: { employeeId: empId, month, year } },
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

  const summary = await prisma.salarySummary.upsert({
    where: { employeeId_month_year: { employeeId: empId, month, year } },
    create: { employeeId: empId, month, year, ...data },
    update: data,
    include: {
      employee: {
        select: { id: true, fullName: true, department: true, payType: true, hourlyRate: true, monthlySalary: true },
      },
      confirmedBy: { select: { id: true, fullName: true } },
    },
  });

  return summary;
}
