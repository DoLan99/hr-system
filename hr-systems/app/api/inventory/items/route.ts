import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, requireManager } from "@/lib/api-auth";

const createSchema = z.object({
  categoryId: z.number().int(),
  name: z.string().min(1).max(200),
  sku: z.string().optional(),
  unit: z.string().default("cái"),
  quantity: z.number().int().min(0).default(0),
  minQuantity: z.number().int().min(0).default(0),
  costPrice: z.number().positive().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

export const GET = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const sp = new URL(req.url).searchParams;
  const categoryId = sp.get("categoryId") ? Number(sp.get("categoryId")) : undefined;
  const lowStock = sp.get("lowStock") === "1";
  const search = sp.get("search") ?? "";

  const items = await prisma.inventoryItem.findMany({
    where: {
      organizationId: auth.orgId,
      ...(categoryId ? { categoryId } : {}),
      ...(lowStock ? { quantity: { lte: prisma.inventoryItem.fields.minQuantity } } : {}),
      ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
    },
    include: {
      category: { select: { id: true, name: true } },
      _count: { select: { assignments: { where: { returnedAt: null } } } },
    },
    orderBy: { name: "asc" },
  });

  // Low stock filter (Prisma can't compare two columns natively)
  const filtered = lowStock
    ? items.filter((i) => i.quantity <= i.minQuantity)
    : items;

  return NextResponse.json({ data: filtered });
});

export const POST = withContext(async (req: NextRequest) => {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const item = await prisma.inventoryItem.create({
    data: {
      ...parsed.data,
      costPrice: parsed.data.costPrice ?? null,
      organizationId: auth.orgId,
    },
    include: { category: { select: { id: true, name: true } } },
  });
  return NextResponse.json({ data: item }, { status: 201 });
});
