import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireManager } from "@/lib/api-auth";

const DEPT_SELECT = {
  id: true, name: true, code: true, description: true, isActive: true, headId: true,
  head: { select: { id: true, fullName: true } },
  teams: { include: { team: { select: { id: true, name: true, isActive: true } } } },
  _count: { select: { employees: true } },
} as const;

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().optional(),
  description: z.string().optional(),
  headId: z.number().int().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const PUT = withContext(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;
  const dept = await prisma.department.update({
    where: { id: Number(params.id) },
    data: {
      ...(d.name !== undefined && { name: d.name }),
      ...(d.code !== undefined && { code: d.code }),
      ...(d.description !== undefined && { description: d.description }),
      ...(d.headId !== undefined && { headId: d.headId }),
      ...(d.isActive !== undefined && { isActive: d.isActive }),
    },
    select: DEPT_SELECT,
  });

  return NextResponse.json({ data: dept });
});

export const DELETE = withContext(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;

  await prisma.department.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
});
