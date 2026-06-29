import { NextRequest, NextResponse } from "next/server";
import { rawPrisma as prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";

export const GET = withContext(async () => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const org = await prisma.organization.findUnique({
    where: { id: auth.orgId },
    select: { workMode: true },
  });

  return NextResponse.json({ workMode: org?.workMode ?? "OFFLINE" });
});

export const PATCH = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;
  if (!auth.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { workMode } = body;

  if (!["ONLINE", "OFFLINE"].includes(workMode)) {
    return NextResponse.json({ error: "Invalid workMode" }, { status: 400 });
  }

  await prisma.organization.update({
    where: { id: auth.orgId },
    data: { workMode },
  });

  return NextResponse.json({ workMode });
});
