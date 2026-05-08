import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatMinutes, ROLES } from "@/lib/utils";
import {
  Users,
  ClipboardList,
  Clock,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  XCircle,
  CalendarClock,
} from "lucide-react";
import { format } from "date-fns";

async function getAdminStats(userId: number) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [employees, totalTasks, overdueTasks, pendingApprovals, summaries] =
    await Promise.all([
      prisma.employee.findMany({ select: { status: true } }),
      prisma.workList.count(),
      prisma.workList.count({ where: { isOverdue: true } }),
      prisma.officeTime.count({ where: { approvalStatus: "PENDING" } }),
      prisma.salarySummary.findMany({
        where: { month, year },
        include: {
          employee: {
            select: { fullName: true, avatarUrl: true, payType: true },
          },
        },
      }),
    ]);

  return {
    totalEmployees: employees.length,
    activeEmployees: employees.filter((e) => e.status === "ACTIVE").length,
    totalTasks,
    overdueTasks,
    pendingApprovals,
    summaries,
    monthlySalaryTotal: summaries.reduce(
      (sum, s) => sum + Number(s.totalCalc),
      0
    ),
  };
}

async function getEmployeeStats(userId: number) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0);

  const [openTasks, overdueTasks, summary, creditedTime] = await Promise.all([
    prisma.workList.count({
      where: {
        assignedToId: userId,
        status: { in: ["NOT_STARTED", "IN_PROGRESS", "BLOCKED"] },
      },
    }),
    prisma.workList.count({
      where: { assignedToId: userId, isOverdue: true },
    }),
    prisma.salarySummary.findUnique({
      where: {
        employeeId_month_year: { employeeId: userId, month, year },
      },
    }),
    prisma.workReport.aggregate({
      where: {
        employeeId: userId,
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { creditedTime: true },
    }),
  ]);

  return {
    openTasks,
    overdueTasks,
    creditedMinutes: creditedTime._sum.creditedTime ?? 0,
    estimatedSalary: summary ? Number(summary.totalCalc) : 0,
    totalScore: summary ? Number(summary.totalScore) : null,
  };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const user = session.user as any;
  const userId = Number(user.id);
  const isAdminOrManager = [
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.MANAGER,
  ].includes(user.role);

  const stats = isAdminOrManager
    ? await getAdminStats(userId)
    : await getEmployeeStats(userId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight leading-tight">
          {isAdminOrManager ? "Dashboard" : `Xin chào, ${user.name}`}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {format(new Date(), "EEEE, dd/MM/yyyy")}
        </p>
      </div>

      {/* Stats cards */}
      {isAdminOrManager ? (
        <AdminStats stats={stats as any} />
      ) : (
        <EmployeeStats stats={stats as any} user={user} />
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "blue",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color?: "blue" | "green" | "red" | "amber";
}) {
  const iconColors = {
    blue:  "bg-blue-50 text-blue-500",
    green: "bg-emerald-50 text-emerald-500",
    red:   "bg-red-50 text-red-500",
    amber: "bg-amber-50 text-amber-500",
  };
  const valColors = {
    blue:  "text-slate-900",
    green: "text-slate-900",
    red:   "text-red-600",
    amber: "text-amber-600",
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-medium text-slate-500 uppercase tracking-wide">{title}</p>
          <p className={`text-[26px] font-bold mt-1 leading-none ${valColors[color]}`}>{value}</p>
          {subtitle && <p className="text-[12px] text-slate-400 mt-1.5">{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-lg flex-shrink-0 ${iconColors[color]}`}>
          <Icon className="w-[18px] h-[18px]" />
        </div>
      </div>
    </div>
  );
}

function AdminStats({ stats }: { stats: any }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Nhân viên"
        value={stats.totalEmployees}
        subtitle={`Active: ${stats.activeEmployees}`}
        icon={Users}
        color="blue"
      />
      <StatCard
        title="Tasks"
        value={stats.totalTasks}
        subtitle={`Overdue: ${stats.overdueTasks}`}
        icon={ClipboardList}
        color={stats.overdueTasks > 0 ? "red" : "green"}
      />
      <StatCard
        title="Chờ duyệt"
        value={stats.pendingApprovals}
        subtitle="Office time"
        icon={Clock}
        color={stats.pendingApprovals > 0 ? "amber" : "green"}
      />
      <StatCard
        title="Lương tháng này"
        value={formatCurrency(stats.monthlySalaryTotal)}
        subtitle={`${stats.summaries.length} nhân viên`}
        icon={TrendingUp}
        color="blue"
      />
    </div>
  );
}

function EmployeeStats({ stats, user }: { stats: any; user: any }) {
  const hours = Math.floor(stats.creditedMinutes / 60);
  const maxHours = 160;
  const pct = Math.min(100, Math.round((hours / maxHours) * 100));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tasks đang mở"
          value={stats.openTasks}
          icon={ClipboardList}
          color="blue"
        />
        <StatCard
          title="Quá hạn"
          value={stats.overdueTasks}
          icon={AlertTriangle}
          color={stats.overdueTasks > 0 ? "red" : "green"}
        />
        <StatCard
          title="Lương tạm tính"
          value={formatCurrency(stats.estimatedSalary)}
          subtitle="Chưa xác nhận"
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          title="Điểm hiệu suất"
          value={stats.totalScore ? `${stats.totalScore}/100` : "—"}
          icon={CheckCircle2}
          color="green"
        />
      </div>

      {/* Hours bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-card">
        <div className="flex justify-between items-center mb-3">
          <p className="text-[13px] font-semibold text-slate-700">
            Giờ credited tháng này
          </p>
          <p className="text-[13px] font-medium text-slate-500">
            {formatMinutes(stats.creditedMinutes)} / {maxHours}h
          </p>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-[12px] text-slate-400 mt-1.5">{pct}% của giới hạn tháng</p>
      </div>
    </div>
  );
}
