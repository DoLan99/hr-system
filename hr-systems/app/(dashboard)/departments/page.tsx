import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DepartmentsClient } from "./_components/departments-client";

export const dynamic = "force-dynamic";

export default async function DepartmentsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [depts, teams, employees] = await Promise.all([
    prisma.department.findMany({
      include: {
        head: { select: { id: true, fullName: true } },
        teams: { include: { team: { select: { id: true, name: true, isActive: true } } } },
        _count: { select: { employees: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.team.findMany({
      include: {
        departments: { include: { department: { select: { id: true, name: true } } } },
        lead: { select: { id: true, fullName: true } },
        _count: { select: { employees: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.employee.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
    }),
  ]);

  return (
    <DepartmentsClient
      initialDepts={JSON.parse(JSON.stringify(depts))}
      initialTeams={JSON.parse(JSON.stringify(teams))}
      employees={employees}
    />
  );
}
