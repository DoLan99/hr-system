import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { ADMIN_ROLES, SUB_MANAGER_ROLES } from "@/lib/managed-scope";
import { z } from "zod";
import { requireApiAuth } from "@/lib/api-auth";

const patchSchema = z.object({
  status: z.enum(["OPEN", "ACKNOWLEDGED", "RESOLVED", "DISMISSED"]),
  notes: z.string().max(2000).optional(),
});

export const PATCH = withContext(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const role = auth.roleName;
  if (!ADMIN_ROLES.includes(role) && !SUB_MANAGER_ROLES.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "id không hợp lệ" }, { status: 422 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const alert = await prisma.anomalyAlert.findFirst({ where: { id } });
  if (!alert) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const updated = await prisma.anomalyAlert.update({
    where: { id },
    data: {
      status: parsed.data.status,
      notes: parsed.data.notes ?? alert.notes,
      acknowledgedById: parsed.data.status === "OPEN" ? null : auth.actorId,
      acknowledgedAt: parsed.data.status === "OPEN" ? null : new Date(),
    },
    include: {
      employee: { select: { id: true, fullName: true } },
      acknowledgedBy: { select: { id: true, fullName: true } },
    },
  });

  return NextResponse.json({ data: updated });
});
