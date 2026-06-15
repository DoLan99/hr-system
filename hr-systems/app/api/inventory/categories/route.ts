import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, requireManager } from "@/lib/api-auth";

const schema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().optional(),
  description: z.string().optional(),
});

export const GET = withContext(async () => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const cats = await prisma.inventoryCategory.findMany({
    where: { organizationId: auth.orgId },
    include: { _count: { select: { items: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ data: cats });
});

export const POST = withContext(async (req: NextRequest) => {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const cat = await prisma.inventoryCategory.create({
    data: { ...parsed.data, organizationId: auth.orgId },
  });
  return NextResponse.json({ data: cat }, { status: 201 });
});
