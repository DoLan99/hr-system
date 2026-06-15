import type { InboundMessage, OutboundReply } from "./types";

/**
 * Parse Microsoft Teams Bot Framework activity payload → InboundMessage
 * https://learn.microsoft.com/en-us/azure/bot-service/bot-activity-handler-concept
 */
export function parseTeamsPayload(body: unknown): InboundMessage | null {
  const b = body as Record<string, unknown>;
  if (b.type !== "message") return null;

  const from = b.from as Record<string, string> | undefined;
  const conversation = b.conversation as Record<string, string> | undefined;

  return {
    externalId: (b.id as string) ?? crypto.randomUUID(),
    externalThread: conversation?.id,
    senderName: from?.name ?? "Unknown",
    senderContact: from?.aadObjectId ?? from?.id,
    subject: `Teams: ${from?.name ?? "Unknown"}`,
    body: ((b.text as string) ?? "").trim(),
    channel: "OTHER", // Teams không có enum riêng, dùng OTHER
    rawPayload: body,
  };
}

/**
 * Gửi reply qua Teams Bot Framework (Incoming Webhook hoặc Bot connector)
 * Config cần: { webhookUrl: string }
 */
export async function sendTeamsReply(
  config: Record<string, string>,
  reply: OutboundReply,
): Promise<void> {
  const webhookUrl = config.webhookUrl;
  if (!webhookUrl) throw new Error("Teams webhookUrl chưa cấu hình");

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      text: reply.body,
    }),
  });

  if (!res.ok) throw new Error(`Teams reply failed: ${res.status}`);
}
