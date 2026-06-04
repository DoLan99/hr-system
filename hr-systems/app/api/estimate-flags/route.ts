import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ADMIN_ROLES, SUB_MANAGER_ROLES } from "@/lib/managed-scope";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";

const include = {
  template: { select: { id: true, code: true, title: true } },
  reviewedBy: { select: { id: true, fullName: true } },
} as const;

export const GET = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const userRole = auth.roleName;
  const canRead = ADMIN_ROLES.includes(userRole) || SUB_MANAGER_ROLES.includes(userRole);
  if (!canRead) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "open";

  const where: any = {};
  if (status !== "all") where.status = status.toUpperCase();

  const items = await prisma.estimateFlag.findMany({
    where,
    include,
    orderBy: [{ flaggedAt: "desc" }],
  });

  return NextResponse.json({ data: items });
});
