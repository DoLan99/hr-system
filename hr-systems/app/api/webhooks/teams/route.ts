import { NextRequest, NextResponse } from "next/server";
import { parseTeamsPayload } from "@/lib/channels/teams";
import { saveInboundMessage, findOrgByChannelSecret } from "@/lib/channels/dispatcher";

// POST /api/webhooks/teams
// Nhận activity từ Microsoft Teams Bot Framework
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Teams gửi Authorization header với Bearer token
  // Trong production cần verify JWT signature từ Microsoft
  // Hiện tại: tìm org bằng secret header X-Teams-Org
  const orgSecret = req.headers.get("x-teams-org") ?? "";
  const orgId = await findOrgByChannelSecret("OTHER", "teamsOrgSecret", orgSecret);

  if (!orgId) {
    return NextResponse.json({ error: "Unknown org" }, { status: 200 }); // Trả 200 để Teams không retry
  }

  const msg = parseTeamsPayload(body);
  if (!msg) return NextResponse.json({ ok: true }); // Non-message activity

  await saveInboundMessage(orgId, msg);

  return NextResponse.json({ ok: true });
}
