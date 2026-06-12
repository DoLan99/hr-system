import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";
import {
  getValidAccessToken,
  createFolder,
  MsNotConnectedError,
  GraphApiError,
} from "@/lib/microsoft-graph";

const schema = z.object({
  name: z.string().min(1).max(255),
  parentId: z.string().default("root"),
});

// POST /api/drive/folders
export const POST = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  try {
    const token = await getValidAccessToken(auth.orgId);
    const folder = await createFolder(token, parsed.data.parentId, parsed.data.name);
    return NextResponse.json({ data: folder }, { status: 201 });
  } catch (err) {
    if (err instanceof MsNotConnectedError)
      return NextResponse.json({ error: err.message, code: "NOT_CONNECTED" }, { status: 424 });
    if (err instanceof GraphApiError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
});
