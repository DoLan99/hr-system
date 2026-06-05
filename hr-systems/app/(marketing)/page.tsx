import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { ArrowRight, Check, Star, TrendingUp, CheckSquare } from "lucide-react";
import { PLANS, formatVnd } from "@/lib/pricing";
import { FaqAccordion } from "./_components/FaqAccordion";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobihome.vn";
const BLUE = "#3B5BDB";
const GREEN = "#0CA678";

export const metadata: Metadata = {
  title: "Quản lý team & nhân sự cho startup Việt",
  description:
    "Tasks, time tracking, payroll, audit — tất cả trong 1 workspace. Built for tech lead Việt Nam quản lý team 5-20 người. Dùng thử miễn phí 14 ngày.",
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: "jobihome.vn — Quản lý team & nhân sự cho startup Việt",
    description: "Tasks, time tracking, payroll, audit — tất cả trong 1 workspace.",
    url: SITE_URL,
    type: "website",
    locale: "vi_VN",
  },
};

function StructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "jobihome.vn",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: SITE_URL,
    description: "Hệ thống quản lý team & nhân sự cho startup Việt",
    offers: { "@type": "Offer", price: "0", priceCurrency: "VND", description: "Free trial 14 ngày" },
    inLanguage: "vi-VN",
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

// ─── Kanban Mockup ────────────────────────────────────────────────────────────
function KanbanMockup() {
  const columns = [
    {
      label: "Cần làm", color: "text-gray-500", dot: "bg-gray-300",
      cards: [
        { title: "Thiết kế màn hình onboarding", tag: "Design", tagClr: "bg-purple-100 text-purple-700", badge: "Cao", bdgClr: "bg-red-100 text-red-600", av: "MT", avBg: BLUE, done: false, progress: undefined },
        { title: "Review tài liệu API v2.0", tag: "Dev", tagClr: "bg-blue-100 text-blue-700", badge: "TB", bdgClr: "bg-yellow-100 text-yellow-600", av: "DH", avBg: "#7C3AED", done: false, progress: undefined },
        { title: "Cập nhật chính sách bảo mật", tag: "Content", tagClr: "bg-green-100 text-green-700", badge: "Thấp", bdgClr: "bg-gray-100 text-gray-500", av: "LA", avBg: GREEN, done: false, progress: undefined },
      ],
    },
    {
      label: "Đang làm", color: "text-blue-600", dot: "bg-blue-500",
      cards: [
        { title: "Tích hợp cổng thanh toán VNPAY", tag: "Dev", tagClr: "bg-blue-100 text-blue-700", badge: "Cao", bdgClr: "bg-red-100 text-red-600", av: "MT", avBg: BLUE, progress: 65, done: false },
        { title: "Viết bài blog SEO cho Q2/2025", tag: "Marketing", tagClr: "bg-pink-100 text-pink-700", badge: "TB", bdgClr: "bg-yellow-100 text-yellow-600", av: "NK", avBg: "#EA580C", progress: 38, done: false },
      ],
    },
    {
      label: "Hoàn thành", color: "text-emerald-600", dot: "bg-emerald-500",
      cards: [
        { title: "Setup CI/CD môi trường staging", tag: "DevOps", tagClr: "bg-orange-100 text-orange-700", badge: "Cao", bdgClr: "bg-red-100 text-red-600", av: "DH", avBg: "#7C3AED", done: true, progress: undefined },
        { title: "Phân tích yêu cầu Sprint 4", tag: "PM", tagClr: "bg-teal-100 text-teal-700", badge: "TB", bdgClr: "bg-yellow-100 text-yellow-600", av: "LA", avBg: GREEN, done: true, progress: undefined },
      ],
    },
  ];

  return (
    <div className="rounded-xl overflow-hidden shadow-2xl border border-gray-200 bg-white select-none">
      <div className="bg-gray-100 px-3.5 py-2.5 flex items-center gap-3 border-b border-gray-200">
        <div className="flex gap-1.5 flex-shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 bg-white rounded px-3 py-[3px] text-[10px] text-gray-400 border border-gray-200 text-center max-w-[180px] mx-auto truncate">
          app.jobihome.vn/sprint-4
        </div>
      </div>
      <div className="flex" style={{ height: 330 }}>
        <div className="w-12 bg-gray-50 border-r border-gray-100 flex flex-col items-center py-3 gap-2.5 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-1" style={{ background: BLUE }}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <rect x="0.5" y="0.5" width="4" height="4" rx="0.8" fill="white" />
              <rect x="6.5" y="0.5" width="4" height="4" rx="0.8" fill="white" fillOpacity="0.6" />
              <rect x="0.5" y="6.5" width="4" height="4" rx="0.8" fill="white" fillOpacity="0.6" />
              <rect x="6.5" y="6.5" width="4" height="4" rx="0.8" fill="white" fillOpacity="0.3" />
            </svg>
          </div>
          {[{ icon: "⊞", active: false }, { icon: "☑", active: true }, { icon: "👥", active: false }, { icon: "⏱", active: false }, { icon: "💰", active: false }].map((item, i) => (
            <div key={i} className="w-8 h-8 rounded-lg flex items-center justify-center text-[13px] cursor-pointer"
              style={item.active ? { background: BLUE } : { color: "#9CA3AF" }}>
              {item.icon}
            </div>
          ))}
          <div className="mt-auto w-6 h-6 rounded-full flex items-center justify-center text-white text-[8px] font-bold" style={{ background: BLUE }}>MT</div>
        </div>
        <div className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden">
          <div className="flex items-center justify-between px-3.5 py-2 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-gray-800">Sprint 4</span>
              <span className="text-gray-300 text-[10px]">·</span>
              <span className="text-[10px] text-gray-400">Tháng 5/2025</span>
              <div className="flex ml-1.5">
                {["Board", "Danh sách", "Lịch"].map((t, i) => (
                  <button key={t} className="text-[9px] px-2 py-0.5 rounded font-medium"
                    style={i === 0 ? { background: BLUE, color: "#fff" } : { color: "#9CA3AF" }}>{t}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-1">
                {[BLUE, GREEN, "#7C3AED", "#EA580C"].map((bg, i) => (
                  <div key={i} className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-white text-[7px] font-bold" style={{ background: bg }}>
                    {["MT", "LA", "DH", "NK"][i]}
                  </div>
                ))}
              </div>
              <span className="text-[9px] text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">+ Lọc</span>
            </div>
          </div>
          <div className="flex gap-2 p-2.5 bg-gray-50/60 flex-1 overflow-hidden">
            {columns.map((col) => (
              <div key={col.label} className="flex-1 flex flex-col min-w-0">
                <div className="flex items-center gap-1 mb-1.5 px-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
                  <span className={`text-[9px] font-bold ${col.color}`}>{col.label}</span>
                  <span className="text-[8px] text-gray-400 bg-gray-200 rounded-full px-1 leading-[14px] ml-0.5">{col.cards.length}</span>
                </div>
                <div className="flex flex-col gap-1.5 overflow-hidden">
                  {col.cards.map((card) => (
                    <div key={card.title} className="bg-white rounded-lg p-2 border border-gray-100 shadow-sm"
                      style={{ opacity: card.done ? 0.55 : 1 }}>
                      <p className="text-[9px] font-medium text-gray-800 leading-tight mb-1.5"
                        style={{ textDecoration: card.done ? "line-through" : "none", color: card.done ? "#9CA3AF" : undefined }}>
                        {card.title}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1 flex-wrap">
                          <span className={`text-[8px] font-medium px-1.5 py-px rounded-full ${card.tagClr}`}>{card.tag}</span>
                          <span className={`text-[8px] font-medium px-1.5 py-px rounded-full ${card.bdgClr}`}>{card.badge}</span>
                        </div>
                        <div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[7px] font-bold flex-shrink-0" style={{ background: card.avBg }}>
                          {card.av}
                        </div>
                      </div>
                      {"progress" in card && card.progress && (
                        <div className="mt-1.5">
                          <div className="w-full bg-gray-100 rounded-full h-[3px]">
                            <div className="h-[3px] rounded-full" style={{ width: `${card.progress}%`, background: BLUE }} />
                          </div>
                          <span className="text-[7px] text-gray-400">{card.progress}%</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function LandingPage() {
  const session = await auth();
  const h = await headers();
  const tenantSlug = h.get("x-tenant-slug");

  if (tenantSlug && session.userId) redirect("/welcome");

  const isSignedIn = !!session.userId;
  const ctaHref = isSignedIn ? "/welcome" : "/sign-up";

  const avatars = [
    { initials: "MT", bg: BLUE }, { initials: "LA", bg: GREEN },
    { initials: "DA", bg: "#7C3AED" }, { initials: "DH", bg: "#EA580C" }, { initials: "NK", bg: "#DB2777" },
  ];

  const featureCards = [
    { icon: "☑", title: "Task Management", desc: "Backlog → In Progress → Done. Tuỳ chỉnh workflow, phân công task, đặt deadline. Đồng bộ realtime, không mất dữ liệu." },
    { icon: "⏱", title: "Time Tracking", desc: "Auto-start timer khi bắt đầu task. Tổng hợp timesheet cuối tuần. Phát hiện bất thường, báo cáo chi tiết từng giờ." },
    { icon: "💰", title: "Payroll & Salary", desc: "Tự động tính lương từ timesheet. Hỗ trợ thuế TNCN, BHXH. Xuất payslip PDF, chuyển khoản 1 click qua VNPAY." },
    { icon: "👥", title: "Multi-team & Roles", desc: "Department, Team, Manager. Team Leader, Accountant. Phân quyền linh hoạt theo từng cấp bậc." },
    { icon: "📋", title: "Audit Log + Anomaly", desc: "Mọi hành động đều có log. Tự động phát hiện bất thường, cảnh báo realtime khi có thao tác lạ." },
    { icon: "📊", title: "Activity Heatmap", desc: "Xem heatmap hoạt động theo giờ + ngày. Tag people, actual hours. Dễ nhận biết bottleneck." },
  ];

  const testimonials = [
    { quote: "jobihome giúp chúng tôi giảm 3 buổi họp báo cáo mỗi tuần. Manager giờ chỉ cần nhìn dashboard là nắm được tiến độ.", name: "Minh Tuấn", title: "CTO", company: "Finsify", initials: "MT", bg: BLUE },
    { quote: "Tính năng payroll tự động giúp HR của mình tiết kiệm gần 2 ngày làm việc mỗi tháng. Không còn sai sót khi tính lương nữa.", name: "Lan Anh", title: "HR Manager", company: "GrowthHack Agency", initials: "LA", bg: GREEN },
    { quote: "Setup trong 15 phút, team dùng ngay không cần training. Đơn giản hơn Jira rất nhiều mà vẫn đủ tính năng cho startup.", name: "Đức Anh", title: "Founder", company: "Techlab Studio", initials: "DA", bg: "#7C3AED" },
  ];

  const plans = Object.values(PLANS);

  return (
    <>
      <StructuredData />

      <style>{`
        .lp-feature-card { transition: border-color 200ms ease, transform 200ms ease, box-shadow 200ms ease; }
        .lp-feature-card:hover { border-color: #3B5BDB !important; transform: translateY(-3px); box-shadow: 0 6px 20px rgba(0,0,0,0.07); }
        .lp-testimonial-card { transition: border-color 180ms ease-out, box-shadow 180ms ease-out; }
        .lp-testimonial-card:hover { border-color: #3B5BDB !important; box-shadow: 0 8px 24px rgba(59,91,219,0.10) !important; }
        .lp-pricing-card { transition: transform 180ms ease-out, box-shadow 180ms ease-out; }
        .lp-pricing-card:hover { transform: scale(1.01); box-shadow: 0 12px 32px rgba(0,0,0,0.08) !important; }
        .lp-cta-btn { transition: filter 180ms ease-out, transform 180ms ease-out !important; }
        .lp-cta-btn:hover { filter: brightness(1.08); transform: scale(1.02); }
        .lp-testimonial-scroll { -webkit-overflow-scrolling: touch; scrollbar-width: none; }
        .lp-testimonial-scroll::-webkit-scrollbar { display: none; }
        @media (max-width: 767px) {
          .lp-stats-item:nth-child(odd)  { border-right: 1px solid #E5E7EB; }
          .lp-stats-item:nth-child(-n+2) { border-bottom: 1px solid #E5E7EB; }
        }
        @media (min-width: 768px) {
          .lp-stats-item:not(:last-child) { border-right: 1px solid #E5E7EB; }
        }
        .lp-features-cta { padding: 40px; }
        @media (max-width: 639px) { .lp-features-cta { padding: 24px; } }
        .lp-final-cta-box { padding: 60px; }
        @media (max-width: 639px) { .lp-final-cta-box { padding: 28px 24px; } }
      `}</style>

      {/* ── Hero ── */}
      <section className="pt-24 pb-16 bg-white overflow-hidden">
        <div className="max-w-[1160px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.08fr] gap-10 xl:gap-16 items-center">
            <div className="flex flex-col items-start">
              <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-7 border text-xs font-medium"
                style={{ background: "#EEF2FF", borderColor: "#C7D2FE", color: BLUE }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: GREEN }} />
                Mới: Tích hợp Zalo OA &amp; VNPAY
              </div>
              <h1 className="mb-5" style={{ fontSize: 46, fontWeight: 800, lineHeight: 1.2, maxWidth: 460 }}>
                <span className="block text-gray-900">Quản lý team &amp;</span>
                <span className="block text-gray-900">nhân sự,</span>
                <span className="block" style={{ color: BLUE }}>tất cả trong một.</span>
              </h1>
              <p className="text-[16px] text-gray-500 leading-[1.75] mb-8 max-w-[430px]">
                Tasks · Time tracking · Payroll · Audit.{" "}
                <span className="font-semibold text-gray-800">jobihome</span> giúp tech lead Việt Nam quản lý team 5–20 người mà không cần 5 công cụ khác nhau.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-8 w-full sm:w-auto">
                <Link href={ctaHref}
                  className="lp-cta-btn inline-flex items-center justify-center gap-2 h-12 px-6 text-white text-[14px] font-semibold rounded-xl w-full sm:w-auto"
                  style={{ background: BLUE, boxShadow: `0 6px 20px ${BLUE}40` }}>
                  {isSignedIn ? "Vào workspace" : "Dùng thử miễn phí 14 ngày"} <ArrowRight size={15} />
                </Link>
                <Link href="/#features"
                  className="lp-cta-btn inline-flex items-center justify-center gap-2 h-12 px-5 text-gray-700 text-[14px] font-semibold rounded-xl border border-gray-200 bg-white w-full sm:w-auto">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#EEF2FF" }}>
                    <span className="text-[9px]" style={{ color: BLUE }}>▶</span>
                  </span>
                  Xem tính năng
                </Link>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2.5">
                  {avatars.map(({ initials, bg }) => (
                    <div key={initials} className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold shadow-sm" style={{ background: bg }}>
                      {initials}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-0.5 mb-0.5">
                    {[1,2,3,4,5].map((i) => <Star key={i} size={11} className="fill-yellow-400 text-yellow-400" />)}
                    <span className="text-[11px] text-gray-400 ml-1">4.8/5</span>
                  </div>
                  <p className="text-[13px] text-gray-500">
                    Đang được dùng bởi <strong className="text-gray-900 font-semibold">120+ startup Việt</strong>
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-2 mt-5">
                {["Không cần thẻ tín dụng", "Setup trong 2 phút", "Hỗ trợ tiếng Việt"].map((b) => (
                  <div key={b} className="flex items-center gap-1.5 text-[12px] text-gray-400">
                    <Check size={12} style={{ color: GREEN }} /> {b}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="absolute -inset-8 rounded-3xl -z-10"
                style={{ background: "radial-gradient(ellipse at 55% 45%, #EEF2FF 0%, #F0FDF4 55%, transparent 80%)" }} />
              <KanbanMockup />
              <div className="absolute -bottom-4 -left-5 bg-white rounded-2xl shadow-xl border border-gray-100 px-3.5 py-3 flex items-center gap-3 z-10">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${GREEN}18` }}>
                  <TrendingUp size={17} style={{ color: GREEN }} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 leading-tight">Hiệu suất sprint</p>
                  <p className="text-[12px] font-bold text-gray-900 leading-tight">+34% so với Sprint 3</p>
                </div>
              </div>
              <div className="absolute -top-3 -right-4 bg-white rounded-2xl shadow-xl border border-gray-100 px-3 py-2.5 flex items-center gap-2.5 z-10">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#EEF2FF" }}>
                  <CheckSquare size={13} style={{ color: BLUE }} />
                </div>
                <div>
                  <p className="text-[9px] text-gray-400">Task hoàn thành</p>
                  <p className="text-[11px] font-semibold text-gray-900">8 / 12 task Sprint 4</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="w-full bg-[#F8F9FA]" style={{ borderTop: "1px solid #EAECF0", borderBottom: "1px solid #EAECF0" }}>
        <div className="max-w-[1100px] mx-auto px-6 py-14 md:py-20">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {[
              { value: "120+", label: "Công ty đang dùng" },
              { value: "4.8★", label: "Đánh giá" },
              { value: "2 phút", label: "Setup" },
              { value: "98%", label: "Gia hạn" },
            ].map((s) => (
              <div key={s.label} className="lp-stats-item flex flex-col items-center text-center px-4 md:px-6 py-8 md:py-0">
                <span className="font-extrabold leading-none mb-2.5" style={{ fontSize: 42, color: BLUE, letterSpacing: "-0.02em" }}>
                  {s.value}
                </span>
                <span className="text-[13px] text-gray-400 font-medium">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pain Points ── */}
      <section className="py-20 bg-white">
        <div className="max-w-[800px] mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Bạn đang gặp khó khăn?</h2>
          <p className="text-sm text-gray-400 mb-10">3 vấn đề chính của mọi tech lead Việt</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 text-left">
            {[
              "Excel + Google Sheet đã lỗi thời",
              "Nhiều việc, không đủ thời gian",
              "Dashboard visual + filter mượt",
              "Auto timer + heartbeat tự động",
              "Tình trạng cuộc họp mỗi 2 ngày",
              "Auto tính timesheets, 1 click",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: BLUE }}>
                  <Check size={9} color="white" strokeWidth={3} />
                </div>
                <span className="text-sm text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-[1000px] mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Mọi thứ mà team bạn cần</h2>
            <p className="text-sm text-gray-400">Không cần Trello + Toggl + Excel + Jira |{" "}
              <span className="font-medium" style={{ color: BLUE }}>jobihome.vn</span>
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {featureCards.map((c) => (
              <div key={c.title} className="lp-feature-card bg-white rounded-xl p-6 border border-gray-100">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg mb-4" style={{ background: "#EEF2FF" }}>
                  {c.icon}
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-2">{c.title}</h3>
                <p className="text-xs text-gray-500 leading-[1.7]">{c.desc}</p>
              </div>
            ))}
          </div>

          <div className="lp-features-cta mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
            style={{ background: "#EEF2FF", borderRadius: 12 }}>
            <div>
              <h3 className="text-[20px] font-bold text-gray-900 leading-snug mb-1">Sẵn sàng thử chưa?</h3>
              <p className="text-[14px] text-gray-500">Miễn phí 14 ngày, không cần thẻ tín dụng.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto flex-shrink-0">
              <Link href={ctaHref}
                className="lp-cta-btn inline-flex items-center justify-center gap-1.5 h-10 px-5 rounded-lg text-[13.5px] font-semibold text-white w-full sm:w-auto"
                style={{ background: BLUE, boxShadow: `0 4px 14px ${BLUE}35` }}>
                Dùng thử miễn phí <ArrowRight size={14} />
              </Link>
              <Link href="/#faq"
                className="lp-cta-btn inline-flex items-center justify-center h-10 px-5 rounded-lg text-[13.5px] font-semibold border w-full sm:w-auto"
                style={{ borderColor: `${BLUE}50`, color: BLUE, background: "transparent" }}>
                Xem câu hỏi thường gặp
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 bg-white">
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold mb-4 border"
              style={{ background: "#EEF2FF", borderColor: "#C7D2FE", color: BLUE }}>
              Đánh giá khách hàng
            </div>
            <h2 className="text-[28px] font-bold text-gray-900 tracking-tight">
              Khách hàng nói gì về <span style={{ color: BLUE }}>jobihome.vn</span>
            </h2>
          </div>
          <div className="lp-testimonial-scroll flex md:grid md:grid-cols-3 gap-4 md:gap-6 overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none -mx-6 md:mx-0 px-6 md:px-0 pb-3 md:pb-0">
            {testimonials.map((c) => (
              <div key={c.name}
                className="lp-testimonial-card flex-none md:flex-auto min-w-[82vw] md:min-w-0 snap-start flex flex-col bg-white rounded-2xl p-7 border border-gray-200"
                style={{ boxShadow: "0 2px 16px 0 rgba(0,0,0,0.06)" }}>
                <div className="flex gap-0.5 mb-5">
                  {[1,2,3,4,5].map((i) => <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-[14px] text-gray-700 leading-[1.8] flex-1 mb-7">"{c.quote}"</p>
                <div className="flex items-center gap-3 pt-5 border-t border-gray-100">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[12px] font-bold flex-shrink-0" style={{ background: c.bg }}>
                    {c.initials}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-gray-900 leading-tight">{c.name}</p>
                    <p className="text-[11px] text-gray-400 leading-tight mt-0.5">{c.title} · {c.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="py-24 bg-white">
        <div className="max-w-[1060px] mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-[32px] font-bold text-gray-900 tracking-tight leading-tight mb-3">
              Giá rõ ràng, không phụ phí
            </h2>
            <p className="text-[15px] text-gray-400">
              Bắt đầu miễn phí 14 ngày. Hủy bất cứ lúc nào. Không cần thẻ tín dụng.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            {plans.map((plan) => (
              <div key={plan.id}
                className="lp-pricing-card relative flex flex-col rounded-2xl bg-white"
                style={
                  plan.recommended
                    ? { border: `2px solid ${BLUE}`, boxShadow: `0 12px 40px ${BLUE}22` }
                    : { border: "1px solid #E5E7EB", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }
                }>
                {plan.recommended && (
                  <div className="absolute -top-3.5 inset-x-0 flex justify-center">
                    <span className="text-[11px] font-bold px-4 py-1 rounded-full text-white"
                      style={{ background: BLUE, boxShadow: `0 2px 8px ${BLUE}55` }}>
                      Phổ biến
                    </span>
                  </div>
                )}
                <div className="p-7 flex flex-col flex-1">
                  <p className="text-[15px] font-bold text-gray-900 mb-4">{plan.name}</p>
                  <div className="mb-1">
                    <span className="font-extrabold"
                      style={{ fontSize: 36, color: plan.recommended ? BLUE : "#111827", lineHeight: 1 }}>
                      {plan.priceVnd === 0 ? "0đ" : formatVnd(plan.priceVnd)}
                    </span>
                  </div>
                  <p className="text-[12.5px] text-gray-400 mb-1">{plan.priceVnd === 0 ? "Mãi mãi" : "/tháng"}</p>
                  <p className="text-[12.5px] text-gray-500 mb-5">{plan.seatLimit} thành viên</p>
                  <ul className="flex flex-col gap-2.5 mb-7 flex-1">
                    {plan.features.slice(0, 4).map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <Check size={14} className="flex-shrink-0 mt-0.5" strokeWidth={2.5}
                          style={{ color: plan.recommended ? BLUE : GREEN }} />
                        <span className="text-[13px] text-gray-600 leading-snug">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={ctaHref}
                    className="lp-cta-btn w-full h-11 rounded-xl text-[13.5px] font-semibold flex items-center justify-center"
                    style={
                      plan.recommended
                        ? { background: BLUE, color: "#fff", boxShadow: `0 4px 16px ${BLUE}40` }
                        : { background: "#F3F4F6", color: "#374151" }
                    }>
                    {plan.priceVnd === 0 ? "Dùng miễn phí" : "Bắt đầu trial"}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center flex-wrap gap-x-7 gap-y-2 mt-8 mb-5">
            {[
              { icon: "🔒", label: "Bảo mật SSL" },
              { icon: "💳", label: "Thanh toán VNPAY / MoMo" },
              { icon: "🛡️", label: "Dữ liệu mã hoá 256-bit" },
            ].map((badge, i) => (
              <span key={badge.label} className="flex items-center gap-1.5" style={{ color: "#868E96", fontSize: 12 }}>
                {i > 0 && <span className="hidden sm:inline text-gray-200 mr-5 -ml-1">·</span>}
                {badge.icon} {badge.label}
              </span>
            ))}
          </div>

          <div className="text-center mt-1 mb-6">
            <Link href="/pricing"
              className="lp-cta-btn inline-flex items-center gap-2 h-10 px-6 text-[13.5px] font-semibold"
              style={{ border: `1px solid ${BLUE}`, color: BLUE, borderRadius: 8 }}>
              Xem chi tiết bảng giá <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-20 bg-gray-50">
        <div className="max-w-[680px] mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Câu hỏi thường gặp</h2>
          <FaqAccordion />
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-16 bg-white">
        <div className="max-w-[900px] mx-auto px-6">
          <div className="lp-final-cta-box relative overflow-hidden" style={{ background: BLUE, borderRadius: 16 }}>
            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white opacity-[0.05] pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white opacity-[0.05] pointer-events-none" />

            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <h2 className="text-[28px] font-extrabold text-white leading-tight tracking-tight mb-3">
                  Sẵn sàng quản lý team tốt hơn?
                </h2>
                <p className="mb-8 leading-relaxed" style={{ fontSize: 15, color: "#93C5FD" }}>
                  Tạo workspace trong 2 phút. Free trial 14 ngày, không cần thẻ tín dụng.
                </p>
                <Link href={ctaHref}
                  className="lp-cta-btn inline-flex items-center justify-center gap-2 h-11 px-7 font-bold w-full sm:w-auto"
                  style={{ fontSize: 14, color: "#fff", border: "1.5px solid rgba(255,255,255,0.6)", borderRadius: 8 }}>
                  {isSignedIn ? "Vào workspace của bạn" : "Bắt đầu miễn phí"} <ArrowRight size={15} />
                </Link>
              </div>

              <ul className="flex flex-col" style={{ gap: 0 }}>
                {["Không cần thẻ tín dụng", "Hủy bất cứ lúc nào", "Onboarding miễn phí", "Hỗ trợ tiếng Việt 24/7"].map((item) => (
                  <li key={item} className="flex items-center gap-3" style={{ fontSize: 15, lineHeight: 2, color: "#fff" }}>
                    <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(255,255,255,0.20)" }}>
                      <Check size={11} color="#fff" strokeWidth={3} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
