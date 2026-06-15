import { prisma } from "@/lib/prisma";
import type { InboundMessage } from "./types";
import type { MessageChannel } from "@prisma/client";

/**
 * Lưu tin nhắn inbound vào DB.
 * Tự động tìm orgId từ ChannelIntegration nếu không truyền vào.
 */
export async function saveInboundMessage(
  orgId: string,
  msg: InboundMessage,
): Promise<number> {
  const channel = (msg.channel as MessageChannel) ?? "OTHER";

  const created = await prisma.message.create({
    data: {
      organizationId: orgId,
      date: new Date(),
      channel,
      subject: msg.subject,
      messageSummary: msg.body.slice(0, 500),
      senderName: msg.senderName,
      senderContact: msg.senderContact,
      externalId: msg.externalId,
      externalThread: msg.externalThread,
      rawPayload: msg.rawPayload ? (msg.rawPayload as object) : undefined,
      status: "OPEN",
      netTime: 0,
      attachments: msg.attachments?.length
        ? { create: msg.attachments }
        : undefined,
    },
  });

  return created.id;
}

/**
 * Lấy config của một kênh cho org cụ thể.
 */
export async function getChannelConfig(
  orgId: string,
  channel: MessageChannel,
): Promise<Record<string, string> | null> {
  const integration = await prisma.channelIntegration.findUnique({
    where: { organizationId_channel: { organizationId: orgId, channel } },
    select: { config: true, isActive: true },
  });
  if (!integration?.isActive) return null;
  return integration.config as Record<string, string>;
}

/**
 * Tìm orgId từ một secret/token trong config (dùng cho webhook inbound không biết org trước).
 */
export async function findOrgByChannelSecret(
  channel: MessageChannel,
  secretKey: string,
  secretValue: string,
): Promise<string | null> {
  const integrations = await prisma.channelIntegration.findMany({
    where: { channel, isActive: true },
    select: { organizationId: true, config: true },
  });

  for (const i of integrations) {
    const cfg = i.config as Record<string, string>;
    if (cfg[secretKey] === secretValue) return i.organizationId;
  }
  return null;
}
