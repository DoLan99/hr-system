import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";

async function findTask(idOrCode: string) {
  const numId = Number(idOrCode);
  if (Number.isInteger(numId) && !isNaN(numId)) {
    return prisma.task.findFirst({ where: { id: numId } });
  }
  return prisma.task.findFirst({ where: { code: idOrCode } });
}

export const POST = withContext(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;
  const userId = auth.actorId;

  const task = await findTask(params.id);
  if (!task) return NextResponse.json({ error: "Không tìm thấy task" }, { status: 404 });

  if (task.assignedToId !== userId) {
    return NextResponse.json({ error: "Chỉ assignee mới có thể start timer" }, { status: 403 });
  }

  const openTimer = await prisma.timeLog.findFirst({
    where: {
      employeeId: userId,
      startTime: { not: null },
      endTime: null,
    },
    select: { id: true, taskId: true, startTime: true, task: { select: { code: true, title: true } } },
  });

  if (openTimer) {
    if (openTimer.taskId === task.id) {
      return NextResponse.json({ data: openTimer, alreadyRunning: true }, { status: 200 });
    }
    return NextResponse.json(
      {
        error: "Bạn đang chạy timer cho task khác. Stop trước khi start task mới.",
        runningTimer: openTimer,
      },
      { status: 409 },
    );
  }

  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const result = await prisma.$transaction(async (tx) => {
    const log = await tx.timeLog.create({
      data: {
        organizationId: auth.orgId,
        taskId: task.id,
        employeeId: userId,
        date: today,
        startTime: now,
        endTime: null,
        durationMinutes: 0,
      },
    });

    const taskUpdate: { status?: "IN_PROGRESS"; dateStarted?: Date; lastUpdate?: Date } = {
      lastUpdate: now,
    };
    if (task.status === "BACKLOG" || task.status === "BLOCKED") {
      taskUpdate.status = "IN_PROGRESS";
    }
    if (!task.dateStarted) {
      taskUpdate.dateStarted = now;
    }
    if (Object.keys(taskUpdate).length > 0) {
      await tx.task.update({ where: { id: task.id }, data: taskUpdate });
    }

    return log;
  });

  return NextResponse.json({ data: result }, { status: 201 });
});
