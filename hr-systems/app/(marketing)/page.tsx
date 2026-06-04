import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { ArrowRight, Check, ListTodo, Clock4, Wallet, Users, ShieldCheck, BarChart3, Sparkles, X } from "lucide-react";
import { PLANS, formatVnd } from "@/lib/pricing";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobihome.vn";

export const metadata: Metadata = {
  title: "Quản lý team & nhân sự cho startup Việt",
  description: "Tasks, time tracking, payroll, audit — tất cả trong 1 workspace. Built for tech lead Việt Nam quản lý team 5-20 người. Dùng thử miễn phí 14 ngày.",
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
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "VND",
      description: "Free trial 14 ngày",
    },
    inLanguage: "vi-VN",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default async function LandingPage() {
  const session = await auth();
  const h = await headers();
  const tenantSlug = h.get("x-tenant-slug");

  // If accessed via tenant subdomain (e.g. landt.jobihome.vn) → go to app
  if (tenantSlug && session.userId) {
    redirect("/welcome");
  }

  const isSignedIn = !!session.userId;

  return (
    <>
      <StructuredData />
      {/* Hero */}
      <section className="px-4 sm:px-6 pt-16 sm:pt-24 pb-12 sm:pb-20">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs font-medium text-blue-700 dark:text-blue-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Hệ thống quản lý team cho startup Việt</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight">
            Quản lý team & nhân sự,<br />
            <span className="text-blue-600 dark:text-blue-400">tất cả trong một</span>.
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Tasks · Time tracking · Payroll · Audit. <strong>jobihome.vn</strong> giúp tech lead Việt Nam quản lý team 5–20 người mà không cần 5 công cụ khác nhau.
          </p>

          <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
            <Link
              href={isSignedIn ? "/welcome" : "/sign-up"}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition text-base"
            >
              {isSignedIn ? "Vào workspace" : "Dùng thử miễn phí 14 ngày"}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-medium rounded-lg transition text-base"
            >
              Xem tính năng
            </Link>
          </div>

          <p className="text-sm text-slate-500 dark:text-slate-400 pt-2">
            ✓ Không cần thẻ tín dụng &nbsp;·&nbsp; ✓ Setup trong 2 phút &nbsp;·&nbsp; ✓ Hỗ trợ tiếng Việt
          </p>
        </div>
      </section>

      {/* Trust strip */}
      <section className="px-4 sm:px-6 pb-12">
        <div className="max-w-5xl mx-auto py-8 border-y border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <Stat number="5-20" label="người / team" />
            <Stat number="1" label="workspace" />
            <Stat number="14 ngày" label="trial miễn phí" />
            <Stat number="<2 phút" label="setup" />
          </div>
        </div>
      </section>

      {/* Pain points */}
      <section className="px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold">Bạn đang gặp khó khăn?</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400">3 vấn đề lớn nhất của tech lead Việt</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PainCard
              before="Excel + Google Sheet rối rắm"
              after="Dashboard visual + filter mượt"
            />
            <PainCard
              before="Nhân viên quên log thời gian"
              after="Auto timer + heartbeat tự động"
            />
            <PainCard
              before="Tính lương cuối tháng mất 2 ngày"
              after="Auto từ timesheets, 1 click"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-4 sm:px-6 py-12 sm:py-20 bg-slate-50 dark:bg-slate-900/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold">Mọi thứ team bạn cần</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400">Không cần Trello + Toggl + Excel — chỉ cần 1 jobihome.vn</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard
              icon={<ListTodo className="w-5 h-5" />}
              title="Task Management"
              desc="Backlog → In Progress → Done. Sub-task, priority, due date, billable cho khách hàng. Đơn giản hơn Jira."
            />
            <FeatureCard
              icon={<Clock4 className="w-5 h-5" />}
              title="Time Tracking"
              desc="Auto timer trên từng task. Yêu cầu video proof khi over-estimate. Manager duyệt thời gian từng log."
            />
            <FeatureCard
              icon={<Wallet className="w-5 h-5" />}
              title="Payroll & Salary"
              desc="Tính lương từ time logs đã duyệt. Hourly hoặc Monthly. KPI scores + bonus tự động."
            />
            <FeatureCard
              icon={<Users className="w-5 h-5" />}
              title="Multi-team & Roles"
              desc="Department, Team, Manager-subordinate. Phân quyền HR / Manager / Team Lead / Accountant."
            />
            <FeatureCard
              icon={<ShieldCheck className="w-5 h-5" />}
              title="Audit Log + Anomaly"
              desc="Mọi thay đổi đều có audit. Phát hiện bất thường (off-hours vault, bulk delete) tự động."
            />
            <FeatureCard
              icon={<BarChart3 className="w-5 h-5" />}
              title="Activity Heatmap"
              desc="Xem heatmap hoạt động theo giờ × ngày. Top pages, active hours. Hiểu rõ team đang làm gì."
            />
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="px-4 sm:px-6 py-12 sm:py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold">Giá rõ ràng, không phụ phí</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400">
              Bắt đầu miễn phí 14 ngày. Hủy bất cứ lúc nào. Không cần thẻ tín dụng.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {(Object.values(PLANS)).map((plan) => (
              <div
                key={plan.id}
                className={`rounded-xl border-2 p-6 flex flex-col ${plan.recommended ? "border-blue-500 relative" : "border-slate-200 dark:border-slate-800"}`}
              >
                {plan.recommended && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-xs font-semibold rounded-full bg-blue-500 text-white">
                    Phổ biến
                  </span>
                )}
                <h3 className="text-lg font-bold">{plan.name}</h3>
                <p className="mt-3 text-3xl font-bold">{plan.priceVnd === 0 ? "0đ" : formatVnd(plan.priceVnd)}</p>
                <p className="text-xs text-slate-500 mt-1">{plan.priceVnd === 0 ? "Mãi mãi" : "/tháng"}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{plan.seatLimit} thành viên</p>

                <ul className="mt-5 space-y-2 text-sm flex-1">
                  {plan.features.slice(0, 4).map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700 dark:text-slate-300">{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={isSignedIn ? "/welcome" : "/sign-up"}
                  className={`mt-6 w-full text-center px-4 py-2 rounded-lg font-medium transition ${plan.recommended ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100"}`}
                >
                  {plan.priceVnd === 0 ? "Dùng miễn phí" : "Bắt đầu trial"}
                </Link>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/pricing" className="text-sm text-blue-600 hover:underline">
              Xem chi tiết bảng giá →
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-4 sm:px-6 py-12 sm:py-20 bg-slate-50 dark:bg-slate-900/40">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold">Câu hỏi thường gặp</h2>
          </div>

          <div className="space-y-4">
            <FaqItem
              q="Có xuất hóa đơn đỏ (VAT) không?"
              a="Có. Sau khi thanh toán, gửi email yêu cầu hóa đơn đỏ với MST + tên công ty, chúng tôi xuất trong vòng 3 ngày làm việc."
            />
            <FaqItem
              q="Thanh toán bằng cách nào?"
              a="Chuyển khoản ngân hàng (Vietcombank). Sau khi chuyển, email biên lai → admin kích hoạt gói trong vòng 24h. Sắp tới sẽ hỗ trợ VNPay / Momo cho thanh toán tự động."
            />
            <FaqItem
              q="Data của tôi có an toàn không?"
              a="Có. Dữ liệu mỗi workspace cách ly hoàn toàn ở DB level (tenant isolation). Audit log full mọi thay đổi. Backup hàng ngày. Password vault mã hóa AES-256."
            />
            <FaqItem
              q="Mời nhân viên qua email được không?"
              a="Có. Admin nhập email + role → hệ thống gửi email invite tự động. Nhân viên click link tạo tài khoản và auto-join workspace."
            />
            <FaqItem
              q="Hết trial thì sao?"
              a="Workspace bị suspended (read-only, không thêm member/task được). Upgrade gói → kích hoạt lại trong vòng 24h. Data không bị xóa."
            />
            <FaqItem
              q="Có app mobile không?"
              a="Hiện tại là web responsive (chạy mượt trên mobile browser). App native iOS/Android đang trong roadmap quý 4/2026."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto text-center space-y-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 sm:p-12 text-white">
          <h2 className="text-3xl sm:text-4xl font-bold">Sẵn sàng quản lý team tốt hơn?</h2>
          <p className="text-lg text-blue-100">
            Tạo workspace trong 2 phút. Free trial 14 ngày, không cần thẻ tín dụng.
          </p>
          <div className="flex justify-center">
            <Link
              href={isSignedIn ? "/welcome" : "/sign-up"}
              className="inline-flex items-center gap-2 px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition"
            >
              {isSignedIn ? "Vào workspace của bạn" : "Bắt đầu miễn phí"}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">{number}</p>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}

function PainCard({ before, after }: { before: string; after: string }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900">
      <div className="flex items-start gap-2 mb-3">
        <X className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-slate-600 dark:text-slate-400 line-through">{before}</p>
      </div>
      <div className="flex items-start gap-2">
        <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{after}</p>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 hover:shadow-lg transition">
      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="font-semibold mb-1.5">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">{desc}</p>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
      <summary className="cursor-pointer font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between list-none">
        <span>{q}</span>
        <span className="text-slate-400 group-open:rotate-180 transition">▾</span>
      </summary>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{a}</p>
    </details>
  );
}
