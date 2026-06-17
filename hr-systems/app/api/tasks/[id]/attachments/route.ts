import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";

export const GET = withContext(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const taskId = Number(params.id);
  const attachments = await prisma.taskAttachment.findMany({
    where: { taskId },
    include: { uploadedBy: { select: { id: true, fullName: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: attachments });
});

export const POST = withContext(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const taskId = Number(params.id);
  const body = await req.json();

  if (!body.fileName || !body.fileUrl) {
    return NextResponse.json({ error: "fileName and fileUrl required" }, { status: 400 });
  }

  const attachment = await prisma.taskAttachment.create({
    data: {
      taskId,
      uploadedById: auth.actorId,
      fileName: body.fileName,
      fileUrl: body.fileUrl,
      fileSize: body.fileSize ?? null,
      mimeType: body.mimeType ?? null,
      driveItemId: body.driveItemId ?? null,
    },
    include: { uploadedBy: { select: { id: true, fullName: true } } },
  });

  return NextResponse.json({ data: attachment }, { status: 201 });
});
