import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN"];
const SUB_MANAGER_ROLES = ["MANAGER", "TEAM_LEAD"];

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const month = Number(searchParams.get("month") ?? now.getMonth() + 1);
  const year = Number(searchParams.get("year") ?? now.getFullYear());
  const priority = searchParams.get("priority") || null;
  const status = searchParams.get("status") || null;
  const teamId = searchParams.get("teamId") ? Number(searchParams.get("teamId")) : null;
  const handlerId = searchParams.get("handlerId") ? Number(searchParams.get("handlerId")) : null;
  const category = searchParams.get("category") || null;

  const userId = Number(session.user.id);
  const userRole = session.user.role;
  const isAdmin = ADMIN_ROLES.includes(userRole);
  const isSubManager = SUB_MANAGER_ROLES.includes(userRole);
  const isManager = isAdmin || isSubManager;

  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
  const daysInMonth = new Date(year, month, 0).getDate();

  // Build base scope by role
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
        unstartedCount: 0,
        inProgressCount: 0,
        unassignedCount: 0,
        statusDistribution: [],
        dailySeries: Array.from({ length: daysInMonth }, (_, i) => ({
          date: `${String(i + 1).padStart(2, "0")}/${String(month).padStart(2, "0")}`,
          created: 0,
          completed: 0,
        })),
        isManager: true,
        isAdmin: false,
        categories: [],
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
  if (category) scopeWhere.category = category;

  // Status distribution: same base scope but without status filter
  const distWhere: any = { ...baseScope };
  if (priority) distWhere.priority = priority;
  if (category) distWhere.category = category;

  const [tasksCreated, tasksCompleted, statusCounts, unstartedCount, inProgressCount, unassignedCount, categories] =
    await Promise.all([
      prisma.workList.findMany({
        where: { ...scopeWhere, createdAt: { gte: startOfMonth, lte: endOfMonth } },
        select: { createdAt: true },
      }),
      prisma.workList.findMany({
        where: {
          ...scopeWhere,
          status: "COMPLETED",
          completedDate: { gte: startOfMonth, lte: endOfMonth },
        },
        select: { completedDate: true },
      }),
      prisma.workList.groupBy({
        by: ["status"],
        where: distWhere,
        _count: { _all: true },
      }),
      prisma.workList.count({
        where: { ...distWhere, status: "NOT_STARTED" },
      }),
      prisma.workList.count({
        where: { ...distWhere, status: "IN_PROGRESS" },
      }),
      isAdmin
        ? prisma.workList.count({ where: { assignedToId: null } })
        : Promise.resolve(0),
      prisma.workList.findMany({
        where: baseScope,
        select: { category: true },
        distinct: ["category"],
        orderBy: { category: "asc" },
      }),
    ]);

  const createdByDay = Array(daysInMonth).fill(0);
  const completedByDay = Array(daysInMonth).fill(0);

  tasksCreated.forEach((t) => {
    const d = new Date(t.createdAt).getDate() - 1;
    if (d >= 0 && d < daysInMonth) createdByDay[d]++;
  });

  tasksCompleted.forEach((t) => {
    if (t.completedDate) {
      const d = new Date(t.completedDate).getDate() - 1;
      if (d >= 0 && d < daysInMonth) completedByDay[d]++;
    }
  });

  const dailySeries = Array.from({ length: daysInMonth }, (_, i) => ({
    date: `${String(i + 1).padStart(2, "0")}/${String(month).padStart(2, "0")}`,
    created: createdByDay[i],
    completed: completedByDay[i],
  }));

  return NextResponse.json({
    unstartedCount,
    inProgressCount,
    unassignedCount: Number(unassignedCount),
    statusDistribution: statusCounts.map((s) => ({
      status: s.status,
      count: s._count._all,
    })),
    dailySeries,
    isManager,
    isAdmin,
    categories: categories
      .map((c) => c.category)
      .filter((c): c is string => !!c),
  });
  } catch (error) {
    console.error("[dashboard GET]", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
