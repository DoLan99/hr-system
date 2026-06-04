import { auth } from "@clerk/nextjs/server";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { rawPrisma } from "@/lib/prisma";
import { runWithContext, type RequestContext } from "@/lib/request-context";
import { writeApiAccessLog } from "@/lib/api-access-log";
import { ensureUserSession, touchActivity } from "@/lib/user-session";

type RouteContext = { params?: Record<string, string | string[]> };
type RouteHandler<TReq extends Request = Request, TCtx extends RouteContext = RouteContext> = (
  req: TReq,
  ctx: TCtx,
) => Promise<Response> | Response;

export function withContext<TReq extends Request, TCtx extends RouteContext>(
  handler: RouteHandler<TReq, TCtx>,
): RouteHandler<TReq, TCtx> {
  return async (req, ctx) => {
    const startedAt = Date.now();
    const requestId = req.headers.get("x-request-id") ?? randomUUID();
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      null;
    const userAgent = req.headers.get("user-agent") ?? null;
    const endpoint = new URL(req.url).pathname;
    const method = req.method;
    const tenantSlug = req.headers.get("x-tenant-slug");

    let clerkUserId: string | null = null;
    let clerkSessionId: string | null = null;
    let organizationId: string | null = null;
    let actorId: number | null = null;

    try {
      const session = await auth();
      clerkUserId = session.userId ?? null;
      clerkSessionId = session.sessionId ?? null;
    } catch {
      // Not in a Clerk-protected route; proceed without auth
    }

    if (clerkUserId && tenantSlug) {
      const employee = await rawPrisma.employee.findFirst({
        where: { clerkUserId, organization: { slug: tenantSlug } },
        select: { id: true, organizationId: true },
      });

      if (!employee) {
        return NextResponse.json(
          { error: "Forbidden: bạn không phải thành viên của workspace này" },
          { status: 403 },
        );
      }

      actorId = employee.id;
      organizationId = employee.organizationId;
    } else if (clerkUserId && !tenantSlug) {
      const employee = await rawPrisma.employee.findFirst({
        where: { clerkUserId },
        select: { id: true, organizationId: true },
      });
      if (employee) {
        actorId = employee.id;
        organizationId = employee.organizationId;
      }
    }

    // Lazy-create UserSession on first authenticated request
    if (clerkSessionId && actorId && organizationId) {
      void ensureUserSession({
        clerkSessionId,
        employeeId: actorId,
        organizationId,
        ipAddress,
        userAgent,
      });
    }

    const context: RequestContext = {
      actorId,
      clerkUserId,
      organizationId,
      sessionId: clerkSessionId,
      requestId,
      ipAddress,
      userAgent,
      endpoint,
      method,
    };

    let response: Response;
    let errorMessage: string | null = null;

    try {
      response = await runWithContext(context, () => Promise.resolve(handler(req, ctx)));
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : String(err);
      void writeApiAccessLog({
        employeeId: actorId,
        sessionId: clerkSessionId,
        requestId,
        endpoint,
        method,
        statusCode: 500,
        durationMs: Date.now() - startedAt,
        ipAddress,
        userAgent,
        errorMessage,
      });
      throw err;
    }

    response.headers.set("x-request-id", requestId);

    const durationMs = Date.now() - startedAt;
    const contentLength = response.headers.get("content-length");
    void writeApiAccessLog({
      employeeId: actorId,
      sessionId: clerkSessionId,
      requestId,
      endpoint,
      method,
      statusCode: response.status,
      durationMs,
      ipAddress,
      userAgent,
      responseSize: contentLength ? Number(contentLength) : null,
    });

    if (clerkSessionId) void touchActivity(clerkSessionId);

    return response;
  };
}
