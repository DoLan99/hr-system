import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getManagedEmployeeIds, buildAssignedScope, ADMIN_ROLES, SUB_MANAGER_ROLES } from "@/lib/managed-scope";

const createSchema = z.object({
  title: z.string().min(1, "Bắt buộc"),
  description: z.string().optional(),
  category: z.string().optional(),
  taskCode: z.string().optional(),
  stdTime: z.number().int().optional(),
  linkTemplate: z.string().optional(),
  note1: z.string().optional(),
  note2: z.string().optional(),
  assignedToId: z.number().int().optional().nullable(),
  testerId: z.number().int().nullable().optional(),
  priority: z.enum(["CRITICAL", "HIGH", "NORMAL", "LOW"]).default("NORMAL"),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "BLOCKED", "COMPLETED", "CANCELLED"]).optional(),
  dueDate: z.string().optional(),
  customerId: z.number().int().optional(),
  dateAssigned: z.string().optional(),
});

const WL_INCLUDE = {
  assignedTo: { select: { id: true, fullName: true, department: true } },
  assignedBy: { select: { id: true, fullName: true } },
  tester: { select: { id: true, fullName: true } },
  customer: { select: { id: true, customerName: true } },
  _count: { select: { workReports: true } },
} as const;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const assignedToId = searchParams.get("assignedToId") ? Number(searchParams.get("assignedToId")) : null;
  const search = searchParams.get("search");
  const priority = searchParams.get("priority");
  const category = searchParams.get("category");

  const userId = Number(session.user.id);
  const userRole = session.user.role;
  const isManager = ADMIN_ROLES.includes(userRole) || SUB_MANAGER_ROLES.includes(userRole);

  const where: any = {};

  if (isManager) {
    const managedIds = await getManagedEmployeeIds(userId, userRole);
    Object.assign(where, buildAssignedScope(managedIds, assignedToId));
  } else {
    where.assignedToId = userId;
  }

  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (category) where.category = category;
  if (search) where.title = { contains: search, mode: "insensitive" };

  const items = await prisma.workList.findMany({
    where,
    include: WL_INCLUDE,
    orderBy: [{ status: "asc" }, { priority: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ data: items });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userRole = session.user.role;
  const isManager = ADMIN_ROLES.includes(userRole) || SUB_MANAGER_ROLES.includes(userRole);
  if (!isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;

  const last = await prisma.workList.findFirst({ orderBy: { id: "desc" } });
  const seq = last ? Number(last.wlId.replace("WL-", "")) + 1 : 1;
  const wlId = `WL-${String(seq).padStart(4, "0")}`;

  const item = await prisma.workList.create({
    data: {
      wlId,
      title: d.title,
      description: d.description,
      category: d.category,
      taskCode: d.taskCode,
      stdTime: d.stdTime,
      linkTemplate: d.linkTemplate,
      note1: d.note1,
      note2: d.note2,
      assignedToId: d.assignedToId ?? null,
      assignedById: Number(session.user.id),
      testerId: d.testerId ?? null,
      priority: d.priority,
      status: d.status ?? "NOT_STARTED",
      dueDate: d.dueDate ? new Date(d.dueDate) : null,
      customerId: d.customerId ?? null,
      dateAssigned: d.dateAssigned ? new Date(d.dateAssigned) : new Date(),
    },
    include: WL_INCLUDE,
  });

  return NextResponse.json({ data: item }, { status: 201 });
}
