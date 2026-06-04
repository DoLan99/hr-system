import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/current-user";
import { MANAGER_ROLES } from "@/lib/api-auth";
import { MessagesClient } from "./_components/messages-client";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const { employee, organization, role } = await requireAuth();
  const userId = employee.id;
  const isManager = MANAGER_ROLES.includes(role.name);

  const PAGE_SIZE = 50;
  const baseFilter: any = { organizationId: organization.id };
  const scope = isManager ? baseFilter : { ...baseFilter, assignedToId: userId };

  const [messages, total, employees, customers] = await Promise.all([
    prisma.message.findMany({
      where: scope,
      include: {
        customer: { select: { id: true, customerName: true, businessName: true } },
        assignedTo: { select: { id: true, fullName: true } },
      },
      orderBy: { date: "desc" },
      take: PAGE_SIZE,
    }),
    prisma.message.count({ where: scope }),
    prisma.employee.findMany({
      where: { organizationId: organization.id, status: "ACTIVE" },
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
    }),
    prisma.customer.findMany({
      where: { organizationId: organization.id, status: { not: "INACTIVE" } },
      select: { id: true, customerName: true, businessName: true },
      orderBy: { customerName: "asc" },
    }),
  ]);

  const now = new Date();
  const messagesWithOverdue = messages.map(m => ({
    ...m,
    isOverdue: !!(m.dueDate && m.status !== "CLOSED" && m.dueDate < now),
  }));

  return (
    <MessagesClient
      initialMessages={JSON.parse(JSON.stringify(messagesWithOverdue))}
      initialTotal={total}
      pageSize={PAGE_SIZE}
      employees={employees}
      customers={customers}
      currentUserId={userId}
      isManager={isManager}
    />
  );
}
