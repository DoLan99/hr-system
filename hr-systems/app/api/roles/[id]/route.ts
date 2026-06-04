import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";

const updateSchema = z.object({
  label: z.string().min(1).optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  permissions: z.record(z.any()).optional(),
});

export const PUT = withContext(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;
  if (!auth.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
});
