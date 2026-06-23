import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-auth";

const createSchema = z.object({
  username:  z.string().min(3).max(40).regex(/^[a-z0-9_]+$/, "Chỉ chứa a-z, 0-9, _"),
  password:  z.string().min(8),
  fullName:  z.string().min(1),
  email:     z.string().email().optional().or(z.literal("")),
  type:      z.enum(["SUPER_ADMIN", "SUPPORT", "FINANCE"]),
});

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.type !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const users = await prisma.adminUser.findMany({
    select: { id: true, username: true, fullName: true, email: true, type: true, isActive: true, lastLoginAt: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ data: users });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.type !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;
  const existing = await prisma.adminUser.findUnique({ where: { username: d.username } });
  if (existing) return NextResponse.json({ error: "Username đã tồn tại" }, { status: 409 });

  const passwordHash = await bcrypt.hash(d.password, 12);
  const user = await prisma.adminUser.create({
    data: { username: d.username, passwordHash, fullName: d.fullName, email: d.email || null, type: d.type },
    select: { id: true, username: true, fullName: true, email: true, type: true, isActive: true, createdAt: true },
  });
  return NextResponse.json({ data: user }, { status: 201 });
}
