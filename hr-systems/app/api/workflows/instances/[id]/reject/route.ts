import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";
import { processApprovalAction } from "@/lib/workflow-engine";

const schema = z.object({ comment: z.string().min(1, "Vui lòng nhập lý do từ chối") });

// POST /api/workflows/instances/[id]/reject
export const POST = withContext(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const instance = await prisma.workflowInstance.findFirst({
    where: { id: params.id, organizationId: auth.orgId },
    select: { id: true, status: true },
  });
  if (!instance) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  if (instance.status !== "RUNNING")
    return NextResponse.json({ error: "Instance đã kết thúc" }, { status: 409 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const result = await processApprovalAction({
    instanceId: params.id,
    actorId: auth.actorId,
    action: "REJECTED",
    comment: parsed.data.comment,
  });

  return NextResponse.json({ data: result });
});
