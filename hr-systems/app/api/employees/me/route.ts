import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidLocale } from "@/lib/i18n";
import { withContext } from "@/lib/with-context";
import { getActorId } from "@/lib/request-context";

export const PATCH = withContext(async (req: Request) => {
  const actorId = getActorId();
  if (!actorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { locale } = body;

  if (!isValidLocale(locale)) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }

  await prisma.employee.update({
    where: { id: actorId },
    data: { locale },
  });

  return NextResponse.json({ ok: true, locale });
});
