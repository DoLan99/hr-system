export interface DayLoad {
  date: string;
  loadMinutes: number;
  utilization: number;
  taskCount: number;
}

export interface EmployeeWorkload {
  employeeId: number;
  fullName: string;
  department: string | null;
  dailyCapacityMinutes: number;
  totalLoadMinutes: number;
  totalCapacityMinutes: number;
  avgUtilization: number;
  days: DayLoad[];
}

export interface WorkloadResponse {
  startDate: string;
  endDate: string;
  dayCount: number;
  employees: EmployeeWorkload[];
}

export interface EmployeeForecast {
  employeeId: number;
  fullName: string;
  department: string | null;
  velocityMinutesPerWeek: number;
  backlogMinutes: number;
  backlogTasks: number;
  etaWeeks: number | null;
  etaDate: string | null;
  confidence: "low" | "medium" | "high";
}

export interface ForecastResponse {
  asOf: string;
  employees: EmployeeForecast[];
  team: {
    totalBacklogMinutes: number;
    totalVelocityPerWeek: number;
    etaWeeks: number | null;
    etaDate: string | null;
  };
}

export interface SkillCell {
  taskType: string;
  experienceCount: number;
  experienceMinutes: number;
}

export interface EmployeeSkillRow {
  employeeId: number;
  fullName: string;
  department: string | null;
  utilization: number;
  skills: SkillCell[];
}

export interface SkillLoadResponse {
  taskTypes: string[];
  rows: EmployeeSkillRow[];
}

export function isBusinessDay(d: Date): boolean {
  const day = d.getDay();
  return day !== 0 && day !== 6;
}

export function* iterDays(start: Date, end: Date): Generator<Date> {
  const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  while (cur <= last) {
    yield new Date(cur);
    cur.setDate(cur.getDate() + 1);
  }
}

export function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
