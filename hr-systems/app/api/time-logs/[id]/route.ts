import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { ADMIN_ROLES, SUB_MANAGER_ROLES, getManagedEmployeeIds } from "@/lib/managed-scope";

const updateSchema = z.object({
  date: z.string().optional(),
  durationMinutes: z.number().int().positive().optional(),
  note: z.string().nullable().optional(),
  videoLink: z.string().nullable().optional(),
  videoCount: z.number().int().min(0).optional(),
  videoDuration: z.number().int().min(0).optional(),
  proofLinks: z.array(z.string()).optional(),
});

const approveSchema = z.object({
  approvedMinutes: z.number().int().min(0),
  rating: z.number().int().min(1).max(5).optional(),
});

const rejectSchema = z.object({
  rejectionReason: z.string().min(1),
});

const include = {
  employee: { select: { id: true, fullName: true, avatarUrl: true } },
  task: {
    select: {
      id: true,
      code: true,
      title: true,
      taskType: true,
      estimatedTime: true,
      billable: true,
      customerId: true,
      assignedToId: true,
      customer: { select: { id: true, customerName: true, businessName: true } },
    },
  },
  approvedBy: { select: { id: true, fullName: true } },
};

async function findLog(id: string) {
  return prisma.timeLog.findUnique({
    where: { id: Number(id) },
    include,
  });
}

async function checkApprovalAccess(log: { task: { assignedToId: number } }, userId: number, role: string) {
  if (ADMIN_ROLES.includes(role)) return true;
  if (SUB_MANAGER_ROLES.includes(role)) {
    const managedIds = await getManagedEmployeeIds(userId, role);
    return managedIds === null || managedIds.includes(log.task.assignedToId);
  }
  return false;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const log = await findLog(params.id);
  if (!log) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const userId = Number(session.user.id);
  if (log.employeeId !== userId) {
    const ok = await checkApprovalAccess(log, userId, session.user.role);
    if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ data: log });
}

// PUT — owner can edit within 24h window
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const log = await findLog(params.id);
  if (!log) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const userId = Number(session.user.id);
  const userRole = session.user.role;
  const isAdmin = ADMIN_ROLES.includes(userRole);

  if (!isAdmin) {
    if (log.employeeId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const ageMs = Date.now() - log.createdAt.getTime();
    if (ageMs > 24 * 3600 * 1000) {
      return NextResponse.json({ error: "Chỉ được sửa trong 24h. Liên hệ Manager nếu cần điều chỉnh." }, { status: 403 });
    }
    if (log.approvalStatus !== "PENDING" && log.approvalStatus !== "AUTO_APPROVED") {
      return NextResponse.json({ error: "Time log đã được duyệt/reject, không sửa được" }, { status: 403 });
    }
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;
  const data: any = {};
  if (d.date) data.date = new Date(d.date);
  if (d.note !== undefined) data.note = d.note;
  if (d.videoLink !== undefined) data.videoLink = d.videoLink;
  if (d.videoCount !== undefined) data.videoCount = d.videoCount;
  if (d.videoDuration !== undefined) data.videoDuration = d.videoDuration;
  if (d.proofLinks !== undefined) data.proofLinks = d.proofLinks;

  const durationDelta = d.durationMinutes !== undefined ? d.durationMinutes - log.durationMinutes : 0;
  if (d.durationMinutes !== undefined) data.durationMinutes = d.durationMinutes;

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.timeLog.update({ where: { id: log.id }, data, include });
    if (durationDelta !== 0) {
      await tx.task.update({
        where: { id: log.taskId },
        data: { actualTimeTotal: { increment: durationDelta } },
      });
    }
    return result;
  });

  return NextResponse.json({ data: updated });
}

// DELETE
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const log = await findLog(params.id);
  if (!log) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const userId = Number(session.user.id);
  const userRole = session.user.role;
  const isAdmin = ADMIN_ROLES.includes(userRole);

  if (!isAdmin && log.employeeId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.timeLog.delete({ where: { id: log.id } });
    await tx.task.update({
      where: { id: log.taskId },
      data: { actualTimeTotal: { decrement: log.durationMinutes } },
    });
  });

  return NextResponse.json({ success: true });
}

// PATCH — manager approval / rejection (action via ?action=approve|reject)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const log = await findLog(params.id);
  if (!log) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const userId = Number(session.user.id);
  const userRole = session.user.role;
  const ok = await checkApprovalAccess(log, userId, userRole);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const action = new URL(req.url).searchParams.get("action") ?? "approve";
  const body = await req.json().catch(() => ({}));

  if (action === "reject") {
    const parsed = rejectSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

    const updated = await prisma.timeLog.update({
      where: { id: log.id },
      data: {
        approvalStatus: "REJECTED",
        rejectionReason: parsed.data.rejectionReason,
        creditedMinutes: 0,
        approvedById: userId,
        approvedAt: new Date(),
      },
      include,
    });
    return NextResponse.json({ data: updated });
  }

  // approve
  const parsed = approveSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  if (parsed.data.approvedMinutes > log.durationMinutes) {
    return NextResponse.json({ error: "approvedMinutes không được vượt durationMinutes" }, { status: 422 });
  }

  const updated = await prisma.timeLog.update({
    where: { id: log.id },
    data: {
      approvalStatus: "APPROVED",
      approvedMinutes: parsed.data.approvedMinutes,
      creditedMinutes: parsed.data.approvedMinutes,
      rating: parsed.data.rating ?? null,
      approvedById: userId,
      approvedAt: new Date(),
    },
    include,
  });
  return NextResponse.json({ data: updated });
}
