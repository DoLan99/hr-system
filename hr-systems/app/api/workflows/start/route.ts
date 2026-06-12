import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";
import { triggerWorkflow } from "@/lib/workflow-engine";

const schema = z.object({
  targetType: z.enum(["LEAVE", "DOCUMENT", "PURCHASE", "TIMELOG", "CUSTOM"]),
  targetId: z.string().min(1),
});

// POST /api/workflows/start
export const POST = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const instanceId = await triggerWorkflow({
    orgId: auth.orgId,
    targetType: parsed.data.targetType,
    targetId: parsed.data.targetId,
    initiatorId: auth.actorId,
  });

  if (!instanceId) {
    return NextResponse.json(
      { data: null, message: "Không có workflow template cho loại này" },
      { status: 200 },
    );
  }

  return NextResponse.json({ data: { instanceId } }, { status: 201 });
});
