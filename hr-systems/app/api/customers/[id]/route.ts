import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, requireManager } from "@/lib/api-auth";

const updateSchema = z.object({
  customerName: z.string().optional(),
  businessName: z.string().optional(),
  custId: z.string().optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  plz: z.string().optional(),
  website: z.string().optional(),
  vatTaxId: z.string().optional(),
  preferredLanguage: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "PROSPECT"]).optional(),
  responsibleStaffId: z.number().int().nullable().optional(),
  lastContactDate: z.string().nullable().optional(),
  notes: z.string().optional(),
});

export const GET = withContext(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const customer = await prisma.customer.findFirst({
    where: { id: Number(params.id) },
    include: {
      responsibleStaff: { select: { id: true, fullName: true } },
      _count: { select: { tasks: true, messages: true } },
    },
  });

  if (!customer) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  return NextResponse.json({ data: customer });
});

export const PUT = withContext(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;
  const updated = await prisma.customer.update({
    where: { id: Number(params.id) },
    data: {
      ...d,
      email: d.email === "" ? null : d.email,
      lastContactDate: d.lastContactDate ? new Date(d.lastContactDate) : d.lastContactDate === null ? null : undefined,
    },
    include: {
      responsibleStaff: { select: { id: true, fullName: true } },
      _count: { select: { tasks: true, messages: true } },
    },
  });

  return NextResponse.json({ data: updated });
});

export const DELETE = withContext(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;

  await prisma.customer.update({ where: { id: Number(params.id) }, data: { status: "INACTIVE" } });
  return NextResponse.json({ ok: true });
});
