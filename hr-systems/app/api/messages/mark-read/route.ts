import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";

export const POST = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const messageIds: number[] = Array.isArray(body.messageIds) ? body.messageIds : [];
  if (messageIds.length === 0) return NextResponse.json({ ok: true });

  await prisma.message.updateMany({
    where: {
      id: { in: messageIds },
      organizationId: auth.orgId,
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true });
});
