import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, requireManager } from "@/lib/api-auth";

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

export const GET = withContext(async (_req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const teams = await prisma.team.findMany({
    select: TEAM_SELECT,
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: teams });
});

export const POST = withContext(async (req: NextRequest) => {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;

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
    },
    select: TEAM_SELECT,
  });

  if (d.departmentIds?.length) {
    await prisma.teamDepartment.createMany({
      data: d.departmentIds.map((deptId) => ({ teamId: team.id, departmentId: deptId })),
    });
  }

  const refreshed = await prisma.team.findFirst({ where: { id: team.id }, select: TEAM_SELECT });
  return NextResponse.json({ data: refreshed }, { status: 201 });
});
