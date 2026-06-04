import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, MANAGER_ROLES } from "@/lib/api-auth";

const score = z.number().min(0).max(10).nullable().optional();

const selfSchema = z.object({
  selfScoreWorkSpeed: score,
  selfScoreQuality: score,
  selfScoreLearning: score,
  selfScoreDeadlines: score,
  selfScoreInitiative: score,
  selfHighlights: z.string().nullable().optional(),
  selfChallenges: z.string().nullable().optional(),
  selfGoalsNext: z.string().nullable().optional(),
  submitSelf: z.boolean().optional(),
});

const mgrSchema = z.object({
  mgrScoreWorkSpeed: score,
  mgrScoreQuality: score,
  mgrScoreLearning: score,
  mgrScoreDeadlines: score,
  mgrScoreInitiative: score,
  mgrStrengths: z.string().nullable().optional(),
  mgrAreasToImprove: z.string().nullable().optional(),
  mgrActionItems: z.string().nullable().optional(),
  recommendedSalaryAdjustPct: z.number().min(-100).max(100).nullable().optional(),
  recommendedPromotion: z.string().nullable().optional(),
  finalize: z.boolean().optional(),
});

const updateSchema = selfSchema.merge(mgrSchema);

function avg(vals: (number | null | undefined)[]): number | null {
  const nums = vals.filter((v): v is number => typeof v === "number");
  if (nums.length === 0) return null;
  return Math.round((nums.reduce((s, v) => s + v, 0) / nums.length) * 100) / 100;
}

export const GET = withContext(async (
  _req: NextRequest,
  { params }: { params: { id: string } },
) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const id = Number(params.id);
  const review = await prisma.performanceReview.findFirst({
    where: { id, organizationId: auth.orgId },
    include: {
      cycle: true,
      employee: { select: { id: true, fullName: true, department: true, avatarUrl: true, role: { select: { name: true, label: true } } } },
      mgrReviewer: { select: { id: true, fullName: true } },
    },
  });
  if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isManager = MANAGER_ROLES.includes(auth.roleName);
  if (!isManager && review.employeeId !== auth.actorId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ data: review });
});

export const PUT = withContext(async (
  req: NextRequest,
  { params }: { params: { id: string } },
) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const id = Number(params.id);
  const review = await prisma.performanceReview.findFirst({
    where: { id, organizationId: auth.orgId },
    include: { cycle: { select: { status: true } } },
  });
  if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (review.cycle.status === "CLOSED") {
    return NextResponse.json({ error: "Cycle đã đóng, không thể chỉnh sửa" }, { status: 403 });
  }

  const isManager = MANAGER_ROLES.includes(auth.roleName);
  const isOwner = review.employeeId === auth.actorId;
  if (!isManager && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const data: any = {};
  const d = parsed.data;

  if (isOwner && review.status !== "COMPLETED") {
    const selfKeys = ["selfScoreWorkSpeed", "selfScoreQuality", "selfScoreLearning", "selfScoreDeadlines", "selfScoreInitiative",
      "selfHighlights", "selfChallenges", "selfGoalsNext"] as const;
    for (const k of selfKeys) {
      if (k in d) data[k] = (d as any)[k];
    }
    const selfScores = [d.selfScoreWorkSpeed, d.selfScoreQuality, d.selfScoreLearning, d.selfScoreDeadlines, d.selfScoreInitiative];
    if (selfScores.some(s => s !== undefined)) {
      data.selfTotalScore = avg([
        d.selfScoreWorkSpeed ?? (review.selfScoreWorkSpeed ? Number(review.selfScoreWorkSpeed) : null),
        d.selfScoreQuality ?? (review.selfScoreQuality ? Number(review.selfScoreQuality) : null),
        d.selfScoreLearning ?? (review.selfScoreLearning ? Number(review.selfScoreLearning) : null),
        d.selfScoreDeadlines ?? (review.selfScoreDeadlines ? Number(review.selfScoreDeadlines) : null),
        d.selfScoreInitiative ?? (review.selfScoreInitiative ? Number(review.selfScoreInitiative) : null),
      ]);
    }
    if (d.submitSelf) {
      data.selfSubmittedAt = new Date();
      if (review.status === "PENDING") data.status = "SELF_DONE";
    }
  }

  if (isManager) {
    const mgrKeys = ["mgrScoreWorkSpeed", "mgrScoreQuality", "mgrScoreLearning", "mgrScoreDeadlines", "mgrScoreInitiative",
      "mgrStrengths", "mgrAreasToImprove", "mgrActionItems", "recommendedSalaryAdjustPct", "recommendedPromotion"] as const;
    for (const k of mgrKeys) {
      if (k in d) data[k] = (d as any)[k];
    }
    const mgrScores = [d.mgrScoreWorkSpeed, d.mgrScoreQuality, d.mgrScoreLearning, d.mgrScoreDeadlines, d.mgrScoreInitiative];
    if (mgrScores.some(s => s !== undefined)) {
      data.mgrTotalScore = avg([
        d.mgrScoreWorkSpeed ?? (review.mgrScoreWorkSpeed ? Number(review.mgrScoreWorkSpeed) : null),
        d.mgrScoreQuality ?? (review.mgrScoreQuality ? Number(review.mgrScoreQuality) : null),
        d.mgrScoreLearning ?? (review.mgrScoreLearning ? Number(review.mgrScoreLearning) : null),
        d.mgrScoreDeadlines ?? (review.mgrScoreDeadlines ? Number(review.mgrScoreDeadlines) : null),
        d.mgrScoreInitiative ?? (review.mgrScoreInitiative ? Number(review.mgrScoreInitiative) : null),
      ]);
    }
    if (d.finalize) {
      data.mgrReviewerId = auth.actorId;
      data.mgrSubmittedAt = new Date();
      data.finalizedAt = new Date();
      data.status = "COMPLETED";
    }
  }

  const updated = await prisma.performanceReview.update({
    where: { id },
    data,
    include: {
      cycle: true,
      employee: { select: { id: true, fullName: true, department: true, avatarUrl: true } },
      mgrReviewer: { select: { id: true, fullName: true } },
    },
  });

  return NextResponse.json({ data: updated });
});
