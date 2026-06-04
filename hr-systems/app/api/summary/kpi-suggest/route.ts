import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, MANAGER_ROLES } from "@/lib/api-auth";
import { computeKpiSuggestion } from "@/lib/kpi";

const schema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020),
  employeeId: z.coerce.number().int(),
});

export const GET = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const parsed = schema.safeParse({
    month: url.searchParams.get("month"),
    year: url.searchParams.get("year"),
    employeeId: url.searchParams.get("employeeId"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { month, year, employeeId } = parsed.data;

  const isManager = MANAGER_ROLES.includes(auth.roleName);
  if (!isManager && employeeId !== auth.actorId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const suggestion = await computeKpiSuggestion(auth.orgId, employeeId, month, year);
  return NextResponse.json({ data: suggestion });
});
