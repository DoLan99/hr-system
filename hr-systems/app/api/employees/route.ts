import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { clerkClient } from "@clerk/nextjs/server";
import { prisma, rawPrisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { getOrgId } from "@/lib/request-context";
import { requireApiAuth, MANAGER_ROLES } from "@/lib/api-auth";

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
});

export const GET = withContext(async (req: NextRequest) => {
  const orgId = getOrgId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
      clerkUserId: true, isOwner: true, membershipRole: true,
      role: { select: { id: true, name: true, label: true } },
      manager: { select: { id: true, fullName: true } },
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
    where: { organizationId: auth.orgId, status: { not: "INACTIVE" } },
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
  if (!inviter) return NextResponse.json({ error: "Người mời không tồn tại" }, { status: 500 });

  const protocol = req.headers.get("x-forwarded-proto") ?? "http";
  const host = req.headers.get("host") ?? "";
  const redirectUrl = `${protocol}://${host}/welcome`;

  const client = await clerkClient();
  let clerkInvitationId: string;
  try {
    const invitation = await client.organizations.createOrganizationInvitation({
      organizationId: org.clerkOrgId,
      inviterUserId: inviter.clerkUserId,
      emailAddress: d.emailCompany,
      role: "org:member",
      redirectUrl,
    });
    clerkInvitationId = invitation.id;
  } catch (err) {
    console.error("[employees POST] Clerk invitation failed:", err);
    const anyErr = err as { errors?: Array<{ message?: string; longMessage?: string; code?: string }>; status?: number };
    const detail = anyErr.errors?.[0]?.longMessage ?? anyErr.errors?.[0]?.message ?? (err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: `Không gửi được email mời: ${detail}` }, { status: 502 });
  }

  const placeholderClerkId = `pending:${clerkInvitationId}`;

  const employee = await prisma.employee.create({
    data: {
      organizationId: auth.orgId,
      clerkUserId: placeholderClerkId,
      isOwner: false,
      membershipRole: "MEMBER",
      fullName: d.fullName,
      emailCompany: d.emailCompany,
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
      status: d.status ?? "PROBATION",
      driveLink1: d.driveLink1,
      driveLink2: d.driveLink2,
      driveLink3: d.driveLink3,
      driveLink4: d.driveLink4,
    },
    select: {
      id: true, employeeCode: true, fullName: true, department: true,
      emailCompany: true, payType: true, status: true,
      clerkUserId: true, isOwner: true, membershipRole: true,
      role: { select: { id: true, name: true, label: true } },
    },
  });

  return NextResponse.json({
    data: employee,
    invitation: { id: clerkInvitationId, message: `Email mời đã gửi tới ${d.emailCompany}` },
  }, { status: 201 });
});
