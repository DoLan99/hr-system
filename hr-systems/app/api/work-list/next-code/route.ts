import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("prefix") ?? "TASK";
  const prefix = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);

  const existing = await prisma.workList.findMany({
    where: { taskCode: { startsWith: `${prefix}-` } },
    select: { taskCode: true },
  });

  const maxNum = existing.reduce((max, item) => {
    const match = item.taskCode?.match(/-(\d+)$/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);

  return NextResponse.json({ code: `${prefix}-${String(maxNum + 1).padStart(3, "0")}` });
}
