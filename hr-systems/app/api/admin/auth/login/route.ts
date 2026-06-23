import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createAdminToken, COOKIE_NAME } from "@/lib/admin-auth";

const schema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Thiếu username hoặc password" }, { status: 400 });

  const { username, password } = parsed.data;

  const admin = await prisma.adminUser.findUnique({ where: { username } });
  if (!admin || !admin.isActive)
    return NextResponse.json({ error: "Tài khoản không tồn tại hoặc đã bị vô hiệu hóa" }, { status: 401 });

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid)
    return NextResponse.json({ error: "Sai mật khẩu" }, { status: 401 });

  // Update last login
  await prisma.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });

  const token = await createAdminToken({
    id: admin.id, username: admin.username, fullName: admin.fullName, type: admin.type,
  });

  const res = NextResponse.json({ ok: true, user: { id: admin.id, username: admin.username, fullName: admin.fullName, type: admin.type } });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
