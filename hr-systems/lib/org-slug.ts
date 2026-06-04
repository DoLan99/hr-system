export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

export const RESERVED_SLUGS = new Set([
  "app", "admin", "api", "www", "auth",
  "sign-in", "sign-up", "signin", "signup", "login", "logout",
  "onboarding", "welcome", "dashboard",
  "static", "_next", "public",
  "mail", "support", "help", "docs", "blog",
  "jobihome",
]);
