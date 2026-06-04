import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ADMIN_ROLES, SUB_MANAGER_ROLES } from "@/lib/managed-scope";
import { withContext } from "@/lib/with-context";
import { requireApiAuth } from "@/lib/api-auth";

const reviewSchema = z.object({
  decisionNote: z.string().optional(),
  bonusTime: z.number().int().min(0).optional(),
});

const include = {
  employee: { select: { id: true, fullName: true, avatarUrl: true } },
  reviewedBy: { select: { id: true, fullName: true } },
};

export const GET = withContext(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const id = Number(params.id);
  const item = await prisma.templateSuggestion.findFirst({ where: { id }, include });
  if (!item) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  return NextResponse.json({ data: item });
});

export const PATCH = withContext(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const userRole = auth.roleName;
  const isManager = ADMIN_ROLES.includes(userRole) || SUB_MANAGER_ROLES.includes(userRole);
  if (!isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = Number(params.id);
  const existing = await prisma.templateSuggestion.findFirst({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  if (existing.status !== "PENDING") {
    return NextResponse.json({ error: "Đã xử lý trước đó" }, { status: 422 });
  }

  const action = new URL(req.url).searchParams.get("action") ?? "approve";
  const body = await req.json().catch(() => ({}));
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  if (action === "reject") {
    const updated = await prisma.templateSuggestion.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedById: auth.actorId,
        reviewedAt: new Date(),
        decisionNote: parsed.data.decisionNote,
      },
      include,
    });
    return NextResponse.json({ data: updated });
  }

  const result = await prisma.$transaction(async (tx) => {
    const codeExists = await tx.taskTemplate.findFirst({
      where: { code: existing.proposedCode, organizationId: auth.orgId },
    });
    if (codeExists) {
      throw new Error("Code template đã tồn tại");
    }

    const newTemplate = await tx.taskTemplate.create({
      data: {
        organizationId: auth.orgId,
        code: existing.proposedCode,
        title: existing.proposedTitle,
        description: existing.description,
        defaultTaskType: existing.proposedTaskType,
        defaultEstimatedTime: existing.proposedEstimate,
        createdById: auth.actorId,
        isActive: true,
      },
    });

    const updated = await tx.templateSuggestion.update({
      where: { id },
      data: {
        status: "APPROVED",
        reviewedById: auth.actorId,
        reviewedAt: new Date(),
        decisionNote: parsed.data.decisionNote,
        bonusTime: parsed.data.bonusTime ?? 0,
        createdTemplateId: newTemplate.id,
      },
      include,
    });
    return updated;
  }).catch((err: any) => ({ error: err.message }));

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }
  return NextResponse.json({ data: result });
});
