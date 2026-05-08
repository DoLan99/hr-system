import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calcSalary, calcTotalScore, LEARN_TASK_IDS } from "@/lib/salary";
import { z } from "zod";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];

const schema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020),
  employeeId: z.number().int().optional(), // nếu không có → tính tất cả employees
});

// POST /api/summary/calculate
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isManager = MANAGER_ROLES.includes(session.user.role);
  // Employee chỉ được recalc của mình
  const selfId = Number(session.user.id);

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { month, year, employeeId } = parsed.data;

  // Xác định danh sách employee cần tính
  let empIds: number[];
  if (isManager && !employeeId) {
    const emps = await prisma.employee.findMany({
      where: { status: "ACTIVE" },
      select: { id: true },
    });
    empIds = emps.map(e => e.id);
  } else {
    empIds = [employeeId ?? selfId];
  }

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const results = await Promise.all(empIds.map(empId => calculateOne(empId, month, year, start, end)));

  return NextResponse.json({ data: results, count: results.length });
}

async function calculateOne(empId: number, month: number, year: number, start: Date, end: Date) {
  // Lấy thông tin employee
  const emp = await prisma.employee.findUnique({
    where: { id: empId },
    select: {
      payType: true, hourlyRate: true, monthlySalary: true,
      bonusMPct: true, bonusAPct: true, bonusTPct: true,
    },
  });
  if (!emp) return null;

  // 1. Credited time từ work_reports trong tháng
  const wrAgg = await prisma.workReport.aggregate({
    where: { employeeId: empId, date: { gte: start, lt: end } },
    _sum: { creditedTime: true, actualTime: true },
  });
  const creditedMinutes = wrAgg._sum.creditedTime ?? 0;

  // 2. Learn hours (task 2001/2002)
  const learnAgg = await prisma.workReport.aggregate({
    where: {
      employeeId: empId,
      date: { gte: start, lt: end },
      taskId: { in: LEARN_TASK_IDS },
    },
    _sum: { creditedTime: true },
  });
  const learnMinutes = learnAgg._sum.creditedTime ?? 0;

  // 3. Missing tasks approved trong tháng
  const mtAgg = await prisma.missingTask.aggregate({
    where: {
      employeeId: empId,
      date: { gte: start, lt: end },
      status: "APPROVED",
    },
    _sum: { approvedTime: true, bonusTime: true },
  });
  const missingApprovedMinutes =
    (mtAgg._sum.approvedTime ?? 0) + (mtAgg._sum.bonusTime ?? 0);

  // 4. Office time (giờ thực làm) trong tháng
  const otAgg = await prisma.officeTime.aggregate({
    where: { employeeId: empId, date: { gte: start, lt: end } },
    _sum: { actualWorked: true },
  });
  const workHoursRealMinutes = otAgg._sum.actualWorked ?? 0;

  // 5. Work list stats (trạng thái hiện tại của employee)
  const [totalTasks, completedTasks, openTasks, overdueTasks] = await Promise.all([
    prisma.workList.count({
      where: { assignedToId: empId, status: { not: "CANCELLED" } },
    }),
    prisma.workList.count({
      where: { assignedToId: empId, status: "COMPLETED" },
    }),
    prisma.workList.count({
      where: { assignedToId: empId, status: { in: ["IN_PROGRESS", "BLOCKED"] } },
    }),
    prisma.workList.count({
      where: { assignedToId: empId, isOverdue: true },
    }),
  ]);

  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const totalActualTimeH = (wrAgg._sum.actualTime ?? 0) / 60;

  // 6. Tính lương
  const salaryResult = calcSalary({
    payType: emp.payType,
    hourlyRate: emp.hourlyRate ? Number(emp.hourlyRate) : null,
    monthlySalary: emp.monthlySalary ? Number(emp.monthlySalary) : null,
    bonusMPct: Number(emp.bonusMPct),
    bonusAPct: Number(emp.bonusAPct),
    bonusTPct: Number(emp.bonusTPct),
    creditedMinutes,
    missingApprovedMinutes,
    learnMinutes,
  });

  const deltaHours = salaryResult.creditedHours - workHoursRealMinutes / 60;

  // Lấy existing để giữ scores
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

  // Upsert
  const summary = await prisma.salarySummary.upsert({
    where: { employeeId_month_year: { employeeId: empId, month, year } },
    create: {
      employeeId: empId,
      month,
      year,
      creditedHours: salaryResult.creditedHours,
      workHoursReal: workHoursRealMinutes / 60,
      learnHours: salaryResult.learnHours,
      deltaHours,
      salaryCalc: salaryResult.salaryCalc,
      bonusCalc: salaryResult.bonusCalc,
      totalCalc: salaryResult.totalCalc,
      totalTasks,
      completedTasks,
      openTasks,
      overdueTasks,
      totalActualTimeH,
      completionRate,
      ...(totalScore !== null && { totalScore }),
    },
    update: {
      creditedHours: salaryResult.creditedHours,
      workHoursReal: workHoursRealMinutes / 60,
      learnHours: salaryResult.learnHours,
      deltaHours,
      salaryCalc: salaryResult.salaryCalc,
      bonusCalc: salaryResult.bonusCalc,
      totalCalc: salaryResult.totalCalc,
      totalTasks,
      completedTasks,
      openTasks,
      overdueTasks,
      totalActualTimeH,
      completionRate,
      ...(totalScore !== null && { totalScore }),
    },
    include: {
      employee: {
        select: { id: true, fullName: true, department: true, payType: true, hourlyRate: true, monthlySalary: true },
      },
      confirmedBy: { select: { id: true, fullName: true } },
    },
  });

  return summary;
}
