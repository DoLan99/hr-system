import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";

// POST /api/workflows/instances/[id]/cancel — chỉ người tạo hoặc manager
export const POST = withContext(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const instance = await prisma.workflowInstance.findFirst({
    where: { id: params.id, organizationId: auth.orgId },
    select: { id: true, status: true, initiatorId: true },
  });
  if (!instance) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  if (instance.status !== "RUNNING")
    return NextResponse.json({ error: "Instance đã kết thúc" }, { status: 409 });

  if (instance.initiatorId !== auth.actorId && !auth.isManager) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.workflowInstance.update({
    where: { id: params.id },
    data: { status: "CANCELLED", completedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
});
