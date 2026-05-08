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

const createSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  description: z.string().optional(),
  headId: z.number().int().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const departments = await prisma.department.findMany({
    select: DEPT_SELECT,
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: departments });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isManager = MANAGER_ROLES.includes((session.user as any).role);
  if (!isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;
  const dept = await prisma.department.create({
    data: { name: d.name, code: d.code, description: d.description, headId: d.headId ?? null, isActive: d.isActive ?? true },
    select: DEPT_SELECT,
  });

  return NextResponse.json({ data: dept }, { status: 201 });
}
