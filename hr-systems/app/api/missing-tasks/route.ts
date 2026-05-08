import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];

const createSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  taskName: z.string().min(1, "Bắt buộc"),
  description: z.string().optional(),
  quantity: z.number().int().min(1).default(1),
  timeAllotted: z.number().int().min(1, "Tối thiểu 1 phút"),
  videoLink: z.string().min(1, "Bắt buộc cung cấp link video"),
  videoDuration: z.number().int().min(0).optional(),
  dateRecorded: z.string().optional(),
  reasonNote: z.string().optional(),
});

// GET /api/missing-tasks?status=PENDING&employeeId=2&month=1&year=2025
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const empId = searchParams.get("employeeId");
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  const userId = Number(session.user.id);
  const isManager = MANAGER_ROLES.includes(session.user.role);

  const where: any = {};
  if (!isManager) where.employeeId = userId;
  else if (empId) where.employeeId = Number(empId);

  if (status) where.status = status;

  if (month && year) {
    const start = new Date(Number(year), Number(month) - 1, 1);
    const end = new Date(Number(year), Number(month), 1);
    where.date = { gte: start, lt: end };
  }

  const items = await prisma.missingTask.findMany({
    where,
    include: {
      employee: { select: { id: true, fullName: true, department: true } },
      reviewedBy: { select: { id: true, fullName: true } },
    },
    orderBy: [{ status: "asc" }, { date: "desc" }],
  });

  return NextResponse.json({ data: items });
}

// POST /api/missing-tasks
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;
  const employeeId = Number(session.user.id);

  const item = await prisma.missingTask.create({
    data: {
      date: new Date(d.date),
      employeeId,
      taskName: d.taskName,
      description: d.description,
      quantity: d.quantity,
      timeAllotted: d.timeAllotted,
      videoLink: d.videoLink,
      videoDuration: d.videoDuration,
      dateRecorded: d.dateRecorded ? new Date(d.dateRecorded) : null,
      reasonNote: d.reasonNote,
    },
    include: {
      employee: { select: { id: true, fullName: true, department: true } },
      reviewedBy: { select: { id: true, fullName: true } },
    },
  });

  return NextResponse.json({ data: item }, { status: 201 });
}
