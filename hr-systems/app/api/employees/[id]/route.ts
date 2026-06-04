import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { getActorId, getOrgId } from "@/lib/request-context";

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
});

async function getCurrentRole(): Promise<string | null> {
  const actorId = getActorId();
  if (!actorId) return null;
  const me = await prisma.employee.findFirst({
    where: { id: actorId },
    select: { role: { select: { name: true } } },
  });
  return me?.role.name ?? null;
}

export const GET = withContext(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const orgId = getOrgId();
  const actorId = getActorId();
  if (!orgId || !actorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  const roleName = await getCurrentRole();
  const isManager = roleName ? MANAGER_ROLES.includes(roleName) : false;
  if (!isManager && id !== actorId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const employee = await prisma.employee.findFirst({
    where: { id },
    select: {
      id: true, employeeCode: true, fullName: true, avatarUrl: true,
      department: true, departmentId: true, teamId: true,
      company: true, emailCompany: true, emailGoogle: true,
      emailPrivate: true, mobileCompany: true, payType: true, hourlyRate: true,
      monthlySalary: true, maxHoursMonth: true, bonusMPct: true, bonusAPct: true,
      bonusTPct: true, startDate: true, status: true, managerId: true,
      driveLink1: true, driveLink2: true, driveLink3: true, driveLink4: true,
      clerkUserId: true, isOwner: true, membershipRole: true,
      role: { select: { id: true, name: true, label: true } },
      manager: { select: { id: true, fullName: true } },
      dept: { select: { id: true, name: true } },
      team: { select: { id: true, name: true } },
    },
  });

  if (!employee) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  return NextResponse.json({ data: employee });
});

export const PUT = withContext(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const orgId = getOrgId();
  const actorId = getActorId();
  if (!orgId || !actorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  const roleName = await getCurrentRole();
  const isManager = roleName ? MANAGER_ROLES.includes(roleName) : false;

  if (!isManager && id !== actorId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const existing = await prisma.employee.findFirst({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;
  const updateData: any = { ...d };

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
      clerkUserId: true, isOwner: true, membershipRole: true,
      role: { select: { id: true, name: true, label: true } },
      manager: { select: { id: true, fullName: true } },
      dept: { select: { id: true, name: true } },
      team: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ data: updated });
});

export const DELETE = withContext(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const orgId = getOrgId();
  const actorId = getActorId();
  if (!orgId || !actorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const roleName = await getCurrentRole();
  const isManager = roleName ? MANAGER_ROLES.includes(roleName) : false;
  if (!isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = Number(params.id);
  if (id === actorId) return NextResponse.json({ error: "Không thể xóa chính mình" }, { status: 400 });

  const existing = await prisma.employee.findFirst({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  await prisma.employee.update({ where: { id }, data: { status: "INACTIVE" } });
  return NextResponse.json({ ok: true });
});
