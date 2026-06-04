import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireManager } from "@/lib/api-auth";

const TEAM_SELECT = {
  id: true, name: true, code: true, description: true, isActive: true, leadId: true,
  lead: { select: { id: true, fullName: true } },
  departments: { include: { department: { select: { id: true, name: true } } } },
  _count: { select: { employees: true } },
} as const;

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().optional(),
  departmentIds: z.array(z.number().int()).optional(),
  leadId: z.number().int().nullable().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const PUT = withContext(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const id = Number(params.id);
  const d = parsed.data;

  if (d.departmentIds !== undefined) {
    await prisma.teamDepartment.deleteMany({ where: { teamId: id } });
    if (d.departmentIds.length > 0) {
      await prisma.teamDepartment.createMany({
        data: d.departmentIds.map((deptId) => ({ teamId: id, departmentId: deptId })),
      });
    }
  }

  const team = await prisma.team.update({
    where: { id },
    data: {
      ...(d.name !== undefined && { name: d.name }),
      ...(d.code !== undefined && { code: d.code }),
      ...(d.leadId !== undefined && { leadId: d.leadId }),
      ...(d.description !== undefined && { description: d.description }),
      ...(d.isActive !== undefined && { isActive: d.isActive }),
    },
    select: TEAM_SELECT,
  });

  return NextResponse.json({ data: team });
});

export const DELETE = withContext(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;

  await prisma.team.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
});
