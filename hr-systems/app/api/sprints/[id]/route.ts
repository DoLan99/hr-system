import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";

export const PATCH = withContext(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;
  if (!auth.isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = Number(params.id);
  const sprint = await prisma.sprint.findFirst({ where: { id, organizationId: auth.orgId } });
  if (!sprint) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const updated = await prisma.sprint.update({
    where: { id },
    data: {
      ...(body.name && { name: body.name.trim() }),
      ...(body.goal !== undefined && { goal: body.goal?.trim() || null }),
      ...(body.status && { status: body.status }),
      ...(body.startDate !== undefined && { startDate: body.startDate ? new Date(body.startDate) : null }),
      ...(body.endDate !== undefined && { endDate: body.endDate ? new Date(body.endDate) : null }),
    },
    include: { _count: { select: { tasks: true } } },
  });

  return NextResponse.json({ data: updated });
});

export const DELETE = withContext(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;
  if (!auth.isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = Number(params.id);
  const sprint = await prisma.sprint.findFirst({ where: { id, organizationId: auth.orgId } });
  if (!sprint) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Unlink tasks before delete
  await prisma.task.updateMany({ where: { sprintId: id }, data: { sprintId: null } });
  await prisma.sprint.delete({ where: { id } });

  return NextResponse.json({ ok: true });
});
