import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ADMIN_ROLES, SUB_MANAGER_ROLES, getManagedEmployeeIds } from "@/lib/managed-scope";
import { TaskReviewsClient } from "./_components/task-reviews-client";

export const metadata = { title: "Task Reviews — HR System" };

export default async function TaskReviewsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = Number(session.user.id);
  const userRole = session.user.role;
  const isAdmin = ADMIN_ROLES.includes(userRole);
  const isSubManager = SUB_MANAGER_ROLES.includes(userRole);
  const isManager = isAdmin || isSubManager;

  const managedIds = isManager ? await getManagedEmployeeIds(userId, userRole) : [];

  const suggestionWhere: any = {};
  if (!isAdmin) {
    if (isSubManager) {
      suggestionWhere.employeeId = { in: managedIds ? [...managedIds, userId] : [userId] };
    } else {
      suggestionWhere.employeeId = userId;
    }
  }

  const [suggestions, flags] = await Promise.all([
    prisma.templateSuggestion.findMany({
      where: suggestionWhere,
      include: {
        employee: { select: { id: true, fullName: true, avatarUrl: true } },
        reviewedBy: { select: { id: true, fullName: true } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
    isManager
      ? prisma.estimateFlag.findMany({
          where: { status: "OPEN" },
          include: {
            template: { select: { id: true, code: true, title: true } },
          },
          orderBy: [{ flaggedAt: "desc" }],
        })
      : [],
  ]);

  return (
    <TaskReviewsClient
      initialSuggestions={suggestions as any}
      initialFlags={flags as any}
      isManager={isManager}
    />
  );
}
