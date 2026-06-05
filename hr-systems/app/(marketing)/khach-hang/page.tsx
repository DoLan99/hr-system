"use client";

import Link from "next/link";
import { ArrowRight, Quote } from "lucide-react";

const BLUE = "#3B5BDB";
const GREEN = "#0CA678";

const STORIES = [
  {
    initials: "LS", company: "Loship", logoColor: "#FF6B35",
    industry: "Logistics & Giao vận", industryColor: "#FFF3EE", industryText: "#CC4A10",
    result: "Giảm 3 buổi họp/tuần",
    resultDesc: "Toàn bộ cập nhật tiến độ chuyển lên jobihome — team lead không cần họp daily nữa.",
    quote: "jobihome giúp chúng tôi biết ai đang làm gì mà không cần hỏi. Tiết kiệm cả tiếng mỗi ngày.",
    name: "Minh Tuấn", title: "CTO", avatar: "MT", avatarBg: BLUE,
    metrics: [{ value: "3×", label: "ít cuộc họp hơn" }, { value: "40%", label: "tăng năng suất" }],
  },
  {
    initials: "TK", company: "Teko Vietnam", logoColor: "#7C3AED",
    industry: "Fintech & Công nghệ", industryColor: "#F3F0FF", industryText: "#5B21B6",
    result: "Tính lương tự động 100%",
    resultDesc: "Từ 2 ngày làm thủ công trong Excel xuống còn 20 phút — kế toán dành thời gian cho việc khác.",
    quote: "Trước đây mỗi tháng tôi mất 2 ngày tính lương. Bây giờ jobihome làm hết, tôi chỉ ký duyệt.",
    name: "Ngọc Kim", title: "Kế toán trưởng", avatar: "NK", avatarBg: "#7C3AED",
    metrics: [{ value: "2 ngày", label: "→ 20 phút" }, { value: "0 lỗi", label: "tính lương/tháng" }],
  },
  {
    initials: "BV", company: "Base.vn", logoColor: GREEN,
    industry: "SaaS & Phần mềm", industryColor: "#ECFDF5", industryText: "#065F46",
    result: "Onboard nhân viên mới trong 1 ngày",
    resultDesc: "Workflow tự động gửi checklist, phân quyền, mời workspace — HR không cần làm thủ công từng bước.",
    quote: "Nhân viên mới ngày đầu đã có đủ tool, task và quyền truy cập. Không ai phải hỏi lại nữa.",
    name: "Đức Hiệp", title: "Head of People", avatar: "DH", avatarBg: GREEN,
    metrics: [{ value: "1 ngày", label: "onboarding hoàn chỉnh" }, { value: "5×", label: "nhanh hơn trước" }],
  },
];

const LOGOS = [
  { name: "Loship", color: "#FF6B35" }, { name: "Teko", color: "#7C3AED" },
  { name: "Base.vn", color: GREEN }, { name: "MoMo", color: "#A21CAF" },
  { name: "Vnpay", color: "#1D4ED8" }, { name: "Ahamove", color: "#D97706" },
];

export default function CustomersPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Hero */}
      <section className="pt-20 pb-16 text-center px-6">
        <div className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold mb-6 border"
          style={{ background: "#EEF2FF", borderColor: "#C7D2FE", color: BLUE }}>
          Câu chuyện khách hàng
        </div>
        <h1 className="text-[38px] lg:text-[48px] font-extrabold text-gray-900 tracking-tight leading-[1.12] mb-4">
          Khách hàng của <span style={{ color: BLUE }}>jobihome.vn</span>
        </h1>
        <p className="text-[16px] text-gray-400 max-w-[480px] mx-auto leading-relaxed">
          Các startup và doanh nghiệp Việt đã thay đổi cách quản lý team như thế nào — bằng số liệu thực tế.
        </p>
      </section>

      {/* Logo strip */}
      <section className="border-y border-gray-100 py-8 px-6 mb-20">
        <p className="text-center text-[12px] font-semibold uppercase tracking-widest text-gray-300 mb-6">
          Tin dùng bởi các công ty
        </p>
        <div className="max-w-[860px] mx-auto flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {LOGOS.map((l) => (
            <div key={l.name} className="flex items-center gap-2 opacity-50 hover:opacity-80 transition-opacity">
              <div className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[9px] font-black flex-shrink-0"
                style={{ background: l.color }}>
                {l.name[0]}
              </div>
              <span className="text-[13px] font-bold text-gray-500 tracking-tight">{l.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Case study cards */}
      <section className="max-w-[1060px] mx-auto px-6 pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {STORIES.map((s) => (
            <article key={s.company} className="group flex flex-col rounded-2xl bg-white transition-all duration-300 cursor-pointer hover:-translate-y-1"
              style={{ border: "1px solid #E5E7EB", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div className="h-1.5 rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${s.logoColor}, ${s.logoColor}99)` }} />
              <div className="p-7 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-[14px] flex-shrink-0"
                      style={{ background: s.logoColor }}>
                      {s.initials}
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-gray-900 leading-tight">{s.company}</p>
                      <span className="inline-block mt-1 text-[10.5px] font-semibold px-2.5 py-0.5 rounded-full"
                        style={{ background: s.industryColor, color: s.industryText }}>
                        {s.industry}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl px-4 py-3.5 mb-5" style={{ background: "#F8F9FF", border: `1px solid ${BLUE}18` }}>
                  <p className="text-[20px] font-extrabold leading-tight mb-1" style={{ color: BLUE }}>{s.result}</p>
                  <p className="text-[12.5px] text-gray-400 leading-snug">{s.resultDesc}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {s.metrics.map((m) => (
                    <div key={m.label} className="rounded-xl px-3.5 py-3 text-center"
                      style={{ background: "#F9FAFB", border: "1px solid #F0F0F0" }}>
                      <p className="text-[18px] font-extrabold text-gray-900 leading-none mb-0.5">{m.value}</p>
                      <p className="text-[11px] text-gray-400 leading-snug">{m.label}</p>
                    </div>
                  ))}
                </div>
                <div className="flex-1 mb-6">
                  <Quote size={16} className="mb-2 opacity-30" style={{ color: BLUE }} />
                  <p className="text-[13.5px] text-gray-600 leading-[1.75] italic">"{s.quote}"</p>
                </div>
                <div className="flex items-center justify-between pt-5 border-t border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                      style={{ background: s.avatarBg }}>
                      {s.avatar}
                    </div>
                    <div>
                      <p className="text-[12.5px] font-semibold text-gray-800 leading-tight">{s.name}</p>
                      <p className="text-[11px] text-gray-400 leading-tight">{s.title} · {s.company}</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-[12.5px] font-semibold" style={{ color: BLUE }}>
                    Đọc câu chuyện <ArrowRight size={13} />
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 rounded-2xl px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left"
          style={{ background: "#F8F9FF", border: `1px solid ${BLUE}20` }}>
          <div>
            <p className="text-[18px] font-bold text-gray-900 mb-1">Câu chuyện tiếp theo có thể là của bạn</p>
            <p className="text-[13.5px] text-gray-400">Tham gia 120+ startup Việt đang dùng jobihome mỗi ngày.</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link href="/dat-lich-demo"
              className="inline-flex items-center gap-2 h-11 px-6 rounded-xl text-[13.5px] font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: BLUE, boxShadow: `0 4px 16px ${BLUE}40` }}>
              Đặt lịch demo <ArrowRight size={14} />
            </Link>
            <Link href="/pricing"
              className="inline-flex items-center h-11 px-5 rounded-xl text-[13.5px] font-semibold border transition-colors hover:bg-white"
              style={{ borderColor: "#D1D5DB", color: "#374151" }}>
              Xem bảng giá
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
