import "server-only";
import { headers } from "next/headers";
import { prisma } from "./prisma";

export async function getTenantSlug(): Promise<string | null> {
  const h = await headers();
  return h.get("x-tenant-slug");
}

export async function getCurrentOrg() {
  const slug = await getTenantSlug();
  if (!slug) return null;
  return prisma.organization.findUnique({ where: { slug } });
}

export async function requireOrgBySlug(slug: string) {
  const org = await prisma.organization.findUnique({ where: { slug } });
  if (!org) throw new Error(`Organization not found: ${slug}`);
  return org;
}

export async function buildTenantUrl(slug: string, path: string = "/"): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const protocol = h.get("x-forwarded-proto") ?? "http";
  const rootHost = stripSubdomainFromHost(host);
  return `${protocol}://${slug}.${rootHost}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function buildAppUrl(path: string = "/"): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const protocol = h.get("x-forwarded-proto") ?? "http";
  const rootHost = stripSubdomainFromHost(host);
  return `${protocol}://${rootHost}${path.startsWith("/") ? path : `/${path}`}`;
}

function stripSubdomainFromHost(host: string): string {
  const [hostname, port] = host.split(":");
  let root: string;
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    root = "localhost";
  } else {
    const parts = hostname.split(".");
    root = parts.length >= 2 ? parts.slice(-2).join(".") : hostname;
  }
  return port ? `${root}:${port}` : root;
}
