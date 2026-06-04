import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, MANAGER_ROLES } from "@/lib/api-auth";

const createSchema = z.object({
  ruleNo: z.number().int().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  effectiveDate: z.string().optional(),
});

export const GET = withContext(async (_req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const rules = await prisma.workRule.findMany({ orderBy: { ruleNo: "asc" } });
  return NextResponse.json({ data: rules });
});

export const POST = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const isManager = MANAGER_ROLES.includes(auth.roleName);
  if (!isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;
  const rule = await prisma.workRule.create({
    data: {
      ruleNo: d.ruleNo,
      title: d.title,
      description: d.description,
      effectiveDate: d.effectiveDate ? new Date(d.effectiveDate) : null,
    },
  });

  return NextResponse.json({ data: rule }, { status: 201 });
});
