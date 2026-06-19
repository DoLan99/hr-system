import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  color: z.string().optional(),
});

export const PUT = withContext(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;
  if (!auth.isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const track = await prisma.careerTrack.update({
    where: { id: Number(params.id) },
    data: parsed.data,
    include: { levels: { orderBy: { seniority: "asc" } }, _count: { select: { employees: true } } },
  });

  return NextResponse.json({ data: track });
});

export const DELETE = withContext(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;
  if (!auth.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.careerTrack.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
});
