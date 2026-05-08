import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN"];

const updateSchema = z.object({
  label: z.string().min(1).optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  permissions: z.record(z.any()).optional(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = ADMIN_ROLES.includes((session.user as any).role);
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;
  const role = await prisma.role.update({
    where: { id: Number(params.id) },
    data: {
      ...(d.label !== undefined && { label: d.label }),
      ...(d.description !== undefined && { description: d.description }),
      ...(d.color !== undefined && { color: d.color }),
      ...(d.permissions !== undefined && { permissions: d.permissions }),
    },
    include: { _count: { select: { employees: true } } },
  });

  return NextResponse.json({ data: role });
}
