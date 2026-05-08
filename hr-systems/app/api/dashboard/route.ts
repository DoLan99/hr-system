import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const month = Number(searchParams.get("month") ?? now.getMonth() + 1);
  const year = Number(searchParams.get("year") ?? now.getFullYear());
  const priority = searchParams.get("priority") || null;
  const status = searchParams.get("status") || null;
  const teamId = searchParams.get("teamId") ? Number(searchParams.get("teamId")) : null;
  const category = searchParams.get("category") || null;

  const userId = Number(session.user.id);
  const isManager = MANAGER_ROLES.includes(session.user.role);

  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
  const daysInMonth = new Date(year, month, 0).getDate();

  const scopeWhere: any = isManager ? {} : { assignedToId: userId };
  if (teamId) scopeWhere.assignedTo = { teamId };
  if (priority) scopeWhere.priority = priority;
  if (status) scopeWhere.status = status;
  if (category) scopeWhere.category = category;

  // Status distribution scope (without status filter so we see all statuses)
  const distWhere: any = isManager ? {} : { assignedToId: userId };
  if (teamId) distWhere.assignedTo = { teamId };
  if (priority) distWhere.priority = priority;
  if (category) distWhere.category = category;

  const [tasksCreated, tasksCompleted, statusCounts, unstartedCount, unassignedCount, categories] =
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
      prisma.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*)::bigint as count FROM "public"."work_list" WHERE "assignedToId" IS NULL`,
      prisma.workList.findMany({
        where: isManager ? {} : { assignedToId: userId },
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
    unassignedCount: Number(unassignedCount[0]?.count ?? 0),
    statusDistribution: statusCounts.map((s) => ({
      status: s.status,
      count: s._count._all,
    })),
    dailySeries,
    isManager,
    categories: categories
      .map((c) => c.category)
      .filter((c): c is string => !!c),
  });
}
