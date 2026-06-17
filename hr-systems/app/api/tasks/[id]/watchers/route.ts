import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";

export const GET = withContext(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const taskId = Number(params.id);
  const watchers = await prisma.taskWatcher.findMany({
    where: { taskId },
    include: {
      employee: { select: { id: true, fullName: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const isWatching = watchers.some((w) => w.employeeId === auth.actorId);

  return NextResponse.json({ data: watchers, isWatching });
});

export const POST = withContext(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const taskId = Number(params.id);

  const existing = await prisma.taskWatcher.findUnique({
    where: { taskId_employeeId: { taskId, employeeId: auth.actorId } },
  });

  if (existing) return NextResponse.json({ data: existing, alreadyWatching: true });

  const watcher = await prisma.taskWatcher.create({
    data: { taskId, employeeId: auth.actorId },
    include: {
      employee: { select: { id: true, fullName: true, avatarUrl: true } },
    },
  });

  return NextResponse.json({ data: watcher }, { status: 201 });
});
