import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, MANAGER_ROLES } from "@/lib/api-auth";

const updateSchema = z.object({
  ruleNo: z.number().int().min(1).optional(),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  effectiveDate: z.string().nullable().optional(),
});

export const PUT = withContext(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const isManager = MANAGER_ROLES.includes(auth.roleName);
  if (!isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;
  const updated = await prisma.workRule.update({
    where: { id: Number(params.id) },
    data: {
      ...(d.ruleNo !== undefined && { ruleNo: d.ruleNo }),
      ...(d.title !== undefined && { title: d.title }),
      ...(d.description !== undefined && { description: d.description }),
      ...(d.effectiveDate !== undefined && { effectiveDate: d.effectiveDate ? new Date(d.effectiveDate) : null }),
    },
  });

  return NextResponse.json({ data: updated });
});

export const DELETE = withContext(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const isManager = MANAGER_ROLES.includes(auth.roleName);
  if (!isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.workRule.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
});
