import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { MessagesClient } from "./_components/messages-client";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = Number(session.user.id);

  const [messages, employees, customers] = await Promise.all([
    prisma.message.findMany({
      include: {
        customer: { select: { id: true, customerName: true, businessName: true } },
        assignedTo: { select: { id: true, fullName: true } },
      },
      orderBy: { date: "desc" },
      take: 200,
    }),
    prisma.employee.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
    }),
    prisma.customer.findMany({
      where: { status: { not: "INACTIVE" } },
      select: { id: true, customerName: true, businessName: true },
      orderBy: { customerName: "asc" },
    }),
  ]);

  return (
    <MessagesClient
      initialMessages={JSON.parse(JSON.stringify(messages))}
      employees={employees}
      customers={customers}
      currentUserId={userId}
    />
  );
}
