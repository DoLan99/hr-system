import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ADMIN_ROLES, SUB_MANAGER_ROLES } from "@/lib/managed-scope";

// PATCH ?action=accept|dismiss
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userRole = session.user.role;
  const canManage = ADMIN_ROLES.includes(userRole) || SUB_MANAGER_ROLES.includes(userRole);
  if (!canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = Number(params.id);
  const flag = await prisma.estimateFlag.findUnique({ where: { id } });
  if (!flag) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  if (flag.status !== "OPEN") {
    return NextResponse.json({ error: "Đã xử lý trước đó" }, { status: 422 });
  }

  const action = new URL(req.url).searchParams.get("action") ?? "accept";
  const userId = Number(session.user.id);

  if (action === "dismiss") {
    const updated = await prisma.estimateFlag.update({
      where: { id },
      data: { status: "DISMISSED", reviewedById: userId, reviewedAt: new Date() },
    });
    return NextResponse.json({ data: updated });
  }

  // accept → update template's default_estimated_time
  const updated = await prisma.$transaction(async (tx) => {
    await tx.taskTemplate.update({
      where: { id: flag.templateId },
      data: { defaultEstimatedTime: flag.suggestedEstimate },
    });
    return tx.estimateFlag.update({
      where: { id },
      data: { status: "ACCEPTED", reviewedById: userId, reviewedAt: new Date() },
    });
  });

  return NextResponse.json({ data: updated });
}
