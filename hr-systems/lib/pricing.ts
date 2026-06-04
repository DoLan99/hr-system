export type PlanId = "FREE" | "STARTER" | "TEAM";

export interface PlanConfig {
  id: PlanId;
  name: string;
  priceVnd: number;
  priceLabel: string;
  seatLimit: number;
  features: string[];
  recommended?: boolean;
}

export const PLANS: Record<PlanId, PlanConfig> = {
  FREE: {
    id: "FREE",
    name: "Solo",
    priceVnd: 0,
    priceLabel: "Miễn phí",
    seatLimit: 1,
    features: [
      "1 thành viên (chỉ chủ workspace)",
      "Quản lý tasks & time logs cơ bản",
      "Không giới hạn customers",
      "Audit log 30 ngày",
    ],
  },
  STARTER: {
    id: "STARTER",
    name: "Starter",
    priceVnd: 299_000,
    priceLabel: "299.000đ / tháng",
    seatLimit: 10,
    features: [
      "Tối đa 10 thành viên",
      "Tất cả tính năng Solo",
      "Phân quyền nâng cao (HR, Manager, Accountant)",
      "Office Time tracking + duyệt",
      "Salary + Payments management",
      "Audit log 90 ngày",
    ],
    recommended: true,
  },
  TEAM: {
    id: "TEAM",
    name: "Team",
    priceVnd: 799_000,
    priceLabel: "799.000đ / tháng",
    seatLimit: 25,
    features: [
      "Tối đa 25 thành viên",
      "Tất cả tính năng Starter",
      "Anomaly detection (alerts bất thường)",
      "Activity heatmap + page stats",
      "Password Vault (lưu mật khẩu khách)",
      "Audit log không giới hạn",
      "Priority support",
    ],
  },
};

export const TRIAL_DAYS = 14;

export function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
}

export function getPlan(planId: string | null | undefined): PlanConfig {
  if (planId && planId in PLANS) return PLANS[planId as PlanId];
  return PLANS.FREE;
}

export function getSeatLimit(planId: string | null | undefined): number {
  return getPlan(planId).seatLimit;
}

export function isTrialActive(trialEndsAt: Date | null | undefined): boolean {
  if (!trialEndsAt) return false;
  return new Date(trialEndsAt) > new Date();
}

export function daysUntilTrialEnds(trialEndsAt: Date | null | undefined): number {
  if (!trialEndsAt) return 0;
  const diff = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export const BANK_INFO = {
  bankName: process.env.NEXT_PUBLIC_BANK_NAME ?? "Vietcombank",
  accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT ?? "0123456789",
  accountHolder: process.env.NEXT_PUBLIC_BANK_HOLDER ?? "DO THI LAN",
  branch: process.env.NEXT_PUBLIC_BANK_BRANCH ?? "Chi nhánh Hà Nội",
  transferNote: (orgSlug: string, planId: PlanId) =>
    `JOBIHOME ${orgSlug.toUpperCase()} ${planId}`,
};
