import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCronAuth } from "@/lib/cron-auth";
import { calcNextRun } from "@/lib/recurrence";

/**
 * GET /api/cron/recurrence
 *
 * Chạy mỗi giờ. Tìm tất cả TaskRecurrence có nextRunAt <= now,
 * tạo task mới từ template task gốc, cập nhật nextRunAt kế tiếp.
 */
export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const dueRecs = await prisma.taskRecurrence.findMany({
    where: {
      isActive: true,
      nextRunAt: { lte: now },
      OR: [{ endDate: null }, { endDate: { gte: now } }],
    },
    include: {
      task: {
        select: {
          id: true, organizationId: true, title: true, description: true,
          taskType: true, priority: true, assignedToId: true, assignedById: true,
          supportId: true, customerId: true, projectId: true, sprintId: true,
          billable: true, hourlyRateOverride: true, requiresVideo: true,
          estimatedTime: true, storyPoints: true, templateId: true,
        },
      },
    },
  });

  const results: { recId: number; taskCode: string; skipped?: string }[] = [];

  for (const rec of dueRecs) {
    // Check maxOccurrences
    if (rec.maxOccurrences !== null && rec.occurrenceCount >= rec.maxOccurrences) {
      await prisma.taskRecurrence.update({ where: { id: rec.id }, data: { isActive: false } });
      results.push({ recId: rec.id, taskCode: "-", skipped: "maxOccurrences reached" });
      continue;
    }

    // Generate sequential code
    const lastTask = await prisma.task.findFirst({
      where: { organizationId: rec.task.organizationId },
      orderBy: { id: "desc" },
      select: { code: true },
    });
    const lastNum = lastTask ? parseInt(lastTask.code.replace("TSK-", ""), 10) : 0;
    const newCode = `TSK-${String(lastNum + 1).padStart(4, "0")}`;

    const newTask = await prisma.task.create({
      data: {
        organizationId: rec.task.organizationId,
        code: newCode,
        title: rec.task.title,
        description: rec.task.description,
        taskType: rec.task.taskType,
        priority: rec.task.priority,
        status: "BACKLOG",
        assignedToId: rec.task.assignedToId,
        assignedById: rec.task.assignedById,
        supportId: rec.task.supportId,
        customerId: rec.task.customerId,
        projectId: rec.task.projectId,
        sprintId: rec.task.sprintId,
        billable: rec.task.billable,
        hourlyRateOverride: rec.task.hourlyRateOverride,
        requiresVideo: rec.task.requiresVideo,
        estimatedTime: rec.task.estimatedTime,
        storyPoints: rec.task.storyPoints,
        templateId: rec.task.templateId,
      },
      select: { code: true },
    });

    // Advance nextRunAt
    const nextRunAt = calcNextRun(
      rec.nextRunAt,
      rec.frequency,
      rec.interval,
      rec.daysOfWeek,
      rec.dayOfMonth,
    );

    await prisma.taskRecurrence.update({
      where: { id: rec.id },
      data: {
        occurrenceCount: { increment: 1 },
        lastRunAt: now,
        nextRunAt,
      },
    });

    results.push({ recId: rec.id, taskCode: newTask.code });
  }

  return NextResponse.json({ ok: true, processed: results.length, results });
}
