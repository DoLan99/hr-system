import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ADMIN_ROLES } from "@/lib/managed-scope";
import { DEFAULT_LABELS, type LabelCategory } from "@/lib/system-labels";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.systemLabel.findMany({
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { key: "asc" }],
  });

  return Response.json({ data: rows });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!ADMIN_ROLES.includes((session.user as any).role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { category, key, label, color, isActive, sortOrder } = body as {
    category: string;
    key: string;
    label: string;
    color?: string;
    isActive?: boolean;
    sortOrder?: number;
  };

  if (!category || !key || !label) {
    return Response.json({ error: "category, key và label là bắt buộc" }, { status: 400 });
  }

  const defaults = DEFAULT_LABELS[category as LabelCategory];
  if (!defaults || !defaults[key]) {
    return Response.json({ error: "category/key không hợp lệ" }, { status: 400 });
  }

  const result = await prisma.systemLabel.upsert({
    where: { category_key: { category, key } },
    update: {
      label,
      color: color ?? null,
      isActive: isActive ?? true,
      sortOrder: sortOrder ?? 0,
    },
    create: {
      category,
      key,
      label,
      color: color ?? null,
      isActive: isActive ?? true,
      sortOrder: sortOrder ?? 0,
    },
  });

  return Response.json({ data: result });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!ADMIN_ROLES.includes((session.user as any).role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { category, key } = await req.json();

  await prisma.systemLabel.deleteMany({ where: { category, key } });

  return Response.json({ ok: true });
}
