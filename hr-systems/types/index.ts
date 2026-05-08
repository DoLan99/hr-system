import type { Employee, Role, WorkList, WorkReport, TaskLibrary, SalarySummary } from "@prisma/client";

export type EmployeeWithRole = Employee & {
  role: Role;
  manager?: Employee | null;
};

export type WorkListWithRelations = WorkList & {
  assignedTo: Pick<Employee, "id" | "fullName" | "avatarUrl">;
  assignedBy: Pick<Employee, "id" | "fullName">;
  customer?: { id: number; customerName: string | null; businessName: string | null } | null;
};

export type WorkReportWithRelations = WorkReport & {
  employee: Pick<Employee, "id" | "fullName" | "avatarUrl">;
  task?: Pick<TaskLibrary, "taskId" | "taskName" | "stdTime"> | null;
  workList?: Pick<WorkList, "wlId" | "title"> | null;
};

export type SalarySummaryWithEmployee = SalarySummary & {
  employee: Pick<Employee, "id" | "fullName" | "avatarUrl" | "payType" | "hourlyRate" | "monthlySalary">;
};

// Session user type
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  roleLabel: string;
  permissions: Record<string, unknown>;
  department?: string | null;
  avatarUrl?: string | null;
}

// API Response types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Dashboard stats
export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  pendingApprovals: number;
  totalTasks: number;
  openTasks: number;
  overdueTasks: number;
  monthlySalaryTotal: number;
}

export interface EmployeeDashboardStats {
  openTasks: number;
  dueSoonTasks: number;
  overdueTasks: number;
  creditedHoursThisMonth: number;
  maxHoursMonth: number;
  estimatedSalary: number;
  remainingLeave: number;
  totalScore: number | null;
}
