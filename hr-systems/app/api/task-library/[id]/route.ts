import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ALLOWED_WRITE = ["SUPER_ADMIN", "ADMIN", "MANAGER"];

const updateSchema = z.object({
  taskName: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  stdTime: z.number().int().min(1).optional(),
  department: z.string().min(1).max(50).optional(),
  linkTemplate: z.string().optional(),
  note1: z.string().optional(),
  note2: z.string().optional(),
});

// GET /api/task-library/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const task = await prisma.taskLibrary.findUnique({
    where: { id: Number(params.id) },
  });
  if (!task) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  return NextResponse.json({ data: task });
}

// PUT /api/task-library/[id] — cập nhật task
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ALLOWED_WRITE.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const task = await prisma.taskLibrary.update({
    where: { id: Number(params.id) },
    data: parsed.data,
  });

  return NextResponse.json({ data: task });
}

// PATCH /api/task-library/[id] — toggle isActive
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ALLOWED_WRITE.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { isActive } = await req.json();

  const task = await prisma.taskLibrary.update({
    where: { id: Number(params.id) },
    data: { isActive: Boolean(isActive) },
  });

  return NextResponse.json({ data: task });
}
