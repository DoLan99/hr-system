import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, MANAGER_ROLES } from "@/lib/api-auth";

const updateSchema = z.object({
  date: z.string().optional(),
  type: z.enum(["VACATION", "HOLIDAY", "ILLNESS", "OTHER"]).optional(),
  requestedHours: z.number().min(0.5).max(24).optional(),
  reason: z.string().optional(),
  evidenceLink: z.string().optional(),
});

export const PUT = withContext(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const id = Number(params.id);
  const existing = await prisma.leave.findFirst({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const isManager = MANAGER_ROLES.includes(auth.roleName);

  if (!isManager && (existing.employeeId !== auth.actorId || existing.status !== "PENDING")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;
  const updated = await prisma.leave.update({
    where: { id },
    data: {
      ...(d.date && { date: new Date(d.date) }),
      ...(d.type && { type: d.type }),
      ...(d.requestedHours !== undefined && { requestedHours: d.requestedHours }),
      ...(d.reason !== undefined && { reason: d.reason }),
      ...(d.evidenceLink !== undefined && { evidenceLink: d.evidenceLink }),
    },
    include: {
      employee: { select: { id: true, fullName: true, department: true } },
      approvedBy: { select: { id: true, fullName: true } },
    },
  });

  return NextResponse.json({ data: updated });
});

export const DELETE = withContext(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const id = Number(params.id);
  const existing = await prisma.leave.findFirst({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const isManager = MANAGER_ROLES.includes(auth.roleName);

  if (!isManager && (existing.employeeId !== auth.actorId || existing.status !== "PENDING")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.leave.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
