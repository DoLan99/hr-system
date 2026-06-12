import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { PLANS, formatVnd } from "@/lib/pricing";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobihome.vn";

export const metadata: Metadata = {
  title: "Quản lý nhân sự & team trong một workspace",
  description:
    "SaaS HR & Team Management cho startup và SME Việt Nam. Task, chấm công, lương, đánh giá hiệu suất — gom toàn bộ vòng đời quản lý nhân sự vào một nơi.",
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: "jobihome.vn — Quản lý nhân sự & team trong một workspace",
    description: "Task, chấm công, lương, đánh giá — trong một workspace duy nhất.",
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

const MODULES = [
  {
    title: "Nhân sự",
    desc: "Hồ sơ, phòng ban, vai trò, kỹ năng & career path.",
    svg: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeLinecap="round" />
        <path d="M16 4a3 3 0 0 1 0 6M21 20a5 5 0 0 0-4-5" strokeLinecap="round" />
      </>
    ),
  },
  {
    title: "Task Management",
    desc: "Trạng thái, ưu tiên, template & review workflow.",
    svg: (
      <>
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </>
    ),
  },
  {
    title: "Time Tracking",
    desc: "Time logs, Office Time, work rules cho org.",
    svg: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" strokeLinecap="round" />
      </>
    ),
  },
  {
    title: "Performance",
    desc: "Auto-KPI, self-review & manager review.",
    svg: <path d="M12 2l2.6 6.3L21 9l-5 4.3L17.5 20 12 16.5 6.5 20 8 13.3 3 9l6.4-.7z" />,
  },
  {
    title: "Lương & Thưởng",
    desc: "Tính lương liên kết time log, lịch sử payment.",
    svg: <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />,
  },
  {
    title: "Leave Management",
    desc: "Đơn nghỉ phép nhiều loại, duyệt & theo dõi.",
    svg: (
      <>
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </>
    ),
  },
  {
    title: "Customers & Messages",
    desc: "Danh sách khách hàng, giao tiếp đa kênh.",
    svg: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  },
  {
    title: "Summary & Báo cáo",
    desc: "Dashboard KPI, trend, AI-suggest, forecast.",
    svg: (
      <>
        <path d="M3 3v18h18" />
        <path d="M7 14l4-4 3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  {
    title: "Capacity Planning",
    desc: "Phân tích workload, dự báo năng lực theo skill.",
    svg: <path d="M3 12h4l3 8 4-16 3 8h4" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    title: "Vault",
    desc: "Lưu credentials khách hàng dạng mã hóa.",
    svg: (
      <>
        <rect x="4" y="11" width="16" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </>
    ),
  },
  {
    title: "Admin & Audit",
    desc: "Heatmap, anomaly detection, audit log đầy đủ.",
    svg: (
      <>
        <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" />
        <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  {
    title: "Integrations",
    desc: "Clerk, Google Drive, Git webhook & cron.",
    svg: (
      <>
        <circle cx="6" cy="6" r="2.5" />
        <circle cx="6" cy="18" r="2.5" />
        <circle cx="18" cy="9" r="2.5" />
        <path d="M6 8.5v7M18 11.5c0 3-3 3.5-6 3.5" strokeLinecap="round" />
      </>
    ),
  },
];

const TESTIMONIALS = [
  {
    quote: "Trước dùng Excel + Slack riêng lẻ, mỗi tháng mất cả buổi chiều tổng hợp lương. Giờ jobihome tự tính từ time log, tôi chỉ cần duyệt trong 10 phút.",
    name: "Nguyễn Thành Đạt",
    role: "CTO · Founding Engineer",
    company: "Loship",
    initials: "ND",
    gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  },
  {
    quote: "Auto-KPI dựa trên task thật thay cho cảm tính — team 12 người giờ có review Q quý minh bạch, nhân viên tự thấy mình đứng đâu và cần cải thiện gì.",
    name: "Trần Minh Châu",
    role: "Engineering Manager",
    company: "Tiki",
    initials: "TC",
    gradient: "linear-gradient(135deg, #0ea5e9, #2f6bff)",
  },
  {
    quote: "Onboarding nhân viên mới từ 3 ngày setup xuống còn 30 phút. Hồ sơ, phân quyền, task đầu tiên — mọi thứ đều trong một workspace duy nhất.",
    name: "Lê Thu Hương",
    role: "Head of People",
    company: "KiotViet",
    initials: "LH",
    gradient: "linear-gradient(135deg, #10b981, #2f6bff)",
  },
];

function StarIco() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.6 6.3L21 9l-5 4.3 1.5 6.7L12 16.5l-5.5 3.5L8 13.3 3 9l6.4-.7z" />
    </svg>
  );
}

function ArrowIco({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function CheckIco({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12l5 5L20 6" />
    </svg>
  );
}

function CheckPlanIco() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12l5 5L20 6" />
    </svg>
  );
}

export default async function LandingPage() {
  const session = await auth();
  const h = await headers();
  const tenantSlug = h.get("x-tenant-slug");

  if (tenantSlug && session.userId) redirect("/welcome");

  const plans = Object.values(PLANS);

  return (
    <>
      <StructuredData />

      {/* ============ HERO ============ */}
      <section className="lp-glow relative overflow-hidden" style={{ padding: "clamp(40px, 5vw, 64px) 0 clamp(48px, 6vw, 80px)" }}>
        <span className="lp-blob lp-blob-1" />
        <span className="lp-blob lp-blob-2" />
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <div className="max-w-[820px] mx-auto text-center">
            <span className="lp-hero-badge"><span className="lp-dotpulse" />Hệ thống quản lý team cho startup Việt</span>
            <h1
              className="text-balance mt-6 font-extrabold text-lp-text"
              style={{ fontSize: "clamp(2.6rem, 6vw, 4.3rem)", lineHeight: 1.02, letterSpacing: "-0.035em" }}
            >
              Quản lý cả đội ngũ trong{" "}
              <span className="lp-grad-text">một workspace</span> duy nhất
            </h1>
            <p
              className="mt-6 mx-auto text-lp-text-2"
              style={{ fontSize: "clamp(1.05rem, 1.6vw, 1.28rem)", lineHeight: 1.6, maxWidth: "60ch" }}
            >
              Tasks, chấm công, trả lương đến đánh giá hiệu suất — jobihome giúp quản lý đội ngũ toàn vẹn, từ khâu tuyển dụng đến khi nghỉ việc.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-9">
              <Link href="/sign-up" className="lp-btn lp-btn-primary lp-btn-lg">
                Dùng thử 14 ngày miễn phí <ArrowIco />
              </Link>
              <Link href="/tinh-nang" className="lp-btn lp-btn-ghost lp-btn-lg">
                Xem tính năng
              </Link>
            </div>
            <p className="mt-4 lp-mono text-[0.85rem] text-lp-text-3">
              Không cần thẻ tín dụng · Hỗ trợ tiếng Việt
            </p>
          </div>

          {/* dashboard mockup */}
          <div className="lp-mock lp-float-soft mt-14 mx-auto" style={{ maxWidth: 1040 }}>
            <div className="lp-mock-bar">
              <div className="lp-mock-dots"><i /><i /><i /></div>
              <div className="lp-mock-url">app.jobihome.vn/dashboard</div>
            </div>
            <div className="grid" style={{ gridTemplateColumns: "188px 1fr", minHeight: 360 }}>
              <aside className="lp-mock-side">
                <div className="flex items-center gap-2 font-extrabold text-[0.92rem] px-2 pt-1 pb-4">
                  <i className="block w-5 h-5 rounded-md" style={{ background: "linear-gradient(135deg, var(--lp-accent), var(--lp-accent-2))" }} />
                  <span>jobihome</span>
                </div>
                <nav className="lp-mock-nav flex flex-col gap-0.5">
                  <a className="on" href="#">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                      <rect x="14" y="14" width="7" height="7" rx="1" />
                    </svg>
                    <span>Tổng quan</span>
                  </a>
                  <a href="#">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M9 11l3 3L22 4" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                    <span>Công việc</span>
                  </a>
                  <a href="#">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 2" strokeLinecap="round" />
                    </svg>
                    <span>Chấm công</span>
                  </a>
                  <a href="#">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                    <span>Lương</span>
                  </a>
                  <a href="#">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2l2.6 6.3L21 9l-5 4.3L17.5 20 12 16.5 6.5 20 8 13.3 3 9l6.4-.7z" />
                    </svg>
                    <span>Đánh giá</span>
                  </a>
                  <a href="#">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="9" cy="8" r="3" />
                      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeLinecap="round" />
                      <path d="M16 4a3 3 0 0 1 0 6M21 20a5 5 0 0 0-4-5" strokeLinecap="round" />
                    </svg>
                    <span>Nhân sự</span>
                  </a>
                </nav>
              </aside>

              <main className="p-5 overflow-hidden">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <div className="font-bold text-[1.05rem]">Tổng quan team</div>
                    <div className="text-[0.76rem] text-lp-text-3">Quý 2 · 2026 — 14 thành viên</div>
                  </div>
                  <div className="lp-avs">
                    <i /><i /><i /><i />
                    <i style={{ background: "var(--lp-surface-2)", color: "var(--lp-text-3)", fontSize: 10, display: "grid", placeItems: "center", fontWeight: 700 }}>+9</i>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="lp-mk">
                    <div className="text-[0.68rem] text-lp-text-3 lp-mono uppercase tracking-wider">Tasks done</div>
                    <div className="text-[1.5rem] font-extrabold leading-tight mt-1">187</div>
                    <div className="text-[0.72rem] font-semibold" style={{ color: "var(--lp-ok)" }}>▲ 12% so với tháng trước</div>
                  </div>
                  <div className="lp-mk">
                    <div className="text-[0.68rem] text-lp-text-3 lp-mono uppercase tracking-wider">Giờ làm</div>
                    <div className="text-[1.5rem] font-extrabold leading-tight mt-1">1.842h</div>
                    <div className="text-[0.72rem] font-semibold" style={{ color: "var(--lp-ok)" }}>▲ 4%</div>
                  </div>
                  <div className="lp-mk">
                    <div className="text-[0.68rem] text-lp-text-3 lp-mono uppercase tracking-wider">Đúng hạn</div>
                    <div className="text-[1.5rem] font-extrabold leading-tight mt-1">94%</div>
                    <div className="text-[0.72rem] font-semibold" style={{ color: "var(--lp-ok)" }}>▲ 6%</div>
                  </div>
                </div>
                <div className="grid gap-3" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
                  <div className="lp-mock-panel">
                    <div className="flex justify-between items-center text-[0.8rem] font-semibold mb-3">
                      Năng suất theo tuần <span className="text-lp-text-3 font-medium text-[0.72rem]">tasks / tuần</span>
                    </div>
                    <div className="lp-chart">
                      {[42, 58, 50, 72, 88, 64, 80, 96].map((h, i) => (
                        <div key={i} className={`lp-bar${h >= 85 ? " lp-bar-hi" : ""}`} style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                  <div className="lp-mock-panel">
                    <div className="flex justify-between items-center text-[0.8rem] font-semibold mb-3">
                      Việc hôm nay <span className="text-lp-text-3 font-medium text-[0.72rem]">6 task</span>
                    </div>
                    <div className="lp-tasklist">
                      <div className="lp-task lp-task-done"><div className="lp-cb" /><div className="lp-tt">Review PR #284</div><div className="lp-badge">2h</div></div>
                      <div className="lp-task"><div className="lp-cb" /><div className="lp-tt">Thiết kế onboarding</div><div className="lp-badge lp-badge-hi">Ưu tiên</div></div>
                      <div className="lp-task"><div className="lp-cb" /><div className="lp-tt">Họp sprint planning</div><div className="lp-badge">1h</div></div>
                      <div className="lp-task lp-task-done"><div className="lp-cb" /><div className="lp-tt">Fix bug thanh toán</div><div className="lp-badge">3h</div></div>
                    </div>
                  </div>
                </div>
              </main>
            </div>
          </div>
        </div>
      </section>

      {/* ============ STAT / TRUST STRIP ============ */}
      <div className="lp-statbar">
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <div className="lp-statbar-grid">
            <div className="lp-statbar-item"><div className="sn">11</div><div className="sl">workspace đang hoạt động</div></div>
            <div className="lp-statbar-item"><div className="sn">5–25</div><div className="sl">nhân sự trên team</div></div>
            <div className="lp-statbar-item"><div className="sn">14 ngày</div><div className="sl">dùng thử miễn phí</div></div>
            <div className="lp-statbar-item"><div className="sn">100%</div><div className="sl">hoàn tiền nếu không hài lòng</div></div>
          </div>
        </div>
      </div>

      {/* ============ PROBLEM → SOLUTION ============ */}
      <section style={{ padding: "clamp(48px, 6vw, 80px) 0" }}>
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <div className="flex gap-3 justify-center mb-6">
            <span className="lp-mono text-[0.72rem] font-semibold tracking-[0.06em] uppercase px-3 py-1.5 rounded-full" style={{ background: "rgba(255,107,107,0.13)", color: "#FF6B6B" }}>Vấn đề</span>
            <span className="lp-mono text-[0.72rem] font-semibold tracking-[0.06em] uppercase px-3 py-1.5 rounded-full" style={{ background: "rgba(74,222,128,0.13)", color: "var(--lp-ok)" }}>Giải pháp</span>
          </div>
          <div className="text-center max-w-[560px] mx-auto">
            <h2 className="text-balance font-extrabold" style={{ fontSize: "clamp(1.9rem, 3.6vw, 2.9rem)", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
              Hết thời Excel rời rạc và công cụ chắp vá.
            </h2>
            <p className="mt-4 text-lp-text-2" style={{ fontSize: "clamp(1rem, 1.5vw, 1.15rem)" }}>
              Mỗi đầu việc quản lý team nằm ở một nơi khác nhau. jobihome thay từng mảnh ghép rời rạc bằng một quy trình liền mạch.
            </p>
          </div>

          <div className="lp-ps-grid">
            {/* Cột TRƯỚC ĐÂY */}
            <div className="lp-ps-col">
              <div className="lp-ps-col-label problem">Trước đây</div>

              {/* Pain 1 — Task phân tán */}
              <div className="lp-ps-card prob">
                <div className="lp-ico">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M10.3 3.9l-7 12A2 2 0 0 0 5 19h14a2 2 0 0 0 1.7-3l-7-12a2 2 0 0 0-3.4 0z" />
                    <path d="M12 9v4M12 17h.01" />
                  </svg>
                </div>
                <h3 className="text-[1rem] font-semibold mt-4 mb-1.5">Task & tiến độ phân tán</h3>
                <p className="text-lp-text-2 text-[0.9rem]">Theo dõi công việc rải rác trên chat, sheet, sticky note — không ai nắm được bức tranh tổng thể.</p>
                <span className="lp-ps-stat">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M10.3 3.9l-7 12A2 2 0 0 0 5 19h14a2 2 0 0 0 1.7-3l-7-12a2 2 0 0 0-3.4 0z"/></svg>
                  3+ công cụ rời rạc mỗi ngày
                </span>
                {/* Mini chaos visual */}
                <div className="lp-ps-mini p-3 mt-3">
                  <div className="flex gap-2 items-center mb-2">
                    {["Slack", "Sheet", "Notion"].map((t) => (
                      <span key={t} className="lp-mono text-[0.62rem] px-2 py-0.5 rounded" style={{ background: "rgba(255,107,107,0.12)", color: "#FF6B6B", border: "1px solid rgba(255,107,107,0.2)" }}>{t}</span>
                    ))}
                    <span className="lp-mono text-[0.62rem] text-lp-text-3">+5 nữa</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {[["Review PR #201", "?", 0.4], ["Deploy staging", "??", 0.65], ["Fix login bug", "???", 0.25]].map(([name, status, w]) => (
                      <div key={String(name)} className="flex items-center gap-2">
                        <div className="h-1.5 rounded-full flex-1" style={{ background: "var(--lp-border)" }}>
                          <div className="h-full rounded-full" style={{ width: `${Number(w) * 100}%`, background: "rgba(255,107,107,0.5)" }} />
                        </div>
                        <span className="lp-mono text-[0.6rem] text-lp-text-3 w-6">{status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pain 2 — Lương thủ công */}
              <div className="lp-ps-card prob">
                <div className="lp-ico">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <path d="M3 9h18M8 4v16" strokeLinecap="round" />
                  </svg>
                </div>
                <h3 className="text-[1rem] font-semibold mt-4 mb-1.5">Chấm công & lương thủ công</h3>
                <p className="text-lp-text-2 text-[0.9rem]">Tổng hợp giờ làm bằng tay trên Excel, tính lương mất nhiều công và dễ sai sót.</p>
                <span className="lp-ps-stat">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9l-7 12A2 2 0 0 0 5 19h14a2 2 0 0 0 1.7-3l-7-12a2 2 0 0 0-3.4 0z"/></svg>
                  Mất 4–6h tính lương mỗi tháng
                </span>
                {/* Mini excel error visual */}
                <div className="lp-ps-mini mt-3">
                  <div className="grid text-[0.64rem] lp-mono" style={{ gridTemplateColumns: "80px 1fr 1fr 1fr" }}>
                    {[
                      ["Nhân viên", "Giờ", "Lương CB", "Thực nhận"],
                      ["Minh Anh", "168", "12,000,000", <span key="e1" style={{ color: "#FF6B6B" }}>#REF!</span>],
                      ["Tuấn Kiệt", "172", "10,500,000", <span key="e2" style={{ color: "#FF6B6B" }}>#VALUE!</span>],
                      ["Thu Hà", "160", "9,000,000", "???"],
                    ].map((row, ri) => (
                      row.map((cell, ci) => (
                        <div key={`${ri}-${ci}`} className="px-2 py-1.5 truncate" style={{
                          borderBottom: "1px solid var(--lp-border)",
                          borderRight: ci < 3 ? "1px solid var(--lp-border)" : undefined,
                          background: ri === 0 ? "var(--lp-surface-2)" : undefined,
                          color: ri === 0 ? "var(--lp-text-3)" : "var(--lp-text-2)",
                          fontWeight: ri === 0 ? 600 : undefined,
                        }}>{cell}</div>
                      ))
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Cột VỚI JOBIHOME */}
            <div className="lp-ps-col">
              <div className="lp-ps-col-label solution">Với jobihome</div>

              {/* Sol 1 — Task tích hợp */}
              <div className="lp-ps-card sol">
                <div className="lp-ico">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                </div>
                <h3 className="text-[1rem] font-semibold mt-4 mb-1.5">Task management tích hợp</h3>
                <p className="text-lp-text-2 text-[0.9rem]">Trạng thái, ưu tiên, ước tính thời gian và timer theo từng task — tất cả ở một nơi.</p>
                <span className="lp-ps-stat">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 6"/></svg>
                  1 workspace · toàn bộ team
                </span>
                {/* Mini kanban visual */}
                <div className="lp-ps-mini p-3 mt-3">
                  <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
                    {[
                      { col: "Cần làm", color: "var(--lp-text-3)", tasks: ["Thiết kế UI", "Viết test"] },
                      { col: "Đang làm", color: "var(--lp-warn)", tasks: ["API auth ▶ 01:12"] },
                      { col: "Done", color: "var(--lp-ok)", tasks: ["Setup CI", "DB schema"] },
                    ].map(({ col, color, tasks }) => (
                      <div key={col}>
                        <div className="lp-mono text-[0.6rem] font-semibold mb-1.5 truncate" style={{ color }}>{col}</div>
                        <div className="flex flex-col gap-1">
                          {tasks.map((t) => (
                            <div key={t} className="text-[0.65rem] px-2 py-1 rounded" style={{ background: "var(--lp-surface-2)", color: "var(--lp-text-2)" }}>{t}</div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sol 2 — Lương tự động */}
              <div className="lp-ps-card sol">
                <div className="lp-ico">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="text-[1rem] font-semibold mt-4 mb-1.5">Office Time + lương tự động</h3>
                <p className="text-lp-text-2 text-[0.9rem]">Chấm công auto-derive từ time log, manager duyệt nhanh, lương liên kết trực tiếp.</p>
                <span className="lp-ps-stat">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 6"/></svg>
                  Tự động 100% · sai sót 0
                </span>
                {/* Mini salary auto visual */}
                <div className="lp-ps-mini mt-3">
                  <div className="grid text-[0.64rem] lp-mono" style={{ gridTemplateColumns: "80px 1fr 1fr 1fr" }}>
                    {[
                      ["Nhân viên", "Giờ", "Lương CB", "Thực nhận"],
                      ["Minh Anh", "168h", "12,000,000", "12,600,000"],
                      ["Tuấn Kiệt", "172h", "10,500,000", "11,025,000"],
                      ["Thu Hà", "160h", "9,000,000", "9,000,000"],
                    ].map((row, ri) => (
                      row.map((cell, ci) => (
                        <div key={`${ri}-${ci}`} className="px-2 py-1.5 truncate" style={{
                          borderBottom: "1px solid var(--lp-border)",
                          borderRight: ci < 3 ? "1px solid var(--lp-border)" : undefined,
                          background: ri === 0 ? "var(--lp-surface-2)" : undefined,
                          color: ri === 0 ? "var(--lp-text-3)" : ci === 3 ? "var(--lp-ok)" : "var(--lp-text-2)",
                          fontWeight: (ri === 0 || ci === 3) ? 600 : undefined,
                        }}>{cell}</div>
                      ))
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Banner */}
          <div className="lp-ps-banner">
            <div className="pb-logo">
              <span className="lm">j</span>
              <span>jobihome<span style={{ color: "var(--lp-accent-ink)" }}>.vn</span></span>
            </div>
            <div className="pb-pills">
              {["Tasks", "Chấm công", "Lương", "Đánh giá", "Vault"].map((p) => (
                <span key={p} className="pb-pill">{p}</span>
              ))}
            </div>
            <Link href="/sign-up" className="lp-btn lp-btn-primary" style={{ height: 42, padding: "0 20px", fontSize: "0.9rem", borderRadius: "100px" }}>
              Dùng thử miễn phí <ArrowIco size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ============ FEATURE SPLIT 1 — Task & Time ============ */}
      <section
        style={{
          background: "var(--lp-bg-elev)",
          borderTop: "1px solid var(--lp-border)",
          borderBottom: "1px solid var(--lp-border)",
          padding: "clamp(48px, 6vw, 80px) 0",
        }}
      >
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center" style={{ gap: "clamp(34px, 5vw, 76px)" }}>
            <div>
              <span className="lp-eyebrow">Tasks · Time · Payroll</span>
              <h2 className="text-balance mt-4 font-extrabold" style={{ fontSize: "clamp(1.9rem, 3.6vw, 2.9rem)", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
                Từ giao việc đến bấm giờ, liền một mạch.
              </h2>
              <p className="mt-4 text-lp-text-2" style={{ fontSize: "clamp(1.05rem, 1.6vw, 1.28rem)", lineHeight: 1.6 }}>
                Tạo task theo trạng thái Cần làm · Đang làm · Done, gắn ưu tiên và ước tính thời gian. Bấm giờ ngay trên task để ghi nhận actual time chính xác.
              </p>
              <div className="lp-tt-bullets">
                <div className="lp-tt-bullet active">
                  <span className="dot" /><div><div className="bname">Timer start/stop theo task</div><div className="bdesc">Mỗi phiên làm việc được lưu lại, làm nền cho chấm công & lương.</div></div>
                </div>
                <div className="lp-tt-bullet">
                  <span className="dot" /><div><div className="bname">Task template & review workflow</div><div className="bdesc">Chuẩn hoá quy trình lặp lại, duyệt task trước khi đóng.</div></div>
                </div>
                <div className="lp-tt-bullet">
                  <span className="dot" /><div><div className="bname">Office Time auto-derive</div><div className="bdesc">Giờ vào/ra suy ra tự động từ time log, manager chỉ cần duyệt.</div></div>
                </div>
                <div className="lp-tt-bullet">
                  <span className="dot" /><div><div className="bname">Ưu tiên & ước tính thời gian</div><div className="bdesc">Gắn priority và est-time để lập kế hoạch sprint chính xác.</div></div>
                </div>
              </div>
              <Link href="/tinh-nang" className="lp-btn lp-btn-text mt-7 inline-flex">
                Tìm hiểu Task & Time <ArrowIco size={16} />
              </Link>
            </div>
            <div>
              <div className="lp-mock">
                <div className="lp-mock-tabs">
                  <div className="lp-mock-tab on">Sprint 14 <span className="cnt">12</span></div>
                  <div className="lp-mock-tab">Backlog <span className="cnt">28</span></div>
                  <div className="lp-mock-tab">Done <span className="cnt">7</span></div>
                </div>
                <div className="p-4">
                  <div className="lp-tt-row"><span className="lp-tt-prio lo" /><span className="lp-tt-name done">Setup CI/CD pipeline</span><span className="lp-tt-chip done">Done</span><span className="lp-tt-av" /></div>
                  <div className="lp-tt-row"><span className="lp-tt-prio hi" /><span className="lp-tt-name">API endpoint chấm công</span><span className="lp-tt-chip doing">▶ 01:24:08</span><span className="lp-tt-av" /></div>
                  <div className="lp-tt-row"><span className="lp-tt-prio md" /><span className="lp-tt-name">Migrate Prisma schema</span><span className="lp-tt-chip todo">Cần làm</span><span className="lp-tt-av" /></div>
                  <div className="lp-tt-row"><span className="lp-tt-prio lo" /><span className="lp-tt-name done">Viết test cho salary module</span><span className="lp-tt-chip done">Done</span><span className="lp-tt-av" /></div>
                  <div className="lp-tt-row"><span className="lp-tt-prio md" /><span className="lp-tt-name">Review thiết kế dashboard</span><span className="lp-tt-chip doing">Đang làm</span><span className="lp-tt-av" /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FEATURE SPLIT 2 — Performance ============ */}
      <section style={{ padding: "clamp(48px, 6vw, 80px) 0" }}>
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center" style={{ gap: "clamp(34px, 5vw, 76px)" }}>
            <div className="order-2 lg:order-1">
              <div className="lp-mock">
                <div className="lp-mock-bar"><div className="lp-mock-dots"><i /><i /><i /></div><div className="lp-mock-url">app.jobihome.vn/reviews</div></div>
                <div className="p-6">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-bold">Review Q2 · Minh Anh</div>
                    <span className="lp-tag">Frontend Lead</span>
                  </div>
                  <div className="grid items-center gap-5" style={{ gridTemplateColumns: "110px 1fr" }}>
                    <div>
                      <div className="lp-donut" style={{ ["--p" as string]: 86 }}>
                        <div className="inner">8.6</div>
                      </div>
                      <div className="text-center text-[0.72rem] text-lp-text-3 lp-mono mt-1">ĐIỂM TỔNG</div>
                    </div>
                    <div className="lp-tasklist">
                      <div className="lp-task"><div className="lp-tt">Tốc độ</div><div className="lp-badge lp-badge-hi">9.2</div></div>
                      <div className="lp-task"><div className="lp-tt">Chất lượng</div><div className="lp-badge lp-badge-hi">8.8</div></div>
                      <div className="lp-task"><div className="lp-tt">Đúng hạn</div><div className="lp-badge lp-badge-hi">8.5</div></div>
                      <div className="lp-task"><div className="lp-tt">Học hỏi</div><div className="lp-badge">7.9</div></div>
                      <div className="lp-task"><div className="lp-tt">Chủ động</div><div className="lp-badge lp-badge-hi">8.6</div></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <span className="lp-eyebrow">Performance Reviews</span>
              <h2 className="text-balance mt-4 font-extrabold" style={{ fontSize: "clamp(1.9rem, 3.6vw, 2.9rem)", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
                Đánh giá khách quan từ dữ liệu thật
              </h2>
              <p className="mt-4 text-lp-text-2" style={{ fontSize: "clamp(1.05rem, 1.6vw, 1.28rem)", lineHeight: 1.6 }}>
                Chu kỳ review theo quý/năm với 3 nguồn điểm chạy song song — không còn đánh giá cảm tính.
              </p>
              <ul className="lp-feat-list">
                <li><span className="lp-ck"><CheckIco /></span><div><b>Auto-KPI từ data</b><p>5 tiêu chí: Tốc độ · Chất lượng · Đúng hạn · Học hỏi · Chủ động.</p></div></li>
                <li><span className="lp-ck"><CheckIco /></span><div><b>Self-review & Manager review</b><p>Nhân viên tự đánh giá, manager cho điểm chính thức dùng cho lương/thăng chức.</p></div></li>
                <li><span className="lp-ck"><CheckIco /></span><div><b>AI-suggest KPI tiếp theo</b><p>Hệ thống gợi ý mục tiêu kế tiếp dựa trên xu hướng hiệu suất.</p></div></li>
              </ul>
              <Link href="/tinh-nang" className="lp-btn lp-btn-text mt-7 inline-flex">
                Cách tính Auto-KPI <ArrowIco size={16} />
              </Link>
            </div>
          </div>

          {/* ── Testimonials ── */}
          <div className="lp-testi-grid">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="lp-testi-card">
                <div className="lp-testi-stars">
                  {Array.from({ length: 5 }).map((_, i) => <StarIco key={i} />)}
                </div>
                <p className="lp-testi-quote">{t.quote}</p>
                <div className="lp-testi-author">
                  <div className="lp-testi-av" style={{ background: t.gradient }}>{t.initials}</div>
                  <div>
                    <div className="lp-testi-name">{t.name}</div>
                    <div className="lp-testi-role">{t.role} · {t.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ ALL MODULES ============ */}
      <section
        style={{
          background: "var(--lp-bg-elev)",
          borderTop: "1px solid var(--lp-border)",
          padding: "clamp(48px, 6vw, 80px) 0",
        }}
      >
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <div className="text-center max-w-[680px] mx-auto mb-13">
            <span className="lp-mono text-[0.72rem] font-semibold tracking-[0.08em] uppercase px-3 py-1.5 rounded-full inline-block" style={{ background: "var(--lp-surface-2)", color: "var(--lp-accent-ink)" }}>Tính năng đầy đủ</span>
            <h2 className="text-balance mt-4 font-extrabold" style={{ fontSize: "clamp(1.9rem, 3.6vw, 2.9rem)", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
              Một hệ thống, trọn vẹn đội nhân sự.
            </h2>
            <p className="mt-4 text-lp-text-2" style={{ fontSize: "clamp(1.05rem, 1.6vw, 1.28rem)" }}>
              Từ hồ sơ nhân viên đến vault mật khẩu khách hàng — mọi thứ một tech lead cần, trong cùng một workspace.
            </p>
          </div>
          <div className="lp-fm-grid mt-10">
            {MODULES.map((m) => (
              <div key={m.title} className="lp-fm-card">
                <div className="lp-ico">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{m.svg}</svg>
                </div>
                <h3>{m.title}</h3>
                <p>{m.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/tinh-nang" className="lp-btn lp-btn-ghost">Xem tất cả tính năng</Link>
          </div>

          {/* Inline CTA sau module grid */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-12 px-8 py-5 rounded-2xl" style={{ background: "var(--lp-surface)", border: "1px solid var(--lp-border)" }}>
            <div>
              <p className="font-semibold text-[0.97rem]">Sẵn sàng thử tất cả 12 module?</p>
              <p className="text-lp-text-2 text-[0.88rem] mt-0.5">Dùng thử miễn phí 14 ngày, không cần thẻ tín dụng.</p>
            </div>
            <Link href="/sign-up" className="lp-btn lp-btn-primary flex-shrink-0" style={{ height: 42, padding: "0 22px", fontSize: "0.9rem" }}>
              Bắt đầu miễn phí <ArrowIco size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ============ INTEGRATIONS ============ */}
      <section style={{ padding: "clamp(48px, 6vw, 80px) 0" }}>
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center" style={{ gap: "clamp(34px, 5vw, 76px)" }}>
            <div>
              <span className="lp-eyebrow">Integrations</span>
              <h2 className="text-balance mt-4 font-extrabold" style={{ fontSize: "clamp(1.9rem, 3.6vw, 2.9rem)", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
                Kết nối với công cụ đội ngũ đang dùng
              </h2>
              <p className="mt-4 text-lp-text-2" style={{ fontSize: "clamp(1.05rem, 1.6vw, 1.28rem)", lineHeight: 1.6 }}>
                jobihome tích hợp sẵn với hệ sinh thái quen thuộc, dữ liệu đồng bộ tự động.
              </p>
              <Link href="/tich-hop" className="lp-btn lp-btn-text mt-7 inline-flex">
                Xem tất cả tích hợp <ArrowIco size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="lp-card lp-card-hover">
                <div className="lp-ico">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M6 15a2 2 0 1 1-2-2h2zM9 15a2 2 0 0 1 4 0v5a2 2 0 0 1-4 0z"/><path d="M9 6a2 2 0 1 1 2 2H9zM9 9a2 2 0 0 1 0-4h5a2 2 0 0 1 0 4z"/><path d="M18 9a2 2 0 1 1 2 2h-2zM15 9a2 2 0 0 1-4 0V4a2 2 0 0 1 4 0z"/><path d="M15 18a2 2 0 1 1-2-2h2zM15 15a2 2 0 0 1 0 4h-5a2 2 0 0 1 0-4z"/>
                  </svg>
                </div>
                <h3 className="font-bold text-[0.97rem]">Slack</h3>
                <p className="text-lp-text-2 text-[0.85rem]">Nhận thông báo task & duyệt ngay trong kênh.</p>
              </div>
              <div className="lp-card lp-card-hover">
                <div className="lp-ico">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
                    <path d="M8 3l-6 10 3 5h6M16 3l6 10-3 5h-6M8 3h8l-4 7z" />
                  </svg>
                </div>
                <h3 className="font-bold text-[0.97rem]">Google Drive</h3>
                <p className="text-lp-text-2 text-[0.85rem]">Lấy thông tin tài liệu, video từ link Drive.</p>
              </div>
              <div className="lp-card lp-card-hover">
                <div className="lp-ico">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z"/><path d="M12 11l4-2.2M12 11v4.5M12 11L8 8.8"/>
                  </svg>
                </div>
                <h3 className="font-bold text-[0.97rem]">Jira</h3>
                <p className="text-lp-text-2 text-[0.85rem]">Đồng bộ issue & trạng thái hai chiều.</p>
              </div>
              <div className="lp-card lp-card-hover">
                <div className="lp-ico">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="6" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="9" r="2.5" />
                    <path d="M6 8.5v7M18 11.5c0 3-3 3.5-6 3.5" strokeLinecap="round" />
                  </svg>
                </div>
                <h3 className="font-bold text-[0.97rem]">Git webhook</h3>
                <p className="text-lp-text-2 text-[0.85rem]">Đưa commit/PR vào activity log tự động.</p>
              </div>
              <div className="lp-card lp-card-hover">
                <div className="lp-ico">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5"/>
                  </svg>
                </div>
                <h3 className="font-bold text-[0.97rem]">All webhook</h3>
                <p className="text-lp-text-2 text-[0.85rem]">Kết nối bất kỳ dịch vụ nào qua webhook.</p>
              </div>
              <div className="lp-card lp-card-hover">
                <div className="lp-ico">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v4h-4"/>
                  </svg>
                </div>
                <h3 className="font-bold text-[0.97rem]">Smart Sync</h3>
                <p className="text-lp-text-2 text-[0.85rem]">Tự đồng bộ & phát hiện bất thường định kỳ.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PRICING TEASER ============ */}
      <section style={{ background: "var(--lp-bg)", padding: "clamp(48px, 6vw, 80px) 0" }}>
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <div className="text-center max-w-[600px] mx-auto mb-14">
            <span className="lp-eyebrow lp-center">Phí dịch vụ · Minh bạch</span>
            <h2 className="text-balance mt-4 font-extrabold" style={{ fontSize: "clamp(1.9rem, 3.6vw, 2.9rem)", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
              Bắt đầu miễn phí, nâng cấp khi team lớn lên.
            </h2>
            <p className="mt-4 text-lp-text-2" style={{ fontSize: "clamp(1rem, 1.5vw, 1.15rem)" }}>
              Ba gói phù hợp từng giai đoạn. Dùng thử 14 ngày, không cần thẻ.
            </p>
          </div>

          <div className="lp-pr-grid">
            {/* Solo — Free */}
            <div className="lp-pr-card">
              <div className="lp-pr-name">Solo</div>
              <div className="lp-pr-price">Miễn phí</div>
              <p className="lp-pr-sub">Cho cá nhân khởi đầu.</p>
              <hr className="lp-pr-div" />
              <ul className="lp-pr-feats">
                <li className="yes"><span className="ck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 6"/></svg></span>1 thành viên</li>
                <li className="yes"><span className="ck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 6"/></svg></span>Tasks &amp; time log cơ bản</li>
                <li className="yes"><span className="ck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 6"/></svg></span>Audit 30 ngày</li>
                <li className="no"><span className="ck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></span>Office Time &amp; Salary</li>
                <li className="no"><span className="ck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></span>Vault &amp; Anomaly detection</li>
              </ul>
              <Link href="/sign-up" className="lp-pr-cta lp-btn lp-btn-ghost lp-btn-block">Bắt đầu</Link>
            </div>

            {/* Starter — Featured */}
            <div className="lp-pr-card feature">
              <span className="lp-pr-badge">Phổ biến</span>
              <div className="lp-pr-name">Starter</div>
              <div className="lp-pr-price">299.000đ<span className="per">/tháng</span></div>
              <p className="lp-pr-sub">Cho team đang tăng tốc, tối đa 10 người.</p>
              <hr className="lp-pr-div" />
              <ul className="lp-pr-feats">
                <li className="yes"><span className="ck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 6"/></svg></span>Tối đa 10 thành viên</li>
                <li className="yes"><span className="ck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 6"/></svg></span>Office Time, Salary, Payments</li>
                <li className="yes"><span className="ck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 6"/></svg></span>Phân quyền nâng cao</li>
                <li className="yes"><span className="ck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 6"/></svg></span>Performance reviews · Audit 90 ngày</li>
                <li className="no"><span className="ck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></span>Vault &amp; Anomaly detection</li>
              </ul>
              <Link href="/sign-up" className="lp-pr-cta lp-btn lp-btn-primary lp-btn-block">Dùng thử 14 ngày</Link>
            </div>

            {/* Team */}
            <div className="lp-pr-card">
              <div className="lp-pr-name">Team</div>
              <div className="lp-pr-price">799.000đ<span className="per">/tháng</span></div>
              <p className="lp-pr-sub">Cho đội ngũ trưởng thành, tối đa 25 người.</p>
              <hr className="lp-pr-div" />
              <ul className="lp-pr-feats">
                <li className="yes"><span className="ck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 6"/></svg></span>Tối đa 25 thành viên</li>
                <li className="yes"><span className="ck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 6"/></svg></span>Mọi thứ trong gói Starter</li>
                <li className="yes"><span className="ck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 6"/></svg></span>Anomaly detection · Vault · Heatmap</li>
                <li className="yes"><span className="ck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 6"/></svg></span>Audit không giới hạn</li>
                <li className="yes"><span className="ck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 6"/></svg></span>Priority support</li>
              </ul>
              <Link href="/sign-up" className="lp-pr-cta lp-btn lp-btn-ghost lp-btn-block">Bắt đầu</Link>
            </div>
          </div>

          <div className="text-center mt-10">
            <Link href="/pricing" className="lp-btn lp-btn-text inline-flex">
              Xem chi tiết bảng giá <ArrowIco size={16} />
            </Link>
          </div>

          {/* Inline CTA sau pricing */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-10 px-8 py-5 rounded-2xl" style={{ background: "var(--lp-accent-soft)", border: "1px solid var(--lp-accent-soft-2)" }}>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-9 h-9 rounded-full grid place-items-center" style={{ background: "var(--lp-accent-soft-2)" }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--lp-accent-ink)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l2.6 6.3L21 9l-5 4.3 1.5 6.7L12 16.5l-5.5 3.5L8 13.3 3 9l6.4-.7z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-[0.97rem]">Không chắc gói nào phù hợp?</p>
                <p className="text-lp-text-2 text-[0.88rem] mt-0.5">Thử miễn phí 14 ngày — tất cả gói đều không cần thẻ.</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <Link href="/pricing" className="lp-btn lp-btn-ghost" style={{ height: 40, padding: "0 18px", fontSize: "0.88rem" }}>
                So sánh gói
              </Link>
              <Link href="/sign-up" className="lp-btn lp-btn-primary" style={{ height: 40, padding: "0 20px", fontSize: "0.88rem" }}>
                Dùng thử miễn phí
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section style={{ padding: "clamp(48px, 6vw, 72px) 0 clamp(56px, 7vw, 96px)" }}>
        <div className="w-full max-w-[1100px] mx-auto px-7">
          <div className="lp-fcta">
            <span className="deco d1" /><span className="deco d2" />
            <div className="lp-fcta-grid">
              {/* LEFT */}
              <div className="lp-fc-left">
                <span className="lp-fc-badge">Miễn phí 14 ngày</span>
                <h2 className="text-balance">Bắt đầu quản lý team thông minh hơn hôm nay.</h2>
                <p className="lp-fc-sub">Tạo workspace trong 2 phút. Không cần thẻ tín dụng. Hủy bất cứ lúc nào.</p>
                <ul className="lp-fc-checks">
                  {[
                    "Không cần thẻ tín dụng",
                    "Setup trong 2 phút",
                    "Hỗ trợ onboarding miễn phí",
                    "Hủy bất cứ lúc nào",
                  ].map((item) => (
                    <li key={item}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12l5 5L20 6" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="lp-fc-proof">
                  <div className="lp-avs"><i /><i /><i /><i /><i /></div>
                  <span>120+ startup Việt đã tin dùng</span>
                </div>
              </div>

              {/* RIGHT */}
              <div className="lp-fc-card">
                <h3>Tạo tài khoản miễn phí</h3>
                <p className="text-[0.9rem] mb-5" style={{ color: "#6B7280" }}>Dùng thử đầy đủ 14 ngày, không cần thẻ.</p>
                <Link href="/sign-up" className="lp-btn lp-btn-primary lp-btn-block lp-btn-lg" style={{ borderRadius: 10, justifyContent: "center" }}>
                  Tạo workspace miễn phí <ArrowIco size={17} />
                </Link>
                <p className="fc-cta-note mt-4">🔒 Dữ liệu mã hóa SSL · Không spam · Hủy bất cứ lúc nào</p>
                <div className="mt-5 pt-5" style={{ borderTop: "1px solid #E5E7EB" }}>
                  <p className="text-[0.85rem] text-center" style={{ color: "#6B7280" }}>
                    Đã có tài khoản?{" "}
                    <Link href="/sign-in" className="font-semibold" style={{ color: "#3B5BDB" }}>Đăng nhập</Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
