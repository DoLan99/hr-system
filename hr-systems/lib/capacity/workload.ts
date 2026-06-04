import { prisma } from "@/lib/prisma";
import {
  type WorkloadResponse, type EmployeeWorkload, type DayLoad,
  isBusinessDay, iterDays, ymd, startOfDay,
} from "./types";

const ACTIVE_STATUSES = ["BACKLOG", "IN_PROGRESS", "BLOCKED", "REVIEW"] as const;

interface ComputeOptions {
  startDate?: Date;
  days?: number;
  employeeIds?: number[];
}

export async function computeWorkload(
  orgId: string,
  opts: ComputeOptions = {},
): Promise<WorkloadResponse> {
  const start = startOfDay(opts.startDate ?? new Date());
  const days = opts.days ?? 14;
  const end = new Date(start);
  end.setDate(end.getDate() + days - 1);

  const employees = await prisma.employee.findMany({
    where: {
      organizationId: orgId,
      status: "ACTIVE",
      ...(opts.employeeIds && opts.employeeIds.length > 0 ? { id: { in: opts.employeeIds } } : {}),
    },
    select: { id: true, fullName: true, department: true, maxHoursMonth: true },
    orderBy: { fullName: "asc" },
  });

  if (employees.length === 0) {
    return { startDate: ymd(start), endDate: ymd(end), dayCount: days, employees: [] };
  }

  const tasks = await prisma.task.findMany({
    where: {
      organizationId: orgId,
      assignedToId: { in: employees.map(e => e.id) },
      status: { in: [...ACTIVE_STATUSES] },
      estimatedTime: { gt: 0 },
    },
    select: {
      id: true,
      assignedToId: true,
      estimatedTime: true,
      actualTimeTotal: true,
      dateStarted: true,
      dueDate: true,
    },
  });

  const dayKeys: string[] = [];
  for (const d of iterDays(start, end)) dayKeys.push(ymd(d));

  const loadByEmpDay = new Map<number, Map<string, { minutes: number; taskCount: number }>>();
  const ensureCell = (empId: number, dayKey: string) => {
    let m = loadByEmpDay.get(empId);
    if (!m) { m = new Map(); loadByEmpDay.set(empId, m); }
    let c = m.get(dayKey);
    if (!c) { c = { minutes: 0, taskCount: 0 }; m.set(dayKey, c); }
    return c;
  };

  const today = startOfDay(new Date());

  for (const task of tasks) {
    const remaining = Math.max(0, (task.estimatedTime ?? 0) - task.actualTimeTotal);
    if (remaining === 0) continue;

    const winStart = task.dateStarted && task.dateStarted > today
      ? startOfDay(task.dateStarted)
      : today;
    const winEndRaw = task.dueDate ?? new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    const winEnd = winEndRaw < winStart ? winStart : startOfDay(winEndRaw);

    const businessDays: string[] = [];
    for (const d of iterDays(winStart, winEnd)) {
      if (isBusinessDay(d)) businessDays.push(ymd(d));
    }
    if (businessDays.length === 0) {
      const fallback = isBusinessDay(today) ? ymd(today) : dayKeys.find(k => isBusinessDay(new Date(k)));
      if (!fallback) continue;
      const cell = ensureCell(task.assignedToId, fallback);
      cell.minutes += remaining;
      cell.taskCount += 1;
      continue;
    }

    const perDay = remaining / businessDays.length;
    for (const dayKey of businessDays) {
      if (!dayKeys.includes(dayKey)) continue;
      const cell = ensureCell(task.assignedToId, dayKey);
      cell.minutes += perDay;
      cell.taskCount += 1;
    }
  }

  const employeesOut: EmployeeWorkload[] = employees.map(emp => {
    const dailyCapacityMinutes = Math.round((emp.maxHoursMonth / 22) * 60);
    const cellMap = loadByEmpDay.get(emp.id) ?? new Map();
    let totalLoad = 0;
    let totalCapacity = 0;
    const days: DayLoad[] = dayKeys.map(dayKey => {
      const cell = cellMap.get(dayKey) ?? { minutes: 0, taskCount: 0 };
      const isBiz = isBusinessDay(new Date(dayKey));
      const capacityToday = isBiz ? dailyCapacityMinutes : 0;
      const utilization = capacityToday > 0 ? (cell.minutes / capacityToday) * 100 : 0;
      totalLoad += cell.minutes;
      totalCapacity += capacityToday;
      return {
        date: dayKey,
        loadMinutes: Math.round(cell.minutes),
        utilization: Math.round(utilization),
        taskCount: cell.taskCount,
      };
    });

    const avgUtilization = totalCapacity > 0 ? Math.round((totalLoad / totalCapacity) * 100) : 0;

    return {
      employeeId: emp.id,
      fullName: emp.fullName,
      department: emp.department,
      dailyCapacityMinutes,
      totalLoadMinutes: Math.round(totalLoad),
      totalCapacityMinutes: totalCapacity,
      avgUtilization,
      days,
    };
  });

  return {
    startDate: ymd(start),
    endDate: ymd(end),
    dayCount: days,
    employees: employeesOut,
  };
}
