import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];

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

// GET /api/customers?search=&status=ACTIVE
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
}

// POST /api/customers
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isManager = MANAGER_ROLES.includes((session.user as any).role);
  if (!isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
}
