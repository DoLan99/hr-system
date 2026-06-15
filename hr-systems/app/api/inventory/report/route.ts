import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";

// GET /api/inventory/report — tổng quan tồn kho
export const GET = withContext(async () => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const [totalItems, categories, items] = await Promise.all([
    prisma.inventoryItem.count({ where: { organizationId: auth.orgId } }),
    prisma.inventoryCategory.findMany({
      where: { organizationId: auth.orgId },
      include: { _count: { select: { items: true } } },
    }),
    prisma.inventoryItem.findMany({
      where: { organizationId: auth.orgId },
      select: { quantity: true, minQuantity: true, costPrice: true },
    }),
  ]);

  const lowStockCount = items.filter((i) => i.minQuantity > 0 && i.quantity <= i.minQuantity).length;
  const totalValue = items.reduce((sum, i) => {
    return sum + (i.quantity * Number(i.costPrice ?? 0));
  }, 0);

  return NextResponse.json({
    data: {
      totalItems,
      lowStockCount,
      totalValue,
      categorySummary: categories.map((c) => ({ id: c.id, name: c.name, itemCount: c._count.items })),
    },
  });
});
