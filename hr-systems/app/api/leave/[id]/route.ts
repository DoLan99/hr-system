import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];

const updateSchema = z.object({
  date: z.string().optional(),
  type: z.enum(["VACATION", "HOLIDAY", "ILLNESS", "OTHER"]).optional(),
  requestedHours: z.number().min(0.5).max(24).optional(),
  reason: z.string().optional(),
  evidenceLink: z.string().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  const existing = await prisma.leave.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const userId = Number(session.user.id);
  const isManager = MANAGER_ROLES.includes((session.user as any).role);

  // Employee chỉ được edit khi PENDING
  if (!isManager && (existing.employeeId !== userId || existing.status !== "PENDING")) {
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
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  const existing = await prisma.leave.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const userId = Number(session.user.id);
  const isManager = MANAGER_ROLES.includes((session.user as any).role);

  if (!isManager && (existing.employeeId !== userId || existing.status !== "PENDING")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.leave.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
