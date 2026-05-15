import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { calcCreditedMinutes } from "@/lib/time-logs";
import { getManagedEmployeeIds, ADMIN_ROLES, SUB_MANAGER_ROLES } from "@/lib/managed-scope";

const createSchema = z.object({
  taskId: z.number().int().positive(),
  date: z.string(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  durationMinutes: z.number().int().positive(),
  quantity: z.number().int().min(1).optional(),
  note: z.string().optional(),
  completionPctAfter: z.number().int().min(0).max(100).nullable().optional(),
  taskStatusAfter: z.enum(["IN_PROGRESS", "BLOCKED", "REVIEW", "DONE"]).nullable().optional(),
  videoCount: z.number().int().min(0).optional(),
  videoDuration: z.number().int().min(0).optional(),
  videoLink: z.string().nullable().optional(),
  proofLinks: z.array(z.string()).optional(),
});

const TIMELOG_INCLUDE = {
  employee: { select: { id: true, fullName: true, avatarUrl: true } },
  task: {
    select: {
      id: true,
      code: true,
      title: true,
      taskType: true,
      estimatedTime: true,
      billable: true,
      customerId: true,
      customer: { select: { id: true, customerName: true, businessName: true } },
    },
  },
  approvedBy: { select: { id: true, fullName: true } },
} as const;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date");
  const month = searchParams.get("month");
  const year = searchParams.get("year");
  const taskId = searchParams.get("taskId");
  const employeeIdParam = searchParams.get("employeeId");
  const approvalStatus = searchParams.get("approvalStatus");

  const userId = Number(session.user.id);
  const userRole = session.user.role;
  const isAdmin = ADMIN_ROLES.includes(userRole);
  const isSubManager = SUB_MANAGER_ROLES.includes(userRole);

  const where: any = {};

  // Scope
  if (isAdmin) {
    if (employeeIdParam) where.employeeId = Number(employeeIdParam);
  } else if (isSubManager) {
    const managedIds = await getManagedEmployeeIds(userId, userRole);
    const allIds = managedIds ? [...managedIds, userId] : [userId];
    if (employeeIdParam) {
      const targetId = Number(employeeIdParam);
      if (!allIds.includes(targetId)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      where.employeeId = targetId;
    } else {
      where.employeeId = { in: allIds };
    }
  } else {
    where.employeeId = userId;
  }

  if (dateStr) {
    const start = new Date(dateStr);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    where.date = { gte: start, lt: end };
  } else if (month && year) {
    const m = Number(month);
    const y = Number(year);
    where.date = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
  }

  if (taskId) where.taskId = Number(taskId);
  if (approvalStatus) where.approvalStatus = approvalStatus;

  const items = await prisma.timeLog.findMany({
    where,
    include: TIMELOG_INCLUDE,
    orderBy: [{ date: "desc" }, { id: "desc" }],
  });

  return NextResponse.json({ data: items });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = Number(session.user.id);
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;

  // Verify task exists + status allows logging
  const task = await prisma.task.findUnique({
    where: { id: d.taskId },
    select: {
      id: true,
      status: true,
      taskType: true,
      estimatedTime: true,
      actualTimeTotal: true,
      requiresVideo: true,
      assignedToId: true,
    },
  });
  if (!task) return NextResponse.json({ error: "Task không tồn tại" }, { status: 404 });
  if (task.status === "DONE" || task.status === "CANCELLED") {
    return NextResponse.json({ error: `Task đã ${task.status}, không thể log thêm time` }, { status: 422 });
  }

  // Permission: assignee OR admin/manager-of-assignee
  const userRole = session.user.role;
  const isAdmin = ADMIN_ROLES.includes(userRole);
  const isSubManager = SUB_MANAGER_ROLES.includes(userRole);
  if (task.assignedToId !== userId && !isAdmin) {
    if (isSubManager) {
      const managedIds = await getManagedEmployeeIds(userId, userRole);
      if (!managedIds || !managedIds.includes(task.assignedToId)) {
        return NextResponse.json({ error: "Không có quyền log time cho task này" }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: "Không có quyền log time cho task này" }, { status: 403 });
    }
  }

  // Calculate credited minutes
  const credited = calcCreditedMinutes({
    taskType: task.taskType,
    durationMinutes: d.durationMinutes,
    estimatedTime: task.estimatedTime,
    actualTimeTotalBefore: task.actualTimeTotal,
    videoLink: d.videoLink,
    requiresVideo: task.requiresVideo,
  });

  const log = await prisma.$transaction(async (tx) => {
    const created = await tx.timeLog.create({
      data: {
        taskId: d.taskId,
        employeeId: task.assignedToId, // log against the assignee
        date: new Date(d.date),
        startTime: d.startTime ? new Date(d.startTime) : null,
        endTime: d.endTime ? new Date(d.endTime) : null,
        durationMinutes: d.durationMinutes,
        quantity: d.quantity ?? 1,
        note: d.note,
        completionPctAfter: d.completionPctAfter ?? null,
        taskStatusAfter: d.taskStatusAfter ?? null,
        videoCount: d.videoCount ?? 0,
        videoDuration: d.videoDuration ?? 0,
        videoLink: d.videoLink ?? null,
        proofLinks: d.proofLinks ?? [],
        creditedMinutes: credited.creditedMinutes,
        approvalStatus: credited.approvalStatus,
      },
      include: TIMELOG_INCLUDE,
    });

    // Update task aggregates
    const taskUpdate: any = {
      actualTimeTotal: { increment: d.durationMinutes },
      lastUpdate: new Date(),
    };
    if (d.completionPctAfter !== undefined && d.completionPctAfter !== null) {
      taskUpdate.progressPct = d.completionPctAfter;
    }
    if (d.taskStatusAfter) {
      taskUpdate.status = d.taskStatusAfter;
      if (d.taskStatusAfter === "DONE") {
        taskUpdate.dateCompleted = new Date();
        taskUpdate.progressPct = 100;
      }
    } else if (task.status === "BACKLOG") {
      taskUpdate.status = "IN_PROGRESS";
      taskUpdate.dateStarted = new Date();
    }

    await tx.task.update({ where: { id: task.id }, data: taskUpdate });

    return created;
  });

  return NextResponse.json({ data: log }, { status: 201 });
}
