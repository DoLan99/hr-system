import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { LeaveClient } from "./_components/leave-client";

export const dynamic = "force-dynamic";

export default async function LeavePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const userId = Number(session.user.id);
  const isManager = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"].includes((session.user as any).role);

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const where: any = { date: { gte: start, lt: end } };
  if (!isManager) where.employeeId = userId;

  const [leaves, employees] = await Promise.all([
    prisma.leave.findMany({
      where,
      include: {
        employee: { select: { id: true, fullName: true, department: true } },
        approvedBy: { select: { id: true, fullName: true } },
      },
      orderBy: { date: "desc" },
    }),
    isManager
      ? prisma.employee.findMany({
          where: { status: "ACTIVE" },
          select: { id: true, fullName: true, department: true },
          orderBy: { fullName: "asc" },
        })
      : [],
  ]);

  return (
    <LeaveClient
      initialLeaves={JSON.parse(JSON.stringify(leaves))}
      initialMonth={month}
      initialYear={year}
      employees={employees}
      currentUserId={userId}
    />
  );
}
