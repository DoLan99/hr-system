import { NextRequest, NextResponse } from "next/server";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, MANAGER_ROLES } from "@/lib/api-auth";
import { computeCareerPath } from "@/lib/skills";

export const GET = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const isManager = MANAGER_ROLES.includes(auth.roleName);
  const url = new URL(req.url);
  const employeeIdParam = url.searchParams.get("employeeId");
  const employeeId = employeeIdParam ? Number(employeeIdParam) : auth.actorId;

  if (!isManager && employeeId !== auth.actorId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await computeCareerPath(auth.orgId, employeeId);
  return NextResponse.json({ data: result ?? null });
});
