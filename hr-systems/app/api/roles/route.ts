import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";

export const GET = withContext(async (_req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const roles = await prisma.role.findMany({
    where: { organizationId: auth.orgId },
    include: { _count: { select: { employees: true } } },
    orderBy: [{ seniority: "asc" }, { label: "asc" }],
  });

  return NextResponse.json({ data: roles });
});

import { z } from "zod";

const createSchema = z.object({
  label: z.string().min(1),
  description: z.string().optional(),
  color: z.string().optional(),
  seniority: z.number().int().min(0).optional(),
});

export const POST = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;
  if (!auth.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;
  const slug = d.label.trim().toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "");
  const name = slug || "ROLE_" + Date.now();

  const role = await prisma.role.create({
    data: {
      organizationId: auth.orgId,
      name,
      label: d.label.trim(),
      description: d.description,
      color: d.color,
      seniority: d.seniority ?? 0,
      permissions: {},
    },
    include: { _count: { select: { employees: true } } },
  });

  return NextResponse.json({ data: role }, { status: 201 });
});
