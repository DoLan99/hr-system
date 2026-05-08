import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { WorkListClient } from "./_components/work-list-client";

export const metadata = { title: "Work List — HR System" };

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];

export default async function WorkListPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = Number(session.user.id);
  const isManager = MANAGER_ROLES.includes(session.user.role);

  const [rawItems, employees, rawCustomers] = await Promise.all([
    prisma.workList.findMany({
      where: isManager ? {} : { assignedToId: userId },
      include: {
        assignedTo: { select: { id: true, fullName: true, department: true } },
        assignedBy: { select: { id: true, fullName: true } },
        tester: { select: { id: true, fullName: true } },
        customer: { select: { id: true, customerName: true } },
        _count: { select: { workReports: true } },
      },
      orderBy: [{ status: "asc" }, { priority: "asc" }, { dueDate: "asc" }],
    }),

    isManager
      ? prisma.employee.findMany({
          where: { status: "ACTIVE" },
          select: { id: true, fullName: true, department: true },
          orderBy: { fullName: "asc" },
        })
      : [],

    isManager
      ? prisma.customer.findMany({
          select: { id: true, customerName: true },
          orderBy: { customerName: "asc" },
        })
      : [],
  ]);

  const items = rawItems;
  const customers = rawCustomers.map(c => ({ id: c.id, name: c.customerName ?? "" }));

  // Overdue check — update isOverdue flag
  const now = new Date();
  const overdueIds = items
    .filter(i => i.dueDate && i.status !== "COMPLETED" && i.status !== "CANCELLED" && i.dueDate < now)
    .map(i => i.wlId);

  if (overdueIds.length > 0) {
    await prisma.workList.updateMany({
      where: { wlId: { in: overdueIds } },
      data: { isOverdue: true },
    });
  }

  const activeCount = items.filter(i => i.status === "IN_PROGRESS" || i.status === "BLOCKED").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Work List"
        description={`Danh sách task giao việc · ${activeCount} đang hoạt động`}
      />
      <WorkListClient
        initialItems={items as any}
        employees={employees}
        customers={customers}
      />
    </div>
  );
}
