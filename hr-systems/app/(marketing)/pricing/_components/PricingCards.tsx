"use client";

import { useState } from "react";
import Link from "next/link";
import { formatVnd } from "@/lib/pricing";
import type { PlanConfig } from "@/lib/pricing";

function CheckIco() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12l5 5L20 6" />
    </svg>
  );
}

const YEARLY_DISCOUNT = 0.2; // 20% off

function yearlyPrice(monthly: number) {
  return Math.round((monthly * 12 * (1 - YEARLY_DISCOUNT)) / 12);
}

export function PricingCards({ plans, isSignedIn }: { plans: PlanConfig[]; isSignedIn: boolean }) {
  const [yearly, setYearly] = useState(false);

  return (
    <>
      {/* Toggle */}
      <div className="flex items-center justify-center gap-3 mb-10">
        <span
          className="text-[0.93rem] font-medium cursor-pointer select-none"
          style={{ color: yearly ? "var(--lp-text-3)" : "var(--lp-text)" }}
          onClick={() => setYearly(false)}
        >
          Theo tháng
        </span>

        <button
          type="button"
          role="switch"
          aria-checked={yearly}
          onClick={() => setYearly((v) => !v)}
          className="relative flex-shrink-0"
          style={{
            width: 44, height: 24, borderRadius: 100,
            background: yearly ? "var(--lp-accent)" : "var(--lp-border-strong)",
            border: "none", cursor: "pointer",
            transition: "background 0.2s",
            padding: 0,
          }}
        >
          <span
            style={{
              position: "absolute", top: 3, left: yearly ? 23 : 3,
              width: 18, height: 18, borderRadius: "50%", background: "#fff",
              transition: "left 0.2s",
              boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
            }}
          />
        </button>

        <span
          className="flex items-center gap-2 text-[0.93rem] font-medium cursor-pointer select-none"
          style={{ color: yearly ? "var(--lp-text)" : "var(--lp-text-3)" }}
          onClick={() => setYearly(true)}
        >
          Theo năm
          <span
            className="lp-mono text-[0.72rem] font-bold px-2 py-0.5 rounded-full"
            style={{
              background: yearly ? "rgba(74,222,128,0.15)" : "rgba(74,222,128,0.08)",
              color: "var(--lp-ok)",
              border: "1px solid rgba(74,222,128,0.25)",
              transition: "background 0.2s",
            }}
          >
            -20%
          </span>
        </span>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
        {plans.map((plan) => {
          const monthly = plan.priceVnd;
          const displayPrice = yearly && monthly > 0 ? yearlyPrice(monthly) : monthly;
          const annualTotal = yearly && monthly > 0 ? yearlyPrice(monthly) * 12 : null;

          return (
            <div key={plan.id} className={`lp-plan${plan.recommended ? " lp-plan-feature" : ""}`}>
              {plan.recommended && (
                <p className="text-center text-[0.75rem] mb-4" style={{ color: "var(--lp-text-3)" }}>Được 80% khách hàng chọn</p>
              )}
              <div className="pname">{plan.name}</div>

              <div className="pprice">
                {monthly === 0 ? (
                  "Miễn phí"
                ) : (
                  <>
                    {formatVnd(displayPrice)}
                    <small> /tháng</small>
                  </>
                )}
              </div>

              {annualTotal && (
                <div
                  className="lp-mono text-[0.78rem] -mt-2 mb-2"
                  style={{ color: "var(--lp-ok)" }}
                >
                  Thanh toán {formatVnd(annualTotal)}/năm
                  {" "}
                  <span style={{ color: "var(--lp-text-3)", textDecoration: "line-through" }}>
                    {formatVnd(monthly * 12)}
                  </span>
                </div>
              )}

              {yearly && monthly > 0 && (
                <div
                  className="lp-mono text-[0.72rem] font-bold px-2.5 py-1 rounded-full inline-block mb-3"
                  style={{ background: "rgba(74,222,128,0.12)", color: "var(--lp-ok)", border: "1px solid rgba(74,222,128,0.2)" }}
                >
                  Tiết kiệm {formatVnd(monthly * 12 - yearlyPrice(monthly) * 12)}/năm
                </div>
              )}

              <p className="pdesc">
                {monthly === 0
                  ? "Cho freelancer & cá nhân mới bắt đầu quản lý công việc."
                  : plan.id === "STARTER"
                  ? "Cho team đang tăng tốc cần phân quyền và tính lương."
                  : "Cho đội ngũ trưởng thành cần quan sát & bảo mật nâng cao."}
              </p>

              <ul>
                {plan.features.map((f) => (
                  <li key={f}><CheckIco />{f}</li>
                ))}
              </ul>

              <Link
                href={isSignedIn ? "/billing" : "/sign-up"}
                className={`lp-btn ${plan.recommended ? "lp-btn-primary" : "lp-btn-ghost"} lp-btn-block`}
              >
                {monthly === 0 ? "Bắt đầu miễn phí" : isSignedIn ? "Upgrade ngay" : "Dùng thử 14 ngày"}
              </Link>
            </div>
          );
        })}
      </div>

      <p className="text-center lp-mono text-[0.88rem] text-lp-text-3 mt-7">
        {yearly
          ? "Thanh toán hàng năm · Tiết kiệm 20% so với tháng · Hủy bất cứ lúc nào"
          : "Thanh toán qua chuyển khoản ngân hàng (Vietcombank) · Xuất hóa đơn VAT theo yêu cầu"}
      </p>

      {/* Enterprise strip */}
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl mt-5"
        style={{
          padding: "20px 28px",
          background: "var(--lp-surface)",
          border: "1px solid var(--lp-border)",
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="grid place-items-center rounded-xl flex-shrink-0"
            style={{ width: 44, height: 44, background: "linear-gradient(135deg, #0F1829, #1E2D5A)" }}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#6366F1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
              <line x1="12" y1="12" x2="12" y2="16" />
              <line x1="10" y1="14" x2="14" y2="14" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-[0.97rem]" style={{ color: "var(--lp-text)" }}>
              Trên 25 người? Chúng tôi có gói Enterprise riêng.
            </p>
            <p className="text-[0.83rem] mt-0.5" style={{ color: "var(--lp-text-3)" }}>
              Số lượng thành viên không giới hạn · SLA · Onboarding tận nơi · Hóa đơn theo quý
            </p>
          </div>
        </div>
        <Link
          href="/contact"
          className="lp-cta-demo flex-shrink-0"
          style={{
            height: 40, padding: "0 20px", borderRadius: 8,
            background: "transparent", color: "#94A3B8",
            border: "1px solid #2A3A6E",
            fontSize: 14, fontWeight: 500,
            display: "inline-flex", alignItems: "center",
            textDecoration: "none", whiteSpace: "nowrap",
          }}
        >
          Liên hệ báo giá →
        </Link>
      </div>
    </>
  );
}
