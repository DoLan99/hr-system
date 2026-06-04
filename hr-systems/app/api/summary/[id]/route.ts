import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calcTotalScore } from "@/lib/salary";
import { z } from "zod";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, MANAGER_ROLES } from "@/lib/api-auth";

const score = z.number().min(0).max(10).nullable().optional();

const updateSchema = z.object({
  scoreWorkSpeed: score,
  scoreQuality: score,
  scoreLearning: score,
  scoreDeadlines: score,
  scoreInitiative: score,
  confirm: z.boolean().optional(),
  salaryPaid: z.number().min(0).optional(),
  bonusPaid: z.number().min(0).optional(),
  moneyReceived: z.number().min(0).optional(),
});

export const PUT = withContext(async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const isManager = MANAGER_ROLES.includes(auth.roleName);
  if (!isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = Number(params.id);
  const existing = await prisma.salarySummary.findFirst({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;

  const newScores = {
    scoreWorkSpeed: "scoreWorkSpeed" in d ? d.scoreWorkSpeed : (existing.scoreWorkSpeed ? Number(existing.scoreWorkSpeed) : null),
    scoreQuality: "scoreQuality" in d ? d.scoreQuality : (existing.scoreQuality ? Number(existing.scoreQuality) : null),
    scoreLearning: "scoreLearning" in d ? d.scoreLearning : (existing.scoreLearning ? Number(existing.scoreLearning) : null),
    scoreDeadlines: "scoreDeadlines" in d ? d.scoreDeadlines : (existing.scoreDeadlines ? Number(existing.scoreDeadlines) : null),
    scoreInitiative: "scoreInitiative" in d ? d.scoreInitiative : (existing.scoreInitiative ? Number(existing.scoreInitiative) : null),
  };
  const totalScore = calcTotalScore(newScores);

  const salaryPaid = d.salaryPaid !== undefined ? d.salaryPaid : Number(existing.salaryPaid);
  const bonusPaid = d.bonusPaid !== undefined ? d.bonusPaid : Number(existing.bonusPaid);
  const moneyReceived = d.moneyReceived !== undefined ? d.moneyReceived : Number(existing.moneyReceived);
  const totalCalc = Number(existing.totalCalc);
  const deltaMoney = totalCalc - moneyReceived;

  const updateData: any = {
    ...newScores,
    ...(totalScore !== null && { totalScore }),
    salaryPaid,
    bonusPaid,
    moneyReceived,
    deltaMoney,
  };

  if (d.confirm) {
    updateData.confirmedById = auth.actorId;
    updateData.confirmedAt = new Date();
  }

  const updated = await prisma.salarySummary.update({
    where: { id },
    data: updateData,
    include: {
      employee: {
        select: { id: true, fullName: true, department: true, payType: true, hourlyRate: true, monthlySalary: true },
      },
      confirmedBy: { select: { id: true, fullName: true } },
    },
  });

  return NextResponse.json({ data: updated });
});
