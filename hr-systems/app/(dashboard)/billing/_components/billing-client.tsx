"use client";

import { useState } from "react";
import { Check, AlertCircle, Crown, Building2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatVnd, type PlanConfig, type PlanId } from "@/lib/pricing";

interface Props {
  currentPlan: PlanId;
  status: "ACTIVE" | "SUSPENDED" | "CANCELLED" | "TRIAL";
  trialEndsAt: string | null;
  seatLimit: number;
  memberCount: number;
  orgSlug: string;
  orgName: string;
  isOwnerOrAdmin: boolean;
  plans: Record<PlanId, PlanConfig>;
  bankInfo: { bankName: string; accountNumber: string; accountHolder: string; branch: string };
  trialDaysLeft: number;
}

export function BillingClient({
  currentPlan, status, trialEndsAt, seatLimit, memberCount,
  orgSlug, orgName, isOwnerOrAdmin, plans, bankInfo, trialDaysLeft,
}: Props) {
  const [selectedPlan, setSelectedPlan] = useState<PlanConfig | null>(null);

  const trialEndDate = trialEndsAt ? new Date(trialEndsAt).toLocaleDateString("vi-VN") : null;
  const seatPercent = (memberCount / seatLimit) * 100;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Billing & Subscription</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Workspace <strong>{orgName}</strong> · slug <code className="px-1.5 bg-slate-100 dark:bg-slate-800 rounded text-xs">{orgSlug}</code>
        </p>
      </div>

      {/* Status card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Crown className="w-5 h-5 text-amber-500" />
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Gói hiện tại</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {plans[currentPlan].name}
                {status === "TRIAL" && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                    Trial
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600 dark:text-slate-400">
              <strong className={cn(seatPercent >= 90 && "text-red-600")}>{memberCount}</strong>
              <span className="text-slate-400">/{seatLimit} seats</span>
            </span>
          </div>
        </div>

        {status === "TRIAL" && trialEndDate && (
          <div className="px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-300">
              <strong>Còn {trialDaysLeft} ngày dùng thử</strong> — hết hạn {trialEndDate}. Upgrade gói trước khi hết hạn để tiếp tục sử dụng.
            </p>
          </div>
        )}

        {status === "SUSPENDED" && (
          <div className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-800 dark:text-red-300">
              Workspace đã bị tạm khóa do quá hạn thanh toán. Liên hệ admin để khôi phục.
            </p>
          </div>
        )}

        {seatPercent >= 90 && status !== "SUSPENDED" && (
          <div className="px-3 py-2 rounded-lg bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-orange-800 dark:text-orange-300">
              Sắp đạt giới hạn seats ({memberCount}/{seatLimit}). Upgrade lên gói cao hơn để thêm nhân viên.
            </p>
          </div>
        )}
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.keys(plans) as PlanId[]).map((planId) => {
          const plan = plans[planId];
          const isCurrent = planId === currentPlan;
          return (
            <div
              key={planId}
              className={cn(
                "bg-white dark:bg-slate-900 rounded-xl border-2 p-5 flex flex-col gap-4 relative",
                plan.recommended ? "border-blue-500" : "border-slate-200 dark:border-slate-700",
                isCurrent && "ring-2 ring-emerald-500",
              )}
            >
              {plan.recommended && (
                <span className="absolute -top-3 left-4 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-500 text-white">
                  Khuyến nghị
                </span>
              )}
              {isCurrent && (
                <span className="absolute -top-3 right-4 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500 text-white">
                  Hiện tại
                </span>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-slate-400" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{plan.name}</h3>
                </div>
                <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">{plan.priceLabel}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{plan.seatLimit} thành viên tối đa</p>
              </div>

              <ul className="space-y-2 text-sm flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {!isCurrent && plan.priceVnd > 0 && isOwnerOrAdmin && (
                <button
                  onClick={() => setSelectedPlan(plan)}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
                >
                  {currentPlan === "FREE" ? "Upgrade" : (plan.priceVnd > plans[currentPlan].priceVnd ? "Upgrade" : "Downgrade")}
                </button>
              )}
              {isCurrent && (
                <div className="text-center py-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                  ✓ Đang dùng
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!isOwnerOrAdmin && (
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
          Chỉ Owner / Admin có quyền thay đổi gói thanh toán.
        </p>
      )}

      {/* Payment modal */}
      {selectedPlan && (
        <PaymentModal
          plan={selectedPlan}
          orgSlug={orgSlug}
          bankInfo={bankInfo}
          onClose={() => setSelectedPlan(null)}
        />
      )}
    </div>
  );
}

function PaymentModal({
  plan, orgSlug, bankInfo, onClose,
}: {
  plan: PlanConfig;
  orgSlug: string;
  bankInfo: { bankName: string; accountNumber: string; accountHolder: string; branch: string };
  onClose: () => void;
}) {
  const transferNote = `JOBIHOME ${orgSlug.toUpperCase()} ${plan.id}`;
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Thanh toán gói {plan.name}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {plan.priceLabel} · {plan.seatLimit} thành viên
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
        </div>

        <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 p-4 space-y-3">
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
            💳 Chuyển khoản theo thông tin sau:
          </p>

          {[
            { label: "Ngân hàng", value: bankInfo.bankName, key: "bank" },
            { label: "Số tài khoản", value: bankInfo.accountNumber, key: "account" },
            { label: "Chủ tài khoản", value: bankInfo.accountHolder, key: "holder" },
            { label: "Chi nhánh", value: bankInfo.branch, key: "branch" },
            { label: "Số tiền", value: formatVnd(plan.priceVnd), key: "amount" },
            { label: "Nội dung CK", value: transferNote, key: "note" },
          ].map(({ label, value, key }) => (
            <div key={key} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-600 dark:text-slate-400 min-w-[100px]">{label}:</span>
              <div className="flex items-center gap-2 flex-1 justify-end">
                <code className="font-mono text-slate-900 dark:text-slate-100 text-right">{value}</code>
                <button
                  onClick={() => copy(value, key)}
                  className="text-xs px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100"
                >
                  {copied === key ? "✓" : "Copy"}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-sm text-slate-700 dark:text-slate-300 space-y-2">
          <p className="font-semibold">Sau khi chuyển khoản:</p>
          <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400">
            <li>Chụp ảnh biên lai chuyển khoản</li>
            <li>Email tới <strong>support@jobihome.vn</strong> kèm tên workspace</li>
            <li>Admin kích hoạt gói trong vòng 24h</li>
          </ol>
        </div>

        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition"
        >
          Đóng
        </button>
      </div>
    </div>
  );
}
