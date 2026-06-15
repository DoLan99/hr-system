import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireManager } from "@/lib/api-auth";

const schema = z.object({
  itemId: z.string().min(1),
  employeeId: z.number().int(),
  quantity: z.number().int().min(1).default(1),
  note: z.string().optional(),
});

// POST /api/inventory/assign — gán thiết bị cho nhân viên
export const POST = withContext(async (req: NextRequest) => {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { itemId, employeeId, quantity, note } = parsed.data;

  const item = await prisma.inventoryItem.findFirst({ where: { id: itemId, organizationId: auth.orgId } });
  if (!item) return NextResponse.json({ error: "Mặt hàng không tồn tại" }, { status: 404 });
  if (item.quantity < quantity) return NextResponse.json({ error: "Tồn kho không đủ" }, { status: 409 });

  const employee = await prisma.employee.findFirst({ where: { id: employeeId, organizationId: auth.orgId } });
  if (!employee) return NextResponse.json({ error: "Nhân viên không tồn tại" }, { status: 404 });

  const [assignment] = await prisma.$transaction([
    prisma.inventoryAssignment.create({
      data: { organizationId: auth.orgId, itemId, employeeId, quantity, note },
      include: {
        item: { select: { id: true, name: true, unit: true } },
        employee: { select: { id: true, fullName: true, department: true } },
      },
    }),
    prisma.inventoryItem.update({ where: { id: itemId }, data: { quantity: { decrement: quantity } } }),
    prisma.inventoryTransaction.create({
      data: { organizationId: auth.orgId, itemId, type: "OUT", quantity, note: `Gán cho ${employee.fullName}`, actorId: auth.actorId },
    }),
  ]);

  return NextResponse.json({ data: assignment }, { status: 201 });
});
