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
  customerSince: z.string().nullable().optional(),
  contractRenewDate: z.string().nullable().optional(),
  notes: z.string().optional(),
});

function nullableDate(v: string | null | undefined) {
  if (v === undefined) return undefined;
  if (v === null || v === "") return null;
  return new Date(v);
}

export const GET = withContext(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const customerId = Number(params.id);
  const [customer, activeTaskCount, activities] = await Promise.all([
    prisma.customer.findFirst({
      where: { id: customerId, organizationId: auth.orgId },
      include: {
        responsibleStaff: { select: { id: true, fullName: true } },
        contacts: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
        _count: { select: { tasks: true, messages: true, contacts: true } },
      },
    }),
    prisma.task.count({
      where: {
        customerId,
        organizationId: auth.orgId,
        status: { in: ["BACKLOG", "IN_PROGRESS", "REVIEW"] },
      },
    }),
    prisma.customerActivity.findMany({
      where: { customerId, organizationId: auth.orgId },
      include: { actor: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  if (!customer) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  return NextResponse.json({ data: { ...customer, activeTaskCount, activities } });
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
      lastContactDate: nullableDate(d.lastContactDate),
      customerSince: nullableDate(d.customerSince),
      contractRenewDate: nullableDate(d.contractRenewDate),
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
