import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";

export const DELETE = withContext(async (_req: NextRequest, { params }: { params: { id: string; attachmentId: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const id = Number(params.attachmentId);
  const att = await prisma.taskAttachment.findUnique({ where: { id } });
  if (!att) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only uploader or manager can delete
  if (att.uploadedById !== auth.actorId && !auth.isManager) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.taskAttachment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
