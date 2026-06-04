import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ADMIN_ROLES, SUB_MANAGER_ROLES } from "@/lib/managed-scope";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";

export const PATCH = withContext(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const userRole = auth.roleName;
  const canManage = ADMIN_ROLES.includes(userRole) || SUB_MANAGER_ROLES.includes(userRole);
  if (!canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = Number(params.id);
  const flag = await prisma.estimateFlag.findFirst({ where: { id } });
  if (!flag) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  if (flag.status !== "OPEN") {
    return NextResponse.json({ error: "Đã xử lý trước đó" }, { status: 422 });
  }

  const action = new URL(req.url).searchParams.get("action") ?? "accept";

  if (action === "dismiss") {
    const updated = await prisma.estimateFlag.update({
      where: { id },
      data: { status: "DISMISSED", reviewedById: auth.actorId, reviewedAt: new Date() },
    });
    return NextResponse.json({ data: updated });
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.taskTemplate.update({
      where: { id: flag.templateId },
      data: { defaultEstimatedTime: flag.suggestedEstimate },
    });
    return tx.estimateFlag.update({
      where: { id },
      data: { status: "ACCEPTED", reviewedById: auth.actorId, reviewedAt: new Date() },
    });
  });

  return NextResponse.json({ data: updated });
});
