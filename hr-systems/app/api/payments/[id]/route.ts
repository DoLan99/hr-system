import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];

const updateSchema = z.object({
  date: z.string().optional(),
  type: z.enum(["SALARY", "BONUS", "ADVANCE", "DEDUCTION", "OTHER"]).optional(),
  amount: z.number().optional(),
  notes: z.string().optional(),
  summaryMonth: z.number().int().min(1).max(12).optional(),
  summaryYear: z.number().int().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isManager = MANAGER_ROLES.includes((session.user as any).role);
  if (!isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = Number(params.id);
  const existing = await prisma.payment.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;
  const updated = await prisma.payment.update({
    where: { id },
    data: {
      ...(d.date && { date: new Date(d.date) }),
      ...(d.type && { type: d.type }),
      ...(d.amount !== undefined && { amount: d.amount }),
      ...(d.notes !== undefined && { notes: d.notes }),
      ...(d.summaryMonth !== undefined && { summaryMonth: d.summaryMonth }),
      ...(d.summaryYear !== undefined && { summaryYear: d.summaryYear }),
    },
    include: {
      employee: { select: { id: true, fullName: true, department: true } },
      createdBy: { select: { id: true, fullName: true } },
    },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isManager = MANAGER_ROLES.includes((session.user as any).role);
  if (!isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.payment.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
}
