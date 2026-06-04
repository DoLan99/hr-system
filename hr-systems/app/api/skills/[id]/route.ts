import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireManager } from "@/lib/api-auth";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  category: z.string().max(50).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  isActive: z.boolean().optional(),
});

export const PUT = withContext(async (
  req: NextRequest,
  { params }: { params: { id: string } },
) => {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;

  const id = Number(params.id);
  const existing = await prisma.skill.findFirst({ where: { id, organizationId: auth.orgId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const updated = await prisma.skill.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ data: updated });
});

export const DELETE = withContext(async (
  _req: NextRequest,
  { params }: { params: { id: string } },
) => {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;

  const id = Number(params.id);
  const existing = await prisma.skill.findFirst({ where: { id, organizationId: auth.orgId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.skill.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
});
