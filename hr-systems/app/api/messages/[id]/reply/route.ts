import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";
import { getChannelConfig } from "@/lib/channels/dispatcher";
import { sendTeamsReply } from "@/lib/channels/teams";
import { sendZaloReply } from "@/lib/channels/zalo";
import { sendEmailReply } from "@/lib/channels/email";
import type { MessageChannel } from "@prisma/client";

const schema = z.object({ body: z.string().min(1) });

// POST /api/messages/[id]/reply
export const POST = withContext(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const message = await prisma.message.findFirst({
    where: { id: Number(params.id), organizationId: auth.orgId },
    select: {
      id: true,
      channel: true,
      senderContact: true,
      externalThread: true,
      subject: true,
    },
  });
  if (!message) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const replyBody = parsed.data.body;
  const channel = message.channel as MessageChannel | null;

  // Look up the original to find the "other party" employee for assignedToId
  const original = await prisma.message.findFirst({
    where: { id: Number(params.id), organizationId: auth.orgId },
    select: { assignedToId: true, senderEmployeeId: true, customerId: true },
  });
  // For internal team chats, route the reply back to the other party
  let replyAssignedToId: number | undefined;
  if (original && !original.customerId) {
    if (original.senderEmployeeId && original.senderEmployeeId !== auth.actorId) {
      replyAssignedToId = original.senderEmployeeId;
    } else if (original.assignedToId && original.assignedToId !== auth.actorId) {
      replyAssignedToId = original.assignedToId;
    }
  }

  // Lưu reply vào DB trước
  const reply = await prisma.message.create({
    data: {
      organizationId: auth.orgId,
      date: new Date(),
      channel: channel ?? "CHAT",
      subject: message.subject ? `Re: ${message.subject}` : "Reply",
      messageSummary: replyBody.slice(0, 500),
      replyToId: message.id,
      externalThread: message.externalThread,
      senderEmployeeId: auth.actorId,
      assignedToId: replyAssignedToId,
      status: "CLOSED",
      netTime: 0,
    },
  });

  // Gửi ra kênh gốc nếu có config
  let sendError: string | null = null;
  if (channel && message.senderContact) {
    try {
      const config = await getChannelConfig(auth.orgId, channel);

      if (config) {
        const outbound = {
          body: replyBody,
          threadId: message.externalThread ?? undefined,
          recipientContact: message.senderContact,
          subject: message.subject ? `Re: ${message.subject}` : undefined,
        };

        if (channel === "OTHER") {
          // Teams
          await sendTeamsReply(config, outbound);
        } else if (channel === "ZALO") {
          await sendZaloReply(config, outbound);
        } else if (channel === "EMAIL") {
          await sendEmailReply(auth.orgId, outbound);
        }
      }
    } catch (err) {
      sendError = err instanceof Error ? err.message : String(err);
    }
  }

  return NextResponse.json({
    data: reply,
    ...(sendError ? { warning: `Lưu OK nhưng gửi ra kênh thất bại: ${sendError}` } : {}),
  }, { status: 201 });
});
