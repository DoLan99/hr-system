import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Inactive user — force logout
    if (token?.status === "INACTIVE") {
      return NextResponse.redirect(new URL("/login?error=inactive", req.url));
    }

    // Admin-only routes
    const adminRoutes = ["/employees", "/work-rules"];
    if (adminRoutes.some((r) => pathname.startsWith(r))) {
      const allowed = ["SUPER_ADMIN", "ADMIN", "HR"];
      if (!allowed.includes(token?.role as string)) {
        return NextResponse.redirect(new URL("/dashboard?error=forbidden", req.url));
      }
    }

    // Accountant / Admin only — salary routes
    if (pathname.startsWith("/summary") || pathname.startsWith("/payments")) {
      const allowed = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD", "ACCOUNTANT"];
      if (!allowed.includes(token?.role as string)) {
        return NextResponse.redirect(new URL("/dashboard?error=forbidden", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
