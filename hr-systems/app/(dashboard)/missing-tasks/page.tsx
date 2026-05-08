import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { MissingTasksClient } from "./_components/missing-tasks-client";

export const metadata = { title: "Missing Tasks — HR System" };

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];

export default async function MissingTasksPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = Number(session.user.id);
  const isManager = MANAGER_ROLES.includes(session.user.role);

  const [items, employees] = await Promise.all([
    prisma.missingTask.findMany({
      where: isManager ? {} : { employeeId: userId },
      include: {
        employee: { select: { id: true, fullName: true, department: true } },
        reviewedBy: { select: { id: true, fullName: true } },
      },
      orderBy: [{ status: "asc" }, { date: "desc" }],
    }),

    isManager
      ? prisma.employee.findMany({
          where: { status: "ACTIVE" },
          select: { id: true, fullName: true },
          orderBy: { fullName: "asc" },
        })
      : null,
  ]);

  const pendingCount = items.filter(i => i.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Missing Tasks"
        description={`Khai báo công việc chưa ghi vào Work Report${pendingCount > 0 ? ` · ${pendingCount} chờ duyệt` : ""}`}
      />
      <MissingTasksClient
        initialItems={items as any}
        employees={employees ?? undefined}
      />
    </div>
  );
}
