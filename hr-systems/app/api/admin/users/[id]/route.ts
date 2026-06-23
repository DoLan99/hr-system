import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-auth";

const updateSchema = z.object({
  fullName:  z.string().min(1).optional(),
  email:     z.string().email().optional().or(z.literal("")),
  type:      z.enum(["SUPER_ADMIN", "SUPPORT", "FINANCE"]).optional(),
  isActive:  z.boolean().optional(),
  password:  z.string().min(8).optional(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.type !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = Number(params.id);
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;
  // Ngăn tự vô hiệu hóa chính mình
  if (session.id === id && d.isActive === false)
    return NextResponse.json({ error: "Không thể vô hiệu hóa tài khoản đang đăng nhập" }, { status: 400 });

  const updateData: Record<string, unknown> = {};
  if (d.fullName) updateData.fullName = d.fullName;
  if (d.email !== undefined) updateData.email = d.email || null;
  if (d.type) updateData.type = d.type;
  if (d.isActive !== undefined) updateData.isActive = d.isActive;
  if (d.password) updateData.passwordHash = await bcrypt.hash(d.password, 12);

  const user = await prisma.adminUser.update({
    where: { id },
    data: updateData,
    select: { id: true, username: true, fullName: true, email: true, type: true, isActive: true, lastLoginAt: true, createdAt: true },
  });
  return NextResponse.json({ data: user });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.type !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = Number(params.id);
  if (session.id === id)
    return NextResponse.json({ error: "Không thể xóa tài khoản đang đăng nhập" }, { status: 400 });

  await prisma.adminUser.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
