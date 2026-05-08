import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];

const schema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  approvedTime: z.number().int().min(1).optional(), // thời gian mới được approve (có thể khác proposed)
  decisionNote: z.string().optional(),
  updateTaskStdTime: z.boolean().default(true), // có cập nhật stdTime task library không
});

// PATCH /api/time-check/[id]/review
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isManager = MANAGER_ROLES.includes(session.user.role);
  if (!isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = Number(params.id);
  const existing = await prisma.timeCheck.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { status, approvedTime, decisionNote, updateTaskStdTime } = parsed.data;

  const finalApprovedTime = approvedTime ?? existing.proposedStdTime;

  const updated = await prisma.timeCheck.update({
    where: { id },
    data: {
      status,
      approvedTime: status === "APPROVED" ? finalApprovedTime : null,
      reviewedById: Number(session.user.id),
      reviewedAt: new Date(),
      decisionNote: decisionNote ?? null,
    },
    include: {
      employee: { select: { id: true, fullName: true, department: true } },
      task: { select: { taskId: true, taskName: true, stdTime: true } },
      reviewedBy: { select: { id: true, fullName: true } },
    },
  });

  // Nếu APPROVED và updateTaskStdTime → cập nhật stdTime trong Task Library
  if (status === "APPROVED" && updateTaskStdTime && existing.taskId) {
    await prisma.taskLibrary.update({
      where: { taskId: existing.taskId },
      data: { stdTime: finalApprovedTime },
    });
  }

  return NextResponse.json({ data: updated });
}
