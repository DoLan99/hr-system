import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, requireManager } from "@/lib/api-auth";

const createSchema = z.object({
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
  responsibleStaffId: z.number().int().optional(),
  notes: z.string().optional(),
});

export const GET = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status");

  const where: any = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { customerName: { contains: search, mode: "insensitive" } },
      { businessName: { contains: search, mode: "insensitive" } },
      { custId: { contains: search, mode: "insensitive" } },
      { contactPerson: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }

  const customers = await prisma.customer.findMany({
    where,
    include: {
      responsibleStaff: { select: { id: true, fullName: true } },
      _count: { select: { tasks: true } },
    },
    orderBy: { customerName: "asc" },
  });

  return NextResponse.json({ data: customers });
});

export const POST = withContext(async (req: NextRequest) => {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;
  const customer = await prisma.customer.create({
    data: {
      ...d,
      email: d.email || null,
      status: d.status ?? "ACTIVE",
    },
    include: {
      responsibleStaff: { select: { id: true, fullName: true } },
      _count: { select: { tasks: true } },
    },
  });

  return NextResponse.json({ data: customer }, { status: 201 });
});
