import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";
import { calcNextRun } from "@/lib/recurrence";

export const GET = withContext(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const taskId = Number(params.id);
  const rec = await prisma.taskRecurrence.findUnique({ where: { taskId } });
  return NextResponse.json({ data: rec });
});

export const PUT = withContext(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;
  if (!auth.isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const taskId = Number(params.id);
  const body = await req.json();

  if (!body.frequency) return NextResponse.json({ error: "frequency required" }, { status: 400 });

  const now = new Date();
  const nextRunAt = calcNextRun(
    now,
    body.frequency,
    body.interval ?? 1,
    body.daysOfWeek ?? [],
    body.dayOfMonth ?? null,
  );

  const rec = await prisma.taskRecurrence.upsert({
    where: { taskId },
    create: {
      taskId,
      frequency: body.frequency,
      interval: body.interval ?? 1,
      daysOfWeek: body.daysOfWeek ?? [],
      dayOfMonth: body.dayOfMonth ?? null,
      endDate: body.endDate ? new Date(body.endDate) : null,
      maxOccurrences: body.maxOccurrences ?? null,
      nextRunAt,
      isActive: true,
    },
    update: {
      frequency: body.frequency,
      interval: body.interval ?? 1,
      daysOfWeek: body.daysOfWeek ?? [],
      dayOfMonth: body.dayOfMonth ?? null,
      endDate: body.endDate ? new Date(body.endDate) : null,
      maxOccurrences: body.maxOccurrences ?? null,
      nextRunAt,
      isActive: true,
    },
  });

  return NextResponse.json({ data: rec });
});

export const DELETE = withContext(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;
  if (!auth.isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const taskId = Number(params.id);
  await prisma.taskRecurrence.deleteMany({ where: { taskId } });
  return NextResponse.json({ ok: true });
});
