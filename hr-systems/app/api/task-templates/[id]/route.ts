import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ADMIN_ROLES } from "@/lib/managed-scope";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";

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

export const GET = withContext(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const id = Number(params.id);
  const item = await prisma.taskTemplate.findFirst({
    where: { id },
    include: { _count: { select: { tasks: true } } },
  });
  if (!item) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  return NextResponse.json({ data: item });
});

export const PUT = withContext(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const canManage = ADMIN_ROLES.includes(auth.roleName) || auth.roleName === "MANAGER" || auth.roleName === "TEAM_LEAD";
  if (!canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = Number(params.id);
  const existing = await prisma.taskTemplate.findFirst({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const updated = await prisma.taskTemplate.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json({ data: updated });
});

export const DELETE = withContext(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  if (!ADMIN_ROLES.includes(auth.roleName)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = Number(params.id);
  const updated = await prisma.taskTemplate.update({
    where: { id },
    data: { isActive: false },
  });
  return NextResponse.json({ success: true, data: updated });
});
