import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { clerkClient } from "@clerk/nextjs/server";
import { prisma, rawPrisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { getOrgId } from "@/lib/request-context";
import { requireApiAuth, MANAGER_ROLES } from "@/lib/api-auth";

function deptPrefix(deptName: string): string {
  const name = deptName.trim();
  // Lấy chữ cái đầu của mỗi từ, tối đa 3 ký tự, uppercase
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return name.slice(0, 3).toUpperCase();
  }
  return words.map(w => w[0]).join("").slice(0, 3).toUpperCase();
}

async function generateEmployeeCode(orgId: string, departmentId?: number | null, deptName?: string): Promise<string> {
  let prefix = "NV";
  if (departmentId) {
    const dept = await rawPrisma.department.findUnique({ where: { id: departmentId }, select: { name: true } });
    if (dept) prefix = deptPrefix(dept.name);
  } else if (deptName) {
    prefix = deptPrefix(deptName);
  }

  // Đếm số nhân viên đã có prefix này (bao gồm cả inactive)
  const existing = await rawPrisma.employee.count({
    where: { organizationId: orgId, employeeCode: { startsWith: prefix + "-" } },
  });
  const seq = existing + 1;
  return `${prefix}-${String(seq).padStart(3, "0")}`;
}

const createSchema = z.object({
  fullName: z.string().min(1),
  emailCompany: z.string().email(),
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
  // personal
  dob: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  nationality: z.string().nullable().optional(),
  permanentAddr: z.string().nullable().optional(),
  currentAddr: z.string().nullable().optional(),
  cccd: z.string().nullable().optional(),
  cccdDate: z.string().nullable().optional(),
  cccdPlace: z.string().nullable().optional(),
  emergencyName: z.string().nullable().optional(),
  emergencyRel: z.string().nullable().optional(),
  emergencyPhone: z.string().nullable().optional(),
  // contract
  contractType: z.string().nullable().optional(),
  contractNo: z.string().nullable().optional(),
  contractStart: z.string().nullable().optional(),
  contractEnd: z.string().nullable().optional(),
  // bank
  bankName: z.string().nullable().optional(),
  bankBranch: z.string().nullable().optional(),
  bankAccount: z.string().nullable().optional(),
  bankHolder: z.string().nullable().optional(),
});

export const GET = withContext(async (req: NextRequest) => {
  const orgId = getOrgId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status");
  const department = searchParams.get("department");
  const roleIdParam = searchParams.get("roleId");
  const teamIdParam = searchParams.get("teamId");

  const where: any = { organizationId: orgId };
  if (status) where.status = status;
  if (department) where.department = department;
  if (roleIdParam) where.roleId = Number(roleIdParam);
  if (teamIdParam) where.teamId = Number(teamIdParam);
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
      department: true, company: true, emailCompany: true, emailGoogle: true, emailPrivate: true,
      mobileCompany: true, payType: true, hourlyRate: true, monthlySalary: true,
      maxHoursMonth: true, bonusMPct: true, bonusAPct: true, bonusTPct: true,
      startDate: true, status: true, managerId: true,
      clerkUserId: true, isOwner: true, membershipRole: true,
      // Personal info
      dob: true, gender: true, nationality: true, permanentAddr: true, currentAddr: true,
      cccd: true, cccdDate: true, cccdPlace: true,
      // Contract
      contractType: true, contractNo: true, contractStart: true, contractEnd: true,
      // Bank
      bankName: true, bankBranch: true, bankAccount: true, bankHolder: true,
      // Emergency
      emergencyName: true, emergencyRel: true, emergencyPhone: true,
      // Photos
      photoPortrait: true, photoCccdFront: true, photoCccdBack: true,
      role: { select: { id: true, name: true, label: true } },
      manager: { select: { id: true, fullName: true } },
      dept: { select: { id: true, name: true } },
      careerTrackId: true,
      careerLevelId: true,
      careerTrack: { select: { id: true, name: true, color: true } },
      careerLevel: { select: { id: true, name: true, seniority: true } },
    },
    orderBy: { fullName: "asc" },
  });

  return NextResponse.json({ data: employees });
});

// POST creates Employee + sends Clerk invitation email.
// When invitee accepts the invitation and signs in, the Clerk webhook
// (or fallback claim-by-email in requireAuth) links their clerkUserId
// to the pre-created Employee record.
export const POST = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  if (!MANAGER_ROLES.includes(auth.roleName)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const d = parsed.data;

  const existing = await prisma.employee.findFirst({
    where: { emailCompany: d.emailCompany },
  });
  if (existing) return NextResponse.json({ error: "Email đã tồn tại trong workspace" }, { status: 409 });

  const org = await rawPrisma.organization.findUnique({
    where: { id: auth.orgId },
    select: { clerkOrgId: true, slug: true, name: true, seatLimit: true, status: true },
  });
  if (!org) return NextResponse.json({ error: "Workspace không tồn tại" }, { status: 404 });

  if (org.status === "SUSPENDED" || org.status === "CANCELLED") {
    return NextResponse.json({ error: "Workspace đã bị tạm khóa, không thể thêm thành viên" }, { status: 403 });
  }

  const memberCount = await rawPrisma.employee.count({
    where: { organizationId: auth.orgId, status: { not: "INACTIVE" }, isOwner: false },
  });
  if (memberCount >= org.seatLimit) {
    return NextResponse.json(
      { error: `Đã đạt giới hạn ${org.seatLimit} thành viên của gói. Vui lòng upgrade gói tại /billing.` },
      { status: 402 },
    );
  }

  const inviter = await rawPrisma.employee.findFirst({
    where: { id: auth.actorId },
    select: { clerkUserId: true },
  });

  // Try to send Clerk invitation (optional — failure does NOT block employee creation)
  let placeholderClerkId = `pending:${d.emailCompany}`;
  let clerkInvitationId: string | null = null;
  try {
    if (inviter) {
      const protocol = req.headers.get("x-forwarded-proto") ?? "http";
      const host = req.headers.get("host") ?? "";
      const redirectUrl = `${protocol}://${host}/welcome`;
      const client = await clerkClient();
      const invitation = await client.organizations.createOrganizationInvitation({
        organizationId: org.clerkOrgId,
        inviterUserId: inviter.clerkUserId,
        emailAddress: d.emailCompany,
        role: "org:member",
        redirectUrl,
      });
      clerkInvitationId = invitation.id;
      placeholderClerkId = `pending:${invitation.id}`;
    }
  } catch (err) {
    // Log but continue — employee record will be created, they can sign up manually
    console.warn("[employees POST] Clerk invitation skipped:", (err as Error).message);
  }

  const autoCode = await generateEmployeeCode(auth.orgId, d.departmentId, d.department);
  const finalCode = d.employeeCode?.trim() || autoCode;

  const employee = await prisma.employee.create({
    data: {
      organizationId: auth.orgId,
      clerkUserId: placeholderClerkId,
      isOwner: false,
      membershipRole: "MEMBER",
      fullName: d.fullName,
      emailCompany: d.emailCompany,
      roleId: d.roleId,
      employeeCode: finalCode,
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
      status: d.status ?? "PROBATION",
      driveLink1: d.driveLink1,
      driveLink2: d.driveLink2,
      driveLink3: d.driveLink3,
      driveLink4: d.driveLink4,
      // personal
      dob: d.dob ? new Date(d.dob) : null,
      gender: d.gender ?? null,
      nationality: d.nationality ?? null,
      permanentAddr: d.permanentAddr ?? null,
      currentAddr: d.currentAddr ?? null,
      cccd: d.cccd ?? null,
      cccdDate: d.cccdDate ? new Date(d.cccdDate) : null,
      cccdPlace: d.cccdPlace ?? null,
      emergencyName: d.emergencyName ?? null,
      emergencyRel: d.emergencyRel ?? null,
      emergencyPhone: d.emergencyPhone ?? null,
      // contract
      contractType: d.contractType ?? null,
      contractNo: d.contractNo ?? null,
      contractStart: d.contractStart ? new Date(d.contractStart) : null,
      contractEnd: d.contractEnd ? new Date(d.contractEnd) : null,
      // bank
      bankName: d.bankName ?? null,
      bankBranch: d.bankBranch ?? null,
      bankAccount: d.bankAccount ?? null,
      bankHolder: d.bankHolder ?? null,
    },
    select: {
      id: true, employeeCode: true, fullName: true, avatarUrl: true,
      department: true, departmentId: true, teamId: true,
      company: true, emailCompany: true, emailGoogle: true,
      emailPrivate: true, mobileCompany: true, payType: true, hourlyRate: true,
      monthlySalary: true, maxHoursMonth: true, bonusMPct: true, bonusAPct: true,
      bonusTPct: true, startDate: true, status: true, managerId: true,
      driveLink1: true,
      dob: true, gender: true, nationality: true, permanentAddr: true, currentAddr: true,
      cccd: true, cccdDate: true, cccdPlace: true,
      contractType: true, contractNo: true, contractStart: true, contractEnd: true,
      bankName: true, bankBranch: true, bankAccount: true, bankHolder: true,
      emergencyName: true, emergencyRel: true, emergencyPhone: true,
      photoPortrait: true, photoCccdFront: true, photoCccdBack: true,
      role: { select: { id: true, name: true, label: true } },
      manager: { select: { id: true, fullName: true } },
      dept: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({
    data: employee,
    invitation: { id: clerkInvitationId, message: `Email mời đã gửi tới ${d.emailCompany}` },
  }, { status: 201 });
});
