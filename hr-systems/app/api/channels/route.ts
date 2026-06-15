import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, requireManager } from "@/lib/api-auth";

const upsertSchema = z.object({
  channel: z.enum(["EMAIL", "SLACK", "PHONE", "ZALO", "CHAT", "OTHER"]),
  config: z.record(z.string()),
  isActive: z.boolean().default(true),
});

// GET /api/channels — list integrations (config fields redacted for security)
export const GET = withContext(async () => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const integrations = await prisma.channelIntegration.findMany({
    where: { organizationId: auth.orgId },
    select: {
      id: true,
      channel: true,
      isActive: true,
      lastSyncAt: true,
      updatedAt: true,
      // Không trả về config đầy đủ (có token/secret) — chỉ trả keys
      config: true,
    },
    orderBy: { channel: "asc" },
  });

  // Redact sensitive values, chỉ hiện tên key
  const safe = integrations.map((i) => ({
    ...i,
    config: Object.fromEntries(
      Object.keys(i.config as object).map((k) => [k, "***"]),
    ),
  }));

  return NextResponse.json({ data: safe });
});

// POST /api/channels — upsert integration config
export const POST = withContext(async (req: NextRequest) => {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;

  const parsed = upsertSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { channel, config, isActive } = parsed.data;

  const integration = await prisma.channelIntegration.upsert({
    where: { organizationId_channel: { organizationId: auth.orgId, channel } },
    create: { organizationId: auth.orgId, channel, config, isActive },
    update: { config, isActive, updatedAt: new Date() },
    select: { id: true, channel: true, isActive: true, updatedAt: true },
  });

  return NextResponse.json({ data: integration });
});

// DELETE /api/channels?channel=ZALO
export const DELETE = withContext(async (req: NextRequest) => {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;

  const channel = new URL(req.url).searchParams.get("channel");
  if (!channel) return NextResponse.json({ error: "Thiếu channel" }, { status: 400 });

  await prisma.channelIntegration.deleteMany({
    where: { organizationId: auth.orgId, channel: channel as never },
  });

  return NextResponse.json({ ok: true });
});
