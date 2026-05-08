import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER"];

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

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isManager = MANAGER_ROLES.includes((session.user as any).role);
  if (!isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isManager = MANAGER_ROLES.includes((session.user as any).role);
  if (!isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.department.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
}
