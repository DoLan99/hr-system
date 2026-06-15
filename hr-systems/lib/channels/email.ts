import type { InboundMessage, OutboundReply } from "./types";
import { getValidAccessToken } from "@/lib/microsoft-graph";

/**
 * Parse Microsoft Graph mail notification → InboundMessage
 * Change notification payload: https://learn.microsoft.com/en-us/graph/change-notifications-overview
 */
export function parseEmailPayload(mailItem: unknown): InboundMessage | null {
  const m = mailItem as Record<string, unknown>;

  const from = m.from as { emailAddress?: { name?: string; address?: string } } | undefined;
  const subject = (m.subject as string) ?? "(Không có tiêu đề)";
  const body = (m.bodyPreview as string) ?? "";
  const id = (m.id as string) ?? crypto.randomUUID();
  const conversationId = m.conversationId as string | undefined;

  return {
    externalId: id,
    externalThread: conversationId,
    senderName: from?.emailAddress?.name ?? from?.emailAddress?.address ?? "Unknown",
    senderContact: from?.emailAddress?.address,
    subject,
    body,
    channel: "EMAIL",
    rawPayload: mailItem,
  };
}

/**
 * Gửi email reply qua Microsoft Graph sendMail API
 */
export async function sendEmailReply(
  orgId: string,
  reply: OutboundReply & { subject?: string },
): Promise<void> {
  if (!reply.recipientContact) throw new Error("Không có địa chỉ email để reply");

  const accessToken = await getValidAccessToken(orgId);

  const res = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        subject: reply.subject ?? "Re: (HR System Reply)",
        body: { contentType: "Text", content: reply.body },
        toRecipients: [{ emailAddress: { address: reply.recipientContact } }],
      },
    }),
  });

  if (!res.ok) throw new Error(`Email reply failed: ${res.status} ${await res.text()}`);
}
