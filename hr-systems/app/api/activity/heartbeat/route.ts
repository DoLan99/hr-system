import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";
import { getRequestContext } from "@/lib/request-context";
import { applyActivityDelta } from "@/lib/activity";

const pageViewSchema = z.object({
  path: z.string().min(1).max(500),
  durationSec: z.number().int().min(0).max(86400),
});

const heartbeatSchema = z.object({
  activeSeconds: z.number().int().min(0).max(3600),
  idleSeconds: z.number().int().min(0).max(3600),
  pageViews: z.array(pageViewSchema).max(100).default([]),
});

export const POST = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const ctx = getRequestContext();
  const sessionId = ctx?.sessionId;
  if (!sessionId) {
    return NextResponse.json({ skipped: true, reason: "no-session-id" });
  }

  const body = await req.json().catch(() => null);
  const parsed = heartbeatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const now = new Date();
  try {
    await applyActivityDelta({
      employeeId: auth.actorId,
      organizationId: auth.orgId,
      sessionId,
      date: now,
      activeSeconds: parsed.data.activeSeconds,
      idleSeconds: parsed.data.idleSeconds,
      pageViews: parsed.data.pageViews,
      occurredAt: now,
    });
  } catch (err) {
    console.error("[activity/heartbeat] failed:", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
});
