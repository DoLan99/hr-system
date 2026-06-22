import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireManager } from "@/lib/api-auth";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal("")),
  phone: z.string().nullable().optional(),
  isPrimary: z.boolean().optional(),
});

export const PUT = withContext(async (req: NextRequest, { params }: { params: { id: string; contactId: string } }) => {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;

  const customerId = Number(params.id);
  const contactId = Number(params.contactId);

  const existing = await prisma.customerContact.findFirst({
    where: { id: contactId, customerId, organizationId: auth.orgId },
  });
  if (!existing) return NextResponse.json({ error: "Không tìm thấy liên hệ" }, { status: 404 });

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;
  const contact = await prisma.$transaction(async (tx) => {
    if (d.isPrimary === true) {
      await tx.customerContact.updateMany({
        where: { customerId, isPrimary: true, NOT: { id: contactId } },
        data: { isPrimary: false },
      });
    }
    return tx.customerContact.update({
      where: { id: contactId },
      data: {
        ...(d.name !== undefined ? { name: d.name } : {}),
        ...(d.role !== undefined ? { role: d.role || null } : {}),
        ...(d.email !== undefined ? { email: d.email || null } : {}),
        ...(d.phone !== undefined ? { phone: d.phone || null } : {}),
        ...(d.isPrimary !== undefined ? { isPrimary: d.isPrimary } : {}),
      },
    });
  });

  return NextResponse.json({ data: contact });
});

export const DELETE = withContext(async (_req: NextRequest, { params }: { params: { id: string; contactId: string } }) => {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;

  const customerId = Number(params.id);
  const contactId = Number(params.contactId);

  const existing = await prisma.customerContact.findFirst({
    where: { id: contactId, customerId, organizationId: auth.orgId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "Không tìm thấy liên hệ" }, { status: 404 });

  await prisma.customerContact.delete({ where: { id: contactId } });
  return NextResponse.json({ ok: true });
});
