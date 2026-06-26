import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, MANAGER_ROLES } from "@/lib/api-auth";

const reviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  approvedHours: z.number().min(0).optional(),
  approvalNote: z.string().optional(),
  money: z.number().min(0).optional(),
});

export const PATCH = withContext(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const isManager = MANAGER_ROLES.includes(auth.roleName);
  // Allow approver (who was designated) or managers
  const leave = await prisma.leave.findFirst({ where: { id: Number(params.id) } });
  const isDesignatedApprover = leave?.approverId === auth.actorId;
  if (!isManager && !isDesignatedApprover) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = Number(params.id);
  const existing = leave ?? await prisma.leave.findFirst({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const body = await req.json();
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;

  const updated = await prisma.leave.update({
    where: { id },
    data: {
      status: d.status,
      approvedHours: d.status === "APPROVED" ? (d.approvedHours ?? Number(existing.requestedHours)) : null,
      approvalNote: d.approvalNote,
      money: d.money,
      approvedById: auth.actorId,
      approvedAt: new Date(),
    },
    include: {
      employee: { select: { id: true, fullName: true, department: true } },
      approvedBy: { select: { id: true, fullName: true } },
    },
  });

  return NextResponse.json({ data: updated });
});
