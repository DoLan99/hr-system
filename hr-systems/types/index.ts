import type {
  Employee,
  Role,
  Task,
  TimeLog,
  TaskTemplate,
  TemplateSuggestion,
  EstimateFlag,
  Customer,
  SalarySummary,
  TaskType,
  TaskStatus,
  TimeLogApprovalStatus,
} from "@prisma/client";

export type EmployeeWithRole = Employee & {
  role: Role;
  manager?: Employee | null;
};

export type TaskWithRelations = Task & {
  assignedTo: Pick<Employee, "id" | "fullName" | "avatarUrl">;
  assignedBy: Pick<Employee, "id" | "fullName">;
  customer?: Pick<Customer, "id" | "customerName" | "businessName"> | null;
  template?: Pick<TaskTemplate, "id" | "code" | "title"> | null;
  parentTask?: Pick<Task, "id" | "code" | "title"> | null;
  _count?: { timeLogs: number; subTasks: number };
};

export type TimeLogWithRelations = TimeLog & {
  employee: Pick<Employee, "id" | "fullName" | "avatarUrl">;
  task: Pick<Task, "id" | "code" | "title" | "taskType" | "estimatedTime" | "billable" | "customerId"> & {
    customer?: Pick<Customer, "id" | "customerName" | "businessName"> | null;
  };
  approvedBy?: Pick<Employee, "id" | "fullName"> | null;
};

export type TaskTemplateWithCount = TaskTemplate & {
  _count?: { tasks: number };
};

export type TemplateSuggestionWithRelations = TemplateSuggestion & {
  employee: Pick<Employee, "id" | "fullName" | "avatarUrl">;
  reviewedBy?: Pick<Employee, "id" | "fullName"> | null;
};

export type EstimateFlagWithRelations = EstimateFlag & {
  template: Pick<TaskTemplate, "id" | "code" | "title">;
  reviewedBy?: Pick<Employee, "id" | "fullName"> | null;
};

export type SalarySummaryWithEmployee = SalarySummary & {
  employee: Pick<Employee, "id" | "fullName" | "avatarUrl" | "payType" | "hourlyRate" | "monthlySalary">;
};

// Re-export enums for convenience
export type { TaskType, TaskStatus, TimeLogApprovalStatus };

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
