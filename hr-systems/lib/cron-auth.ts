import { NextRequest } from "next/server";

/**
 * Xác thực request từ Vercel Cron.
 *
 * Vercel Cron tự động gắn header `Authorization: Bearer ${CRON_SECRET}` nếu
 * env var `CRON_SECRET` được set. Trên local dev có thể truyền tay header
 * tương ứng để test.
 *
 * Trả về `true` nếu hợp lệ; `false` nếu thiếu/sai secret.
 * Nếu env `CRON_SECRET` không set thì luôn từ chối (an toàn hơn).
 */
export function verifyCronAuth(req: NextRequest | Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}
