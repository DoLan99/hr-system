import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { getAdminSession } from "@/lib/admin-auth";

export const GET = withContext(async () => {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plans = await prisma.planConfig.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ data: plans });
});
