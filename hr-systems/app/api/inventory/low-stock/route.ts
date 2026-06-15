import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";

// GET /api/inventory/low-stock — items có quantity <= minQuantity
export const GET = withContext(async () => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const items = await prisma.inventoryItem.findMany({
    where: { organizationId: auth.orgId, minQuantity: { gt: 0 } },
    include: { category: { select: { name: true } } },
    orderBy: { quantity: "asc" },
  });

  const lowStock = items.filter((i) => i.quantity <= i.minQuantity);
  return NextResponse.json({ data: lowStock, count: lowStock.length });
});
