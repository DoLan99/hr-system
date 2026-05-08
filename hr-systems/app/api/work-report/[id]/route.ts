import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calcCreditedTime } from "@/lib/work-report";
import { z } from "zod";

const updateSchema = z.object({
  taskId: z.string().optional(),
  quantity: z.number().int().min(1).optional(),
  actualTime: z.number().int().min(1).optional(),
  completionPct: z.number().int().min(0).max(100).optional(),
  description: z.string().optional(),
  videoLink: z.string().optional(),
  videoDuration: z.number().int().optional(),
  note: z.string().optional(),
  link: z.string().optional(),
  wlId: z.string().nullable().optional(),
  // Manager only
  rating: z.number().int().min(1).max(5).optional(),
  creditedTime: z.number().int().min(0).optional(),
});

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];

// PUT /api/work-report/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  const existing = await prisma.workReport.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const userId = Number(session.user.id);
  const isManager = MANAGER_ROLES.includes(session.user.role);

  // Chỉ chủ sở hữu hoặc manager mới được sửa
  if (!isManager && existing.employeeId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const d = parsed.data;
  const newTaskId = d.taskId ?? existing.taskId ?? "";
  const newActual = d.actualTime ?? existing.actualTime;
  const newQty = d.quantity ?? existing.quantity;
  const newVideoLink = d.videoLink !== undefined ? d.videoLink : existing.videoLink;

  // Lấy std time nếu task thay đổi
  let stdTime: number | null = existing.stdTime
    ? existing.stdTime / (existing.quantity ?? 1)
    : null;
  if (d.taskId) {
    const task = await prisma.taskLibrary.findUnique({ where: { taskId: d.taskId } });
    stdTime = task?.stdTime ?? null;
  }

  // Manager có thể override credited time trực tiếp
  let creditedTime = existing.creditedTime;
  if (isManager && d.creditedTime !== undefined) {
    creditedTime = d.creditedTime;
  } else if (
    d.actualTime !== undefined ||
    d.taskId !== undefined ||
    d.videoLink !== undefined ||
    d.quantity !== undefined
  ) {
    const result = calcCreditedTime({
      taskId: newTaskId,
      actualTime: newActual,
      stdTime,
      quantity: newQty,
      videoLink: newVideoLink,
    });
    creditedTime = result.creditedTime;
  }

  const updated = await prisma.workReport.update({
    where: { id },
    data: {
      ...(d.taskId && { taskId: d.taskId }),
      ...(d.quantity !== undefined && { quantity: d.quantity }),
      ...(d.actualTime !== undefined && {
        actualTime: d.actualTime,
        delta: stdTime !== null ? d.actualTime - stdTime : null,
        stdTimeIssue: stdTime !== null && d.actualTime > stdTime,
      }),
      ...(d.completionPct !== undefined && { completionPct: d.completionPct }),
      ...(d.description !== undefined && { description: d.description }),
      ...(d.videoLink !== undefined && { videoLink: d.videoLink }),
      ...(d.videoDuration !== undefined && { videoDuration: d.videoDuration }),
      ...(d.note !== undefined && { note: d.note }),
      ...(d.link !== undefined && { link: d.link }),
      ...(d.wlId !== undefined && { wlId: d.wlId }),
      ...(isManager && d.rating !== undefined && { rating: d.rating }),
      creditedTime,
      ...(stdTime !== null && d.quantity !== undefined && {
        stdTime: stdTime * d.quantity,
      }),
    },
    include: {
      task: { select: { taskId: true, taskName: true, stdTime: true } },
      workList: { select: { wlId: true, title: true } },
    },
  });

  // Sync totals
  await syncOfficeTimeTotal(existing.employeeId, existing.date);
  if (d.wlId || existing.wlId) {
    const wlId = d.wlId ?? existing.wlId;
    if (wlId) await syncWorkListTime(wlId);
  }

  return NextResponse.json({ data: updated });
}

// DELETE /api/work-report/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  const existing = await prisma.workReport.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const userId = Number(session.user.id);
  const isManager = MANAGER_ROLES.includes(session.user.role);
  if (!isManager && existing.employeeId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.workReport.delete({ where: { id } });
  await syncOfficeTimeTotal(existing.employeeId, existing.date);
  if (existing.wlId) await syncWorkListTime(existing.wlId);

  return NextResponse.json({ success: true });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function syncOfficeTimeTotal(employeeId: number, date: Date) {
  const start = new Date(date); start.setHours(0, 0, 0, 0);
  const end = new Date(date); end.setHours(23, 59, 59, 999);
  const agg = await prisma.workReport.aggregate({
    where: { employeeId, date: { gte: start, lte: end } },
    _sum: { actualTime: true },
  });
  await prisma.officeTime.updateMany({
    where: { employeeId, date: { gte: start, lte: end } },
    data: { workReportTotal: agg._sum.actualTime ?? 0 },
  });
}

async function syncWorkListTime(wlId: string) {
  const agg = await prisma.workReport.aggregate({
    where: { wlId },
    _sum: { actualTime: true },
  });
  await prisma.workList.update({
    where: { wlId },
    data: { totalActualTime: agg._sum.actualTime ?? 0 },
  });
}
