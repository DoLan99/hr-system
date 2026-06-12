import { NextResponse } from "next/server";
import { withContext } from "@/lib/with-context";
import { requireManager } from "@/lib/api-auth";
import { disconnectToken } from "@/lib/microsoft-graph";

// DELETE /api/drive/disconnect — chỉ Manager/Admin mới được ngắt kết nối
export const DELETE = withContext(async () => {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;

  await disconnectToken(auth.orgId);
  return NextResponse.json({ ok: true });
});
