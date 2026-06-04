import { NextRequest, NextResponse } from "next/server";
import { parseDriveFileId, getDriveVideoInfo } from "@/lib/google-drive";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";

export const GET = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Thiếu param url" }, { status: 400 });

  const fileId = parseDriveFileId(url);
  if (!fileId) {
    return NextResponse.json({ error: "Không nhận dạng được link Google Drive" }, { status: 422 });
  }

  try {
    const info = await getDriveVideoInfo(fileId);
    return NextResponse.json({ data: info });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi khi gọi Drive API";
    return NextResponse.json({ error: message }, { status: 502 });
  }
});
