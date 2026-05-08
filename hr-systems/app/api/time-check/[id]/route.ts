import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];

const editSchema = z.object({
  actualTime: z.number().int().min(1).optional(),
  proposedStdTime: z.number().int().min(1).optional(),
  reason: z.string().min(1).optional(),
  videoLink: z.string().min(1).optional(),
  videoDuration: z.number().int().min(0).optional(),
});

const include = {
  employee: { select: { id: true, fullName: true, department: true } },
  task: { select: { taskId: true, taskName: true, stdTime: true } },
  reviewedBy: { select: { id: true, fullName: true } },
};

// PUT /api/time-check/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  const existing = await prisma.timeCheck.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const userId = Number(session.user.id);
  const isManager = MANAGER_ROLES.includes(session.user.role);

  if (!isManager && existing.employeeId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!isManager && existing.status !== "PENDING") {
    return NextResponse.json({ error: "Không thể sửa sau khi đã xét duyệt" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = editSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;
  const newProposed = d.proposedStdTime ?? existing.proposedStdTime;
  const difference = newProposed - existing.currentStdTime;

  const updated = await prisma.timeCheck.update({
    where: { id },
    data: {
      ...(d.actualTime !== undefined && { actualTime: d.actualTime }),
      ...(d.proposedStdTime !== undefined && {
        proposedStdTime: d.proposedStdTime,
        difference,
        timeCheckType: difference >= 0 ? "INCREASE" : "DECREASE",
      }),
      ...(d.reason !== undefined && { reason: d.reason }),
      ...(d.videoLink !== undefined && { videoLink: d.videoLink }),
      ...(d.videoDuration !== undefined && { videoDuration: d.videoDuration }),
    },
    include,
  });

  return NextResponse.json({ data: updated });
}

// DELETE /api/time-check/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  const existing = await prisma.timeCheck.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const userId = Number(session.user.id);
  const isManager = MANAGER_ROLES.includes(session.user.role);

  if (!isManager && existing.employeeId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!isManager && existing.status !== "PENDING") {
    return NextResponse.json({ error: "Không thể xóa sau khi đã xét duyệt" }, { status: 400 });
  }

  await prisma.timeCheck.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
