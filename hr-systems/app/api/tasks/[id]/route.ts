import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getManagedEmployeeIds, ADMIN_ROLES, SUB_MANAGER_ROLES } from "@/lib/managed-scope";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";

const TASK_TYPES = ["NORMAL", "LEARNING", "NEW_RESEARCH", "MEETING", "ADMIN", "BILLABLE_CLIENT", "INTERNAL"] as const;
const TASK_STATUSES = ["BACKLOG", "IN_PROGRESS", "BLOCKED", "REVIEW", "DONE", "CANCELLED"] as const;

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  taskType: z.enum(TASK_TYPES).optional(),
  priority: z.enum(["CRITICAL", "HIGH", "NORMAL", "LOW"]).optional(),
  status: z.enum(TASK_STATUSES).optional(),
  estimatedTime: z.number().int().nullable().optional(),
  assignedToId: z.number().int().optional(),
  supportId: z.number().int().nullable().optional(),
  customerId: z.number().int().nullable().optional(),
  projectId: z.number().int().nullable().optional(),
  billable: z.boolean().optional(),
  hourlyRateOverride: z.number().nullable().optional(),
  requiresVideo: z.boolean().optional(),
  videoLink: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  progressPct: z.number().int().min(0).max(100).optional(),
  reasonNextAction: z.string().nullable().optional(),
});

const include = {
  assignedTo: { select: { id: true, fullName: true, avatarUrl: true } },
  assignedBy: { select: { id: true, fullName: true } },
  support: { select: { id: true, fullName: true } },
  customer: { select: { id: true, customerName: true, businessName: true } },
  template: { select: { id: true, code: true, title: true } },
  parentTask: { select: { id: true, code: true, title: true } },
  _count: { select: { timeLogs: true, subTasks: true } },
};

async function findTask(idOrCode: string) {
  const numId = Number(idOrCode);
  if (Number.isInteger(numId) && !isNaN(numId)) {
    return prisma.task.findFirst({ where: { id: numId } });
  }
  return prisma.task.findFirst({ where: { code: idOrCode } });
}

async function checkAccess(taskAssigneeId: number, userId: number, userRole: string) {
  if (ADMIN_ROLES.includes(userRole)) return true;
  if (SUB_MANAGER_ROLES.includes(userRole)) {
    const managedIds = await getManagedEmployeeIds(userId, userRole);
    return managedIds === null || managedIds.includes(taskAssigneeId) || taskAssigneeId === userId;
  }
  return taskAssigneeId === userId;
}

export const GET = withContext(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const existing = await findTask(params.id);
  if (!existing) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const ok = await checkAccess(existing.assignedToId, auth.actorId, auth.roleName);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const detail = await prisma.task.findFirst({
    where: { id: existing.id },
    include: {
      ...include,
      timeLogs: {
        select: {
          id: true,
          date: true,
          durationMinutes: true,
          creditedMinutes: true,
          approvalStatus: true,
          videoLink: true,
          note: true,
          employee: { select: { id: true, fullName: true } },
        },
        orderBy: { date: "desc" },
        take: 30,
      },
      subTasks: {
        select: { id: true, code: true, title: true, status: true, progressPct: true },
      },
    },
  });

  return NextResponse.json({ data: detail });
});

export const PUT = withContext(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const existing = await findTask(params.id);
  if (!existing) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const userId = auth.actorId;
  const userRole = auth.roleName;
  const isAdmin = ADMIN_ROLES.includes(userRole);
  const isSubManager = SUB_MANAGER_ROLES.includes(userRole);
  const isManager = isAdmin || isSubManager;

  const ok = await checkAccess(existing.assignedToId, userId, userRole);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;

  if (isSubManager && d.assignedToId !== undefined) {
    const managedIds = await getManagedEmployeeIds(userId, userRole);
    if (!managedIds || (!managedIds.includes(d.assignedToId) && d.assignedToId !== userId)) {
      return NextResponse.json({ error: "Không có quyền assign task cho nhân viên này" }, { status: 403 });
    }
  }

  if (d.status === "BLOCKED" && d.reasonNextAction === undefined && !existing.reasonNextAction) {
    return NextResponse.json({ error: "Phải điền reasonNextAction khi status = BLOCKED" }, { status: 422 });
  }

  const data: any = {};
  if (isManager) {
    if (d.title !== undefined) data.title = d.title;
    if (d.description !== undefined) data.description = d.description;
    if (d.taskType !== undefined) data.taskType = d.taskType;
    if (d.priority !== undefined) data.priority = d.priority;
    if (d.estimatedTime !== undefined) data.estimatedTime = d.estimatedTime;
    if (d.assignedToId !== undefined) data.assignedToId = d.assignedToId;
    if (d.supportId !== undefined) data.supportId = d.supportId;
    if (d.customerId !== undefined) data.customerId = d.customerId;
    if (d.projectId !== undefined) data.projectId = d.projectId;
    if (d.billable !== undefined) data.billable = d.billable;
    if (d.hourlyRateOverride !== undefined) data.hourlyRateOverride = d.hourlyRateOverride;
    if (d.requiresVideo !== undefined) data.requiresVideo = d.requiresVideo;
    if (d.dueDate !== undefined) data.dueDate = d.dueDate ? new Date(d.dueDate) : null;
  }

  if (d.videoLink !== undefined) data.videoLink = d.videoLink;

  if (d.status !== undefined) {
    data.status = d.status;
    if (d.status === "DONE") {
      data.dateCompleted = new Date();
      data.progressPct = 100;
    } else if (d.status === "IN_PROGRESS" && !existing.dateStarted) {
      data.dateStarted = new Date();
    } else if (d.status === "BACKLOG") {
      data.dateCompleted = null;
    }
  }
  if (d.progressPct !== undefined) data.progressPct = d.progressPct;
  if (d.reasonNextAction !== undefined) data.reasonNextAction = d.reasonNextAction;

  const willBeBillable = data.billable ?? existing.billable;
  const willHaveCustomer = (data.customerId !== undefined ? data.customerId : existing.customerId) ?? null;
  if (willBeBillable && !willHaveCustomer) {
    return NextResponse.json({ error: "Task billable phải có khách hàng" }, { status: 422 });
  }

  const updated = await prisma.task.update({
    where: { id: existing.id },
    data,
    include,
  });

  return NextResponse.json({ data: updated });
});

export const DELETE = withContext(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const isManager = ADMIN_ROLES.includes(auth.roleName) || SUB_MANAGER_ROLES.includes(auth.roleName);
  if (!isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const existing = await findTask(params.id);
  if (!existing) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const cancelled = await prisma.task.update({
    where: { id: existing.id },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({ success: true, data: cancelled });
});
