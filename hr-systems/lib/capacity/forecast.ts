import { prisma } from "@/lib/prisma";
import type { ForecastResponse, EmployeeForecast } from "./types";

const APPROVED = ["APPROVED", "AUTO_APPROVED"] as const;
const ACTIVE_STATUSES = ["BACKLOG", "IN_PROGRESS", "BLOCKED", "REVIEW"] as const;

function confidenceFor(weeksOfData: number): "low" | "medium" | "high" {
  if (weeksOfData >= 4) return "high";
  if (weeksOfData >= 2) return "medium";
  return "low";
}

export async function computeForecast(orgId: string): Promise<ForecastResponse> {
  const now = new Date();
  const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

  const employees = await prisma.employee.findMany({
    where: { organizationId: orgId, status: "ACTIVE" },
    select: { id: true, fullName: true, department: true, createdAt: true },
    orderBy: { fullName: "asc" },
  });

  const velocityAgg = await prisma.timeLog.groupBy({
    by: ["employeeId"],
    where: {
      organizationId: orgId,
      employeeId: { in: employees.map(e => e.id) },
      date: { gte: fourWeeksAgo, lt: now },
      approvalStatus: { in: [...APPROVED] },
    },
    _sum: { creditedMinutes: true, durationMinutes: true },
  });

  const velocityMap = new Map<number, number>();
  for (const v of velocityAgg) {
    const minutes = v._sum.creditedMinutes ?? v._sum.durationMinutes ?? 0;
    velocityMap.set(v.employeeId, minutes / 4);
  }

  const backlogTasks = await prisma.task.findMany({
    where: {
      organizationId: orgId,
      assignedToId: { in: employees.map(e => e.id) },
      status: { in: [...ACTIVE_STATUSES] },
    },
    select: { assignedToId: true, estimatedTime: true, actualTimeTotal: true },
  });

  const backlogByEmp = new Map<number, { minutes: number; count: number }>();
  for (const t of backlogTasks) {
    const remaining = Math.max(0, (t.estimatedTime ?? 0) - t.actualTimeTotal);
    const cur = backlogByEmp.get(t.assignedToId) ?? { minutes: 0, count: 0 };
    cur.minutes += remaining;
    cur.count += 1;
    backlogByEmp.set(t.assignedToId, cur);
  }

  const empForecasts: EmployeeForecast[] = employees.map(emp => {
    const velocity = velocityMap.get(emp.id) ?? 0;
    const backlog = backlogByEmp.get(emp.id) ?? { minutes: 0, count: 0 };
    const etaWeeks = velocity > 0 ? backlog.minutes / velocity : null;
    const etaDate = etaWeeks != null
      ? new Date(now.getTime() + etaWeeks * 7 * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const empAgeWeeks = Math.min(4, Math.floor((now.getTime() - emp.createdAt.getTime()) / (7 * 24 * 60 * 60 * 1000)));

    return {
      employeeId: emp.id,
      fullName: emp.fullName,
      department: emp.department,
      velocityMinutesPerWeek: Math.round(velocity),
      backlogMinutes: Math.round(backlog.minutes),
      backlogTasks: backlog.count,
      etaWeeks: etaWeeks != null ? Math.round(etaWeeks * 10) / 10 : null,
      etaDate,
      confidence: confidenceFor(empAgeWeeks),
    };
  });

  const totalBacklog = empForecasts.reduce((s, e) => s + e.backlogMinutes, 0);
  const totalVelocity = empForecasts.reduce((s, e) => s + e.velocityMinutesPerWeek, 0);
  const teamEtaWeeks = totalVelocity > 0 ? totalBacklog / totalVelocity : null;
  const teamEtaDate = teamEtaWeeks != null
    ? new Date(now.getTime() + teamEtaWeeks * 7 * 24 * 60 * 60 * 1000).toISOString()
    : null;

  return {
    asOf: now.toISOString(),
    employees: empForecasts,
    team: {
      totalBacklogMinutes: totalBacklog,
      totalVelocityPerWeek: totalVelocity,
      etaWeeks: teamEtaWeeks != null ? Math.round(teamEtaWeeks * 10) / 10 : null,
      etaDate: teamEtaDate,
    },
  };
}
