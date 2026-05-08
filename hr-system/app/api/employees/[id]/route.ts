import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];

const updateSchema = z.object({
  fullName: z.string().min(1).optional(),
  roleId: z.number().int().optional(),
  employeeCode: z.string().optional(),
  department: z.string().optional(),
  departmentId: z.number().int().nullable().optional(),
  teamId: z.number().int().nullable().optional(),
  company: z.string().optional(),
  emailGoogle: z.string().email().optional().or(z.literal("")),
  emailPrivate: z.string().email().optional().or(z.literal("")),
  mobileCompany: z.string().optional(),
  payType: z.enum(["HOURLY", "MONTHLY", "CONTRACT"]).optional(),
  hourlyRate: z.number().min(0).nullable().optional(),
  monthlySalary: z.number().min(0).nullable().optional(),
  maxHoursMonth: z.number().int().min(1).optional(),
  bonusMPct: z.number().min(0).max(100).optional(),
  bonusAPct: z.number().min(0).max(100).optional(),
  bonusTPct: z.number().min(0).max(100).optional(),
  managerId: z.number().int().nullable().optional(),
  startDate: z.string().nullable().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "PROBATION"]).optional(),
  driveLink1: z.string().optional(),
  driveLink2: z.string().optional(),
  driveLink3: z.string().optional(),
  driveLink4: z.string().optional(),
  password: z.string().min(6).optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  const userId = Number(session.user.id);

  // Employee can only view their own profile; managers can view all
  const isManager = MANAGER_ROLES.includes((session.user as any).role);
  if (!isManager && id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const employee = await prisma.employee.findUnique({
    where: { id },
    select: {
      id: true, employeeCode: true, fullName: true, avatarUrl: true,
      department: true, departmentId: true, teamId: true,
      company: true, emailCompany: true, emailGoogle: true,
      emailPrivate: true, mobileCompany: true, payType: true, hourlyRate: true,
      monthlySalary: true, maxHoursMonth: true, bonusMPct: true, bonusAPct: true,
      bonusTPct: true, startDate: true, status: true, managerId: true,
      driveLink1: true, driveLink2: true, driveLink3: true, driveLink4: true,
      role: { select: { id: true, name: true, label: true } },
      manager: { select: { id: true, fullName: true } },
      dept: { select: { id: true, name: true } },
      team: { select: { id: true, name: true } },
    },
  });

  if (!employee) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  return NextResponse.json({ data: employee });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  const userId = Number(session.user.id);
  const isManager = MANAGER_ROLES.includes((session.user as any).role);

  if (!isManager && id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const existing = await prisma.employee.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;
  const updateData: any = { ...d };

  // Non-managers can only update basic info, not salary/role
  if (!isManager) {
    delete updateData.roleId;
    delete updateData.payType;
    delete updateData.hourlyRate;
    delete updateData.monthlySalary;
    delete updateData.bonusMPct;
    delete updateData.bonusAPct;
    delete updateData.bonusTPct;
    delete updateData.status;
    delete updateData.managerId;
  }

  if (d.password) {
    updateData.passwordHash = await bcrypt.hash(d.password, 10);
    delete updateData.password;
  } else {
    delete updateData.password;
  }

  if (d.startDate !== undefined) {
    updateData.startDate = d.startDate ? new Date(d.startDate) : null;
  }
  if (d.emailGoogle === "") updateData.emailGoogle = null;
  if (d.emailPrivate === "") updateData.emailPrivate = null;

  const updated = await prisma.employee.update({
    where: { id },
    data: updateData,
    select: {
      id: true, employeeCode: true, fullName: true, avatarUrl: true,
      department: true, departmentId: true, teamId: true,
      company: true, emailCompany: true, emailGoogle: true,
      emailPrivate: true, mobileCompany: true, payType: true, hourlyRate: true,
      monthlySalary: true, maxHoursMonth: true, bonusMPct: true, bonusAPct: true,
      bonusTPct: true, startDate: true, status: true, managerId: true,
      driveLink1: true, driveLink2: true, driveLink3: true, driveLink4: true,
      role: { select: { id: true, name: true, label: true } },
      manager: { select: { id: true, fullName: true } },
      dept: { select: { id: true, name: true } },
      team: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isManager = MANAGER_ROLES.includes((session.user as any).role);
  if (!isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = Number(params.id);
  const userId = Number(session.user.id);
  if (id === userId) return NextResponse.json({ error: "Không thể xóa chính mình" }, { status: 400 });

  // Soft delete
  await prisma.employee.update({ where: { id }, data: { status: "INACTIVE" } });
  return NextResponse.json({ ok: true });
}
