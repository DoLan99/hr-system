import { NextRequest, NextResponse } from "next/server";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, ADMIN_ROLES } from "@/lib/api-auth";
import {
  getValidAccessToken,
  getDriveItem,
  deleteDriveItem,
  MsNotConnectedError,
  GraphApiError,
} from "@/lib/microsoft-graph";

// GET /api/drive/files/[id] — lấy metadata + download URL
export const GET = withContext(async (
  _req: NextRequest,
  { params }: { params: { id: string } },
) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const { id } = params;

  try {
    const token = await getValidAccessToken(auth.orgId);
    const item = await getDriveItem(token, id);
    return NextResponse.json({ data: item });
  } catch (err) {
    if (err instanceof MsNotConnectedError)
      return NextResponse.json({ error: err.message, code: "NOT_CONNECTED" }, { status: 424 });
    if (err instanceof GraphApiError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
});

// DELETE /api/drive/files/[id] — chỉ ADMIN/MANAGER
export const DELETE = withContext(async (
  _req: NextRequest,
  { params }: { params: { id: string } },
) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;
  if (!ADMIN_ROLES.includes(auth.roleName))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = params;

  try {
    const token = await getValidAccessToken(auth.orgId);
    await deleteDriveItem(token, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof MsNotConnectedError)
      return NextResponse.json({ error: err.message, code: "NOT_CONNECTED" }, { status: 424 });
    if (err instanceof GraphApiError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
});
