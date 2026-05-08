import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calcTotalScore } from "@/lib/salary";
import { z } from "zod";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];

const score = z.number().min(0).max(10).nullable().optional();

const updateSchema = z.object({
  // Scores (0-10, manager only)
  scoreWorkSpeed: score,
  scoreQuality: score,
  scoreLearning: score,
  scoreDeadlines: score,
  scoreInitiative: score,
  // Confirm (manager only)
  confirm: z.boolean().optional(),
  // Manual overrides (manager)
  salaryPaid: z.number().min(0).optional(),
  bonusPaid: z.number().min(0).optional(),
  moneyReceived: z.number().min(0).optional(),
});

// PUT /api/summary/[id] — update scores + confirm
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isManager = MANAGER_ROLES.includes(session.user.role);
  if (!isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = Number(params.id);
  const existing = await prisma.salarySummary.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;

  // Merge scores with existing
  const newScores = {
    scoreWorkSpeed: "scoreWorkSpeed" in d ? d.scoreWorkSpeed : (existing.scoreWorkSpeed ? Number(existing.scoreWorkSpeed) : null),
    scoreQuality: "scoreQuality" in d ? d.scoreQuality : (existing.scoreQuality ? Number(existing.scoreQuality) : null),
    scoreLearning: "scoreLearning" in d ? d.scoreLearning : (existing.scoreLearning ? Number(existing.scoreLearning) : null),
    scoreDeadlines: "scoreDeadlines" in d ? d.scoreDeadlines : (existing.scoreDeadlines ? Number(existing.scoreDeadlines) : null),
    scoreInitiative: "scoreInitiative" in d ? d.scoreInitiative : (existing.scoreInitiative ? Number(existing.scoreInitiative) : null),
  };
  const totalScore = calcTotalScore(newScores);

  // Tính deltaMoney nếu cập nhật paid amounts
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
    updateData.confirmedById = Number(session.user.id);
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
}
