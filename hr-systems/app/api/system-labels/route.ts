import { prisma } from "@/lib/prisma";
import { ADMIN_ROLES } from "@/lib/managed-scope";
import { DEFAULT_LABELS, type LabelCategory } from "@/lib/system-labels";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";

export const GET = withContext(async () => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const rows = await prisma.systemLabel.findMany({
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { key: "asc" }],
  });

  return Response.json({ data: rows });
});

export const PUT = withContext(async (req: Request) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;
  if (!ADMIN_ROLES.includes(auth.roleName)) {
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

  const existing = await prisma.systemLabel.findFirst({
    where: { category, key },
  });

  const data = {
    label,
    color: color ?? null,
    isActive: isActive ?? true,
    sortOrder: sortOrder ?? 0,
  };

  const result = existing
    ? await prisma.systemLabel.update({ where: { id: existing.id }, data })
    : await prisma.systemLabel.create({ data: { category, key, ...data } });

  return Response.json({ data: result });
});

export const DELETE = withContext(async (req: Request) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;
  if (!ADMIN_ROLES.includes(auth.roleName)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { category, key } = await req.json();
  await prisma.systemLabel.deleteMany({ where: { category, key } });

  return Response.json({ ok: true });
});
