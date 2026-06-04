import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, MANAGER_ROLES } from "@/lib/api-auth";

const updateSchema = z.object({
  currentLevel: z.number().int().min(1).max(5).optional(),
  targetLevel: z.number().int().min(1).max(5).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  verify: z.boolean().optional(),
});

export const PUT = withContext(async (
  req: NextRequest,
  { params }: { params: { id: string } },
) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const id = Number(params.id);
  const existing = await prisma.employeeSkill.findFirst({ where: { id, organizationId: auth.orgId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isManager = MANAGER_ROLES.includes(auth.roleName);
  const isOwner = existing.employeeId === auth.actorId;
  if (!isManager && !isOwner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const data: any = {};
  if (parsed.data.currentLevel !== undefined) data.currentLevel = parsed.data.currentLevel;
  if (parsed.data.targetLevel !== undefined) data.targetLevel = parsed.data.targetLevel;
  if (parsed.data.notes !== undefined) data.notes = parsed.data.notes;
  if (parsed.data.verify && isManager) {
    data.verifiedById = auth.actorId;
    data.verifiedAt = new Date();
  }

  const updated = await prisma.employeeSkill.update({
    where: { id },
    data,
    include: { skill: true, verifiedBy: { select: { id: true, fullName: true } } },
  });
  return NextResponse.json({ data: updated });
});

export const DELETE = withContext(async (
  _req: NextRequest,
  { params }: { params: { id: string } },
) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const id = Number(params.id);
  const existing = await prisma.employeeSkill.findFirst({ where: { id, organizationId: auth.orgId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isManager = MANAGER_ROLES.includes(auth.roleName);
  const isOwner = existing.employeeId === auth.actorId;
  if (!isManager && !isOwner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.employeeSkill.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
