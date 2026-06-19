import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, MANAGER_ROLES } from "@/lib/api-auth";
import { getActorId } from "@/lib/request-context";

export const GET = withContext(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const empId = Number(params.id);
  const actorId = getActorId();
  const isManager = MANAGER_ROLES.includes(auth.roleName);
  if (!isManager && actorId !== empId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const skills = await prisma.employeeSkill.findMany({
    where: { employeeId: empId, organizationId: auth.orgId },
    include: { skill: { select: { id: true, name: true, category: true } } },
    orderBy: [{ skill: { category: "asc" } }, { skill: { name: "asc" } }],
  });

  return NextResponse.json({ data: skills });
});

const addSchema = z.object({
  skillId: z.number().int(),
  currentLevel: z.number().int().min(1).max(5).default(1),
  notes: z.string().nullable().optional(),
});

export const POST = withContext(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const empId = Number(params.id);
  const actorId = getActorId();
  const isManager = MANAGER_ROLES.includes(auth.roleName);
  if (!isManager && actorId !== empId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { skillId, currentLevel, notes } = parsed.data;

  const record = await prisma.employeeSkill.upsert({
    where: { organizationId_employeeId_skillId: { organizationId: auth.orgId, employeeId: empId, skillId } },
    create: { organizationId: auth.orgId, employeeId: empId, skillId, currentLevel, notes: notes ?? null },
    update: { currentLevel, notes: notes ?? null },
    include: { skill: { select: { id: true, name: true, category: true } } },
  });

  return NextResponse.json({ data: record });
});

export const DELETE = withContext(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const empId = Number(params.id);
  const actorId = getActorId();
  const isManager = MANAGER_ROLES.includes(auth.roleName);
  if (!isManager && actorId !== empId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const skillId = Number(searchParams.get("skillId"));
  if (!skillId) return NextResponse.json({ error: "Thiếu skillId" }, { status: 400 });

  await prisma.employeeSkill.deleteMany({
    where: { organizationId: auth.orgId, employeeId: empId, skillId },
  });

  return NextResponse.json({ ok: true });
});
