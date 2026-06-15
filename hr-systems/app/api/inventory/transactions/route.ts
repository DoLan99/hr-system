import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, requireManager } from "@/lib/api-auth";

const schema = z.object({
  itemId: z.string().min(1),
  type: z.enum(["IN", "OUT", "ADJUST", "RETURN"]),
  quantity: z.number().int().min(1),
  note: z.string().optional(),
  referenceNo: z.string().optional(),
});

export const GET = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const sp = new URL(req.url).searchParams;
  const itemId = sp.get("itemId");
  const limit = Math.min(Number(sp.get("limit") ?? 50), 200);

  const txs = await prisma.inventoryTransaction.findMany({
    where: { organizationId: auth.orgId, ...(itemId ? { itemId } : {}) },
    include: {
      item: { select: { id: true, name: true, unit: true } },
      actor: { select: { id: true, fullName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return NextResponse.json({ data: txs });
});

export const POST = withContext(async (req: NextRequest) => {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { itemId, type, quantity, note, referenceNo } = parsed.data;

  const item = await prisma.inventoryItem.findFirst({ where: { id: itemId, organizationId: auth.orgId } });
  if (!item) return NextResponse.json({ error: "Mặt hàng không tồn tại" }, { status: 404 });

  // Tính delta
  const delta =
    type === "IN" ? quantity
    : type === "OUT" || type === "RETURN" ? -quantity
    : quantity - item.quantity; // ADJUST: set absolute

  const newQty = type === "ADJUST" ? quantity : item.quantity + delta;
  if (newQty < 0) return NextResponse.json({ error: "Số lượng tồn kho không đủ" }, { status: 409 });

  const [tx] = await prisma.$transaction([
    prisma.inventoryTransaction.create({
      data: { organizationId: auth.orgId, itemId, type, quantity, note, referenceNo, actorId: auth.actorId },
      include: { item: { select: { id: true, name: true, unit: true } }, actor: { select: { fullName: true } } },
    }),
    prisma.inventoryItem.update({ where: { id: itemId }, data: { quantity: newQty } }),
  ]);

  return NextResponse.json({ data: tx }, { status: 201 });
});
