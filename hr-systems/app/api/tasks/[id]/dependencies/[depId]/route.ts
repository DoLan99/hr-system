import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";

export const DELETE = withContext(async (_req: NextRequest, { params }: { params: { id: string; depId: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const id = Number(params.depId);
  await prisma.taskDependency.delete({ where: { id } });

  return NextResponse.json({ ok: true });
});
