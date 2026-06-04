import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withContext } from "@/lib/with-context";
import { requireApiAuth, MANAGER_ROLES } from "@/lib/api-auth";

export const GET = withContext(async (req: NextRequest) => {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const month = Number(searchParams.get("month") ?? new Date().getMonth() + 1);
  const year = Number(searchParams.get("year") ?? new Date().getFullYear());
  const empId = searchParams.get("employeeId");

  const isManager = MANAGER_ROLES.includes(auth.roleName);

  const where: any = { month, year };
  if (!isManager) where.employeeId = auth.actorId;
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
});
