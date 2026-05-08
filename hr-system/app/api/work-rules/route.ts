import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];

const createSchema = z.object({
  ruleNo: z.number().int().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  effectiveDate: z.string().optional(),
});

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rules = await prisma.workRule.findMany({ orderBy: { ruleNo: "asc" } });
  return NextResponse.json({ data: rules });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isManager = MANAGER_ROLES.includes((session.user as any).role);
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
}
