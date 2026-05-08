import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];

const editSchema = z.object({
  taskName: z.string().min(1).optional(),
  description: z.string().optional(),
  quantity: z.number().int().min(1).optional(),
  timeAllotted: z.number().int().min(1).optional(),
  videoLink: z.string().min(1).optional(),
  videoDuration: z.number().int().min(0).optional(),
  dateRecorded: z.string().nullable().optional(),
  reasonNote: z.string().optional(),
});

const include = {
  employee: { select: { id: true, fullName: true, department: true } },
  reviewedBy: { select: { id: true, fullName: true } },
};

// PUT /api/missing-tasks/[id] — employee edit khi còn PENDING
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  const existing = await prisma.missingTask.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const userId = Number(session.user.id);
  const isManager = MANAGER_ROLES.includes(session.user.role);

  if (!isManager && existing.employeeId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  // Employee chỉ sửa được khi còn PENDING
  if (!isManager && existing.status !== "PENDING") {
    return NextResponse.json({ error: "Không thể sửa sau khi đã được xét duyệt" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = editSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;
  const updated = await prisma.missingTask.update({
    where: { id },
    data: {
      ...(d.taskName && { taskName: d.taskName }),
      ...(d.description !== undefined && { description: d.description }),
      ...(d.quantity !== undefined && { quantity: d.quantity }),
      ...(d.timeAllotted !== undefined && { timeAllotted: d.timeAllotted }),
      ...(d.videoLink && { videoLink: d.videoLink }),
      ...(d.videoDuration !== undefined && { videoDuration: d.videoDuration }),
      ...("dateRecorded" in d && { dateRecorded: d.dateRecorded ? new Date(d.dateRecorded) : null }),
      ...(d.reasonNote !== undefined && { reasonNote: d.reasonNote }),
    },
    include,
  });

  return NextResponse.json({ data: updated });
}

// DELETE /api/missing-tasks/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  const existing = await prisma.missingTask.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const userId = Number(session.user.id);
  const isManager = MANAGER_ROLES.includes(session.user.role);

  if (!isManager && existing.employeeId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!isManager && existing.status !== "PENDING") {
    return NextResponse.json({ error: "Không thể xóa sau khi đã xét duyệt" }, { status: 400 });
  }

  await prisma.missingTask.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
