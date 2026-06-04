import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { calcCreditedMinutes } from "@/lib/time-logs";
import { z } from "zod";
import { requireApiAuth } from "@/lib/api-auth";

const bodySchema = z.object({
  note: z.string().max(2000).optional(),
  proofLinks: z.array(z.string().url()).max(20).optional(),
  videoLink: z.string().nullable().optional(),
  videoDuration: z.number().int().min(0).nullable().optional(),
  videoCount: z.number().int().min(0).optional(),
  completionPctAfter: z.number().int().min(0).max(100).nullable().optional(),
  taskStatusAfter: z.enum(["IN_PROGRESS", "BLOCKED", "REVIEW", "DONE"]).nullable().optional(),
});

async function findTask(idOrCode: string) {
  const numId = Number(idOrCode);
  if (Number.isInteger(numId) && !isNaN(numId)) {
    return prisma.task.findFirst({ where: { id: numId } });
  }
  return prisma.task.findFirst({ where: { code: idOrCode } });
}

export const POST = withContext(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;
  const userId = auth.actorId;

  const task = await findTask(params.id);
  if (!task) return NextResponse.json({ error: "Không tìm thấy task" }, { status: 404 });

  if (task.assignedToId !== userId) {
    return NextResponse.json({ error: "Chỉ assignee mới có thể stop timer" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const d = parsed.data;

  const openLog = await prisma.timeLog.findFirst({
    where: {
      taskId: task.id,
      employeeId: userId,
      startTime: { not: null },
      endTime: null,
    },
    orderBy: { startTime: "desc" },
  });

  if (!openLog || !openLog.startTime) {
    return NextResponse.json({ error: "Không có timer đang chạy cho task này" }, { status: 404 });
  }

  const now = new Date();
  const durationMinutes = Math.max(
    1,
    Math.round((now.getTime() - openLog.startTime.getTime()) / 60000),
  );

  const currentTotal = task.actualTimeTotal;

  const proofLinks: string[] = d.proofLinks?.length
    ? d.proofLinks
    : d.videoLink
      ? [d.videoLink]
      : [];
  const primaryVideoLink = proofLinks[0] ?? null;

  const credited = calcCreditedMinutes({
    taskType: task.taskType,
    durationMinutes,
    estimatedTime: task.estimatedTime,
    actualTimeTotalBefore: currentTotal,
    videoLink: primaryVideoLink,
    requiresVideo: task.requiresVideo,
  });

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.timeLog.update({
      where: { id: openLog.id },
      data: {
        endTime: now,
        durationMinutes,
        note: d.note ?? null,
        completionPctAfter: d.completionPctAfter ?? null,
        taskStatusAfter: d.taskStatusAfter ?? null,
        videoLink: primaryVideoLink,
        videoDuration: d.videoDuration ?? 0,
        videoCount: proofLinks.length,
        proofLinks: proofLinks.length ? proofLinks : [],
        creditedMinutes: credited.creditedMinutes,
        approvalStatus: credited.approvalStatus,
      },
    });

    const taskUpdate: {
      actualTimeTotal: { increment: number };
      lastUpdate: Date;
      progressPct?: number;
      status?: "IN_PROGRESS" | "BLOCKED" | "REVIEW" | "DONE";
      dateCompleted?: Date;
      videoLink?: string;
    } = {
      actualTimeTotal: { increment: durationMinutes },
      lastUpdate: now,
    };
    if (primaryVideoLink) {
      taskUpdate.videoLink = primaryVideoLink;
    }
    if (d.completionPctAfter !== undefined && d.completionPctAfter !== null) {
      taskUpdate.progressPct = d.completionPctAfter;
    }
    if (d.taskStatusAfter) {
      taskUpdate.status = d.taskStatusAfter;
      if (d.taskStatusAfter === "DONE") {
        taskUpdate.dateCompleted = now;
        taskUpdate.progressPct = 100;
      }
    }
    await tx.task.update({ where: { id: task.id }, data: taskUpdate });

    return updated;
  });

  return NextResponse.json({ data: result, credited });
});
