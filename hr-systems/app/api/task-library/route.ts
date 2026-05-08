import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ALLOWED_WRITE = ["SUPER_ADMIN", "ADMIN", "MANAGER"];

const createSchema = z.object({
  taskId: z
    .string()
    .min(1, "Task ID bắt buộc")
    .max(20)
    .regex(/^[A-Z0-9]+$/, "Chỉ dùng chữ IN HOA và số, không dấu cách"),
  taskName: z.string().min(1, "Tên task bắt buộc").max(200),
  description: z.string().optional(),
  stdTime: z.number().int().min(1, "Tối thiểu 1 phút"),
  department: z.string().min(1, "Phòng ban bắt buộc").max(50),
  linkTemplate: z.string().optional(),
  note1: z.string().optional(),
  note2: z.string().optional(),
});

// GET /api/task-library — danh sách tasks
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const department = searchParams.get("department") ?? "";
  const activeOnly = searchParams.get("activeOnly") !== "false"; // default true

  const tasks = await prisma.taskLibrary.findMany({
    where: {
      ...(activeOnly && { isActive: true }),
      ...(department && { department }),
      ...(search && {
        OR: [
          { taskId: { contains: search, mode: "insensitive" as const } },
          { taskName: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    },
    orderBy: [{ department: "asc" }, { taskId: "asc" }],
  });

  return NextResponse.json({ data: tasks });
}

// POST /api/task-library — tạo task mới
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ALLOWED_WRITE.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  // Kiểm tra trùng Task ID
  const existing = await prisma.taskLibrary.findUnique({
    where: { taskId: parsed.data.taskId },
  });
  if (existing) {
    return NextResponse.json(
      { error: `Task ID "${parsed.data.taskId}" đã tồn tại.` },
      { status: 409 }
    );
  }

  const task = await prisma.taskLibrary.create({ data: parsed.data });
  return NextResponse.json({ data: task }, { status: 201 });
}
