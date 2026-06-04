import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireManager } from "@/lib/api-auth";

export const DELETE = withContext(async (
  _req: NextRequest,
  { params }: { params: { id: string } },
) => {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;

  const id = Number(params.id);
  const existing = await prisma.roleSkillRequirement.findFirst({
    where: { id, organizationId: auth.orgId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.roleSkillRequirement.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
