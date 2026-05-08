// TEMPORARY – delete this file after calling POST /api/migrate once
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.$executeRaw`ALTER TABLE "public"."work_list" ALTER COLUMN "assignedToId" DROP NOT NULL`;
  return NextResponse.json({ ok: true, message: "assignedToId is now nullable. Please delete app/api/migrate/route.ts" });
}
