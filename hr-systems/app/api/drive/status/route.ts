import { NextResponse } from "next/server";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// GET /api/drive/status — kiểm tra org đã kết nối Microsoft chưa
export const GET = withContext(async () => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const token = await prisma.microsoftToken.findUnique({
    where: { organizationId: auth.orgId },
    select: { msUserEmail: true, msUserName: true, expiresAt: true, updatedAt: true },
  });

  return NextResponse.json({
    connected: !!token,
    account: token
      ? {
          email: token.msUserEmail,
          name: token.msUserName,
          expiresAt: token.expiresAt,
          lastSync: token.updatedAt,
        }
      : null,
  });
});
