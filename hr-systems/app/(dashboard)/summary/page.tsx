import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SummaryClient } from "./_components/summary-client";

export const dynamic = "force-dynamic";

export default async function SummaryPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const userId = Number(session.user.id);
  const role = (session.user as any).role as string;
  const isManager = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"].includes(role);

  const where: any = { month, year };
  if (!isManager) where.employeeId = userId;

  const summaries = await prisma.salarySummary.findMany({
    where,
    include: {
      employee: {
        select: {
          id: true,
          fullName: true,
          department: true,
          payType: true,
          hourlyRate: true,
          monthlySalary: true,
        },
      },
      confirmedBy: { select: { id: true, fullName: true } },
    },
    orderBy: { employee: { fullName: "asc" } },
  });

  return (
    <SummaryClient
      initialSummaries={JSON.parse(JSON.stringify(summaries))}
      initialMonth={month}
      initialYear={year}
      employeeId={userId}
    />
  );
}
