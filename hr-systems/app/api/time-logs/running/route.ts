import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";

export const GET = withContext(async (_req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const running = await prisma.timeLog.findFirst({
    where: {
      employeeId: auth.actorId,
      startTime: { not: null },
      endTime: null,
    },
    select: {
      id: true, startTime: true, taskId: true,
      task: {
        select: {
          id: true, code: true, title: true, taskType: true,
          estimatedTime: true, actualTimeTotal: true,
        },
      },
    },
    orderBy: { startTime: "desc" },
  });

  return NextResponse.json({ data: running });
});
