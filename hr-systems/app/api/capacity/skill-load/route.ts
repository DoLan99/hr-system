import { NextRequest, NextResponse } from "next/server";
import { withContext } from "@/lib/with-context";
import { requireManager } from "@/lib/api-auth";
import { computeSkillLoad } from "@/lib/capacity";

export const GET = withContext(async (_req: NextRequest) => {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;

  const result = await computeSkillLoad(auth.orgId);
  return NextResponse.json({ data: result });
});
