export type InboundMessage = {
  externalId: string;
  externalThread?: string;
  senderName: string;
  senderContact?: string;
  subject?: string;
  body: string;
  channel: "EMAIL" | "SLACK" | "ZALO" | "CHAT" | "OTHER";
  rawPayload: unknown;
  attachments?: { name: string; url: string; size?: number; mimeType?: string }[];
};

export type OutboundReply = {
  body: string;
  threadId?: string;
  recipientContact?: string;
};
