import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/current-user";
import { DepartmentsClient } from "./_components/departments-client";

export const dynamic = "force-dynamic";

export default async function DepartmentsPage() {
  const { organization } = await requireAuth();
  const orgFilter = { organizationId: organization.id };

  const [depts, teams, employees] = await Promise.all([
    prisma.department.findMany({
      where: orgFilter,
      include: {
        head: { select: { id: true, fullName: true } },
        teams: { include: { team: { select: { id: true, name: true, isActive: true } } } },
        _count: { select: { employees: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.team.findMany({
      where: orgFilter,
      include: {
        departments: { include: { department: { select: { id: true, name: true } } } },
        lead: { select: { id: true, fullName: true } },
        _count: { select: { employees: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.employee.findMany({
      where: { ...orgFilter, status: "ACTIVE" },
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
