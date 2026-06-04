import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, MANAGER_ROLES } from "@/lib/api-auth";

const schema = z.object({
  employeeId: z.coerce.number().int(),
  months: z.coerce.number().int().min(1).max(24).default(6),
  endMonth: z.coerce.number().int().min(1).max(12).optional(),
  endYear: z.coerce.number().int().min(2020).optional(),
});

export const GET = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const parsed = schema.safeParse({
    employeeId: url.searchParams.get("employeeId"),
    months: url.searchParams.get("months") ?? undefined,
    endMonth: url.searchParams.get("endMonth") ?? undefined,
    endYear: url.searchParams.get("endYear") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { employeeId, months } = parsed.data;
  const isManager = MANAGER_ROLES.includes(auth.roleName);
  if (!isManager && employeeId !== auth.actorId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const endMonth = parsed.data.endMonth ?? now.getMonth() + 1;
  const endYear = parsed.data.endYear ?? now.getFullYear();

  const periods: { month: number; year: number }[] = [];
  let m = endMonth, y = endYear;
  for (let i = 0; i < months; i++) {
    periods.unshift({ month: m, year: y });
    m -= 1;
    if (m === 0) { m = 12; y -= 1; }
  }

  const earliestStart = new Date(periods[0].year, periods[0].month - 1, 1);
  const summaries = await prisma.salarySummary.findMany({
    where: {
      organizationId: auth.orgId,
      employeeId,
      OR: periods.map(p => ({ month: p.month, year: p.year })),
    },
    select: {
      month: true, year: true,
      scoreWorkSpeed: true, scoreQuality: true,
      scoreLearning: true, scoreDeadlines: true, scoreInitiative: true,
      totalScore: true, completionRate: true, creditedHours: true,
    },
  });

  void earliestStart;

  const byKey = new Map(summaries.map(s => [`${s.year}-${s.month}`, s]));
  const series = periods.map(p => {
    const s = byKey.get(`${p.year}-${p.month}`);
    const num = (v: any) => (v == null ? null : Number(v));
    return {
      month: p.month,
      year: p.year,
      label: `${String(p.month).padStart(2, "0")}/${String(p.year).slice(2)}`,
      scoreWorkSpeed: num(s?.scoreWorkSpeed),
      scoreQuality: num(s?.scoreQuality),
      scoreLearning: num(s?.scoreLearning),
      scoreDeadlines: num(s?.scoreDeadlines),
      scoreInitiative: num(s?.scoreInitiative),
      totalScore: num(s?.totalScore),
      completionRate: num(s?.completionRate),
      creditedHours: num(s?.creditedHours),
    };
  });

  return NextResponse.json({ data: series });
});
