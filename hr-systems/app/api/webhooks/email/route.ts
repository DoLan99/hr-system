import { NextRequest, NextResponse } from "next/server";
import { parseEmailPayload } from "@/lib/channels/email";
import { saveInboundMessage } from "@/lib/channels/dispatcher";
import { prisma } from "@/lib/prisma";

// POST /api/webhooks/email
// Microsoft Graph change notification cho Mail
// https://learn.microsoft.com/en-us/graph/change-notifications-overview
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Microsoft gửi validationToken khi đăng ký subscription
  const validationToken = searchParams.get("validationToken");
  if (validationToken) {
    return new Response(validationToken, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  let body: { value?: unknown[] } & Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const notifications = body.value ?? [];

  for (const notification of notifications) {
    const n = notification as Record<string, unknown>;
    const clientState = n.clientState as string | undefined;
    if (!clientState) continue;

    // clientState = orgId (set khi đăng ký subscription)
    const orgId = clientState;
    const orgExists = await prisma.organization.findUnique({ where: { id: orgId }, select: { id: true } });
    if (!orgExists) continue;

    // resourceData chứa mail item
    const resourceData = n.resourceData as Record<string, unknown> | undefined;
    if (!resourceData) continue;

    const msg = parseEmailPayload(resourceData);
    if (!msg) continue;

    await saveInboundMessage(orgId, msg);
  }

  // Graph yêu cầu 202 Accepted
  return new Response(null, { status: 202 });
}
