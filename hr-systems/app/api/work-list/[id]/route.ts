import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  taskCode: z.string().optional(),
  stdTime: z.number().int().nullable().optional(),
  linkTemplate: z.string().nullable().optional(),
  note1: z.string().nullable().optional(),
  note2: z.string().nullable().optional(),
  assignedToId: z.number().int().optional(),
  testerId: z.number().int().nullable().optional(),
  priority: z.enum(["CRITICAL", "HIGH", "NORMAL", "LOW"]).optional(),
  dueDate: z.string().nullable().optional(),
  customerId: z.number().int().nullable().optional(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "BLOCKED", "COMPLETED", "CANCELLED"]).optional(),
  progressPct: z.number().int().min(0).max(100).optional(),
  reasonNextAction: z.string().optional(),
});

const include = {
  assignedTo: { select: { id: true, fullName: true, department: true } },
  assignedBy: { select: { id: true, fullName: true } },
  tester: { select: { id: true, fullName: true } },
  customer: { select: { id: true, customerName: true } },
  _count: { select: { workReports: true } },
};

// GET /api/work-list/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const item = await prisma.workList.findUnique({
    where: { wlId: params.id },
    include: {
      ...include,
      workReports: {
        select: { id: true, date: true, taskName: true, actualTime: true, creditedTime: true },
        orderBy: { date: "desc" },
        take: 20,
      },
    },
  });

  if (!item) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const userId = Number(session.user.id);
  const isManager = MANAGER_ROLES.includes(session.user.role);
  if (!isManager && item.assignedToId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ data: item });
}

// PUT /api/work-list/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.workList.findUnique({ where: { wlId: params.id } });
  if (!existing) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const userId = Number(session.user.id);
  const isManager = MANAGER_ROLES.includes(session.user.role);

  // Employee chỉ được cập nhật status/progress/reasonNextAction của task mình
  if (!isManager && existing.assignedToId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;

  // Employee chỉ update được status/progress/reason
  const data: any = {};
  if (isManager) {
    if (d.title !== undefined) data.title = d.title;
    if (d.description !== undefined) data.description = d.description;
    if (d.category !== undefined) data.category = d.category;
    if (d.taskCode !== undefined) data.taskCode = d.taskCode;
    if ("stdTime" in d) data.stdTime = d.stdTime;
    if ("linkTemplate" in d) data.linkTemplate = d.linkTemplate;
    if ("note1" in d) data.note1 = d.note1;
    if ("note2" in d) data.note2 = d.note2;
    if (d.assignedToId !== undefined) data.assignedToId = d.assignedToId;
    if ("testerId" in d) data.testerId = d.testerId;
    if (d.priority !== undefined) data.priority = d.priority;
    if ("dueDate" in d) data.dueDate = d.dueDate ? new Date(d.dueDate) : null;
    if ("customerId" in d) data.customerId = d.customerId;
  }

  if (d.status !== undefined) {
    data.status = d.status;
    if (d.status === "COMPLETED") {
      data.completedDate = new Date();
      data.progressPct = 100;
    } else if (d.status === "NOT_STARTED") {
      data.completedDate = null;
    }
  }
  if (d.progressPct !== undefined) data.progressPct = d.progressPct;
  if (d.reasonNextAction !== undefined) data.reasonNextAction = d.reasonNextAction;
  data.lastUpdate = new Date();

  const updated = await prisma.workList.update({
    where: { wlId: params.id },
    data,
    include,
  });

  return NextResponse.json({ data: updated });
}

// DELETE /api/work-list/[id] — manager only
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isManager = MANAGER_ROLES.includes(session.user.role);
  if (!isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const existing = await prisma.workList.findUnique({ where: { wlId: params.id } });
  if (!existing) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  await prisma.workList.delete({ where: { wlId: params.id } });
  return NextResponse.json({ success: true });
}
