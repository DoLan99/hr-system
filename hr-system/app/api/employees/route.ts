import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];

const createSchema = z.object({
  fullName: z.string().min(1),
  emailCompany: z.string().email(),
  password: z.string().min(6),
  roleId: z.number().int(),
  employeeCode: z.string().optional(),
  department: z.string().optional(),
  departmentId: z.number().int().nullable().optional(),
  teamId: z.number().int().nullable().optional(),
  company: z.string().optional(),
  emailGoogle: z.string().email().optional().or(z.literal("")),
  emailPrivate: z.string().email().optional().or(z.literal("")),
  mobileCompany: z.string().optional(),
  payType: z.enum(["HOURLY", "MONTHLY", "CONTRACT"]).optional(),
  hourlyRate: z.number().min(0).optional(),
  monthlySalary: z.number().min(0).optional(),
  maxHoursMonth: z.number().int().min(1).optional(),
  bonusMPct: z.number().min(0).max(100).optional(),
  bonusAPct: z.number().min(0).max(100).optional(),
  bonusTPct: z.number().min(0).max(100).optional(),
  managerId: z.number().int().optional(),
  startDate: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "PROBATION"]).optional(),
  driveLink1: z.string().optional(),
  driveLink2: z.string().optional(),
  driveLink3: z.string().optional(),
  driveLink4: z.string().optional(),
});

// GET /api/employees?search=&status=ACTIVE&department=
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status");
  const department = searchParams.get("department");

  const where: any = {};
  if (status) where.status = status;
  if (department) where.department = department;
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { emailCompany: { contains: search, mode: "insensitive" } },
      { employeeCode: { contains: search, mode: "insensitive" } },
    ];
  }

  const employees = await prisma.employee.findMany({
    where,
    select: {
      id: true, employeeCode: true, fullName: true, avatarUrl: true,
      department: true, company: true, emailCompany: true, emailGoogle: true,
      mobileCompany: true, payType: true, hourlyRate: true, monthlySalary: true,
      maxHoursMonth: true, bonusMPct: true, bonusAPct: true, bonusTPct: true,
      startDate: true, status: true, managerId: true,
      role: { select: { id: true, name: true, label: true } },
      manager: { select: { id: true, fullName: true } },
    },
    orderBy: { fullName: "asc" },
  });

  return NextResponse.json({ data: employees });
}

// POST /api/employees — manager only
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isManager = MANAGER_ROLES.includes((session.user as any).role);
  if (!isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;

  const existing = await prisma.employee.findUnique({ where: { emailCompany: d.emailCompany } });
  if (existing) return NextResponse.json({ error: "Email đã tồn tại" }, { status: 409 });

  const passwordHash = await bcrypt.hash(d.password, 10);

  const employee = await prisma.employee.create({
    data: {
      fullName: d.fullName,
      emailCompany: d.emailCompany,
      passwordHash,
      roleId: d.roleId,
      employeeCode: d.employeeCode,
      department: d.department,
      departmentId: d.departmentId ?? null,
      teamId: d.teamId ?? null,
      company: d.company,
      emailGoogle: d.emailGoogle || null,
      emailPrivate: d.emailPrivate || null,
      mobileCompany: d.mobileCompany,
      payType: d.payType ?? "HOURLY",
      hourlyRate: d.hourlyRate,
      monthlySalary: d.monthlySalary,
      maxHoursMonth: d.maxHoursMonth ?? 160,
      bonusMPct: d.bonusMPct ?? 0,
      bonusAPct: d.bonusAPct ?? 0,
      bonusTPct: d.bonusTPct ?? 0,
      managerId: d.managerId,
      startDate: d.startDate ? new Date(d.startDate) : null,
      status: d.status ?? "ACTIVE",
      driveLink1: d.driveLink1,
      driveLink2: d.driveLink2,
      driveLink3: d.driveLink3,
      driveLink4: d.driveLink4,
    },
    select: {
      id: true, employeeCode: true, fullName: true, department: true,
      emailCompany: true, payType: true, status: true,
      role: { select: { id: true, name: true, label: true } },
    },
  });

  return NextResponse.json({ data: employee }, { status: 201 });
}
