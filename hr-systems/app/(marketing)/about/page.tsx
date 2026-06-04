import type { Metadata } from "next";
import Link from "next/link";
import { Heart, Target, Users, Zap, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Giới thiệu — jobihome.vn",
  description: "Câu chuyện và sứ mệnh của jobihome.vn — xây dựng công cụ quản lý team đơn giản cho startup Việt.",
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 space-y-16">
      <header className="text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-slate-100">
          Tại sao chúng tôi xây <span className="text-blue-600">jobihome.vn</span>
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Là tech lead Việt Nam, tôi đã chứng kiến quá nhiều team quản lý nhân sự bằng 5 công cụ + 10 file Excel. Không nên như vậy.
        </p>
      </header>

      {/* Story */}
      <section className="prose prose-slate dark:prose-invert max-w-none">
        <h2 className="text-2xl font-bold mb-4">Câu chuyện</h2>
        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
          Năm 2025, khi quản lý team 12 người với mix giữa full-time và freelancer, tôi mất gần 2 ngày
          mỗi cuối tháng chỉ để tổng hợp time sheet, tính lương, đối chiếu task hoàn thành. Excel rối,
          công cụ track time tách rời với task, không có audit log...
        </p>
        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
          Tôi thử Jira (quá phức tạp), Trello (thiếu time tracking), Toggl + Google Sheet (rời rạc).
          Cuối cùng tôi quyết định <strong>tự build</strong> — và <strong>jobihome.vn</strong> ra đời.
        </p>
        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
          Mục tiêu: 1 workspace, làm được mọi thứ team startup Việt cần — không thừa, không thiếu.
        </p>
      </section>

      {/* Values */}
      <section>
        <h2 className="text-2xl font-bold text-center mb-10">Giá trị cốt lõi</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <ValueCard
            icon={<Target className="w-5 h-5" />}
            title="Đơn giản hơn Jira"
            desc="Cho team 5-20 người, không phải Fortune 500. Không cần workflow 12 trạng thái — chỉ cần thứ chạy được."
          />
          <ValueCard
            icon={<Heart className="w-5 h-5" />}
            title="Built in Vietnam, for Vietnam"
            desc="Tiếng Việt native, VAT/hóa đơn đỏ, support qua Zalo. Hiểu pain point của tech lead Việt vì tôi cũng là một."
          />
          <ValueCard
            icon={<Zap className="w-5 h-5" />}
            title="Tự động hóa thật"
            desc="Auto timer, auto credited minutes, auto salary. Bạn không phải nhập lại số liệu 3 lần."
          />
          <ValueCard
            icon={<Users className="w-5 h-5" />}
            title="Audit-ready"
            desc="Mọi thay đổi đều có log. Phát hiện bất thường tự động. Investor / kiểm toán nhìn vào sẽ tin tưởng."
          />
        </div>
      </section>

      {/* Roadmap */}
      <section>
        <h2 className="text-2xl font-bold text-center mb-10">Roadmap 2026-2027</h2>
        <div className="space-y-4 max-w-2xl mx-auto">
          <RoadmapItem
            quarter="Q2 2026"
            title="Launch + Onboarding 50 khách đầu tiên"
            status="current"
          />
          <RoadmapItem
            quarter="Q3 2026"
            title="VNPay / Momo integration (auto recurring)"
            status="planned"
          />
          <RoadmapItem
            quarter="Q4 2026"
            title="Mobile app (iOS + Android)"
            status="planned"
          />
          <RoadmapItem
            quarter="Q1 2027"
            title="API + Webhooks cho 3rd party integrations"
            status="planned"
          />
          <RoadmapItem
            quarter="Q2 2027"
            title="Mở rộng thị trường Đông Nam Á"
            status="planned"
          />
        </div>
      </section>

      {/* CTA */}
      <section className="text-center space-y-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 sm:p-12 text-white">
        <h2 className="text-2xl sm:text-3xl font-bold">Sẵn sàng dùng thử?</h2>
        <p className="text-blue-100">
          14 ngày miễn phí. Không cần thẻ tín dụng. Setup trong 2 phút.
        </p>
        <Link
          href="/sign-up"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition"
        >
          Bắt đầu ngay <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}

function ValueCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="font-semibold mb-1.5 text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}

function RoadmapItem({ quarter, title, status }: { quarter: string; title: string; status: "current" | "planned" }) {
  return (
    <div className={`flex items-start gap-4 p-4 rounded-xl border ${status === "current" ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"}`}>
      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${status === "current" ? "bg-blue-500 animate-pulse" : "bg-slate-300 dark:bg-slate-700"}`} />
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{quarter}</p>
        <p className="font-medium text-slate-900 dark:text-slate-100 mt-0.5">{title}</p>
      </div>
    </div>
  );
}
