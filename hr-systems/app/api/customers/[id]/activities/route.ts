import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";

const createSchema = z.object({
  content: z.string().min(1),
  type: z.enum(["NOTE", "TASK", "MESSAGE", "PAYMENT", "MEETING", "CONTRACT", "OTHER"]).optional(),
});

export const POST = withContext(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const customerId = Number(params.id);
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, organizationId: auth.orgId },
    select: { id: true },
  });
  if (!customer) return NextResponse.json({ error: "Không tìm thấy khách hàng" }, { status: 404 });

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const activity = await prisma.customerActivity.create({
    data: {
      organizationId: auth.orgId,
      customerId,
      content: parsed.data.content,
      type: parsed.data.type ?? "NOTE",
      actorId: auth.actorId,
    },
    include: { actor: { select: { id: true, fullName: true } } },
  });

  return NextResponse.json({ data: activity }, { status: 201 });
});
