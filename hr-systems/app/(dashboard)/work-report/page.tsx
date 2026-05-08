import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { WorkReportClient } from "./_components/work-report-client";
import { EmployeeSwitcher } from "./_components/employee-switcher";
import { format } from "date-fns";

export const metadata = { title: "Work Report — HR System" };

interface Props {
  searchParams: { date?: string; employeeId?: string };
}

export default async function WorkReportPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = Number(session.user.id);
  const role = session.user.role;
  const isManager = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"].includes(role);

  // Ngày hiển thị — mặc định hôm nay
  const dateStr = searchParams.date ?? format(new Date(), "yyyy-MM-dd");

  // Employee đang xem — manager có thể xem của người khác
  const targetId =
    isManager && searchParams.employeeId
      ? Number(searchParams.employeeId)
      : userId;

  // Fetch dữ liệu ban đầu
  const dateStart = new Date(dateStr + "T00:00:00");
  const dateEnd = new Date(dateStr + "T23:59:59");

  const [entries, openTasks, targetEmployee, allEmployees] = await Promise.all([
    prisma.workReport.findMany({
      where: {
        employeeId: targetId,
        date: { gte: dateStart, lte: dateEnd },
      },
      include: {
        task: { select: { taskId: true, taskName: true, stdTime: true } },
        workList: { select: { wlId: true, title: true } },
      },
      orderBy: { id: "asc" },
    }),

    // Open tasks của employee đang xem
    prisma.workList.findMany({
      where: {
        assignedToId: targetId,
        status: { in: ["NOT_STARTED", "IN_PROGRESS", "BLOCKED"] },
      },
      select: { wlId: true, title: true },
      orderBy: { wlId: "asc" },
    }),

    // Tên employee đang xem
    targetId !== userId
      ? prisma.employee.findUnique({
          where: { id: targetId },
          select: { fullName: true },
        })
      : null,

    // Danh sách nhân viên cho manager switcher
    isManager
      ? prisma.employee.findMany({
          where: { status: "ACTIVE" },
          select: { id: true, fullName: true, department: true },
          orderBy: { fullName: "asc" },
        })
      : [],
  ]);

  const title = targetEmployee
    ? `Work Report — ${targetEmployee.fullName}`
    : "Work Report";

  const description = `Nhập và theo dõi công việc hằng ngày · ${dateStr}`;

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />

      {/* Manager: employee switcher */}
      {isManager && (
        <EmployeeSwitcher
          employees={allEmployees as any}
          currentId={targetId}
          dateStr={dateStr}
        />
      )}

      <WorkReportClient
        initialDate={dateStr}
        initialEntries={entries as any}
        openTasks={openTasks}
        employeeId={targetId}
      />
    </div>
  );
}

