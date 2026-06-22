import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireManager } from "@/lib/api-auth";

const stepSchema = z.object({
  stepOrder: z.number().int().min(1),
  name: z.string().min(1),
  approverType: z.enum(["ROLE", "SPECIFIC_EMPLOYEE", "DEPARTMENT_HEAD", "DIRECT_MANAGER"]),
  approverRef: z.string().nullable().optional(),
  slaHours: z.number().int().min(1).nullable().optional(),
  stepType: z.enum(["any", "all"]).optional().default("any"),
  notifyOnReject: z.boolean().optional().default(true),
  approverRefs: z.array(z.string()).optional().default([]),
});

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  triggers: z.array(z.string()).optional(),
  conditions: z.array(z.object({ field: z.string(), op: z.string(), val: z.string() })).optional(),
  notificationsConfig: z.object({
    onSubmit: z.boolean(), onApprove: z.boolean(), onReject: z.boolean(), onDeadline: z.boolean(),
  }).optional(),
  steps: z.array(stepSchema).min(1).optional(),
});

// PUT /api/workflows/templates/[id]
export const PUT = withContext(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;

  const template = await prisma.workflowTemplate.findFirst({
    where: { id: params.id, organizationId: auth.orgId },
  });
  if (!template) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { steps, conditions, notificationsConfig, ...rest } = parsed.data;

  // Kiểm tra running instances trước khi xóa steps (tránh FK violation)
  if (steps) {
    const running = await prisma.workflowInstance.count({
      where: { templateId: params.id, status: "RUNNING" },
    });
    if (running > 0) {
      return NextResponse.json(
        { error: `Có ${running} instance đang chạy, không thể thay đổi cấu trúc bước duyệt. Hãy lưu lại các trường khác mà không sửa steps.` },
        { status: 409 },
      );
    }
  }

  const updated = await prisma.workflowTemplate.update({
    where: { id: params.id },
    data: {
      ...rest,
      ...(conditions !== undefined ? { conditions: conditions as any } : {}),
      ...(notificationsConfig !== undefined ? { notificationsConfig: notificationsConfig as any } : {}),
      ...(steps ? { steps: { deleteMany: {}, create: steps } } : {}),
    },
    include: { steps: { orderBy: { stepOrder: "asc" } } },
  });

  return NextResponse.json({ data: updated });
});

// DELETE /api/workflows/templates/[id]
export const DELETE = withContext(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireManager();
  if (!auth.ok) return auth.response;

  const template = await prisma.workflowTemplate.findFirst({
    where: { id: params.id, organizationId: auth.orgId },
  });
  if (!template) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  // Không xóa nếu đang có instance đang chạy
  const running = await prisma.workflowInstance.count({
    where: { templateId: params.id, status: "RUNNING" },
  });
  if (running > 0) {
    return NextResponse.json(
      { error: `Có ${running} instance đang chạy, không thể xóa template` },
      { status: 409 },
    );
  }

  await prisma.workflowTemplate.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
});
