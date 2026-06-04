import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobihome.vn";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pricing", "/about", "/contact", "/terms", "/privacy"],
        disallow: [
          "/dashboard",
          "/employees",
          "/tasks",
          "/customers",
          "/time-logs",
          "/billing",
          "/super-admin",
          "/admin",
          "/sign-in",
          "/sign-up",
          "/welcome",
          "/onboarding",
          "/api/",
          "/_next/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
