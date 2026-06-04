import { NextRequest, NextResponse } from "next/server";
import { withContext } from "@/lib/with-context";
import { ADMIN_ROLES } from "@/lib/managed-scope";
import { runAnomalyDetection } from "@/lib/anomaly-detection";
import { requireApiAuth } from "@/lib/api-auth";

export const POST = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;
  if (!ADMIN_ROLES.includes(auth.roleName)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const hours = Math.min(168, Math.max(1, Number(searchParams.get("hours") ?? "24")));

  const result = await runAnomalyDetection(hours);
  return NextResponse.json({ data: result });
});
