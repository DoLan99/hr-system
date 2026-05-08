import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];

const schema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  approvedTime: z.number().int().min(0).optional(),
  bonusTime: z.number().int().min(0).default(0),
  decisionNote: z.string().optional(),
});

// PATCH /api/missing-tasks/[id]/review
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isManager = MANAGER_ROLES.includes(session.user.role);
  if (!isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = Number(params.id);
  const existing = await prisma.missingTask.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { status, approvedTime, bonusTime, decisionNote } = parsed.data;

  const updated = await prisma.missingTask.update({
    where: { id },
    data: {
      status,
      approvedTime: status === "APPROVED" ? (approvedTime ?? existing.timeAllotted) : null,
      bonusTime: status === "APPROVED" ? bonusTime : 0,
      reviewedById: Number(session.user.id),
      reviewedAt: new Date(),
      decisionNote: decisionNote ?? null,
    },
    include: {
      employee: { select: { id: true, fullName: true, department: true } },
      reviewedBy: { select: { id: true, fullName: true } },
    },
  });

  return NextResponse.json({ data: updated });
}
