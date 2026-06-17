import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";

export const GET = withContext(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const taskId = Number(params.id);

  const [blocking, blockedBy] = await Promise.all([
    prisma.taskDependency.findMany({
      where: { taskId },
      include: {
        dependsOn: { select: { id: true, code: true, title: true, status: true, priority: true } },
      },
    }),
    prisma.taskDependency.findMany({
      where: { dependsOnId: taskId },
      include: {
        task: { select: { id: true, code: true, title: true, status: true, priority: true } },
      },
    }),
  ]);

  return NextResponse.json({ data: { blocking, blockedBy } });
});

export const POST = withContext(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const taskId = Number(params.id);
  const body = await req.json();

  if (!body.dependsOnId) return NextResponse.json({ error: "dependsOnId required" }, { status: 400 });
  if (body.dependsOnId === taskId) return NextResponse.json({ error: "Không thể tự phụ thuộc" }, { status: 400 });

  const dep = await prisma.taskDependency.upsert({
    where: { taskId_dependsOnId: { taskId, dependsOnId: body.dependsOnId } },
    create: {
      taskId,
      dependsOnId: body.dependsOnId,
      type: body.type ?? "BLOCKS",
    },
    update: { type: body.type ?? "BLOCKS" },
    include: {
      dependsOn: { select: { id: true, code: true, title: true, status: true, priority: true } },
    },
  });

  return NextResponse.json({ data: dep }, { status: 201 });
});
