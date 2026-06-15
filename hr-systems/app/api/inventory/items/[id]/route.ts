import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, requireManager } from "@/lib/api-auth";

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  sku: z.string().optional(),
  unit: z.string().optional(),
  minQuantity: z.number().int().min(0).optional(),
  costPrice: z.number().positive().nullable().optional(),
  location: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  categoryId: z.number().int().optional(),
});

export const GET = withContext(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const item = await prisma.inventoryItem.findFirst({
    where: { id: params.id, organizationId: auth.orgId },
    include: {
      category: true,
      transactions: { orderBy: { createdAt: "desc" }, take: 20, include: { actor: { select: { fullName: true } } } },
      assignments: {
        where: { returnedAt: null },
        include: { employee: { select: { id: true, fullName: true, department: true } } },
      },
    },
  });
  if (!item) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  return NextResponse.json({ data: item });
});

export const PUT = withContext(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;

  const existing = await prisma.inventoryItem.findFirst({ where: { id: params.id, organizationId: auth.orgId } });
  if (!existing) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const item = await prisma.inventoryItem.update({
    where: { id: params.id },
    data: parsed.data,
    include: { category: { select: { id: true, name: true } } },
  });
  return NextResponse.json({ data: item });
});

export const DELETE = withContext(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;

  const item = await prisma.inventoryItem.findFirst({ where: { id: params.id, organizationId: auth.orgId } });
  if (!item) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const active = await prisma.inventoryAssignment.count({ where: { itemId: params.id, returnedAt: null } });
  if (active > 0) return NextResponse.json({ error: `Có ${active} thiết bị đang được sử dụng` }, { status: 409 });

  await prisma.inventoryItem.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
});
