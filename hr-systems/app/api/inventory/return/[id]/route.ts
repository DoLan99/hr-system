import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireManager } from "@/lib/api-auth";

const schema = z.object({ note: z.string().optional() });

// POST /api/inventory/return/[id] — thu hồi thiết bị (assignmentId)
export const POST = withContext(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;

  const assignment = await prisma.inventoryAssignment.findFirst({
    where: { id: params.id, organizationId: auth.orgId, returnedAt: null },
    include: { employee: { select: { fullName: true } } },
  });
  if (!assignment) return NextResponse.json({ error: "Không tìm thấy hoặc đã thu hồi" }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  const note = parsed.success ? parsed.data.note : undefined;

  await prisma.$transaction([
    prisma.inventoryAssignment.update({ where: { id: params.id }, data: { returnedAt: new Date(), note: note ?? assignment.note } }),
    prisma.inventoryItem.update({ where: { id: assignment.itemId }, data: { quantity: { increment: assignment.quantity } } }),
    prisma.inventoryTransaction.create({
      data: {
        organizationId: auth.orgId,
        itemId: assignment.itemId,
        type: "RETURN",
        quantity: assignment.quantity,
        note: `Thu hồi từ ${assignment.employee.fullName}`,
        actorId: auth.actorId,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
});
