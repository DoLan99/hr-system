import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/current-user";
import { EmployeesClient } from "./EmployeesClient";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  const { organization } = await requireAuth();

  const [employees, roles, departments, teams] = await Promise.all([
    prisma.employee.findMany({
      where: { organizationId: organization.id },
      select: {
        id: true, employeeCode: true, fullName: true, avatarUrl: true,
        emailCompany: true, emailGoogle: true, emailPrivate: true, mobileCompany: true,
        startDate: true, status: true, departmentId: true, teamId: true, managerId: true,
        company: true, driveLink1: true,
        dob: true, gender: true, nationality: true, permanentAddr: true, currentAddr: true,
        cccd: true, cccdDate: true, cccdPlace: true,
        contractType: true, contractNo: true, contractStart: true, contractEnd: true,
        bankName: true, bankBranch: true, bankAccount: true, bankHolder: true,
        emergencyName: true, emergencyRel: true, emergencyPhone: true,
        photoPortrait: true, photoCccdFront: true, photoCccdBack: true,
        payType: true, hourlyRate: true, monthlySalary: true,
        maxHoursMonth: true, bonusMPct: true, bonusAPct: true, bonusTPct: true,
        role: { select: { id: true, name: true, label: true } },
        manager: { select: { id: true, fullName: true } },
        dept: { select: { id: true, name: true } },
      },
      orderBy: { fullName: "asc" },
    }),
    prisma.role.findMany({
      where: { organizationId: organization.id },
      select: { id: true, name: true, label: true },
      orderBy: { name: "asc" },
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
      roles={JSON.parse(JSON.stringify(roles))}
      departments={JSON.parse(JSON.stringify(departments))}
      teams={JSON.parse(JSON.stringify(teams))}
    />
  );
}
