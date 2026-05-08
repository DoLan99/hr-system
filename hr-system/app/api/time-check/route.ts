import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];

const createSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  taskId: z.string().min(1, "Chọn Task ID"),
  actualTime: z.number().int().min(1, "Tối thiểu 1 phút"),
  proposedStdTime: z.number().int().min(1, "Tối thiểu 1 phút"),
  reason: z.string().min(1, "Bắt buộc giải thích lý do"),
  videoLink: z.string().min(1, "Video bắt buộc"),
  videoDuration: z.number().int().min(0).optional(),
});

// GET /api/time-check?status=PENDING&employeeId=2
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const empId = searchParams.get("employeeId");

  const userId = Number(session.user.id);
  const isManager = MANAGER_ROLES.includes(session.user.role);

  const where: any = {};
  if (!isManager) where.employeeId = userId;
  else if (empId) where.employeeId = Number(empId);
  if (status) where.status = status;

  const items = await prisma.timeCheck.findMany({
    where,
    include: {
      employee: { select: { id: true, fullName: true, department: true } },
      task: { select: { taskId: true, taskName: true, stdTime: true } },
      reviewedBy: { select: { id: true, fullName: true } },
    },
    orderBy: [{ status: "asc" }, { date: "desc" }],
  });

  return NextResponse.json({ data: items });
}

// POST /api/time-check
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;
  const employeeId = Number(session.user.id);

  // Lấy stdTime hiện tại của task
  const task = await prisma.taskLibrary.findUnique({ where: { taskId: d.taskId } });
  if (!task) return NextResponse.json({ error: "Task không tồn tại" }, { status: 404 });

  const currentStdTime = task.stdTime ?? 0;
  const difference = d.proposedStdTime - currentStdTime;
  const timeCheckType = difference >= 0 ? "INCREASE" : "DECREASE";

  const item = await prisma.timeCheck.create({
    data: {
      date: new Date(d.date),
      employeeId,
      taskId: d.taskId,
      currentStdTime,
      actualTime: d.actualTime,
      proposedStdTime: d.proposedStdTime,
      difference,
      timeCheckType,
      reason: d.reason,
      videoLink: d.videoLink,
      videoDuration: d.videoDuration,
    },
    include: {
      employee: { select: { id: true, fullName: true, department: true } },
      task: { select: { taskId: true, taskName: true, stdTime: true } },
      reviewedBy: { select: { id: true, fullName: true } },
    },
  });

  return NextResponse.json({ data: item }, { status: 201 });
}
