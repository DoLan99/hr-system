import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireManager } from "@/lib/api-auth";

const createSchema = z.object({
  name: z.string().min(1),
  role: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  isPrimary: z.boolean().optional(),
});

export const POST = withContext(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;

  const customerId = Number(params.id);
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, organizationId: auth.orgId },
    select: { id: true },
  });
  if (!customer) return NextResponse.json({ error: "Không tìm thấy khách hàng" }, { status: 404 });

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;
  const contact = await prisma.$transaction(async (tx) => {
    if (d.isPrimary) {
      await tx.customerContact.updateMany({
        where: { customerId, isPrimary: true },
        data: { isPrimary: false },
      });
    }
    return tx.customerContact.create({
      data: {
        organizationId: auth.orgId,
        customerId,
        name: d.name,
        role: d.role || null,
        email: d.email || null,
        phone: d.phone || null,
        isPrimary: d.isPrimary ?? false,
      },
    });
  });

  return NextResponse.json({ data: contact }, { status: 201 });
});
