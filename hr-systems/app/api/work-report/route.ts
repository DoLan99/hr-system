import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calcCreditedTime } from "@/lib/work-report";
import { z } from "zod";

const createSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Định dạng yyyy-MM-dd"),
  taskId: z.string().min(1, "Bắt buộc"),
  quantity: z.number().int().min(1).default(1),
  actualTime: z.number().int().min(1, "Tối thiểu 1 phút"),
  completionPct: z.number().int().min(0).max(100).default(100),
  description: z.string().optional(),
  videoLink: z.string().optional(),
  videoDuration: z.number().int().optional(),
  note: z.string().optional(),
  link: z.string().optional(),
  wlId: z.string().optional(),
});

// GET /api/work-report
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date");
  const employeeId = searchParams.get("employeeId");
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  const userId = Number(session.user.id);
  const role = session.user.role;
  const isManager = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"].includes(role);

  // Scope: chỉ xem của mình trừ khi là manager
  const targetId = isManager && employeeId ? Number(employeeId) : userId;

  let dateFilter = {};
  if (dateStr) {
    const start = new Date(dateStr);
    const end = new Date(dateStr);
    end.setDate(end.getDate() + 1);
    dateFilter = { date: { gte: start, lt: end } };
  } else if (month && year) {
    const start = new Date(Number(year), Number(month) - 1, 1);
    const end = new Date(Number(year), Number(month), 1);
    dateFilter = { date: { gte: start, lt: end } };
  }

  const reports = await prisma.workReport.findMany({
    where: { employeeId: targetId, ...dateFilter },
    include: {
      task: { select: { taskId: true, taskName: true, stdTime: true } },
      workList: { select: { wlId: true, title: true } },
    },
    orderBy: [{ date: "asc" }, { id: "asc" }],
  });

  return NextResponse.json({ data: reports });
}

// POST /api/work-report
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const d = parsed.data;
  const employeeId = Number(session.user.id);

  // Lấy task info
  const task = await prisma.taskLibrary.findUnique({ where: { taskId: d.taskId } });

  const stdTime = task?.stdTime ?? null;
  const { creditedTime } = calcCreditedTime({
    taskId: d.taskId,
    actualTime: d.actualTime,
    stdTime,
    quantity: d.quantity,
    videoLink: d.videoLink,
  });

  const report = await prisma.workReport.create({
    data: {
      date: new Date(d.date),
      employeeId,
      taskId: d.taskId,
      quantity: d.quantity,
      taskName: task?.taskName ?? d.taskId,
      description: d.description,
      stdTime: stdTime ? stdTime * d.quantity : null,
      actualTime: d.actualTime,
      delta: stdTime ? d.actualTime - stdTime : null,
      creditedTime,
      completionPct: d.completionPct,
      stdTimeIssue: stdTime !== null && d.actualTime > stdTime,
      videoDuration: d.videoDuration,
      videoLink: d.videoLink,
      note: d.note,
      link: d.link,
      wlId: d.wlId || null,
    },
    include: {
      task: { select: { taskId: true, taskName: true, stdTime: true } },
      workList: { select: { wlId: true, title: true } },
    },
  });

  // Cập nhật work_report_total cho office_time của ngày đó
  await syncOfficeTimeTotal(employeeId, new Date(d.date));

  // Cập nhật total_actual_time cho WL nếu có
  if (d.wlId) await syncWorkListTime(d.wlId);

  return NextResponse.json({ data: report }, { status: 201 });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function syncOfficeTimeTotal(employeeId: number, date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

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
