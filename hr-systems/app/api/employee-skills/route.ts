import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, MANAGER_ROLES } from "@/lib/api-auth";

const upsertSchema = z.object({
  skillId: z.number().int(),
  employeeId: z.number().int().optional(),
  currentLevel: z.number().int().min(1).max(5),
  targetLevel: z.number().int().min(1).max(5).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

export const GET = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const isManager = MANAGER_ROLES.includes(auth.roleName);
  const url = new URL(req.url);
  const employeeIdParam = url.searchParams.get("employeeId");
  const employeeId = employeeIdParam ? Number(employeeIdParam) : auth.actorId;

  if (!isManager && employeeId !== auth.actorId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const skills = await prisma.employeeSkill.findMany({
    where: { organizationId: auth.orgId, employeeId },
    include: {
      skill: { select: { id: true, name: true, category: true, description: true } },
      verifiedBy: { select: { id: true, fullName: true } },
    },
    orderBy: [{ skill: { category: "asc" } }, { skill: { name: "asc" } }],
  });
  return NextResponse.json({ data: skills });
});

export const POST = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const isManager = MANAGER_ROLES.includes(auth.roleName);
  const employeeId = parsed.data.employeeId ?? auth.actorId;
  if (!isManager && employeeId !== auth.actorId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const skill = await prisma.skill.findFirst({
    where: { id: parsed.data.skillId, organizationId: auth.orgId, isActive: true },
  });
  if (!skill) return NextResponse.json({ error: "Skill không tồn tại" }, { status: 404 });

  const existing = await prisma.employeeSkill.findFirst({
    where: { organizationId: auth.orgId, employeeId, skillId: parsed.data.skillId },
  });

  if (existing) {
    const updated = await prisma.employeeSkill.update({
      where: { id: existing.id },
      data: {
        currentLevel: parsed.data.currentLevel,
        targetLevel: parsed.data.targetLevel ?? null,
        notes: parsed.data.notes ?? null,
      },
      include: { skill: true, verifiedBy: { select: { id: true, fullName: true } } },
    });
    return NextResponse.json({ data: updated });
  }

  const created = await prisma.employeeSkill.create({
    data: {
      organizationId: auth.orgId,
      employeeId,
      skillId: parsed.data.skillId,
      currentLevel: parsed.data.currentLevel,
      targetLevel: parsed.data.targetLevel ?? null,
      notes: parsed.data.notes ?? null,
    },
    include: { skill: true, verifiedBy: { select: { id: true, fullName: true } } },
  });
  return NextResponse.json({ data: created });
});
