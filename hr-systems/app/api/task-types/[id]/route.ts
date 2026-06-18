import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, ADMIN_ROLES } from "@/lib/api-auth";

const SYSTEM_KEYS = ["NORMAL", "LEARNING", "NEW_RESEARCH", "MEETING", "ADMIN", "BILLABLE_CLIENT", "INTERNAL"];

const updateSchema = z.object({
  key:       z.string().min(1).regex(/^[A-Z0-9_]+$/, "Key phải UPPER_SNAKE_CASE").optional(),
  label:     z.string().min(1).max(50).optional(),
  color:     z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  iconEmoji: z.string().max(4).optional(),
  sortOrder: z.number().int().optional(),
  isActive:  z.boolean().optional(),
});

export const PUT = withContext(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;
  if (!ADMIN_ROLES.includes(auth.roleName)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = Number(params.id);
  const record = await prisma.taskTypeConfig.findFirst({ where: { id, organizationId: auth.orgId } });
  if (!record) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const newKey = parsed.data.key;

  // If key is changing, check for duplicates and cascade update tasks/templates
  if (newKey && newKey !== record.key) {
    const dup = await prisma.taskTypeConfig.findFirst({ where: { organizationId: auth.orgId, key: newKey } });
    if (dup) return NextResponse.json({ error: `Key "${newKey}" đã tồn tại` }, { status: 409 });

    const [updated] = await prisma.$transaction([
      prisma.taskTypeConfig.update({ where: { id }, data: parsed.data }),
      prisma.task.updateMany({ where: { organizationId: auth.orgId, taskType: record.key }, data: { taskType: newKey } }),
      prisma.taskTemplate.updateMany({ where: { organizationId: auth.orgId, defaultTaskType: record.key }, data: { defaultTaskType: newKey } }),
    ]);
    return NextResponse.json({ data: updated });
  }

  const updated = await prisma.taskTypeConfig.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ data: updated });
});

export const DELETE = withContext(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;
  if (!ADMIN_ROLES.includes(auth.roleName)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = Number(params.id);
  const record = await prisma.taskTypeConfig.findFirst({ where: { id, organizationId: auth.orgId } });
  if (!record) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  if (SYSTEM_KEYS.includes(record.key)) {
    return NextResponse.json({ error: "Không thể xóa loại hệ thống. Chỉ có thể ẩn." }, { status: 400 });
  }

  // Check if any tasks/templates are using this type
  const [taskCount, tplCount] = await Promise.all([
    prisma.task.count({ where: { organizationId: auth.orgId, taskType: record.key } }),
    prisma.taskTemplate.count({ where: { organizationId: auth.orgId, defaultTaskType: record.key } }),
  ]);

  if (taskCount + tplCount > 0) {
    return NextResponse.json({
      error: `Không thể xóa — đang có ${taskCount} task và ${tplCount} template dùng loại này.`,
    }, { status: 400 });
  }

  await prisma.taskTypeConfig.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
