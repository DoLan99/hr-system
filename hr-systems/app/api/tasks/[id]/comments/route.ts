import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";

export const GET = withContext(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const taskId = Number(params.id);
  if (isNaN(taskId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const task = await prisma.task.findFirst({ where: { id: taskId, organizationId: auth.orgId }, select: { id: true } });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const comments = await prisma.taskComment.findMany({
    where: { taskId, deletedAt: null, parentId: null },
    include: {
      author: { select: { id: true, fullName: true, avatarUrl: true } },
      replies: {
        where: { deletedAt: null },
        include: { author: { select: { id: true, fullName: true, avatarUrl: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: comments });
});

export const POST = withContext(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const taskId = Number(params.id);
  if (isNaN(taskId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const task = await prisma.task.findFirst({ where: { id: taskId, organizationId: auth.orgId }, select: { id: true } });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const content = (body.content ?? "").trim();
  if (!content) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const comment = await prisma.taskComment.create({
    data: {
      taskId,
      authorId: auth.actorId,
      content,
      parentId: body.parentId ?? null,
    },
    include: {
      author: { select: { id: true, fullName: true, avatarUrl: true } },
      replies: {
        where: { deletedAt: null },
        include: { author: { select: { id: true, fullName: true, avatarUrl: true } } },
      },
    },
  });

  return NextResponse.json({ data: comment });
});
