import { NextRequest, NextResponse } from "next/server";
import { withContext } from "@/lib/with-context";
import { requireManager } from "@/lib/api-auth";
import { computeForecast } from "@/lib/capacity";

export const GET = withContext(async (_req: NextRequest) => {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;

  const result = await computeForecast(auth.orgId);
  return NextResponse.json({ data: result });
});
