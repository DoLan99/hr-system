import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];

const reviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  approvedHours: z.number().min(0).optional(),
  approvalNote: z.string().optional(),
  money: z.number().min(0).optional(),
});

// PATCH /api/leave/[id]/review
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isManager = MANAGER_ROLES.includes((session.user as any).role);
  if (!isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = Number(params.id);
  const existing = await prisma.leave.findUnique({ where: { id } });
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
      approvedById: Number(session.user.id),
      approvedAt: new Date(),
    },
    include: {
      employee: { select: { id: true, fullName: true, department: true } },
      approvedBy: { select: { id: true, fullName: true } },
    },
  });

  return NextResponse.json({ data: updated });
}
