import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getManagedEmployeeIds, buildAssignedScope, ADMIN_ROLES, SUB_MANAGER_ROLES } from "@/lib/managed-scope";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";

const TASK_TYPES = ["NORMAL", "LEARNING", "NEW_RESEARCH", "MEETING", "ADMIN", "BILLABLE_CLIENT", "INTERNAL"] as const;
const TASK_STATUSES = ["BACKLOG", "IN_PROGRESS", "BLOCKED", "REVIEW", "DONE", "CANCELLED"] as const;

const createSchema = z.object({
  title: z.string().min(1, "Bắt buộc"),
  description: z.string().optional(),
  taskType: z.enum(TASK_TYPES).default("NORMAL"),
  priority: z.enum(["CRITICAL", "HIGH", "NORMAL", "LOW"]).default("NORMAL"),
  status: z.enum(TASK_STATUSES).optional(),
  estimatedTime: z.number().int().nullable().optional(),
  templateId: z.number().int().nullable().optional(),
  parentTaskId: z.number().int().nullable().optional(),
  assignedToId: z.number().int().optional(),
  supportId: z.number().int().nullable().optional(),
  customerId: z.number().int().nullable().optional(),
  projectId: z.number().int().nullable().optional(),
  billable: z.boolean().default(false),
  hourlyRateOverride: z.number().nullable().optional(),
  requiresVideo: z.boolean().optional(),
  dueDate: z.string().nullable().optional(),
});

const TASK_INCLUDE = {
  assignedTo: { select: { id: true, fullName: true, avatarUrl: true } },
  assignedBy: { select: { id: true, fullName: true } },
  support: { select: { id: true, fullName: true } },
  customer: { select: { id: true, customerName: true, businessName: true } },
  template: { select: { id: true, code: true, title: true } },
  parentTask: { select: { id: true, code: true, title: true } },
  _count: { select: { timeLogs: true, subTasks: true } },
} as const;

export const GET = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const taskType = searchParams.get("taskType");
  const priority = searchParams.get("priority");
  const assignedToId = searchParams.get("assignedToId") ? Number(searchParams.get("assignedToId")) : null;
  const customerId = searchParams.get("customerId") ? Number(searchParams.get("customerId")) : null;
  const overdue = searchParams.get("overdue") === "true";
  const billable = searchParams.get("billable");
  const search = searchParams.get("search");

  const userId = auth.actorId;
  const userRole = auth.roleName;
  const isManager = ADMIN_ROLES.includes(userRole) || SUB_MANAGER_ROLES.includes(userRole);

  const where: any = {};

  if (isManager) {
    const managedIds = await getManagedEmployeeIds(userId, userRole);
    Object.assign(where, buildAssignedScope(managedIds, assignedToId));
  } else {
    where.assignedToId = userId;
  }

  if (status) where.status = status;
  if (taskType) where.taskType = taskType;
  if (priority) where.priority = priority;
  if (customerId) where.customerId = customerId;
  if (billable === "true") where.billable = true;
  if (billable === "false") where.billable = false;
  if (overdue) {
    where.isOverdue = true;
    where.status = { notIn: ["DONE", "CANCELLED"] };
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } },
    ];
  }

  const items = await prisma.task.findMany({
    where,
    include: TASK_INCLUDE,
    orderBy: [{ status: "asc" }, { priority: "asc" }, { dueDate: "asc" }, { dateCreated: "desc" }],
  });

  return NextResponse.json({ data: items });
});

export const POST = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const userId = auth.actorId;
  const userRole = auth.roleName;
  const isManager = ADMIN_ROLES.includes(userRole) || SUB_MANAGER_ROLES.includes(userRole);

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;

  let template: { defaultTaskType: any; defaultEstimatedTime: number | null; defaultPriority: any; requiresVideo: boolean | null; title: string } | null = null;
  if (d.templateId) {
    template = await prisma.taskTemplate.findFirst({
      where: { id: d.templateId },
      select: { defaultTaskType: true, defaultEstimatedTime: true, defaultPriority: true, requiresVideo: true, title: true },
    });
  }

  const assignedToId = d.assignedToId ?? userId;
  if (!isManager && assignedToId !== userId) {
    return NextResponse.json({ error: "Không có quyền giao task cho người khác" }, { status: 403 });
  }
  if (isManager && SUB_MANAGER_ROLES.includes(userRole) && d.assignedToId) {
    const managedIds = await getManagedEmployeeIds(userId, userRole);
    if (managedIds && !managedIds.includes(d.assignedToId) && d.assignedToId !== userId) {
      return NextResponse.json({ error: "Không có quyền giao task cho nhân viên này" }, { status: 403 });
    }
  }

  const last = await prisma.task.findFirst({ orderBy: { id: "desc" } });
  const seq = last ? Number(last.code.replace("TSK-", "")) + 1 : 1;
  const code = `TSK-${String(seq).padStart(4, "0")}`;

  const taskType = d.taskType ?? template?.defaultTaskType ?? "NORMAL";
  const requiresVideo = d.requiresVideo ??
    template?.requiresVideo ??
    ["LEARNING", "NEW_RESEARCH"].includes(taskType);

  if (d.billable && !d.customerId) {
    return NextResponse.json({ error: "Task billable phải có khách hàng" }, { status: 422 });
  }

  const status = d.status ?? (assignedToId === userId ? "IN_PROGRESS" : "BACKLOG");

  const task = await prisma.task.create({
    data: {
      organizationId: auth.orgId,
      code,
      title: d.title,
      description: d.description,
      taskType,
      priority: d.priority ?? template?.defaultPriority ?? "NORMAL",
      status,
      estimatedTime: d.estimatedTime ?? template?.defaultEstimatedTime ?? null,
      templateId: d.templateId ?? null,
      parentTaskId: d.parentTaskId ?? null,
      assignedToId,
      assignedById: userId,
      supportId: d.supportId ?? null,
      customerId: d.customerId ?? null,
      projectId: d.projectId ?? null,
      billable: d.billable,
      hourlyRateOverride: d.hourlyRateOverride ?? null,
      requiresVideo,
      dueDate: d.dueDate ? new Date(d.dueDate) : null,
      dateStarted: status === "IN_PROGRESS" ? new Date() : null,
    },
    include: TASK_INCLUDE,
  });

  if (d.templateId) {
    await prisma.taskTemplate.update({
      where: { id: d.templateId },
      data: { usageCount: { increment: 1 } },
    }).catch(() => {});
  }

  return NextResponse.json({ data: task }, { status: 201 });
});
