import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken, saveToken } from "@/lib/microsoft-graph";

// Callback này KHÔNG wrap withContext vì Azure redirect thẳng vào đây
// (không có Clerk session header từ browser lúc này)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDesc = searchParams.get("error_description");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3003";

  if (error) {
    return NextResponse.redirect(
      `${appUrl}/settings?ms_error=${encodeURIComponent(errorDesc ?? error)}`,
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/settings?ms_error=missing_params`);
  }

  let orgId: string;
  try {
    orgId = Buffer.from(state, "base64url").toString("utf8");
  } catch {
    return NextResponse.redirect(`${appUrl}/settings?ms_error=invalid_state`);
  }

  try {
    const token = await exchangeCodeForToken(code);
    await saveToken(orgId, token);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.redirect(
      `${appUrl}/settings?ms_error=${encodeURIComponent(msg)}`,
    );
  }

  return NextResponse.redirect(`${appUrl}/settings?ms_connected=1`);
}
