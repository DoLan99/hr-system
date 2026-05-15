import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { ADMIN_ROLES, SUB_MANAGER_ROLES } from "@/lib/managed-scope";

const reviewSchema = z.object({
  decisionNote: z.string().optional(),
  bonusTime: z.number().int().min(0).optional(),
});

const include = {
  employee: { select: { id: true, fullName: true, avatarUrl: true } },
  reviewedBy: { select: { id: true, fullName: true } },
};

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  const item = await prisma.templateSuggestion.findUnique({ where: { id }, include });
  if (!item) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  return NextResponse.json({ data: item });
}

// PATCH ?action=approve|reject — manager creates/rejects template
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userRole = session.user.role;
  const isManager = ADMIN_ROLES.includes(userRole) || SUB_MANAGER_ROLES.includes(userRole);
  if (!isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = Number(params.id);
  const existing = await prisma.templateSuggestion.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  if (existing.status !== "PENDING") {
    return NextResponse.json({ error: "Đã xử lý trước đó" }, { status: 422 });
  }

  const action = new URL(req.url).searchParams.get("action") ?? "approve";
  const body = await req.json().catch(() => ({}));
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const userId = Number(session.user.id);

  if (action === "reject") {
    const updated = await prisma.templateSuggestion.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedById: userId,
        reviewedAt: new Date(),
        decisionNote: parsed.data.decisionNote,
      },
      include,
    });
    return NextResponse.json({ data: updated });
  }

  // approve → create template
  const result = await prisma.$transaction(async (tx) => {
    // check code unique
    const codeExists = await tx.taskTemplate.findUnique({ where: { code: existing.proposedCode } });
    if (codeExists) {
      throw new Error("Code template đã tồn tại");
    }

    const newTemplate = await tx.taskTemplate.create({
      data: {
        code: existing.proposedCode,
        title: existing.proposedTitle,
        description: existing.description,
        defaultTaskType: existing.proposedTaskType,
        defaultEstimatedTime: existing.proposedEstimate,
        createdById: userId,
        isActive: true,
      },
    });

    const updated = await tx.templateSuggestion.update({
      where: { id },
      data: {
        status: "APPROVED",
        reviewedById: userId,
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
}
