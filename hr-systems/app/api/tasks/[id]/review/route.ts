import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";
import { ADMIN_ROLES, SUB_MANAGER_ROLES } from "@/lib/managed-scope";

const schema = z.object({
  action: z.enum(["approve", "changes", "reject"]),
  comment: z.string().optional(),
});

// PATCH /api/tasks/[id]/review
export const PATCH = withContext(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const isManager = ADMIN_ROLES.includes(auth.roleName) || SUB_MANAGER_ROLES.includes(auth.roleName);
  if (!isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = Number(params.id);
  const task = await prisma.task.findFirst({ where: { id, organizationId: auth.orgId } });
  if (!task) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  if (task.status !== "REVIEW") return NextResponse.json({ error: "Task không ở trạng thái Review" }, { status: 400 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { action } = parsed.data;
  const newStatus = action === "approve" ? "DONE" : action === "changes" ? "IN_PROGRESS" : "IN_PROGRESS";

  const updated = await prisma.task.update({
    where: { id },
    data: {
      status: newStatus,
      reasonNextAction: parsed.data.comment ?? null,
    },
  });

  return NextResponse.json({ data: updated });
});
