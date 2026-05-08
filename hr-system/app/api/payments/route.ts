import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];

const createSchema = z.object({
  date: z.string().min(1),
  employeeId: z.number().int(),
  type: z.enum(["SALARY", "BONUS", "ADVANCE", "DEDUCTION", "OTHER"]),
  amount: z.number(),
  notes: z.string().optional(),
  summaryMonth: z.number().int().min(1).max(12).optional(),
  summaryYear: z.number().int().optional(),
});

// GET /api/payments?employeeId=&month=&year=&type=
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const empId = searchParams.get("employeeId");
  const month = searchParams.get("month") ? Number(searchParams.get("month")) : null;
  const year = searchParams.get("year") ? Number(searchParams.get("year")) : null;
  const type = searchParams.get("type");

  const userId = Number(session.user.id);
  const isManager = MANAGER_ROLES.includes((session.user as any).role);

  const where: any = {};
  if (!isManager) where.employeeId = userId;
  else if (empId) where.employeeId = Number(empId);

  if (type) where.type = type;
  if (month) where.summaryMonth = month;
  if (year) where.summaryYear = year;

  const payments = await prisma.payment.findMany({
    where,
    include: {
      employee: { select: { id: true, fullName: true, department: true } },
      createdBy: { select: { id: true, fullName: true } },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ data: payments });
}

// POST /api/payments — manager only
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isManager = MANAGER_ROLES.includes((session.user as any).role);
  if (!isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;
  const payment = await prisma.payment.create({
    data: {
      date: new Date(d.date),
      employeeId: d.employeeId,
      type: d.type,
      amount: d.amount,
      notes: d.notes,
      summaryMonth: d.summaryMonth,
      summaryYear: d.summaryYear,
      createdById: Number(session.user.id),
    },
    include: {
      employee: { select: { id: true, fullName: true, department: true } },
      createdBy: { select: { id: true, fullName: true } },
    },
  });

  return NextResponse.json({ data: payment }, { status: 201 });
}
