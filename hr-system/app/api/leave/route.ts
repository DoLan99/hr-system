import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];

const createSchema = z.object({
  date: z.string().min(1),
  type: z.enum(["VACATION", "HOLIDAY", "ILLNESS", "OTHER"]),
  requestedHours: z.number().min(0.5).max(24),
  reason: z.string().optional(),
  evidenceLink: z.string().optional(),
  employeeId: z.number().int().optional(), // manager only
});

// GET /api/leave?month=1&year=2025&status=PENDING&employeeId=2
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") ? Number(searchParams.get("month")) : null;
  const year = searchParams.get("year") ? Number(searchParams.get("year")) : null;
  const status = searchParams.get("status");
  const empId = searchParams.get("employeeId");

  const userId = Number(session.user.id);
  const isManager = MANAGER_ROLES.includes((session.user as any).role);

  const where: any = {};
  if (!isManager) where.employeeId = userId;
  else if (empId) where.employeeId = Number(empId);

  if (status) where.status = status;

  if (month && year) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    where.date = { gte: start, lt: end };
  } else if (year) {
    where.date = { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) };
  }

  const leaves = await prisma.leave.findMany({
    where,
    include: {
      employee: { select: { id: true, fullName: true, department: true } },
      approvedBy: { select: { id: true, fullName: true } },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ data: leaves });
}

// POST /api/leave
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;
  const userId = Number(session.user.id);
  const isManager = MANAGER_ROLES.includes((session.user as any).role);

  const employeeId = isManager && d.employeeId ? d.employeeId : userId;

  const leave = await prisma.leave.create({
    data: {
      date: new Date(d.date),
      employeeId,
      type: d.type,
      requestedHours: d.requestedHours,
      reason: d.reason,
      evidenceLink: d.evidenceLink,
      status: "PENDING",
    },
    include: {
      employee: { select: { id: true, fullName: true, department: true } },
      approvedBy: { select: { id: true, fullName: true } },
    },
  });

  return NextResponse.json({ data: leave }, { status: 201 });
}
