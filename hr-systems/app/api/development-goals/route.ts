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

const createSchema = z.object({
  employeeId: z.number().int(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  category: z.string().max(50).nullable().optional(),
  targetDate: z.string().nullable().optional(),
  skillId: z.number().int().nullable().optional(),
  targetLevel: z.number().int().min(1).max(5).nullable().optional(),
  progressPct: z.number().int().min(0).max(100).default(0),
  status: z.enum(["NOT_STARTED","IN_PROGRESS","DONE","CANCELLED"]).default("IN_PROGRESS"),
});

export const GET = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const actorId = getActorId()!;
  const { searchParams } = new URL(req.url);
  const empId = searchParams.get("employeeId") ? Number(searchParams.get("employeeId")) : null;
  const isManager = MANAGER_ROLES.includes(auth.roleName);

  const targetId = empId ?? actorId;
  if (!isManager && targetId !== actorId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const goals = await prisma.developmentGoal.findMany({
    where: { organizationId: auth.orgId, employeeId: targetId },
    select: GOAL_SELECT,
    orderBy: [{ status: "asc" }, { targetDate: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ data: goals });
});

export const POST = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const actorId = getActorId()!;
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;
  const isManager = MANAGER_ROLES.includes(auth.roleName);
  if (!isManager && d.employeeId !== actorId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const goal = await prisma.developmentGoal.create({
    data: {
      organizationId: auth.orgId,
      employeeId: d.employeeId,
      createdById: actorId,
      title: d.title,
      description: d.description ?? null,
      category: d.category ?? null,
      targetDate: d.targetDate ? new Date(d.targetDate) : null,
      skillId: d.skillId ?? null,
      targetLevel: d.targetLevel ?? null,
      progressPct: d.progressPct,
      status: d.status,
    },
    select: GOAL_SELECT,
  });

  return NextResponse.json({ data: goal }, { status: 201 });
});
