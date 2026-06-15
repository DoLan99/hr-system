import type { InboundMessage, OutboundReply } from "./types";

/**
 * Parse Zalo OA webhook payload → InboundMessage
 * https://developers.zalo.me/docs/official-account/webhook
 */
export function parseZaloPayload(body: unknown): InboundMessage | null {
  const b = body as Record<string, unknown>;
  if (b.event_name !== "user_send_text" && b.event_name !== "user_send_image") return null;

  const sender = b.sender as Record<string, string> | undefined;
  const message = b.message as Record<string, string> | undefined;

  return {
    externalId: (message?.msg_id as string) ?? crypto.randomUUID(),
    externalThread: sender?.id,
    senderName: (b.follower as Record<string, string>)?.display_name ?? sender?.id ?? "Zalo User",
    senderContact: sender?.id,
    subject: `Zalo: ${(b.follower as Record<string, string>)?.display_name ?? "Unknown"}`,
    body: (message?.text as string) ?? "[Hình ảnh]",
    channel: "ZALO",
    rawPayload: body,
  };
}

/**
 * Gửi tin nhắn trả lời qua Zalo OA API
 * Config cần: { accessToken: string }
 */
export async function sendZaloReply(
  config: Record<string, string>,
  reply: OutboundReply,
): Promise<void> {
  const accessToken = config.accessToken;
  if (!accessToken) throw new Error("Zalo accessToken chưa cấu hình");
  if (!reply.recipientContact) throw new Error("Không có Zalo user ID để reply");

  const res = await fetch("https://openapi.zalo.me/v2.0/oa/message/cs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      access_token: accessToken,
    },
    body: JSON.stringify({
      recipient: { user_id: reply.recipientContact },
      message: { text: reply.body },
    }),
  });

  if (!res.ok) throw new Error(`Zalo reply failed: ${res.status}`);
  const json = await res.json();
  if (json.error !== 0) throw new Error(`Zalo error: ${json.message}`);
}
