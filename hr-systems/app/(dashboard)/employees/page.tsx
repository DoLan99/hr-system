import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/current-user";
import { EmployeesClient } from "./_components/employees-client";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  const { organization } = await requireAuth();

  const [employees, roles, departments, teams] = await Promise.all([
    prisma.employee.findMany({
      where: { organizationId: organization.id },
      select: {
        id: true, employeeCode: true, fullName: true, avatarUrl: true,
        department: true, departmentId: true, teamId: true,
        company: true, emailCompany: true, emailGoogle: true,
        mobileCompany: true, payType: true, hourlyRate: true, monthlySalary: true,
        maxHoursMonth: true, bonusMPct: true, bonusAPct: true, bonusTPct: true,
        startDate: true, status: true, managerId: true, driveLink1: true,
        clerkUserId: true, isOwner: true, membershipRole: true,
        role: { select: { id: true, name: true, label: true } },
        manager: { select: { id: true, fullName: true } },
        dept: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
      },
      orderBy: { fullName: "asc" },
    }),
    prisma.role.findMany({
      where: { organizationId: organization.id },
      orderBy: { id: "asc" },
    }),
    prisma.department.findMany({
      where: { organizationId: organization.id, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.team.findMany({
      where: { organizationId: organization.id, isActive: true },
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
