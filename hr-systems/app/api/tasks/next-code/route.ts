import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";

export const GET = withContext(async () => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const last = await prisma.task.findFirst({ orderBy: { id: "desc" }, select: { code: true } });
  const seq = last ? Number(last.code.replace("TSK-", "")) + 1 : 1;
  const code = `TSK-${String(seq).padStart(4, "0")}`;

  return NextResponse.json({ data: { code } });
});
