// Business logic cho Time Logs — credited time calculation
import type { TaskType, TimeLogApprovalStatus } from "@prisma/client";

const VIDEO_REQUIRED_TYPES: TaskType[] = ["LEARNING", "NEW_RESEARCH"];

export type CreditedResult = {
  creditedMinutes: number | null; // null = chưa quyết (pending)
  approvalStatus: TimeLogApprovalStatus;
  reason: string | null;
};

export type CalcInput = {
  taskType: TaskType;
  durationMinutes: number;
  estimatedTime: number | null;
  actualTimeTotalBefore: number; // tổng phút đã log của task TRƯỚC log này
  videoLink?: string | null;
  requiresVideo?: boolean; // override (manager set trên task)
};

/**
 * Tính credited minutes cho 1 time log mới được tạo.
 *
 * Rules:
 * 1. task_type = LEARNING / NEW_RESEARCH → bắt buộc video
 *    - Có video → PENDING (manager duyệt)
 *    - Không video → REJECTED (credited = 0)
 *
 * 2. Task type khác:
 *    - Nếu (actualTotalBefore + duration) ≤ estimatedTime → AUTO_APPROVED, credited = duration
 *    - Nếu vượt estimate:
 *      - Có video → PENDING (manager duyệt)
 *      - Không video → AUTO_APPROVED nhưng credited prorate (chỉ tính phần trong estimate)
 *
 * 3. Task có requiresVideo = TRUE (manager đặt) → giống LEARNING
 *
 * 4. Estimate NULL → coi như không giới hạn → AUTO_APPROVED full duration
 */
export function calcCreditedMinutes(input: CalcInput): CreditedResult {
  const {
    taskType,
    durationMinutes,
    estimatedTime,
    actualTimeTotalBefore,
    videoLink,
    requiresVideo,
  } = input;

  const hasVideo = !!videoLink?.trim();
  const isVideoRequiredType =
    requiresVideo === true || VIDEO_REQUIRED_TYPES.includes(taskType);

  // Rule 1 & 3: video-required types
  if (isVideoRequiredType) {
    if (!hasVideo) {
      return {
        creditedMinutes: 0,
        approvalStatus: "REJECTED",
        reason: "Thiếu video bắt buộc cho task type này",
      };
    }
    return {
      creditedMinutes: null,
      approvalStatus: "PENDING",
      reason: "Chờ Manager duyệt",
    };
  }

  // Rule 4: estimate null → unlimited
  if (estimatedTime === null) {
    return {
      creditedMinutes: durationMinutes,
      approvalStatus: "AUTO_APPROVED",
      reason: null,
    };
  }

  // Rule 2: tính tổng sau log này
  const totalAfter = actualTimeTotalBefore + durationMinutes;

  if (totalAfter <= estimatedTime) {
    return {
      creditedMinutes: durationMinutes,
      approvalStatus: "AUTO_APPROVED",
      reason: null,
    };
  }

  // Vượt estimate
  if (hasVideo) {
    return {
      creditedMinutes: null,
      approvalStatus: "PENDING",
      reason: "Vượt estimate, có video — chờ Manager duyệt",
    };
  }

  // Vượt estimate, không video → prorate
  // Tính phần còn lại trong estimate (có thể đã âm nếu trước đó đã vượt)
  const remainingInEstimate = Math.max(0, estimatedTime - actualTimeTotalBefore);
  const creditedFromThisLog = Math.min(durationMinutes, remainingInEstimate);

  return {
    creditedMinutes: creditedFromThisLog,
    approvalStatus: "AUTO_APPROVED",
    reason: `Vượt estimate, không video → chỉ credited ${creditedFromThisLog}/${durationMinutes} phút`,
  };
}

export function approvalStatusLabel(status: TimeLogApprovalStatus) {
  return {
    AUTO_APPROVED: { label: "Tự duyệt", color: "text-green-600 bg-green-50" },
    PENDING: { label: "Chờ duyệt", color: "text-blue-600 bg-blue-50" },
    APPROVED: { label: "Đã duyệt", color: "text-emerald-600 bg-emerald-50" },
    REJECTED: { label: "Từ chối", color: "text-red-600 bg-red-50" },
  }[status];
}

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  NORMAL: "Bình thường",
  LEARNING: "Học & Tìm hiểu",
  NEW_RESEARCH: "Việc mới / R&D",
  MEETING: "Họp",
  ADMIN: "Hành chính",
  BILLABLE_CLIENT: "Tính tiền khách",
  INTERNAL: "Nội bộ",
};

export const TASK_TYPE_COLORS: Record<TaskType, string> = {
  NORMAL: "bg-slate-100 text-slate-700",
  LEARNING: "bg-violet-100 text-violet-700",
  NEW_RESEARCH: "bg-amber-100 text-amber-700",
  MEETING: "bg-sky-100 text-sky-700",
  ADMIN: "bg-zinc-100 text-zinc-700",
  BILLABLE_CLIENT: "bg-emerald-100 text-emerald-700",
  INTERNAL: "bg-indigo-100 text-indigo-700",
};

export function isVideoRequired(taskType: TaskType, requiresVideo: boolean): boolean {
  return requiresVideo || VIDEO_REQUIRED_TYPES.includes(taskType);
}

/** Tổng credited minutes cho một list time logs */
export function sumCreditedMinutes(logs: { creditedMinutes: number | null }[]): number {
  return logs.reduce((s, l) => s + (l.creditedMinutes ?? 0), 0);
}

/** Tổng duration minutes (giờ thực) */
export function sumDurationMinutes(logs: { durationMinutes: number }[]): number {
  return logs.reduce((s, l) => s + l.durationMinutes, 0);
}
