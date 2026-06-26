/**
 * Attendance status computation logic per PRD E3.1
 * Maps leave types + check-in/out to attendance status codes
 */

export type AttCode =
  | "X" | "X/2"
  | "P" | "P/2"
  | "L" | "L/2"
  | "CĐ" | "CĐ/2"
  | "TS" | "TS/2"
  | "U" | "U/2"
  | "XP" | "XU" | "PU" | "CĐU"
  | "--";

export interface DayInfo {
  date: Date;
  checkIn: Date | null;
  checkOut: Date | null;
  leaveType: string | null;
  leaveShift: "FULL_DAY" | "MORNING" | "AFTERNOON" | null;
  isHoliday: boolean;
  isWeekend: boolean; // Sunday
  isSaturday: boolean;
}

export interface AttSummary {
  standardDays: number;
  actualDays: number;
  payrollDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  holidayDays: number;
  specialLeaveDays: number;
  maternityDays: number;
  lateCount: number;
}

const WORK_START = 9 * 60; // 09:00 in minutes
const LUNCH_START = 12 * 60;
const WORK_RESUME = 13 * 60 + 30;
const LATE_THRESHOLD = 120; // 2 hours late = absent

/** Leave type → attendance code */
function leaveTypeToCode(type: string, shift: "FULL_DAY" | "MORNING" | "AFTERNOON"): AttCode {
  const isHalf = shift !== "FULL_DAY";
  switch (type) {
    case "PAID_LEAVE":
    case "SICK_LEAVE_PAID":
    case "HALF_DAY_PAID":
    case "VACATION":
    case "ILLNESS":
      return isHalf ? "P/2" : "P";
    case "UNPAID_LEAVE":
    case "INSURANCE_LEAVE":
    case "HALF_DAY_UNPAID":
    case "OTHER":
      return isHalf ? "U/2" : "U";
    case "SPECIAL_LEAVE":
      return isHalf ? "CĐ/2" : "CĐ";
    case "MATERNITY_LEAVE":
    case "CHILD_CARE_LEAVE":
      return isHalf ? "TS/2" : "TS";
    case "HOLIDAY":
      return isHalf ? "L/2" : "L";
    case "PERSONAL_TIME_PAID":
      return "P/2";
    case "COMPENSATORY_LEAVE":
    case "OUT_OF_OFFICE_WORK":
      return "X";
    default:
      return isHalf ? "U/2" : "U";
  }
}

/** Leave type deducts from payroll? */
export function leaveDeductsPayroll(type: string): boolean {
  return ["UNPAID_LEAVE", "INSURANCE_LEAVE", "HALF_DAY_UNPAID", "MATERNITY_LEAVE", "CHILD_CARE_LEAVE"].includes(type);
}

function minutesOf(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

/** Compute status code for a single day */
export function computeDayStatus(info: DayInfo): { code: AttCode; workUnit: number; leaveUnit: number } {
  const today = new Date();
  today.setHours(23, 59, 59);

  // Future date
  if (info.date > today) {
    if (info.isHoliday) return { code: "L", workUnit: 0, leaveUnit: 1 };
    return { code: "--", workUnit: 0, leaveUnit: 0 };
  }

  // Weekend/Sunday
  if (info.isWeekend) return { code: "--", workUnit: 0, leaveUnit: 0 };

  // Saturday with no work
  if (info.isSaturday && !info.checkIn && !info.leaveType)
    return { code: "--", workUnit: 0, leaveUnit: 0 };

  // Holiday takes precedence
  if (info.isHoliday) return { code: "L", workUnit: 0, leaveUnit: 1 };

  // Full-day leave
  if (info.leaveType && info.leaveShift === "FULL_DAY") {
    const code = leaveTypeToCode(info.leaveType, "FULL_DAY");
    const isWork = code === "X";
    return { code, workUnit: isWork ? 1 : 0, leaveUnit: isWork ? 0 : 1 };
  }

  // Has check-in data
  const hasCheckIn = !!info.checkIn;

  // Half-day leave + check-in → composite
  if (info.leaveType && info.leaveShift !== "FULL_DAY" && hasCheckIn) {
    // MORNING leave + afternoon check-in → XP or XU
    const leaveCode = leaveTypeToCode(info.leaveType, info.leaveShift!);
    const deducts = leaveDeductsPayroll(info.leaveType);
    if (deducts) {
      return { code: "XU", workUnit: 0.5, leaveUnit: 0.5 };
    }
    return { code: "XP", workUnit: 0.5, leaveUnit: 0.5 };
  }

  // Half-day leave, no check-in → P/2 or U/2
  if (info.leaveType && info.leaveShift !== "FULL_DAY" && !hasCheckIn) {
    const code = leaveTypeToCode(info.leaveType, info.leaveShift!);
    return { code, workUnit: 0, leaveUnit: 0.5 };
  }

  // No leave, has check-in
  if (hasCheckIn) {
    const ci = minutesOf(info.checkIn!);
    const lateBy = Math.max(0, ci - WORK_START);

    if (lateBy >= LATE_THRESHOLD) {
      // Very late → half absence
      return { code: "XU", workUnit: 0.5, leaveUnit: 0 };
    }
    return { code: "X", workUnit: 1, leaveUnit: 0 };
  }

  // No leave, no check-in, past day → unpaid absence
  return { code: "U", workUnit: 0, leaveUnit: 0 };
}

/** Compute period summary */
export function computeSummary(days: Array<{ code: AttCode; workUnit: number; leaveUnit: number; isWorkDay: boolean; leaveType?: string | null }>): AttSummary {
  let standardDays = 0, actualDays = 0, payrollDays = 0;
  let paidLeaveDays = 0, unpaidLeaveDays = 0, holidayDays = 0;
  let specialLeaveDays = 0, maternityDays = 0;
  const lateCount = 0;

  for (const d of days) {
    if (d.isWorkDay) standardDays += 1;
    actualDays += d.workUnit;

    switch (d.code) {
      case "X": case "X/2": payrollDays += d.workUnit; break;
      case "P": case "P/2": paidLeaveDays += d.leaveUnit; payrollDays += d.leaveUnit; break;
      case "L": case "L/2": holidayDays += d.leaveUnit; payrollDays += d.leaveUnit; break;
      case "CĐ": case "CĐ/2": specialLeaveDays += d.leaveUnit; payrollDays += d.leaveUnit; break;
      case "TS": case "TS/2": maternityDays += d.leaveUnit; break;
      case "U": case "U/2": unpaidLeaveDays += d.leaveUnit; break;
      case "XP": payrollDays += 0.5; paidLeaveDays += 0.5; actualDays += 0; break;
      case "XU": payrollDays += 0.5; unpaidLeaveDays += 0.5; break;
      case "PU": paidLeaveDays += 0.5; unpaidLeaveDays += 0.5; payrollDays += 0.5; break;
      case "CĐU": specialLeaveDays += 0.5; unpaidLeaveDays += 0.5; payrollDays += 0.5; break;
    }
  }

  return {
    standardDays,
    actualDays,
    payrollDays,
    paidLeaveDays,
    unpaidLeaveDays,
    holidayDays,
    specialLeaveDays,
    maternityDays,
    lateCount,
  };
}
