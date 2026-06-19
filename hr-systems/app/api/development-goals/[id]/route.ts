import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, MANAGER_ROLES } from "@/lib/api-auth";
import { getActorId } from "@/lib/request-context";

const GOAL_SELECT = {
  id: true, title: true, description: true, category: true,
  targetDate: true, status: true, progressPct: true,
  targetLevel: true, createdAt: true, updatedAt: true,
  skill: { select: { id: true, name: true, category: true } },
  employee: { select: { id: true, fullName: true } },
} as const;

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  category: z.string().max(50).nullable().optional(),
  targetDate: z.string().nullable().optional(),
  skillId: z.number().int().nullable().optional(),
  targetLevel: z.number().int().min(1).max(5).nullable().optional(),
  progressPct: z.number().int().min(0).max(100).optional(),
  status: z.enum(["NOT_STARTED","IN_PROGRESS","DONE","CANCELLED"]).optional(),
});

export const PUT = withContext(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const actorId = getActorId()!;
  const id = Number(params.id);
  const goal = await prisma.developmentGoal.findFirst({ where: { id, organizationId: auth.orgId } });
  if (!goal) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const isManager = MANAGER_ROLES.includes(auth.roleName);
  if (!isManager && goal.employeeId !== actorId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;
  const updated = await prisma.developmentGoal.update({
    where: { id },
    data: {
      ...d,
      targetDate: d.targetDate !== undefined ? (d.targetDate ? new Date(d.targetDate) : null) : undefined,
    },
    select: GOAL_SELECT,
  });

  return NextResponse.json({ data: updated });
});

export const DELETE = withContext(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const actorId = getActorId()!;
  const id = Number(params.id);
  const goal = await prisma.developmentGoal.findFirst({ where: { id, organizationId: auth.orgId } });
  if (!goal) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const isManager = MANAGER_ROLES.includes(auth.roleName);
  if (!isManager && goal.employeeId !== actorId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.developmentGoal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
