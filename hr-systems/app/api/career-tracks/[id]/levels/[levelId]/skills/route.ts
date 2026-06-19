import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";

const upsertSchema = z.object({
  skillId: z.number().int(),
  requiredLevel: z.number().int().min(1).max(5),
  importance: z.enum(["CRITICAL", "IMPORTANT", "NICE_TO_HAVE"]).default("IMPORTANT"),
});

export const POST = withContext(async (req: NextRequest, { params }: { params: { levelId: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;
  if (!auth.isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;
  const levelId = Number(params.levelId);

  const req_ = await prisma.careerLevelSkill.upsert({
    where: { levelId_skillId: { levelId, skillId: d.skillId } },
    create: { organizationId: auth.orgId, levelId, skillId: d.skillId, requiredLevel: d.requiredLevel, importance: d.importance },
    update: { requiredLevel: d.requiredLevel, importance: d.importance },
    include: { skill: true },
  });

  return NextResponse.json({ data: req_ });
});

export const DELETE = withContext(async (req: NextRequest, { params }: { params: { levelId: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;
  if (!auth.isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { skillId } = await req.json();
  await prisma.careerLevelSkill.deleteMany({
    where: { levelId: Number(params.levelId), skillId: Number(skillId) },
  });

  return NextResponse.json({ ok: true });
});
