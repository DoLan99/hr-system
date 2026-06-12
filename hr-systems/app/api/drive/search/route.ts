import { NextRequest, NextResponse } from "next/server";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";
import {
  getValidAccessToken,
  searchDriveItems,
  MsNotConnectedError,
  GraphApiError,
} from "@/lib/microsoft-graph";

// GET /api/drive/search?q=keyword
export const GET = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const q = new URL(req.url).searchParams.get("q") ?? "";
  if (q.trim().length < 2) {
    return NextResponse.json({ data: [] });
  }

  try {
    const token = await getValidAccessToken(auth.orgId);
    const items = await searchDriveItems(token, q);
    return NextResponse.json({ data: items });
  } catch (err) {
    if (err instanceof MsNotConnectedError)
      return NextResponse.json({ error: err.message, code: "NOT_CONNECTED" }, { status: 424 });
    if (err instanceof GraphApiError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
});
