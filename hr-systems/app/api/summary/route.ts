import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];

// GET /api/summary?month=1&year=2025&employeeId=2
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = Number(searchParams.get("month") ?? new Date().getMonth() + 1);
  const year = Number(searchParams.get("year") ?? new Date().getFullYear());
  const empId = searchParams.get("employeeId");

  const userId = Number(session.user.id);
  const isManager = MANAGER_ROLES.includes(session.user.role);

  const where: any = { month, year };
  if (!isManager) where.employeeId = userId;
  else if (empId) where.employeeId = Number(empId);

  const summaries = await prisma.salarySummary.findMany({
    where,
    include: {
      employee: {
        select: {
          id: true, fullName: true, department: true,
          payType: true, hourlyRate: true, monthlySalary: true,
        },
      },
      confirmedBy: { select: { id: true, fullName: true } },
    },
    orderBy: { employee: { fullName: "asc" } },
  });

  return NextResponse.json({ data: summaries });
}
