import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, MANAGER_ROLES } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

type Ctx = { params: { id: string } };

// DELETE /api/documents/[id]
export const DELETE = withContext(async (req: NextRequest, ctx: Ctx) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const doc = await prisma.systemDocument.findUnique({
    where: { id: ctx.params.id },
  });
  if (!doc) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  if (doc.organizationId !== auth.orgId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Only manager+ or the uploader can delete
  if (!MANAGER_ROLES.includes(auth.roleName) && doc.uploadedById !== auth.actorId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Remove file from disk
  try {
    const filePath = path.join(process.cwd(), "public", "uploads", "documents", doc.fileKey);
    await unlink(filePath);
  } catch {
    // File may not exist — proceed
  }

  await prisma.systemDocument.delete({ where: { id: ctx.params.id } });

  return NextResponse.json({ ok: true });
});
