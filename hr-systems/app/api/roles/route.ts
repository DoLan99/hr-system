import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";

export const GET = withContext(async (_req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const roles = await prisma.role.findMany({
    include: { _count: { select: { employees: true } } },
    orderBy: { id: "asc" },
  });

  return NextResponse.json({ data: roles });
});
