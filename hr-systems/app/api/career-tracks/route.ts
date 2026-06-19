import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  color: z.string().optional(),
});

export const GET = withContext(async (_req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const tracks = await prisma.careerTrack.findMany({
    where: { organizationId: auth.orgId },
    include: {
      levels: {
        orderBy: { seniority: "asc" },
        include: { skillRequirements: { include: { skill: true } } },
      },
      _count: { select: { employees: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: tracks });
});

export const POST = withContext(async (req: NextRequest) => {
  try {
    const auth = await requireApiAuth();
    if (!auth.ok) return auth.response;
    if (!auth.isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

    const d = parsed.data;
    const track = await prisma.careerTrack.create({
      data: {
        organizationId: auth.orgId,
        name: d.name.trim(),
        description: d.description,
        color: d.color,
      },
      include: { levels: true, _count: { select: { employees: true } } },
    });

    return NextResponse.json({ data: track }, { status: 201 });
  } catch (e: any) {
    console.error("[career-tracks POST]", e);
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
});
