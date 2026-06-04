import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN"];
const SUB_MANAGER_ROLES = ["MANAGER", "TEAM_LEAD"];

export const GET = withContext(async (req: NextRequest) => {
  try {
    const auth = await requireApiAuth();
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const month = Number(searchParams.get("month") ?? now.getMonth() + 1);
    const year = Number(searchParams.get("year") ?? now.getFullYear());
    const priority = searchParams.get("priority") || null;
    const status = searchParams.get("status") || null;
    const teamId = searchParams.get("teamId") ? Number(searchParams.get("teamId")) : null;
    const handlerId = searchParams.get("handlerId") ? Number(searchParams.get("handlerId")) : null;
    const taskType = searchParams.get("taskType") || null;

    const userId = auth.actorId;
    const userRole = auth.roleName;
    const isAdmin = ADMIN_ROLES.includes(userRole);
    const isSubManager = SUB_MANAGER_ROLES.includes(userRole);
    const isManager = isAdmin || isSubManager;

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
    const daysInMonth = new Date(year, month, 0).getDate();

    const baseScope: any = {};

    if (isAdmin) {
      if (teamId) baseScope.assignedTo = { teamId };
    } else if (isSubManager) {
      let managedIds: number[] = [];
      if (userRole === "TEAM_LEAD") {
        const myTeam = await prisma.team.findFirst({
          where: { leadId: userId, isActive: true },
          select: { employees: { where: { status: "ACTIVE" }, select: { id: true } } },
        });
        managedIds = myTeam?.employees.map((e) => e.id) ?? [];
      } else {
        const subs = await prisma.employee.findMany({
          where: { managerId: userId, status: "ACTIVE" },
          select: { id: true },
        });
        managedIds = subs.map((e) => e.id);
      }

      if (managedIds.length === 0) {
        return NextResponse.json({
          backlogCount: 0,
          inProgressCount: 0,
          blockedCount: 0,
          reviewCount: 0,
          overdueCount: 0,
          statusDistribution: [],
          dailySeries: Array.from({ length: daysInMonth }, (_, i) => ({
            date: `${String(i + 1).padStart(2, "0")}/${String(month).padStart(2, "0")}`,
            created: 0,
            completed: 0,
          })),
          isManager: true,
          isAdmin: false,
          taskTypes: [],
        });
      }

      if (handlerId && managedIds.includes(handlerId)) {
        baseScope.assignedToId = handlerId;
      } else {
        baseScope.assignedToId = { in: managedIds };
      }
    } else {
      baseScope.assignedToId = userId;
    }

    const scopeWhere: any = { ...baseScope };
    if (priority) scopeWhere.priority = priority;
    if (status) scopeWhere.status = status;
    if (taskType) scopeWhere.taskType = taskType;

    const distWhere: any = { ...baseScope };
    if (priority) distWhere.priority = priority;
    if (taskType) distWhere.taskType = taskType;

    const [tasksCreated, tasksCompleted, statusCounts, backlogCount, inProgressCount, blockedCount, reviewCount, overdueCount, taskTypes] =
      await Promise.all([
        prisma.task.findMany({
          where: { ...scopeWhere, dateCreated: { gte: startOfMonth, lte: endOfMonth } },
          select: { dateCreated: true },
        }),
        prisma.task.findMany({
          where: {
            ...scopeWhere,
            status: "DONE",
            dateCompleted: { gte: startOfMonth, lte: endOfMonth },
          },
          select: { dateCompleted: true },
        }),
        prisma.task.groupBy({
          by: ["status"],
          where: distWhere,
          _count: { _all: true },
        }),
        prisma.task.count({ where: { ...distWhere, status: "BACKLOG" } }),
        prisma.task.count({ where: { ...distWhere, status: "IN_PROGRESS" } }),
        prisma.task.count({ where: { ...distWhere, status: "BLOCKED" } }),
        prisma.task.count({ where: { ...distWhere, status: "REVIEW" } }),
        prisma.task.count({
          where: {
            ...distWhere,
            isOverdue: true,
            status: { notIn: ["DONE", "CANCELLED"] },
          },
        }),
        prisma.task.findMany({
          where: baseScope,
          select: { taskType: true },
          distinct: ["taskType"],
        }),
      ]);

    const createdByDay = Array(daysInMonth).fill(0);
    const completedByDay = Array(daysInMonth).fill(0);

    tasksCreated.forEach((t) => {
      const d = new Date(t.dateCreated).getDate() - 1;
      if (d >= 0 && d < daysInMonth) createdByDay[d]++;
    });

    tasksCompleted.forEach((t) => {
      if (t.dateCompleted) {
        const d = new Date(t.dateCompleted).getDate() - 1;
        if (d >= 0 && d < daysInMonth) completedByDay[d]++;
      }
    });

    const dailySeries = Array.from({ length: daysInMonth }, (_, i) => ({
      date: `${String(i + 1).padStart(2, "0")}/${String(month).padStart(2, "0")}`,
      created: createdByDay[i],
      completed: completedByDay[i],
    }));

    return NextResponse.json({
      backlogCount,
      inProgressCount,
      blockedCount,
      reviewCount,
      overdueCount,
      statusDistribution: statusCounts.map((s) => ({
        status: s.status,
        count: s._count._all,
      })),
      dailySeries,
      isManager,
      isAdmin,
      taskTypes: taskTypes.map((t) => t.taskType),
    });
  } catch (error) {
    console.error("[dashboard GET]", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
});
