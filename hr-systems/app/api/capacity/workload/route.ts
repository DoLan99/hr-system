import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withContext } from "@/lib/with-context";
import { requireManager } from "@/lib/api-auth";
import { computeWorkload } from "@/lib/capacity";

const schema = z.object({
  startDate: z.string().optional(),
  days: z.coerce.number().int().min(1).max(60).default(14),
});

export const GET = withContext(async (req: NextRequest) => {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const parsed = schema.safeParse({
    startDate: url.searchParams.get("startDate") ?? undefined,
    days: url.searchParams.get("days") ?? undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const startDate = parsed.data.startDate ? new Date(parsed.data.startDate) : undefined;
  const result = await computeWorkload(auth.orgId, { startDate, days: parsed.data.days });
  return NextResponse.json({ data: result });
});
