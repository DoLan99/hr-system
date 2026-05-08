import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { EmployeesClient } from "./_components/employees-client";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [employees, roles, departments, teams] = await Promise.all([
    prisma.employee.findMany({
      select: {
        id: true, employeeCode: true, fullName: true, avatarUrl: true,
        department: true, departmentId: true, teamId: true,
        company: true, emailCompany: true, emailGoogle: true,
        mobileCompany: true, payType: true, hourlyRate: true, monthlySalary: true,
        maxHoursMonth: true, bonusMPct: true, bonusAPct: true, bonusTPct: true,
        startDate: true, status: true, managerId: true, driveLink1: true,
        role: { select: { id: true, name: true, label: true } },
        manager: { select: { id: true, fullName: true } },
        dept: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
      },
      orderBy: { fullName: "asc" },
    }),
    prisma.role.findMany({ orderBy: { id: "asc" } }),
    prisma.department.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.team.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <EmployeesClient
      initialEmployees={JSON.parse(JSON.stringify(employees))}
      roles={roles}
      departments={departments}
      teams={teams}
    />
  );
}
