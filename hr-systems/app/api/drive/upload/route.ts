import { NextRequest, NextResponse } from "next/server";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";
import {
  getValidAccessToken,
  uploadSmallFile,
  MsNotConnectedError,
  GraphApiError,
} from "@/lib/microsoft-graph";

const MAX_SIZE = 4 * 1024 * 1024; // 4 MB

// POST /api/drive/upload — multipart form: file + parentId
export const POST = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const parentId = (formData.get("parentId") as string | null) ?? "root";

  if (!file) return NextResponse.json({ error: "Thiếu file" }, { status: 400 });
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File vượt quá 4MB" }, { status: 413 });
  }

  try {
    const token = await getValidAccessToken(auth.orgId);
    const buffer = await file.arrayBuffer();
    const item = await uploadSmallFile(token, parentId, file.name, buffer, file.type);
    return NextResponse.json({ data: item }, { status: 201 });
  } catch (err) {
    if (err instanceof MsNotConnectedError)
      return NextResponse.json({ error: err.message, code: "NOT_CONNECTED" }, { status: 424 });
    if (err instanceof GraphApiError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
});
