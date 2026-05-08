import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];

const schema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  approvedDelta: z.number().int().optional(),
});

// PATCH /api/office-time/[id]/approve
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isManager = MANAGER_ROLES.includes(session.user.role);
  if (!isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = Number(params.id);
  const existing = await prisma.officeTime.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { status, approvedDelta } = parsed.data;

  const updated = await prisma.officeTime.update({
    where: { id },
    data: {
      approvalStatus: status,
      approvedById: Number(session.user.id),
      approvedAt: new Date(),
      ...(approvedDelta !== undefined && { approvedDelta }),
    },
    include: { approvedBy: { select: { fullName: true } } },
  });

  return NextResponse.json({ data: updated });
}
