import { prisma } from "@/lib/prisma";
import { computeWorkload } from "./workload";
import type { SkillLoadResponse, EmployeeSkillRow, SkillCell } from "./types";

const TASK_TYPES = [
  "NORMAL", "LEARNING", "NEW_RESEARCH", "MEETING",
  "ADMIN", "BILLABLE_CLIENT", "INTERNAL",
] as const;

export async function computeSkillLoad(orgId: string): Promise<SkillLoadResponse> {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const employees = await prisma.employee.findMany({
    where: { organizationId: orgId, status: "ACTIVE" },
    select: { id: true, fullName: true, department: true },
    orderBy: { fullName: "asc" },
  });

  if (employees.length === 0) {
    return { taskTypes: [...TASK_TYPES], rows: [] };
  }

  const skillAgg = await prisma.task.groupBy({
    by: ["assignedToId", "taskType"],
    where: {
      organizationId: orgId,
      assignedToId: { in: employees.map(e => e.id) },
      status: "DONE",
      dateCompleted: { gte: ninetyDaysAgo },
    },
    _count: { _all: true },
    _sum: { actualTimeTotal: true },
  });

  const skillMap = new Map<string, { count: number; minutes: number }>();
  for (const s of skillAgg) {
    skillMap.set(`${s.assignedToId}:${s.taskType}`, {
      count: s._count._all,
      minutes: s._sum.actualTimeTotal ?? 0,
    });
  }

  const workload = await computeWorkload(orgId, { days: 7 });
  const utilMap = new Map(workload.employees.map(e => [e.employeeId, e.avgUtilization]));

  const rows: EmployeeSkillRow[] = employees.map(emp => {
    const skills: SkillCell[] = TASK_TYPES.map(taskType => {
      const cell = skillMap.get(`${emp.id}:${taskType}`) ?? { count: 0, minutes: 0 };
      return {
        taskType,
        experienceCount: cell.count,
        experienceMinutes: cell.minutes,
      };
    });

    return {
      employeeId: emp.id,
      fullName: emp.fullName,
      department: emp.department,
      utilization: utilMap.get(emp.id) ?? 0,
      skills,
    };
  });

  return { taskTypes: [...TASK_TYPES], rows };
}
