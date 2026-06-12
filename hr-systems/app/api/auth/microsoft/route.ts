import { NextRequest, NextResponse } from "next/server";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";
import { getMsAuthUrl } from "@/lib/microsoft-graph";

// GET /api/auth/microsoft — redirect sang Azure AD login
export const GET = withContext(async (_req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  // state = orgId (verify lại ở callback)
  const state = Buffer.from(auth.orgId).toString("base64url");
  const authUrl = getMsAuthUrl(state);

  return NextResponse.redirect(authUrl);
});
