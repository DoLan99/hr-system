import { rawPrisma } from "@/lib/prisma";
import { parseUserAgent } from "@/lib/ua-parser";
import type { SessionLogoutReason } from "@prisma/client";

interface EnsureSessionInput {
  clerkSessionId: string;
  employeeId: number;
  organizationId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Ensure a UserSession row exists for the given Clerk sessionId.
 * Idempotent — no-op if already exists. Called on every authenticated
 * request through `withContext`, so first request after Clerk sign-in
 * creates the row, subsequent requests just touch `lastActivityAt`.
 */
export async function ensureUserSession(input: EnsureSessionInput): Promise<void> {
  const existing = await rawPrisma.userSession.findUnique({
    where: { id: input.clerkSessionId },
    select: { id: true },
  });
  if (existing) return;

  const ua = parseUserAgent(input.userAgent);
  try {
    await rawPrisma.userSession.create({
      data: {
        id: input.clerkSessionId,
        organizationId: input.organizationId,
        employeeId: input.employeeId,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        device: ua.device,
        browser: ua.browser,
        os: ua.os,
        loginMethod: "CLERK",
      },
    });
  } catch (err) {
    // Race condition: another concurrent request just created it. Ignore.
    if (!(err instanceof Error && err.message.includes("Unique constraint"))) {
      console.error("[user-session] ensureUserSession failed:", err);
    }
  }
}

export async function endSession(
  sessionId: string,
  reason: SessionLogoutReason = "MANUAL",
): Promise<void> {
  await rawPrisma.userSession.update({
    where: { id: sessionId },
    data: {
      logoutAt: new Date(),
      logoutReason: reason,
    },
  }).catch(() => {});
}

const TOUCH_INTERVAL_MS = 60_000;
const lastTouch = new Map<string, number>();

/**
 * Cập nhật lastActivityAt cho session (throttled, fire-and-forget).
 */
export async function touchActivity(sessionId: string): Promise<void> {
  const now = Date.now();
  const prev = lastTouch.get(sessionId) ?? 0;
  if (now - prev < TOUCH_INTERVAL_MS) return;
  lastTouch.set(sessionId, now);

  try {
    await rawPrisma.userSession.update({
      where: { id: sessionId },
      data: { lastActivityAt: new Date(now) },
    });
  } catch {
    lastTouch.delete(sessionId);
  }
}
