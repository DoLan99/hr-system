import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";

export const PATCH = withContext(async (req: NextRequest, { params }: { params: { id: string; itemId: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const itemId = Number(params.itemId);
  const body = await req.json();

  const item = await prisma.taskChecklistItem.update({
    where: { id: itemId },
    data: {
      ...(body.content !== undefined && { content: body.content.trim() }),
      ...(body.checked !== undefined && { checked: body.checked }),
      ...(body.order !== undefined && { order: body.order }),
    },
  });

  return NextResponse.json({ data: item });
});

export const DELETE = withContext(async (_req: NextRequest, { params }: { params: { id: string; itemId: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const itemId = Number(params.itemId);
  await prisma.taskChecklistItem.delete({ where: { id: itemId } });

  return NextResponse.json({ ok: true });
});
