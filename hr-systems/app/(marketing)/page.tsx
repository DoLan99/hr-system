import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { ArrowRight, Check, Star, TrendingUp, CheckSquare } from "lucide-react";
import { PLANS, formatVnd } from "@/lib/pricing";
import { FaqAccordion } from "./_components/FaqAccordion";
import { FeaturesTabSection } from "./_components/FeaturesTabSection";

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

function HeroMockup() {
  const cols = [
    {
      label: "Cần làm", dot: "#9CA3AF", color: "#6B7280",
      cards: [
        { title: "Thiết kế màn hình onboarding", tag: "Design", av: "MT", avBg: BLUE, badge: "Cao", badgeClr: "#EF4444" },
        { title: "Review tài liệu API v2.0", tag: "Dev", av: "DH", avBg: "#7C3AED", badge: "TB", badgeClr: "#F59E0B" },
        { title: "Cập nhật chính sách bảo mật", tag: "Content", av: "LA", avBg: GREEN, badge: "Thấp", badgeClr: "#9CA3AF" },
      ],
    },
    {
      label: "Đang làm", dot: "#3B5BDB", color: "#2563EB",
      cards: [
        { title: "Tích hợp cổng thanh toán VNPAY", tag: "Dev", av: "MT", avBg: BLUE, badge: "Cao", badgeClr: "#EF4444", progress: 65 },
        { title: "Viết bài blog SEO Q2/2025", tag: "Marketing", av: "NK", avBg: "#EA580C", badge: "TB", badgeClr: "#F59E0B", progress: 38 },
      ],
    },
    {
      label: "Hoàn thành", dot: "#059669", color: "#059669",
      cards: [
        { title: "Setup CI/CD môi trường staging", tag: "DevOps", av: "DH", avBg: "#7C3AED", badge: "Cao", badgeClr: "#EF4444", done: true },
        { title: "Phân tích yêu cầu Sprint 4", tag: "PM", av: "LA", avBg: GREEN, badge: "TB", badgeClr: "#F59E0B", done: true },
      ],
    },
  ];
  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white select-none" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)" }}>
      <div className="bg-gray-100 px-4 py-2.5 flex items-center gap-3 border-b border-gray-200">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 bg-white rounded-md px-3 py-1 text-[11px] text-gray-400 border border-gray-200 text-center max-w-[240px] mx-auto">
          app.jobihome.vn/sprint-4
        </div>
      </div>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-bold text-gray-800">Sprint 4</span>
          <span className="text-gray-200 text-xs">·</span>
          <span className="text-[11px] text-gray-400">Tháng 5/2025</span>
          <div className="flex ml-1">
            {["Board", "List", "Calendar"].map((t, i) => (
              <button key={t} className="text-[10px] px-2 py-0.5 rounded font-medium"
                style={i === 0 ? { background: BLUE, color: "#fff" } : { color: "#9CA3AF" }}>{t}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1">
            {[BLUE, GREEN, "#7C3AED", "#EA580C"].map((bg, i) => (
              <div key={i} className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-white text-[7px] font-bold" style={{ background: bg }}>
                {["MT", "LA", "DH", "NK"][i]}
              </div>
            ))}
          </div>
          <span className="text-[10px] text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">+ Lọc</span>
        </div>
      </div>
      <div className="flex gap-3 p-4 bg-gray-50 overflow-hidden" style={{ height: 280 }}>
        {cols.map((col) => (
          <div key={col.label} className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-2 h-2 rounded-full" style={{ background: col.dot }} />
              <span className="text-[10px] font-bold" style={{ color: col.color }}>{col.label}</span>
              <span className="text-[9px] text-gray-400 bg-gray-200 rounded-full px-1.5 leading-4">{col.cards.length}</span>
            </div>
            <div className="flex flex-col gap-2 overflow-hidden">
              {col.cards.map((card) => (
                <div key={card.title} className="bg-white rounded-lg p-2.5 border border-gray-100 shadow-sm"
                  style={{ opacity: "done" in card && card.done ? 0.5 : 1 }}>
                  <p className="text-[10px] font-medium text-gray-800 leading-tight mb-2"
                    style={{ textDecoration: "done" in card && card.done ? "line-through" : "none" }}>
                    {card.title}
                  </p>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[8px] font-medium px-1.5 py-px rounded-full bg-blue-50 text-blue-600">{card.tag}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[8px] font-medium px-1.5 py-px rounded-full"
                        style={{ background: `${card.badgeClr}18`, color: card.badgeClr }}>{card.badge}</span>
                      <div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[7px] font-bold" style={{ background: card.avBg }}>{card.av}</div>
                    </div>
                  </div>
                  {"progress" in card && card.progress && (
                    <div className="mt-1.5">
                      <div className="w-full bg-gray-100 rounded-full h-1">
                        <div className="h-1 rounded-full" style={{ width: `${card.progress}%`, background: BLUE }} />
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
  );
}

export default async function LandingPage() {
  const session = await auth();
  const h = await headers();
  const tenantSlug = h.get("x-tenant-slug");

  if (tenantSlug && session.userId) redirect("/welcome");

  const avatars = [
    { initials: "MT", bg: BLUE },
    { initials: "LA", bg: GREEN },
    { initials: "DA", bg: "#7C3AED" },
    { initials: "DH", bg: "#EA580C" },
    { initials: "NK", bg: "#DB2777" },
  ];

  const testimonials = [
    { quote: "jobihome giúp chúng tôi giảm 3 buổi họp báo cáo mỗi tuần. Manager chỉ cần nhìn dashboard là nắm được tiến độ.", name: "Minh Tuấn", title: "CTO", company: "Finsify", initials: "MT", bg: BLUE },
    { quote: "Payroll tự động giúp HR tiết kiệm gần 2 ngày làm việc mỗi tháng. Không còn sai sót khi tính lương nữa.", name: "Lan Anh", title: "HR Manager", company: "GrowthHack Agency", initials: "LA", bg: GREEN },
    { quote: "Setup 15 phút, team dùng ngay không cần training. Đơn giản hơn Jira mà vẫn đủ tính năng cho startup.", name: "Đức Anh", title: "Founder", company: "Techlab Studio", initials: "DA", bg: "#7C3AED" },
  ];

  const plans = Object.values(PLANS);

  return (
    <>
      <StructuredData />

      <style>{`
        .lp-headline { font-family: var(--font-plus-jakarta, 'Plus Jakarta Sans', system-ui, sans-serif); }
        .lp-btn { transition: filter 150ms ease, transform 150ms ease; }
        .lp-btn:hover { filter: brightness(1.07); transform: scale(1.015); }
        .lp-card { transition: border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease; }
        .lp-card:hover { border-color: #3B5BDB !important; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(59,91,219,0.10) !important; }
        .lp-testimonial-scroll { -webkit-overflow-scrolling: touch; scrollbar-width: none; }
        .lp-testimonial-scroll::-webkit-scrollbar { display: none; }
        @media (max-width: 767px) {
          .lp-stats-item:nth-child(odd)  { border-right: 1px solid #F3F4F6; }
          .lp-stats-item:nth-child(-n+2) { border-bottom: 1px solid #F3F4F6; }
        }
        @media (min-width: 768px) {
          .lp-stats-item:not(:last-child) { border-right: 1px solid #F3F4F6; }
        }
      `}</style>

      {/* ── HERO ── */}
      <section className="pt-24 pb-16 bg-white overflow-hidden">
        <div className="max-w-[1160px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.08fr] gap-10 xl:gap-16 items-center">

            {/* Left */}
            <div className="flex flex-col items-start">
              <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-7 border text-xs font-medium"
                style={{ background: "#EEF2FF", borderColor: "#C7D2FE", color: BLUE }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: GREEN }} />
                Mới: Tích hợp Zalo OA &amp; VNPAY
              </div>
              <h1 className="lp-headline mb-5" style={{ fontSize: 46, fontWeight: 800, lineHeight: 1.2, maxWidth: 460 }}>
                <span className="block text-gray-900">Quản lý team &amp;</span>
                <span className="block text-gray-900">nhân sự,</span>
                <span className="block" style={{ color: BLUE }}>tất cả trong một.</span>
              </h1>
              <p className="text-[16px] text-gray-500 leading-[1.75] mb-8 max-w-[430px]">
                Tasks · Time tracking · Payroll · Audit.{" "}
                <span className="font-semibold text-gray-800">jobihome</span> giúp tech lead Việt Nam quản lý team 5–20 người mà không cần 5 công cụ khác nhau.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-8 w-full sm:w-auto">
                <Link href="/sign-up"
                  className="lp-btn lp-headline inline-flex items-center justify-center gap-2 h-12 px-6 text-white text-[14px] font-semibold rounded-xl w-full sm:w-auto"
                  style={{ background: BLUE, boxShadow: `0 6px 20px ${BLUE}40` }}>
                  Dùng thử miễn phí 14 ngày <ArrowRight size={15} />
                </Link>
                <Link href="#features"
                  className="lp-btn inline-flex items-center justify-center gap-2 h-12 px-5 text-gray-700 text-[14px] font-semibold rounded-xl border border-gray-200 bg-white w-full sm:w-auto">
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

            {/* Right */}
            <div className="relative hidden lg:block">
              <div className="absolute -inset-8 rounded-3xl -z-10"
                style={{ background: "radial-gradient(ellipse at 55% 45%, #EEF2FF 0%, #F0FDF4 55%, transparent 80%)" }} />
              <HeroMockup />
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

      {/* ── STATS BAR ── */}
      <section className="w-full" style={{ background: "#F9FAFB", borderTop: "1px solid #F3F4F6", borderBottom: "1px solid #F3F4F6", marginTop: 48 }}>
        <div className="max-w-[1200px] mx-auto px-6 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {[
              { value: "120+", label: "Công ty đang dùng" },
              { value: "4.8★", label: "Đánh giá trung bình" },
              { value: "2 phút", label: "Thời gian setup" },
              { value: "98%", label: "Tỷ lệ gia hạn" },
            ].map((s) => (
              <div key={s.label} className="lp-stats-item flex flex-col items-center text-center px-4 md:px-8 py-8 md:py-0">
                <span className="lp-headline font-extrabold leading-none mb-2" style={{ fontSize: 32, color: "#111827", letterSpacing: "-0.02em" }}>
                  {s.value}
                </span>
                <span className="text-[13px]" style={{ color: "#6B7280" }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PAIN POINTS ── */}
      <section className="py-24 bg-white">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-12">
            <span className="inline-flex items-center rounded-full px-4 py-1.5 text-[12px] font-semibold mb-4"
              style={{ background: "#FFF3CD", color: "#B45309" }}>
              Vấn đề
            </span>
            <h2 className="lp-headline mb-4" style={{ fontSize: 36, fontWeight: 800, color: "#111827", lineHeight: 1.15 }}>
              Bạn đang gặp khó khăn?
            </h2>
            <p className="mx-auto text-[16px] leading-relaxed" style={{ color: "#6B7280", maxWidth: 520 }}>
              3 vấn đề chính của mọi tech lead Việt — và cách jobihome giải quyết tất cả
            </p>
          </div>
          <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-0 rounded-2xl overflow-hidden border border-gray-200 mx-auto"
            style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)", maxWidth: 860 }}>
            <div className="p-10" style={{ background: "#FFF5F5" }}>
              <p className="lp-headline text-[13px] font-bold mb-6 flex items-center gap-2" style={{ color: "#E03131" }}>
                ❌ Trước jobihome
              </p>
              <div className="flex flex-col gap-5">
                {["Excel + Google Sheet đã lỗi thời", "Nhiều việc, không đủ thời gian", "Họp báo cáo tiến độ mỗi 2 ngày"].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="flex-shrink-0 mt-0.5 text-[14px]" style={{ color: "#E03131" }}>✕</span>
                    <span className="text-[14px] leading-snug" style={{ color: "#374151" }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden sm:block absolute left-1/2 top-8 bottom-8 w-px" style={{ background: "#E5E7EB" }} />
            <div className="p-10" style={{ background: "#F0FFF4" }}>
              <p className="lp-headline text-[13px] font-bold mb-6 flex items-center gap-2" style={{ color: "#2F9E44" }}>
                ✅ Sau jobihome
              </p>
              <div className="flex flex-col gap-5">
                {["Dashboard visual + filter mượt mà", "Auto timer + heartbeat tự động", "Auto tính lương 1 click"].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="flex-shrink-0 mt-0.5 text-[14px]" style={{ color: "#2F9E44" }}>✓</span>
                    <span className="text-[14px] leading-snug" style={{ color: "#374151" }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES TAB ── */}
      <FeaturesTabSection />

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 bg-white">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-12">
            <span className="inline-flex items-center rounded-full px-4 py-1.5 text-[12px] font-semibold mb-4"
              style={{ background: "#F3F0FF", color: "#7C3AED" }}>
              Khách hàng
            </span>
            <h2 className="lp-headline mb-3" style={{ fontSize: 36, fontWeight: 800, color: "#111827", lineHeight: 1.15 }}>
              Khách hàng nói gì về <span style={{ color: BLUE }}>jobihome.vn</span>
            </h2>
            <p className="mx-auto text-[16px]" style={{ color: "#6B7280", maxWidth: 460 }}>
              Hơn 120 startup Việt đang dùng mỗi ngày
            </p>
          </div>
          <div className="lp-testimonial-scroll flex md:grid md:grid-cols-3 gap-5 overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none -mx-6 md:mx-0 px-6 md:px-0 pb-3 md:pb-0">
            {testimonials.map((c) => (
              <div key={c.name}
                className="lp-card flex-none md:flex-auto min-w-[82vw] md:min-w-0 snap-start flex flex-col bg-white rounded-2xl p-7 border border-gray-100"
                style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}>
                <div className="flex gap-0.5 mb-5">
                  {[1,2,3,4,5].map((i) => <Star key={i} size={15} className="fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-[14.5px] leading-[1.8] flex-1 mb-6" style={{ color: "#374151" }}>"{c.quote}"</p>
                <div className="flex items-center gap-3 pt-5 border-t border-gray-100">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[12px] font-bold flex-shrink-0" style={{ background: c.bg }}>
                    {c.initials}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold leading-tight" style={{ color: "#111827" }}>{c.name}</p>
                    <p className="text-[11px] leading-tight mt-0.5" style={{ color: "#9CA3AF" }}>{c.title}, {c.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="py-24" style={{ background: "#F9FAFB" }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-12">
            <span className="inline-flex items-center rounded-full px-4 py-1.5 text-[12px] font-semibold mb-4"
              style={{ background: "#E6FCF5", color: "#2F9E44" }}>
              Bảng giá
            </span>
            <h2 className="lp-headline mb-3" style={{ fontSize: 36, fontWeight: 800, color: "#111827", lineHeight: 1.15 }}>
              Giá rõ ràng, không phụ phí
            </h2>
            <p className="mx-auto text-[16px]" style={{ color: "#6B7280", maxWidth: 480 }}>
              Bắt đầu miễn phí 14 ngày. Hủy bất cứ lúc nào. Không cần thẻ tín dụng.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {plans.map((plan) => (
              <div key={plan.id}
                className="lp-card relative flex flex-col rounded-2xl bg-white"
                style={
                  plan.recommended
                    ? { border: `2px solid ${BLUE}`, boxShadow: `0 16px 40px ${BLUE}1F` }
                    : { border: "1px solid #F3F4F6", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }
                }>
                {plan.recommended && (
                  <div className="absolute -top-3.5 inset-x-0 flex justify-center">
                    <span className="lp-headline text-[11px] font-bold px-4 py-1 rounded-full text-white"
                      style={{ background: BLUE }}>
                      Phổ biến nhất
                    </span>
                  </div>
                )}
                <div className="p-7 flex flex-col flex-1">
                  <p className="lp-headline text-[15px] font-bold mb-5" style={{ color: "#111827" }}>{plan.name}</p>
                  <div className="mb-1">
                    <span className="lp-headline font-extrabold" style={{ fontSize: 36, color: plan.recommended ? BLUE : "#111827", lineHeight: 1 }}>
                      {plan.priceVnd === 0 ? "0đ" : formatVnd(plan.priceVnd)}
                    </span>
                  </div>
                  <p className="text-[12.5px] mb-1" style={{ color: "#6B7280" }}>{plan.priceVnd === 0 ? "Mãi mãi" : "/tháng"}</p>
                  <p className="text-[12.5px] mb-6" style={{ color: "#6B7280" }}>{plan.seatLimit} thành viên</p>
                  <ul className="flex flex-col gap-3 mb-8 flex-1">
                    {plan.features.slice(0, 4).map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <Check size={14} className="flex-shrink-0 mt-0.5" strokeWidth={2.5}
                          style={{ color: plan.recommended ? BLUE : "#2F9E44" }} />
                        <span className="text-[13px] leading-snug" style={{ color: "#374151" }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/sign-up"
                    className="lp-btn lp-headline w-full flex items-center justify-center rounded-xl text-[13.5px] font-semibold"
                    style={
                      plan.recommended
                        ? { height: 44, background: BLUE, color: "#fff", boxShadow: `0 4px 16px ${BLUE}40` }
                        : { height: 44, background: "#F3F4F6", color: "#374151" }
                    }>
                    {plan.priceVnd === 0 ? "Dùng miễn phí" : "Bắt đầu trial"}
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link href="/pricing"
              className="lp-btn lp-headline inline-flex items-center gap-2 text-[13.5px] font-semibold"
              style={{ height: 40, paddingLeft: 24, paddingRight: 24, border: `1px solid ${BLUE}`, color: BLUE, borderRadius: 8 }}>
              Xem chi tiết bảng giá <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 bg-white">
        <div className="max-w-[720px] mx-auto px-6">
          <div className="text-center mb-12">
            <span className="inline-flex items-center rounded-full px-4 py-1.5 text-[12px] font-semibold mb-4"
              style={{ background: "#EEF2FF", color: BLUE }}>
              FAQ
            </span>
            <h2 className="lp-headline" style={{ fontSize: 36, fontWeight: 800, color: "#111827" }}>
              Câu hỏi thường gặp
            </h2>
          </div>
          <FaqAccordion />
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-20 bg-white">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="relative overflow-hidden rounded-2xl" style={{ background: BLUE, padding: "64px 64px" }}>
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white opacity-[0.04] pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-52 h-52 rounded-full bg-white opacity-[0.04] pointer-events-none" />
            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <h2 className="lp-headline text-white mb-3" style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.2 }}>
                  Sẵn sàng quản lý team tốt hơn?
                </h2>
                <p className="mb-8 leading-relaxed text-[15px]" style={{ color: "#93C5FD" }}>
                  Tạo workspace trong 2 phút. Free trial 14 ngày, không cần thẻ tín dụng.
                </p>
                <Link href="/sign-up"
                  className="lp-btn lp-headline inline-flex items-center justify-center gap-2 text-white"
                  style={{ height: 48, paddingLeft: 28, paddingRight: 28, border: "1.5px solid rgba(255,255,255,0.55)", borderRadius: 10, fontSize: 15, fontWeight: 600 }}>
                  Bắt đầu miễn phí →
                </Link>
              </div>
              <ul className="flex flex-col gap-4">
                {["Không cần thẻ tín dụng", "Hủy bất cứ lúc nào", "Onboarding miễn phí", "Hỗ trợ tiếng Việt 24/7"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-[15px] text-white">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(255,255,255,0.18)" }}>
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
