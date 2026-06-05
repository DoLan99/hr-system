import React, { useState } from "react"
import { Link } from "react-router"
import { Check, ChevronDown, ArrowRight } from "lucide-react"
import { BLUE, GREEN } from "../shared"

type Cell = boolean | string

interface TableGroup {
  group: string
  rows: { feature: string; hint?: string; solo: Cell; starter: Cell; team: Cell }[]
}

const TABLE_GROUPS: TableGroup[] = [
  {
    group: "Quản lý công việc",
    rows: [
      { feature: "Thành viên", solo: "Tối đa 5", starter: "Không giới hạn", team: "Không giới hạn" },
      { feature: "Dự án đang hoạt động", solo: "3 dự án", starter: "Không giới hạn", team: "Không giới hạn" },
      { feature: "Kanban & Sprint board", solo: true, starter: true, team: true },
      { feature: "Gán task & deadline", solo: true, starter: true, team: true },
      { feature: "Sub-task & checklist", solo: false, starter: true, team: true },
      { feature: "Milestone & Gantt view", solo: false, starter: false, team: true },
    ],
  },
  {
    group: "Chấm công & Thời gian",
    rows: [
      { feature: "Chấm công qua app mobile", solo: true, starter: true, team: true },
      { feature: "Timer tự động khi bắt đầu task", solo: false, starter: true, team: true },
      { feature: "Phát hiện đi muộn & tăng ca", solo: false, starter: true, team: true },
      { feature: "Báo cáo chấm công PDF/Excel", solo: false, starter: true, team: true },
      { feature: "Lịch sử chấm công (ngày lưu)", solo: "30 ngày", starter: "1 năm", team: "Không giới hạn" },
    ],
  },
  {
    group: "Lương & Tài chính",
    rows: [
      { feature: "Bảng lương tự động từ chấm công", solo: false, starter: true, team: true },
      { feature: "Tính thuế TNCN & BHXH", solo: false, starter: true, team: true },
      { feature: "Phiếu lương điện tử gửi email", solo: false, starter: true, team: true },
      { feature: "Thanh toán qua VNPAY, MoMo", solo: false, starter: true, team: true },
      { feature: "Tích hợp kế toán bên ngoài", hint: "MISA, Fast Accounting", solo: false, starter: false, team: true },
    ],
  },
  {
    group: "Quản lý nhân sự",
    rows: [
      { feature: "Hồ sơ nhân viên", solo: true, starter: true, team: true },
      { feature: "Phân quyền theo vai trò", solo: "Cơ bản", starter: "Nâng cao", team: "Tùy chỉnh" },
      { feature: "Quản lý nghỉ phép & OT", solo: false, starter: true, team: true },
      { feature: "Đa phòng ban & team lồng nhau", solo: false, starter: true, team: true },
      { feature: "Onboarding workflow tự động", solo: false, starter: false, team: true },
    ],
  },
  {
    group: "Bảo mật & Kiểm toán",
    rows: [
      { feature: "Mã hóa SSL / AES-256", solo: true, starter: true, team: true },
      { feature: "Audit log (lịch sử thao tác)", solo: "30 ngày", starter: "1 năm", team: "Không giới hạn" },
      { feature: "Phát hiện hành động bất thường", solo: false, starter: true, team: true },
      { feature: "SSO / SAML đăng nhập", solo: false, starter: false, team: true },
      { feature: "IP allowlist & 2FA bắt buộc", solo: false, starter: false, team: true },
    ],
  },
  {
    group: "Báo cáo & Phân tích",
    rows: [
      { feature: "Dashboard năng suất team", solo: false, starter: true, team: true },
      { feature: "Activity heatmap", solo: false, starter: true, team: true },
      { feature: "Báo cáo tùy chỉnh", solo: false, starter: false, team: true },
      { feature: "Xuất dữ liệu CSV / Excel", solo: false, starter: true, team: true },
    ],
  },
  {
    group: "Hỗ trợ",
    rows: [
      { feature: "Email support", solo: true, starter: true, team: true },
      { feature: "Live chat ưu tiên qua Zalo", solo: false, starter: true, team: true },
      { feature: "Onboarding 1-1", solo: false, starter: false, team: true },
      { feature: "Account manager riêng", solo: false, starter: false, team: true },
      { feature: "SLA uptime", solo: "Không cam kết", starter: "99.5%", team: "99.9%" },
    ],
  },
]

function CellValue({ val, highlight }: { val: Cell; highlight: boolean }) {
  if (val === true)
    return (
      <div
        className="w-5 h-5 rounded-full mx-auto flex items-center justify-center"
        style={{ background: highlight ? BLUE : "#F0FDF4", border: highlight ? "none" : "1px solid #BBF7D0" }}
      >
        <Check size={10} strokeWidth={3} color={highlight ? "#fff" : GREEN} />
      </div>
    )
  if (val === false)
    return <span className="block text-center text-gray-300 text-lg leading-none select-none">—</span>
  return (
    <span
      className="block text-center text-[12px] font-medium leading-tight"
      style={{ color: highlight ? BLUE : "#4B5563" }}
    >
      {val}
    </span>
  )
}

export default function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly")
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(TABLE_GROUPS.map((g) => [g.group, true]))
  )

  const toggleGroup = (g: string) =>
    setOpenGroups((prev) => ({ ...prev, [g]: !prev[g] }))

  const plans = [
    {
      name: "Solo",
      desc: "Cá nhân & team nhỏ",
      monthly: "0đ",
      yearly: "0đ",
      period: "miễn phí mãi",
      highlight: false,
      cta: "Bắt đầu miễn phí",
    },
    {
      name: "Starter",
      desc: "Startup 5–20 người",
      monthly: "299.000đ",
      yearly: "249.000đ",
      period: "/ tháng",
      highlight: true,
      badge: "Phổ biến nhất",
      cta: "Dùng thử 14 ngày",
    },
    {
      name: "Team",
      desc: "Doanh nghiệp 20+",
      monthly: "799.000đ",
      yearly: "659.000đ",
      period: "/ tháng",
      highlight: false,
      cta: "Liên hệ tư vấn",
    },
  ]

  return (
    <section className="py-24 bg-white">
      <div className="max-w-[1060px] mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold mb-5 border"
            style={{ background: "#EEF2FF", borderColor: "#C7D2FE", color: BLUE }}
          >
            Bảng giá
          </div>
          <h1 className="text-[32px] font-bold text-gray-900 tracking-tight leading-tight mb-3">
            Giá rõ ràng, không phí ẩn
          </h1>
          <p className="text-[15px] text-gray-400 mb-8">
            Dùng thử 14 ngày đầy đủ tính năng — hủy bất cứ lúc nào, không cần thẻ tín dụng.
          </p>

          {/* Toggle */}
          <div
            className="inline-flex items-center rounded-xl p-1 gap-0.5"
            style={{ background: "#F3F4F6", border: "1px solid #E5E7EB" }}
          >
            {(["monthly", "yearly"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setBilling(c)}
                className="relative flex items-center gap-2 px-5 py-2 rounded-lg text-[13px] font-semibold transition-all"
                style={
                  billing === c
                    ? { background: "#fff", color: "#111827", boxShadow: "0 1px 4px rgba(0,0,0,0.10)" }
                    : { color: "#9CA3AF" }
                }
              >
                {c === "monthly" ? "Hàng tháng" : "Hàng năm"}
                {c === "yearly" && (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={
                      billing === "yearly"
                        ? { background: "#DCFCE7", color: "#15803D" }
                        : { background: "#E5E7EB", color: "#9CA3AF" }
                    }
                  >
                    2 tháng miễn phí
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="relative flex flex-col rounded-2xl bg-white overflow-visible"
              style={
                plan.highlight
                  ? { border: `2px solid ${BLUE}`, boxShadow: `0 12px 40px ${BLUE}22` }
                  : { border: "1px solid #E5E7EB", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }
              }
            >
              {(plan as any).badge && (
                <div className="absolute -top-3.5 inset-x-0 flex justify-center">
                  <span
                    className="text-[11px] font-bold px-4 py-1 rounded-full text-white"
                    style={{ background: BLUE, boxShadow: `0 2px 8px ${BLUE}55` }}
                  >
                    {(plan as any).badge}
                  </span>
                </div>
              )}

              <div className="p-7 flex flex-col flex-1">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                      {plan.name}
                    </span>
                    {plan.highlight && billing === "yearly" && (
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: "#DCFCE7", color: "#15803D" }}
                      >
                        Tiết kiệm 600k/năm
                      </span>
                    )}
                  </div>
                  <p className="text-[12.5px] text-gray-400 leading-snug">{plan.desc}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-end gap-1.5 leading-none mb-1">
                    <span
                      className="font-extrabold"
                      style={{ fontSize: 38, color: plan.highlight ? BLUE : "#111827", lineHeight: 1 }}
                    >
                      {billing === "monthly" ? plan.monthly : plan.yearly}
                    </span>
                  </div>
                  <p className="text-[12px] text-gray-400 mt-1.5">
                    {plan.period}
                    {billing === "yearly" && plan.name !== "Solo" && (
                      <span className="ml-2 line-through text-gray-300">
                        {plan.monthly}
                      </span>
                    )}
                  </p>
                </div>

                <div className="border-t border-gray-100 mb-6" />

                <button
                  className="w-full h-11 rounded-xl text-[13.5px] font-semibold transition-all"
                  style={
                    plan.highlight
                      ? { background: BLUE, color: "#fff", boxShadow: `0 4px 16px ${BLUE}40` }
                      : plan.name === "Team"
                      ? { border: `1.5px solid ${BLUE}`, color: BLUE, background: "transparent" }
                      : { background: "#F3F4F6", color: "#374151" }
                  }
                >
                  {plan.cta}
                </button>

                <p className="text-center text-[11px] text-gray-400 mt-3">
                  {plan.name === "Solo"
                    ? "Không cần thẻ tín dụng"
                    : plan.name === "Starter"
                    ? "Hủy bất cứ lúc nào"
                    : "Phản hồi trong 24 giờ"}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison table */}
        <div className="mb-14">
          <h2 className="text-[18px] font-bold text-gray-900 text-center mb-8">
            So sánh chi tiết tính năng
          </h2>

          <div
            className="grid rounded-xl overflow-hidden mb-1"
            style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr", border: "1px solid #E5E7EB" }}
          >
            <div className="bg-gray-50 px-5 py-3.5 border-r border-gray-200">
              <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide">Tính năng</span>
            </div>
            {plans.map((plan) => (
              <div
                key={plan.name}
                className="px-4 py-3.5 flex flex-col items-center justify-center"
                style={
                  plan.highlight
                    ? { background: `${BLUE}0D`, borderLeft: `2px solid ${BLUE}` }
                    : { background: "#FAFAFA", borderLeft: "1px solid #E5E7EB" }
                }
              >
                <span
                  className="text-[12px] font-bold uppercase tracking-wide"
                  style={{ color: plan.highlight ? BLUE : "#374151" }}
                >
                  {plan.name}
                </span>
                <span className="text-[11px] text-gray-400 mt-0.5">
                  {billing === "monthly" ? plan.monthly : plan.yearly}
                  {plan.name !== "Solo" && <span className="text-gray-300">/th</span>}
                </span>
              </div>
            ))}
          </div>

          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #E5E7EB" }}>
            {TABLE_GROUPS.map((group, gi) => (
              <div key={group.group}>
                <button
                  onClick={() => toggleGroup(group.group)}
                  className="w-full flex items-center justify-between px-5 py-3 text-left transition-colors hover:bg-gray-50"
                  style={{ background: "#F8F9FA", borderTop: gi > 0 ? "1px solid #E5E7EB" : "none" }}
                >
                  <span className="text-[12px] font-bold text-gray-700 uppercase tracking-wide">
                    {group.group}
                  </span>
                  <ChevronDown
                    size={13}
                    className="text-gray-400 transition-transform"
                    style={{ transform: openGroups[group.group] ? "rotate(180deg)" : "none" }}
                  />
                </button>

                {openGroups[group.group] &&
                  group.rows.map((row, ri) => (
                    <div
                      key={row.feature}
                      className="grid"
                      style={{
                        gridTemplateColumns: "1fr 1fr 1fr 1fr",
                        borderTop: "1px solid #F3F4F6",
                        background: ri % 2 === 0 ? "#fff" : "#FAFAFA",
                      }}
                    >
                      <div className="px-5 py-3.5 flex flex-col justify-center border-r border-gray-100">
                        <span className="text-[13px] text-gray-700 font-medium leading-snug">
                          {row.feature}
                        </span>
                        {row.hint && (
                          <span className="text-[11px] text-gray-400 mt-0.5">{row.hint}</span>
                        )}
                      </div>

                      {(["solo", "starter", "team"] as const).map((key) => (
                        <div
                          key={key}
                          className="px-4 py-3.5 flex items-center justify-center"
                          style={
                            key === "starter"
                              ? { background: `${BLUE}06`, borderLeft: `2px solid ${BLUE}30` }
                              : { borderLeft: "1px solid #F3F4F6" }
                          }
                        >
                          <CellValue val={row[key]} highlight={key === "starter"} />
                        </div>
                      ))}
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>

        {/* Footer strip */}
        <div
          className="rounded-2xl px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ background: "#F8F9FA", border: "1px solid #E5E7EB" }}
        >
          <div className="flex items-center gap-3 text-[13px] text-gray-500">
            <svg width="16" height="18" viewBox="0 0 16 18" fill="none">
              <path d="M8 0L1 3.5V9C1 13.1 4.1 16.9 8 18C11.9 16.9 15 13.1 15 9V3.5L8 0Z" fill="#DCFCE7" stroke="#6EE7B7" strokeWidth="0.8"/>
              <path d="M5.5 9L7.2 10.7L10.5 7.5" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>
              Bảo mật SSL · Thanh toán qua{" "}
              <strong className="text-gray-700">VNPAY</strong>,{" "}
              <strong className="text-gray-700">MoMo</strong>,{" "}
              chuyển khoản · Hóa đơn VAT đầy đủ
            </span>
          </div>

          <Link
            to="/dat-lich-demo"
            className="flex-shrink-0 inline-flex items-center gap-2 h-10 px-5 rounded-xl text-[13.5px] font-semibold border transition-colors hover:bg-blue-50 whitespace-nowrap"
            style={{ borderColor: BLUE, color: BLUE }}
          >
            Chưa chắc? Đặt lịch demo 15 phút
            <ArrowRight size={14} />
          </Link>
        </div>

      </div>
    </section>
  )
}
