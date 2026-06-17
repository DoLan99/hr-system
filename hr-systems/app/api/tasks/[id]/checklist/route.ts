import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";

export const GET = withContext(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const taskId = Number(params.id);
  const items = await prisma.taskChecklistItem.findMany({
    where: { taskId },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ data: items });
});

export const POST = withContext(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const taskId = Number(params.id);
  const body = await req.json();
  if (!body.content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const maxOrder = await prisma.taskChecklistItem.aggregate({
    where: { taskId },
    _max: { order: true },
  });

  const item = await prisma.taskChecklistItem.create({
    data: {
      taskId,
      content: body.content.trim(),
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  return NextResponse.json({ data: item }, { status: 201 });
});
