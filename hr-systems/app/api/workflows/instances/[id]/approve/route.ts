import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";
import { processApprovalAction } from "@/lib/workflow-engine";

const schema = z.object({ comment: z.string().optional() });

// POST /api/workflows/instances/[id]/approve
export const POST = withContext(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  // Kiểm tra instance thuộc org
  const instance = await prisma.workflowInstance.findFirst({
    where: { id: params.id, organizationId: auth.orgId },
    select: { id: true, status: true, currentStep: true, approvals: { select: { stepOrder: true, approverId: true, action: true } } },
  });
  if (!instance) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  if (instance.status !== "RUNNING")
    return NextResponse.json({ error: "Instance đã kết thúc" }, { status: 409 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);

  const result = await processApprovalAction({
    instanceId: params.id,
    actorId: auth.actorId,
    action: "APPROVED",
    comment: parsed.success ? parsed.data.comment : undefined,
  });

  return NextResponse.json({ data: result });
});
