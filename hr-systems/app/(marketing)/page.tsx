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
    title: "Lương & Thanh toán",
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
];

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
      <section className="lp-glow relative overflow-hidden" style={{ padding: "clamp(48px, 7vw, 92px) 0 clamp(64px, 9vw, 130px)" }}>
        <span className="lp-blob lp-blob-1" />
        <span className="lp-blob lp-blob-2" />
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <div className="max-w-[820px] mx-auto text-center">
            <span className="lp-eyebrow lp-center">HR & Team Management · SaaS</span>
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
              Task, chấm công, tính lương đến đánh giá hiệu suất — jobihome gom toàn bộ vòng đời quản lý nhân sự vào một nơi. Thay thế Excel và các công cụ rời rạc, được thiết kế cho team công nghệ Việt 5–25 người.
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
      <section style={{ padding: "clamp(48px, 6vw, 84px) 0" }}>
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <p className="text-center lp-mono text-[0.82rem] tracking-wider uppercase text-lp-text-3 mb-8">
            Được xây cho team công nghệ Việt Nam
          </p>
          <div className="lp-stats">
            <div className="lp-stat"><div className="n">11</div><div className="l">module trong một hệ thống</div></div>
            <div className="lp-stat"><div className="n">5–25</div><div className="l">người mỗi đội ngũ</div></div>
            <div className="lp-stat"><div className="n">14 ngày</div><div className="l">dùng thử, không cần thẻ</div></div>
            <div className="lp-stat"><div className="n">100%</div><div className="l">giao diện tiếng Việt</div></div>
          </div>
        </div>
      </section>

      {/* ============ PROBLEM → SOLUTION ============ */}
      <section style={{ padding: "clamp(64px, 9vw, 130px) 0" }}>
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <div className="text-center max-w-[680px] mx-auto mb-14">
            <span className="lp-eyebrow lp-center">The problem · Bài toán</span>
            <h2 className="text-balance mt-4 font-extrabold" style={{ fontSize: "clamp(1.9rem, 3.6vw, 2.9rem)", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
              Hết thời Excel rời rạc và công cụ chắp vá
            </h2>
            <p className="mt-4 text-lp-text-2" style={{ fontSize: "clamp(1.05rem, 1.6vw, 1.28rem)" }}>
              Mỗi đầu việc quản lý team nằm ở một nơi khác nhau. jobihome thay từng mảnh ghép bằng một quy trình liền mạch.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-[920px] mx-auto">
            <div className="lp-card">
              <div className="lp-ico" style={{ background: "rgba(217,119,6,0.1)", color: "var(--lp-warn)", borderColor: "rgba(217,119,6,0.2)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M10.3 3.9l-7 12A2 2 0 0 0 5 19h14a2 2 0 0 0 1.7-3l-7-12a2 2 0 0 0-3.4 0z" />
                  <path d="M12 9v4M12 17h.01" />
                </svg>
              </div>
              <h3 className="text-[1.12rem] font-bold mb-2">Task & tiến độ phân tán</h3>
              <p className="text-lp-text-2 text-[0.95rem]">Theo dõi công việc rải rác trên chat, sheet, sticky note — không ai nắm được bức tranh tổng thể.</p>
            </div>
            <div className="lp-card">
              <div className="lp-ico">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </div>
              <h3 className="text-[1.12rem] font-bold mb-2">Task management tích hợp</h3>
              <p className="text-lp-text-2 text-[0.95rem]">Trạng thái, ưu tiên, ước tính thời gian và timer theo từng task — tất cả ở một nơi.</p>
            </div>
            <div className="lp-card">
              <div className="lp-ico" style={{ background: "rgba(217,119,6,0.1)", color: "var(--lp-warn)", borderColor: "rgba(217,119,6,0.2)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="M3 9h18M8 4v16" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="text-[1.12rem] font-bold mb-2">Chấm công & lương thủ công</h3>
              <p className="text-lp-text-2 text-[0.95rem]">Tổng hợp giờ làm bằng tay trên Excel, tính lương mất nhiều công và dễ sai sót.</p>
            </div>
            <div className="lp-card">
              <div className="lp-ico">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-[1.12rem] font-bold mb-2">Office Time + lương tự động</h3>
              <p className="text-lp-text-2 text-[0.95rem]">Chấm công auto-derive từ time log, manager duyệt nhanh, lương liên kết trực tiếp.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FEATURE SPLIT 1 — Task & Time ============ */}
      <section
        style={{
          background: "var(--lp-bg-elev)",
          borderTop: "1px solid var(--lp-border)",
          borderBottom: "1px solid var(--lp-border)",
          padding: "clamp(64px, 9vw, 130px) 0",
        }}
      >
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center" style={{ gap: "clamp(34px, 5vw, 76px)" }}>
            <div>
              <span className="lp-eyebrow">Tasks & Time tracking</span>
              <h2 className="text-balance mt-4 font-extrabold" style={{ fontSize: "clamp(1.9rem, 3.6vw, 2.9rem)", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
                Từ giao việc đến bấm giờ, liền một mạch
              </h2>
              <p className="mt-4 text-lp-text-2" style={{ fontSize: "clamp(1.05rem, 1.6vw, 1.28rem)", lineHeight: 1.6 }}>
                Tạo task theo trạng thái Cần làm · Đang làm · Done, gắn ưu tiên và ước tính thời gian. Bấm giờ ngay trên task để ghi nhận actual time chính xác.
              </p>
              <ul className="lp-feat-list">
                <li><span className="lp-ck"><CheckIco /></span><div><b>Task template & review workflow</b><p>Chuẩn hoá quy trình lặp lại, duyệt task trước khi đóng.</p></div></li>
                <li><span className="lp-ck"><CheckIco /></span><div><b>Timer start/stop theo task</b><p>Mỗi phiên làm việc được lưu lại, làm nền cho chấm công và lương.</p></div></li>
                <li><span className="lp-ck"><CheckIco /></span><div><b>Office Time auto-derive</b><p>Giờ vào/ra suy ra tự động từ time log, manager chỉ cần duyệt.</p></div></li>
              </ul>
              <Link href="/tinh-nang" className="lp-btn lp-btn-text mt-7 inline-flex">
                Tìm hiểu Task & Time <ArrowIco size={16} />
              </Link>
            </div>
            <div>
              <div className="lp-mock">
                <div className="lp-mock-bar"><div className="lp-mock-dots"><i /><i /><i /></div><div className="lp-mock-url">app.jobihome.vn/tasks</div></div>
                <div className="p-5">
                  <div className="flex justify-between items-center mb-3">
                    <div className="font-bold">Sprint 14</div>
                    <span className="lp-tag">Đang làm · 8</span>
                  </div>
                  <div className="lp-tasklist">
                    <div className="lp-task lp-task-done"><div className="lp-cb" /><div className="lp-tt">Setup CI/CD pipeline</div><div className="lp-badge">est 4h</div></div>
                    <div className="lp-task"><div className="lp-cb" /><div className="lp-tt">API endpoint chấm công</div><div className="lp-badge lp-badge-hi">▶ 01:24:08</div></div>
                    <div className="lp-task"><div className="lp-cb" /><div className="lp-tt">Migrate Prisma schema</div><div className="lp-badge">est 2h</div></div>
                    <div className="lp-task lp-task-done"><div className="lp-cb" /><div className="lp-tt">Viết test cho salary module</div><div className="lp-badge">3h</div></div>
                    <div className="lp-task"><div className="lp-cb" /><div className="lp-tt">Review thiết kế dashboard</div><div className="lp-badge">est 1h</div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FEATURE SPLIT 2 — Performance ============ */}
      <section style={{ padding: "clamp(64px, 9vw, 130px) 0" }}>
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
        </div>
      </section>

      {/* ============ ALL MODULES ============ */}
      <section
        style={{
          background: "var(--lp-bg-elev)",
          borderTop: "1px solid var(--lp-border)",
          padding: "clamp(64px, 9vw, 130px) 0",
        }}
      >
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <div className="text-center max-w-[680px] mx-auto mb-13">
            <span className="lp-eyebrow lp-center">Everything included · 11 module</span>
            <h2 className="text-balance mt-4 font-extrabold" style={{ fontSize: "clamp(1.9rem, 3.6vw, 2.9rem)", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
              Một hệ thống, trọn vòng đời nhân sự
            </h2>
            <p className="mt-4 text-lp-text-2" style={{ fontSize: "clamp(1.05rem, 1.6vw, 1.28rem)" }}>
              Từ hồ sơ nhân viên đến vault mật khẩu khách hàng — mọi thứ một tech lead cần.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
            {MODULES.map((m) => (
              <div key={m.title} className="lp-card lp-card-hover">
                <div className="lp-ico">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{m.svg}</svg>
                </div>
                <h3 className="text-[1.12rem] font-bold mb-2">{m.title}</h3>
                <p className="text-lp-text-2 text-[0.95rem]">{m.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/tinh-nang" className="lp-btn lp-btn-ghost">Xem tất cả tính năng</Link>
          </div>
        </div>
      </section>

      {/* ============ INTEGRATIONS ============ */}
      <section style={{ padding: "clamp(64px, 9vw, 130px) 0" }}>
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
            <div className="grid grid-cols-2 gap-5">
              <div className="lp-card">
                <div className="lp-ico">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2a10 10 0 1 0 10 10" strokeLinecap="round" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <h3 className="font-bold text-[1rem]">Clerk</h3>
                <p className="text-lp-text-2 text-[0.88rem]">Auth & quản lý người dùng, multi-tenant.</p>
              </div>
              <div className="lp-card">
                <div className="lp-ico">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
                    <path d="M8 3l-6 10 3 5h6M16 3l6 10-3 5h-6M8 3h8l-4 7z" />
                  </svg>
                </div>
                <h3 className="font-bold text-[1rem]">Google Drive</h3>
                <p className="text-lp-text-2 text-[0.88rem]">Lấy thông tin video từ link Drive.</p>
              </div>
              <div className="lp-card">
                <div className="lp-ico">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="6" cy="6" r="2.5" />
                    <circle cx="6" cy="18" r="2.5" />
                    <circle cx="18" cy="9" r="2.5" />
                    <path d="M6 8.5v7M18 11.5c0 3-3 3.5-6 3.5" strokeLinecap="round" />
                  </svg>
                </div>
                <h3 className="font-bold text-[1rem]">Git webhook</h3>
                <p className="text-lp-text-2 text-[0.88rem]">Đưa commit/PR vào activity log.</p>
              </div>
              <div className="lp-card">
                <div className="lp-ico">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
                    <path d="M12 2L2 20h20z" />
                  </svg>
                </div>
                <h3 className="font-bold text-[1rem]">Vercel Cron</h3>
                <p className="text-lp-text-2 text-[0.88rem]">Anomaly detection & đóng session định kỳ.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PRICING TEASER ============ */}
      <section
        style={{
          background: "var(--lp-bg-elev)",
          borderTop: "1px solid var(--lp-border)",
          padding: "clamp(64px, 9vw, 130px) 0",
        }}
      >
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <div className="text-center max-w-[680px] mx-auto mb-13">
            <span className="lp-eyebrow lp-center">Pricing · Minh bạch</span>
            <h2 className="text-balance mt-4 font-extrabold" style={{ fontSize: "clamp(1.9rem, 3.6vw, 2.9rem)", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
              Bắt đầu miễn phí, nâng cấp khi team lớn lên
            </h2>
            <p className="mt-4 text-lp-text-2" style={{ fontSize: "clamp(1.05rem, 1.6vw, 1.28rem)" }}>
              Ba gói phù hợp từng giai đoạn. Dùng thử 14 ngày, không cần thẻ.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10 items-stretch">
            {plans.map((plan) => (
              <div key={plan.id} className={`lp-plan${plan.recommended ? " lp-plan-feature" : ""}`}>
                <div className="pname">{plan.name}</div>
                <div className="pprice">
                  {plan.priceVnd === 0 ? "Miễn phí" : (
                    <>
                      {formatVnd(plan.priceVnd)}<small> /tháng</small>
                    </>
                  )}
                </div>
                <p className="pdesc">{plan.priceVnd === 0 ? "Cho cá nhân khởi đầu." : plan.id === "STARTER" ? "Cho team đang tăng tốc." : "Cho đội ngũ trưởng thành."}</p>
                <ul>
                  {plan.features.slice(0, 4).map((f) => (
                    <li key={f}><CheckPlanIco />{f}</li>
                  ))}
                </ul>
                <Link href="/sign-up" className={`lp-btn ${plan.recommended ? "lp-btn-primary" : "lp-btn-ghost"} lp-btn-block`}>
                  {plan.priceVnd === 0 ? "Bắt đầu" : "Dùng thử 14 ngày"}
                </Link>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/pricing" className="lp-btn lp-btn-text inline-flex">
              Xem chi tiết bảng giá <ArrowIco size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section style={{ padding: "clamp(64px, 9vw, 130px) 0" }}>
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <div className="lp-cta-band">
            <h2 className="text-balance">Sẵn sàng thay thế Excel?</h2>
            <p>Tạo workspace cho team của bạn trong vài phút. Dùng thử 14 ngày miễn phí, không cần thẻ tín dụng.</p>
            <div className="flex gap-3 justify-center flex-wrap relative">
              <Link href="/sign-up" className="lp-btn lp-btn-primary lp-btn-lg">Bắt đầu miễn phí</Link>
              <Link href="/pricing" className="lp-btn lp-btn-ghost lp-btn-lg">Xem bảng giá</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
