import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";
import {
  getValidAccessToken,
  createSharingLink,
  MsNotConnectedError,
  GraphApiError,
} from "@/lib/microsoft-graph";

const schema = z.object({
  itemId: z.string().min(1),
  type: z.enum(["view", "edit"]).default("view"),
  expirationHours: z.number().int().min(1).max(720).default(24),
});

// POST /api/drive/share
export const POST = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  try {
    const token = await getValidAccessToken(auth.orgId);
    const result = await createSharingLink(
      token,
      parsed.data.itemId,
      parsed.data.type,
      parsed.data.expirationHours,
    );
    return NextResponse.json({ data: result });
  } catch (err) {
    if (err instanceof MsNotConnectedError)
      return NextResponse.json({ error: err.message, code: "NOT_CONNECTED" }, { status: 424 });
    if (err instanceof GraphApiError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
});
