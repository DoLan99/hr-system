import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, requireManager } from "@/lib/api-auth";

const DEPT_SELECT = {
  id: true, name: true, code: true, description: true, isActive: true, headId: true,
  head: { select: { id: true, fullName: true } },
  teams: { include: { team: { select: { id: true, name: true, isActive: true } } } },
  _count: { select: { employees: true } },
} as const;

const createSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  description: z.string().optional(),
  headId: z.number().int().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const GET = withContext(async (_req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const departments = await prisma.department.findMany({
    select: DEPT_SELECT,
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: departments });
});

export const POST = withContext(async (req: NextRequest) => {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;
  const dept = await prisma.department.create({
    data: { name: d.name, code: d.code, description: d.description, headId: d.headId ?? null, isActive: d.isActive ?? true },
    select: DEPT_SELECT,
  });

  return NextResponse.json({ data: dept }, { status: 201 });
});
