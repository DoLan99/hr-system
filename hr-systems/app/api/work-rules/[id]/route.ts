import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, MANAGER_ROLES } from "@/lib/api-auth";

const updateSchema = z.object({
  ruleNo: z.number().int().min(1).optional(),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  effectiveDate: z.string().nullable().optional(),
  config: z.record(z.unknown()).optional(),
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
  const ruleId = Number(params.id);

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};
    if (d.ruleNo !== undefined) updateData.ruleNo = d.ruleNo;
    if (d.title !== undefined) updateData.title = d.title;
    if (d.description !== undefined) updateData.description = d.description;
    if (d.effectiveDate !== undefined) updateData.effectiveDate = d.effectiveDate ? new Date(d.effectiveDate) : null;
    if (d.config !== undefined) updateData.config = d.config;

    const updated = await prisma.workRule.update({ where: { id: ruleId }, data: updateData });
    return NextResponse.json({ data: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[work-rules PUT]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
});

export const DELETE = withContext(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const isManager = MANAGER_ROLES.includes(auth.roleName);
  if (!isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.workRule.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
});
