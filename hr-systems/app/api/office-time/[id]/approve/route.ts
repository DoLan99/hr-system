import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, MANAGER_ROLES } from "@/lib/api-auth";

const schema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  approvedDelta: z.number().int().optional(),
});

export const PATCH = withContext(async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const isManager = MANAGER_ROLES.includes(auth.roleName);
  if (!isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = Number(params.id);
  const existing = await prisma.officeTime.findFirst({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { status, approvedDelta } = parsed.data;

  const updated = await prisma.officeTime.update({
    where: { id },
    data: {
      approvalStatus: status,
      approvedById: auth.actorId,
      approvedAt: new Date(),
      ...(approvedDelta !== undefined && { approvedDelta }),
    },
    include: { approvedBy: { select: { fullName: true } } },
  });

  return NextResponse.json({ data: updated });
});
