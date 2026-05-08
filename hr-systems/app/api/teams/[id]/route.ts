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

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().optional(),
  departmentIds: z.array(z.number().int()).optional(),
  leadId: z.number().int().nullable().optional(),
  description: z.string().optional(),
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

  const id = Number(params.id);
  const d = parsed.data;

  // Replace department links if provided
  if (d.departmentIds !== undefined) {
    await prisma.teamDepartment.deleteMany({ where: { teamId: id } });
    if (d.departmentIds.length > 0) {
      await prisma.teamDepartment.createMany({
        data: d.departmentIds.map(deptId => ({ teamId: id, departmentId: deptId })),
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
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isManager = MANAGER_ROLES.includes((session.user as any).role);
  if (!isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.team.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
}
