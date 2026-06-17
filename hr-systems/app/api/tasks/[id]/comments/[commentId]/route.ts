import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";

export const PATCH = withContext(async (req: NextRequest, { params }: { params: { id: string; commentId: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const commentId = Number(params.commentId);
  if (isNaN(commentId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const comment = await prisma.taskComment.findFirst({ where: { id: commentId, deletedAt: null } });
  if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (comment.authorId !== auth.actorId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const updated = await prisma.taskComment.update({
    where: { id: commentId },
    data: { content: content.trim() },
    include: {
      author: { select: { id: true, fullName: true, avatarUrl: true } },
      replies: { where: { deletedAt: null }, include: { author: { select: { id: true, fullName: true, avatarUrl: true } } } },
    },
  });
  return NextResponse.json({ data: updated });
});

export const DELETE = withContext(async (_req: NextRequest, { params }: { params: { id: string; commentId: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const commentId = Number(params.commentId);
  if (isNaN(commentId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const comment = await prisma.taskComment.findFirst({ where: { id: commentId, deletedAt: null } });
  if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (comment.authorId !== auth.actorId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.taskComment.update({ where: { id: commentId }, data: { deletedAt: new Date() } });
  return NextResponse.json({ ok: true });
});
