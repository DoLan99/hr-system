import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  seniority: z.number().int().min(0).optional(),
});

export const PUT = withContext(async (req: NextRequest, { params }: { params: { levelId: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;
  if (!auth.isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const level = await prisma.careerLevel.update({
    where: { id: Number(params.levelId) },
    data: parsed.data,
    include: { skillRequirements: { include: { skill: true } } },
  });

  return NextResponse.json({ data: level });
});

export const DELETE = withContext(async (_req: NextRequest, { params }: { params: { levelId: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;
  if (!auth.isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.careerLevel.delete({ where: { id: Number(params.levelId) } });
  return NextResponse.json({ ok: true });
});
