import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ADMIN_ROLES, SUB_MANAGER_ROLES } from "@/lib/managed-scope";

const include = {
  template: { select: { id: true, code: true, title: true } },
  reviewedBy: { select: { id: true, fullName: true } },
} as const;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userRole = session.user.role;
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
}
