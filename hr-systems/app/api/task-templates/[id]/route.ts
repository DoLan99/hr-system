import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { ADMIN_ROLES } from "@/lib/managed-scope";

const TASK_TYPES = ["NORMAL", "LEARNING", "NEW_RESEARCH", "MEETING", "ADMIN", "BILLABLE_CLIENT", "INTERNAL"] as const;

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  defaultTaskType: z.enum(TASK_TYPES).optional(),
  defaultEstimatedTime: z.number().int().nullable().optional(),
  defaultPriority: z.enum(["CRITICAL", "HIGH", "NORMAL", "LOW"]).optional(),
  requiresVideo: z.boolean().nullable().optional(),
  department: z.string().nullable().optional(),
  linkTemplate: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  const item = await prisma.taskTemplate.findUnique({
    where: { id },
    include: { _count: { select: { tasks: true } } },
  });
  if (!item) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  return NextResponse.json({ data: item });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userRole = session.user.role;
  const canManage = ADMIN_ROLES.includes(userRole) || userRole === "MANAGER" || userRole === "TEAM_LEAD";
  if (!canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = Number(params.id);
  const existing = await prisma.taskTemplate.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const updated = await prisma.taskTemplate.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json({ data: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!ADMIN_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = Number(params.id);
  // Soft-delete: set inactive
  const updated = await prisma.taskTemplate.update({
    where: { id },
    data: { isActive: false },
  });
  return NextResponse.json({ success: true, data: updated });
}
