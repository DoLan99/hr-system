import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireManager } from "@/lib/api-auth";

const updateSchema = z.object({
  status: z.enum(["DRAFT", "OPEN", "CLOSED"]).optional(),
  selfDueDate: z.string().nullable().optional(),
  managerDueDate: z.string().nullable().optional(),
});

export const GET = withContext(async (
  _req: NextRequest,
  { params }: { params: { id: string } },
) => {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;

  const id = Number(params.id);
  const cycle = await prisma.reviewCycle.findFirst({
    where: { id, organizationId: auth.orgId },
    include: {
      createdBy: { select: { id: true, fullName: true } },
      reviews: {
        include: {
          employee: { select: { id: true, fullName: true, department: true, avatarUrl: true } },
          mgrReviewer: { select: { id: true, fullName: true } },
        },
        orderBy: [{ status: "asc" }, { employee: { fullName: "asc" } }],
      },
    },
  });
  if (!cycle) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ data: cycle });
});

export const PUT = withContext(async (
  req: NextRequest,
  { params }: { params: { id: string } },
) => {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;

  const id = Number(params.id);
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const existing = await prisma.reviewCycle.findFirst({
    where: { id, organizationId: auth.orgId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: any = {};
  if (parsed.data.status) {
    data.status = parsed.data.status;
    if (parsed.data.status === "OPEN" && !existing.openedAt) data.openedAt = new Date();
    if (parsed.data.status === "CLOSED") data.closedAt = new Date();
  }
  if (parsed.data.selfDueDate !== undefined) {
    data.selfDueDate = parsed.data.selfDueDate ? new Date(parsed.data.selfDueDate) : null;
  }
  if (parsed.data.managerDueDate !== undefined) {
    data.managerDueDate = parsed.data.managerDueDate ? new Date(parsed.data.managerDueDate) : null;
  }

  const updated = await prisma.reviewCycle.update({ where: { id }, data });
  return NextResponse.json({ data: updated });
});
