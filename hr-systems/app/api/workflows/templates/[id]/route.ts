import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireManager } from "@/lib/api-auth";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
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

  const updated = await prisma.workflowTemplate.update({
    where: { id: params.id },
    data: parsed.data,
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
