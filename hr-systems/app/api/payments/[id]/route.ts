import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, MANAGER_ROLES } from "@/lib/api-auth";

const updateSchema = z.object({
  date: z.string().optional(),
  type: z.enum(["SALARY", "BONUS", "ADVANCE", "DEDUCTION", "OTHER"]).optional(),
  amount: z.number().optional(),
  notes: z.string().optional(),
  summaryMonth: z.number().int().min(1).max(12).optional(),
  summaryYear: z.number().int().optional(),
});

export const PUT = withContext(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const isManager = MANAGER_ROLES.includes(auth.roleName);
  if (!isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = Number(params.id);
  const existing = await prisma.payment.findFirst({ where: { id } });
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
});

export const DELETE = withContext(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const isManager = MANAGER_ROLES.includes(auth.roleName);
  if (!isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.payment.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
});
