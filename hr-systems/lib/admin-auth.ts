import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const COOKIE_NAME = "admin_session";
const SECRET = process.env.NEXTAUTH_SECRET ?? "change-me";

interface AdminPayload {
  id: number;
  username: string;
  fullName: string;
  type: string;
}

// Simple HMAC-signed token (no external JWT dep — works in Edge)
async function hmac(data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Buffer.from(sig).toString("base64url");
}

export async function createAdminToken(payload: AdminPayload): Promise<string> {
  const data = JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000) });
  const encoded = Buffer.from(data).toString("base64url");
  const sig = await hmac(encoded);
  return `${encoded}.${sig}`;
}

export async function verifyAdminToken(token: string): Promise<AdminPayload | null> {
  try {
    const [encoded, sig] = token.split(".");
    if (!encoded || !sig) return null;
    const expected = await hmac(encoded);
    if (expected !== sig) return null;
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString());
    // 30-day expiry
    if (Math.floor(Date.now() / 1000) - payload.iat > 60 * 60 * 24 * 30) return null;
    return payload as AdminPayload;
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export async function getAdminSessionFromRequest(req: NextRequest): Promise<AdminPayload | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export { COOKIE_NAME };
