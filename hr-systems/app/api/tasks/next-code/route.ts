import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const last = await prisma.task.findFirst({ orderBy: { id: "desc" }, select: { code: true } });
  const seq = last ? Number(last.code.replace("TSK-", "")) + 1 : 1;
  const code = `TSK-${String(seq).padStart(4, "0")}`;

  return NextResponse.json({ data: { code } });
}
