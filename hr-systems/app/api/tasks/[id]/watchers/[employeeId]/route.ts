import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";

export const DELETE = withContext(async (_req: NextRequest, { params }: { params: { id: string; employeeId: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const taskId = Number(params.id);
  const employeeId = Number(params.employeeId);

  // Only allow unwatch own account (or manager can remove others)
  if (employeeId !== auth.actorId && !auth.isManager) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.taskWatcher.deleteMany({ where: { taskId, employeeId } });

  return NextResponse.json({ ok: true });
});
