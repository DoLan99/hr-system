import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";

export const GET = withContext(async (_req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const sprints = await prisma.sprint.findMany({
    where: { organizationId: auth.orgId },
    include: { _count: { select: { tasks: true } } },
    orderBy: [{ status: "asc" }, { startDate: "desc" }],
  });

  return NextResponse.json({ data: sprints });
});

export const POST = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;
  if (!auth.isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  if (!body.name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const sprint = await prisma.sprint.create({
    data: {
      organizationId: auth.orgId,
      name: body.name.trim(),
      goal: body.goal?.trim() || null,
      status: body.status ?? "PLANNING",
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
    },
    include: { _count: { select: { tasks: true } } },
  });

  return NextResponse.json({ data: sprint }, { status: 201 });
});
