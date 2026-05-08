import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER"];

const TEAM_SELECT = {
  id: true, name: true, code: true, description: true, isActive: true, leadId: true,
  lead: { select: { id: true, fullName: true } },
  departments: { include: { department: { select: { id: true, name: true } } } },
  _count: { select: { employees: true } },
} as const;

const createSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  departmentIds: z.array(z.number().int()).optional(),
  leadId: z.number().int().nullable().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const teams = await prisma.team.findMany({
    select: TEAM_SELECT,
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: teams });
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
  const team = await prisma.team.create({
    data: {
      name: d.name,
      code: d.code,
      leadId: d.leadId ?? null,
      description: d.description,
      isActive: d.isActive ?? true,
      departments: d.departmentIds?.length
        ? { create: d.departmentIds.map(id => ({ departmentId: id })) }
        : undefined,
    },
    select: TEAM_SELECT,
  });

  return NextResponse.json({ data: team }, { status: 201 });
}
