import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  seniority: z.number().int().min(0),
});

export const POST = withContext(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;
  if (!auth.isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const level = await prisma.careerLevel.create({
    data: {
      organizationId: auth.orgId,
      trackId: Number(params.id),
      name: parsed.data.name.trim(),
      seniority: parsed.data.seniority,
    },
    include: { skillRequirements: { include: { skill: true } } },
  });

  return NextResponse.json({ data: level }, { status: 201 });
});
