import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/pricing",
  "/about",
  "/contact",
  "/terms",
  "/privacy",
  "/tinh-nang(.*)",
  "/tich-hop",
  "/khach-hang",
  "/blog(.*)",
  "/dat-lich-demo",
  "/so-sanh(.*)",
  "/sitemap.xml",
  "/robots.txt",
  "/opengraph-image(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/api/cron(.*)",
  "/api/auth/microsoft/callback",
]);

const NON_TENANT_SUBDOMAINS = new Set([
  "",
  "www",
  "app",
  "admin",
  "api",
  "static",
  "mail",
]);

function extractSubdomain(host: string | null): string {
  if (!host) return "";
  const hostname = host.split(":")[0];

  if (hostname === "localhost") return "";

  const parts = hostname.split(".");

  if (parts[parts.length - 1] === "localhost") {
    return parts.slice(0, -1).join(".");
  }

  if (parts.length <= 2) return "";

  return parts.slice(0, -2).join(".");
}

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  const host = req.headers.get("host");
  const subdomain = extractSubdomain(host);
  const isTenant = subdomain && !NON_TENANT_SUBDOMAINS.has(subdomain);

  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-request-id", requestId);

  if (isTenant) {
    requestHeaders.set("x-tenant-slug", subdomain);
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("x-request-id", requestId);
  if (isTenant) {
    response.headers.set("x-tenant-slug", subdomain);
  }
  return response;
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    "/(api|trpc)(.*)",
  ],
};
