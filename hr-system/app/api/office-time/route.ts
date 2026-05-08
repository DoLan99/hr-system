import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calcActualWorked } from "@/lib/office-time";
import { z } from "zod";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];

const clockSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkpoint: z.enum([
    "startWork1", "startLunch", "startWork2",
    "startAfternoonBreak", "startWork3", "endWorkday",
  ]),
  timeStr: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  employeeId: z.number().int().optional(),
});

// GET /api/office-time?month=1&year=2025&employeeId=2
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = Number(searchParams.get("month") ?? new Date().getMonth() + 1);
  const year = Number(searchParams.get("year") ?? new Date().getFullYear());
  const empId = searchParams.get("employeeId");

  const userId = Number(session.user.id);
  const isManager = MANAGER_ROLES.includes(session.user.role);
  const targetId = isManager && empId ? Number(empId) : userId;

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const records = await prisma.officeTime.findMany({
    where: { employeeId: targetId, date: { gte: start, lt: end } },
    include: { approvedBy: { select: { fullName: true } } },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({ data: records });
}

// POST /api/office-time — clock in/out 1 checkpoint
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = clockSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { date, checkpoint, timeStr, employeeId: bodyEmpId } = parsed.data;

  const userId = Number(session.user.id);
  const isManager = MANAGER_ROLES.includes(session.user.role);
  const targetId = isManager && bodyEmpId ? bodyEmpId : userId;

  // Chỉ manager mới được clock cho người khác
  if (!isManager && bodyEmpId && bodyEmpId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Tính thời điểm checkpoint
  const dateStart = new Date(date + "T00:00:00");
  let checkpointTime: Date;
  if (timeStr) {
    const [h, m] = timeStr.split(":").map(Number);
    checkpointTime = new Date(dateStart);
    checkpointTime.setHours(h, m, 0, 0);
  } else {
    checkpointTime = new Date();
  }

  // Upsert record
  const existing = await prisma.officeTime.findUnique({
    where: { date_employeeId: { date: dateStart, employeeId: targetId } },
  });

  let record;
  if (existing) {
    record = await prisma.officeTime.update({
      where: { id: existing.id },
      data: {
        [checkpoint]: checkpointTime,
        // Reset approval nếu employee tự sửa
        ...(targetId === userId && !isManager && { approvalStatus: "PENDING", approvedById: null, approvedAt: null }),
      },
    });
  } else {
    record = await prisma.officeTime.create({
      data: { date: dateStart, employeeId: targetId, [checkpoint]: checkpointTime },
    });
  }

  // Recalc actualWorked & delta
  const actualWorked = calcActualWorked(record);
  const delta = actualWorked > 0 ? record.workReportTotal - actualWorked : null;

  const updated = await prisma.officeTime.update({
    where: { id: record.id },
    data: { actualWorked, delta },
    include: { approvedBy: { select: { fullName: true } } },
  });

  return NextResponse.json({ data: updated }, { status: 201 });
}
