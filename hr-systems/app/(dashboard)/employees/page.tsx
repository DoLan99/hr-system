import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/current-user";
import { EmployeesClient } from "./EmployeesClient";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  const { organization } = await requireAuth();

  const [employees, roles, departments] = await Promise.all([
    prisma.employee.findMany({
      where: { organizationId: organization.id },
      select: {
        id: true, employeeCode: true, fullName: true, avatarUrl: true,
        emailCompany: true, emailGoogle: true,
        mobileCompany: true, startDate: true, status: true,
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
  ]);

  return (
    <EmployeesClient
      initialEmployees={JSON.parse(JSON.stringify(employees))}
      roles={JSON.parse(JSON.stringify(roles))}
      departments={JSON.parse(JSON.stringify(departments))}
    />
  );
}
