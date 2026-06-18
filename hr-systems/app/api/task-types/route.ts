import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, ADMIN_ROLES } from "@/lib/api-auth";

const createSchema = z.object({
  key:       z.string().min(1).max(50).regex(/^[A-Z0-9_]+$/, "Key phải là UPPER_SNAKE_CASE"),
  label:     z.string().min(1).max(50),
  color:     z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#3B5BDB"),
  iconEmoji: z.string().max(4).default("✦"),
  sortOrder: z.number().int().default(0),
});

export const GET = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const types = await prisma.taskTypeConfig.findMany({
    where: { organizationId: auth.orgId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ data: types });
});

export const POST = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  if (!ADMIN_ROLES.includes(auth.roleName)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const existing = await prisma.taskTypeConfig.findUnique({
    where: { organizationId_key: { organizationId: auth.orgId, key: parsed.data.key } },
  });
  if (existing) return NextResponse.json({ error: "Key đã tồn tại" }, { status: 409 });

  const created = await prisma.taskTypeConfig.create({
    data: { ...parsed.data, organizationId: auth.orgId },
  });

  return NextResponse.json({ data: created }, { status: 201 });
});
