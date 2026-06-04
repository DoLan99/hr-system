import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, requireManager } from "@/lib/api-auth";

const upsertSchema = z.object({
  roleId: z.number().int(),
  skillId: z.number().int(),
  requiredLevel: z.number().int().min(1).max(5),
  importance: z.enum(["CRITICAL", "IMPORTANT", "NICE_TO_HAVE"]).default("IMPORTANT"),
});

export const GET = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const roleIdParam = url.searchParams.get("roleId");

  const where: any = { organizationId: auth.orgId };
  if (roleIdParam) where.roleId = Number(roleIdParam);

  const reqs = await prisma.roleSkillRequirement.findMany({
    where,
    include: {
      skill: { select: { id: true, name: true, category: true } },
      role: { select: { id: true, name: true, label: true } },
    },
    orderBy: [{ role: { seniority: "asc" } }, { skill: { name: "asc" } }],
  });
  return NextResponse.json({ data: reqs });
});

export const POST = withContext(async (req: NextRequest) => {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const existing = await prisma.roleSkillRequirement.findFirst({
    where: {
      organizationId: auth.orgId,
      roleId: parsed.data.roleId,
      skillId: parsed.data.skillId,
    },
  });

  if (existing) {
    const updated = await prisma.roleSkillRequirement.update({
      where: { id: existing.id },
      data: {
        requiredLevel: parsed.data.requiredLevel,
        importance: parsed.data.importance,
      },
      include: { skill: true, role: { select: { id: true, name: true, label: true } } },
    });
    return NextResponse.json({ data: updated });
  }

  const created = await prisma.roleSkillRequirement.create({
    data: {
      organizationId: auth.orgId,
      roleId: parsed.data.roleId,
      skillId: parsed.data.skillId,
      requiredLevel: parsed.data.requiredLevel,
      importance: parsed.data.importance,
    },
    include: { skill: true, role: { select: { id: true, name: true, label: true } } },
  });
  return NextResponse.json({ data: created });
});
