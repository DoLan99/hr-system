import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, requireManager } from "@/lib/api-auth";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().max(50).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
});

export const GET = withContext(async (_req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const skills = await prisma.skill.findMany({
    where: { organizationId: auth.orgId, isActive: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  return NextResponse.json({ data: skills });
});

export const POST = withContext(async (req: NextRequest) => {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  try {
    const skill = await prisma.skill.create({
      data: {
        organizationId: auth.orgId,
        name: parsed.data.name,
        category: parsed.data.category ?? null,
        description: parsed.data.description ?? null,
      },
    });
    return NextResponse.json({ data: skill });
  } catch (e: any) {
    if (e.code === "P2002") return NextResponse.json({ error: "Tên skill đã tồn tại" }, { status: 409 });
    throw e;
  }
});
