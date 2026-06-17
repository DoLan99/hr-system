export type RecurrenceFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export const FREQ_LABEL: Record<RecurrenceFrequency, string> = {
  DAILY: "Hàng ngày",
  WEEKLY: "Hàng tuần",
  MONTHLY: "Hàng tháng",
  YEARLY: "Hàng năm",
};

export const DOW_LABEL = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

/**
 * Tính nextRunAt kế tiếp sau một mốc thời gian hiện tại.
 * daysOfWeek: mảng số 0-6 (0=CN, 1=T2,...)
 */
export function calcNextRun(
  from: Date,
  frequency: RecurrenceFrequency,
  interval: number,
  daysOfWeek: number[],
  dayOfMonth: number | null,
): Date {
  const d = new Date(from);

  switch (frequency) {
    case "DAILY": {
      d.setDate(d.getDate() + interval);
      break;
    }
    case "WEEKLY": {
      if (daysOfWeek.length === 0) {
        d.setDate(d.getDate() + interval * 7);
        break;
      }
      // Find next matching day of week
      const sorted = [...daysOfWeek].sort((a, b) => a - b);
      let found = false;
      for (let i = 1; i <= 7 * interval; i++) {
        const next = new Date(d);
        next.setDate(d.getDate() + i);
        if (sorted.includes(next.getDay())) {
          return next;
        }
        found = true;
      }
      if (!found) d.setDate(d.getDate() + interval * 7);
      break;
    }
    case "MONTHLY": {
      d.setMonth(d.getMonth() + interval);
      if (dayOfMonth) {
        d.setDate(Math.min(dayOfMonth, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
      }
      break;
    }
    case "YEARLY": {
      d.setFullYear(d.getFullYear() + interval);
      break;
    }
  }

  return d;
}

export function describeRecurrence(
  frequency: RecurrenceFrequency,
  interval: number,
  daysOfWeek: number[],
  dayOfMonth: number | null,
): string {
  const freq = FREQ_LABEL[frequency];
  if (interval === 1) {
    if (frequency === "WEEKLY" && daysOfWeek.length > 0) {
      return `${freq} vào ${daysOfWeek.map((d) => DOW_LABEL[d]).join(", ")}`;
    }
    if (frequency === "MONTHLY" && dayOfMonth) {
      return `${freq} vào ngày ${dayOfMonth}`;
    }
    return freq;
  }
  const unitMap: Record<RecurrenceFrequency, string> = {
    DAILY: "ngày", WEEKLY: "tuần", MONTHLY: "tháng", YEARLY: "năm",
  };
  return `Mỗi ${interval} ${unitMap[frequency]}`;
}
