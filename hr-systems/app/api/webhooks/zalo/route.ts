import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { parseZaloPayload } from "@/lib/channels/zalo";
import { saveInboundMessage, findOrgByChannelSecret } from "@/lib/channels/dispatcher";

// GET /api/webhooks/zalo — Zalo OA verification (URL verification)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const challenge = searchParams.get("challenge") ?? "";
  return new Response(challenge, { status: 200 }); // Echo challenge
}

// POST /api/webhooks/zalo
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Tìm org bằng OA ID trong payload
  const oaId = (body as Record<string, string>)?.oa_id ?? "";
  const orgId = await findOrgByChannelSecret("ZALO", "oaId", oaId);

  if (!orgId) return NextResponse.json({ ok: true }); // Bỏ qua nếu không khớp org

  // Verify HMAC nếu có secret
  const rawBody = JSON.stringify(body);
  const signature = req.headers.get("x-zevent-signature") ?? "";
  // (Verification có thể thêm sau khi có app secret thực tế)
  void signature; void rawBody;

  const msg = parseZaloPayload(body);
  if (!msg) return NextResponse.json({ ok: true });

  await saveInboundMessage(orgId, msg);

  return NextResponse.json({ ok: true });
}
