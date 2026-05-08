import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CustomersClient } from "./_components/customers-client";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const isManager = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"].includes((session.user as any).role);

  const [customers, employees] = await Promise.all([
    prisma.customer.findMany({
      include: {
        responsibleStaff: { select: { id: true, fullName: true } },
        _count: { select: { workList: true, workReports: true } },
      },
      orderBy: { customerName: "asc" },
    }),
    isManager
      ? prisma.employee.findMany({
          where: { status: "ACTIVE" },
          select: { id: true, fullName: true },
          orderBy: { fullName: "asc" },
        })
      : [],
  ]);

  return (
    <CustomersClient
      initialCustomers={JSON.parse(JSON.stringify(customers))}
      employees={employees}
    />
  );
}
