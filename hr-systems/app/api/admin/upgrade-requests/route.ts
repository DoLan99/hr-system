import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { getAdminSession } from "@/lib/admin-auth";

export const GET = withContext(async () => {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["SUPER_ADMIN", "SUPPORT", "FINANCE"].includes(session.type))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const requests = await prisma.upgradeRequest.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ data: requests });
});
