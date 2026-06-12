import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Về chúng tôi — jobihome.vn",
  description: "jobihome được xây cho tech lead và founder người Việt: một công cụ đủ chuyên nghiệp nhưng không phức tạp như SAP/Workday, hợp quy trình Việt Nam.",
};

function CheckIco() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
      <path d="M5 12l5 5L20 6" />
    </svg>
  );
}

const VALUES = [
  {
    title: "Khách quan hơn cảm tính",
    desc: "Quyết định nhân sự nên dựa trên dữ liệu thật, không phải ấn tượng.",
    svg: <path d="M12 2l2.6 6.3L21 9l-5 4.3L17.5 20 12 16.5 6.5 20 8 13.3 3 9l6.4-.7z" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    title: "Minh bạch & an toàn",
    desc: "Audit log đầy đủ, dữ liệu tách biệt theo tổ chức, không nhập nhằng.",
    svg: (
      <>
        <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" />
        <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  {
    title: "Đơn giản đến mức dùng được ngay",
    desc: "Sức mạnh không nên đánh đổi bằng sự rườm rà.",
    svg: <path d="M13 2L3 14h7l-1 8 10-12h-7z" strokeLinecap="round" strokeLinejoin="round" />,
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Page hero */}
      <section className="lp-glow relative overflow-hidden" style={{ padding: "clamp(40px, 5vw, 64px) 0 0", textAlign: "center" }}>
        <span className="lp-blob lp-blob-1" />
        <span className="lp-blob lp-blob-2" />
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <span className="lp-eyebrow lp-center" style={{ justifyContent: "center" }}>About · Về chúng tôi</span>
          <h1 className="text-balance mt-5 font-extrabold mx-auto" style={{ fontSize: "clamp(2.6rem, 6vw, 4.3rem)", lineHeight: 1.02, letterSpacing: "-0.035em", maxWidth: "18ch" }}>
            Công cụ HR cho người Việt làm công nghệ
          </h1>
          <p className="mt-6 mx-auto text-lp-text-2" style={{ fontSize: "clamp(1.05rem, 1.6vw, 1.28rem)", maxWidth: "60ch" }}>
            Chúng tôi tin rằng một tech lead không nên mất nửa ngày làm việc cho bảng tính. jobihome ra đời để quản lý team trở nên đơn giản, minh bạch và đúng cách Việt Nam.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section style={{ padding: "clamp(48px, 6vw, 80px) 0" }}>
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <div className="lp-card text-center mx-auto" style={{ padding: "clamp(32px, 5vw, 60px)", maxWidth: 920 }}>
            <span className="lp-eyebrow lp-center" style={{ justifyContent: "center" }}>Sứ mệnh</span>
            <p className="text-balance mt-5 font-bold" style={{ fontSize: "clamp(1.4rem, 3vw, 2.1rem)", letterSpacing: "-0.02em", lineHeight: 1.3 }}>
              Gom toàn bộ vòng đời quản lý nhân sự — task, chấm công, lương, đánh giá — vào{" "}
              <span className="text-lp-accent-ink">một workspace duy nhất</span>, đủ chuyên nghiệp nhưng không phức tạp như SAP hay Workday.
            </p>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section style={{ padding: "clamp(48px, 6vw, 80px) 0" }}>
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center" style={{ gap: "clamp(34px, 5vw, 76px)" }}>
            <div>
              <span className="lp-eyebrow">Đối tượng</span>
              <h2 className="text-balance mt-4 font-extrabold" style={{ fontSize: "clamp(1.9rem, 3.6vw, 2.9rem)", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
                Dành cho tech lead & founder Việt
              </h2>
              <p className="mt-4 text-lp-text-2" style={{ fontSize: "clamp(1.05rem, 1.6vw, 1.28rem)", lineHeight: 1.6 }}>
                jobihome nhắm đến người đang quản lý team 5–20 người tại startup hoặc công ty phần mềm nhỏ — những người cần một hệ thống nghiêm túc nhưng nhẹ nhàng, và hiểu quy trình làm việc kiểu Việt Nam.
              </p>
              <ul className="lp-feat-list">
                <li><span className="lp-ck"><CheckIco /></span><div><b>Đủ chuyên nghiệp</b><p>Phân quyền, audit, đánh giá khách quan — không thua công cụ lớn.</p></div></li>
                <li><span className="lp-ck"><CheckIco /></span><div><b>Không phức tạp</b><p>Dùng được ngay, không cần đội triển khai hay đào tạo dài ngày.</p></div></li>
                <li><span className="lp-ck"><CheckIco /></span><div><b>Hợp quy trình Việt</b><p>Giao diện tiếng Việt, thanh toán nội địa, chấm công đúng thói quen.</p></div></li>
              </ul>
            </div>
            {/* Team illustration */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "var(--lp-surface)", border: "1px solid var(--lp-border)", padding: 24 }}>
              {/* Header row */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="font-bold text-[0.95rem]" style={{ color: "var(--lp-text)" }}>jobihome Team</p>
                  <p className="text-[0.75rem] mt-0.5" style={{ color: "var(--lp-text-3)" }}>Ho Chi Minh City · Remote-first</p>
                </div>
                <span className="flex items-center gap-1.5 lp-mono text-[0.72rem] font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(74,222,128,0.12)", color: "var(--lp-ok)", border: "1px solid rgba(74,222,128,0.2)" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                  Đang tuyển
                </span>
              </div>

              {/* Team members */}
              <div className="flex flex-col gap-2.5 mb-5">
                {[
                  { name: "Lan Đỗ", role: "Founder & CEO", focus: "Product · Strategy", color: "#2F6BFF", initials: "LĐ", yoe: "8 năm kinh nghiệm" },
                  { name: "Minh Trần", role: "Lead Engineer", focus: "Next.js · PostgreSQL", color: "#7C3AED", initials: "MT", yoe: "6 năm kinh nghiệm" },
                  { name: "Anh Nguyễn", role: "Product Designer", focus: "UX · Design System", color: "#0891B2", initials: "AN", yoe: "5 năm kinh nghiệm" },
                ].map((m) => (
                  <div key={m.name} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: "var(--lp-bg)", border: "1px solid var(--lp-border)" }}>
                    <div className="grid place-items-center rounded-full font-bold text-white flex-shrink-0" style={{ width: 38, height: 38, fontSize: "0.82rem", background: m.color }}>
                      {m.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-[0.88rem]" style={{ color: "var(--lp-text)" }}>{m.name}</p>
                        <span className="lp-mono text-[0.65rem] font-bold px-1.5 py-0.5 rounded" style={{ background: "var(--lp-surface)", color: "var(--lp-text-3)" }}>{m.role}</span>
                      </div>
                      <p className="text-[0.75rem] mt-0.5" style={{ color: "var(--lp-text-3)" }}>{m.focus} · {m.yoe}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mini stats */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { n: "2022", l: "Thành lập" },
                  { n: "120+", l: "Khách hàng" },
                  { n: "🇻🇳", l: "Made in VN" },
                ].map((s) => (
                  <div key={s.l} className="text-center rounded-lg py-2.5" style={{ background: "var(--lp-bg)", border: "1px solid var(--lp-border)" }}>
                    <div className="font-extrabold text-[1.1rem]" style={{ color: "var(--lp-text)", letterSpacing: "-0.02em" }}>{s.n}</div>
                    <div className="text-[0.68rem] mt-0.5" style={{ color: "var(--lp-text-3)" }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Founder story */}
      <section style={{ padding: "clamp(48px, 6vw, 80px) 0" }}>
        <div className="w-full max-w-[860px] mx-auto px-7">
          <span className="lp-eyebrow lp-center mb-6">Câu chuyện người sáng lập</span>

          <div className="rounded-2xl p-8 md:p-12" style={{ background: "var(--lp-surface)", border: "1px solid var(--lp-border)" }}>
            {/* Quote mark */}
            <div style={{ fontSize: "4rem", lineHeight: 1, color: "var(--lp-accent)", opacity: 0.3, fontFamily: "Georgia, serif", marginBottom: -16 }}>"</div>

            <div className="flex flex-col gap-5 text-[1.05rem] leading-[1.85]" style={{ color: "var(--lp-text-2)" }}>
              <p>
                Năm 2021, tôi đang lead một team 12 người tại một startup fintech. Mỗi cuối tháng, tôi mất gần một ngày rưỡi để tổng hợp chấm công từ Google Sheet, tính lương trong Excel, copy sang email, rồi lại sửa khi có người phản hồi nhầm. Cứ lặp đi lặp lại như vậy mỗi tháng.
              </p>
              <p>
                Tôi thử Jira — mạnh nhưng nặng, không có lương. Thử BambooHR — tốt nhưng không có phiên bản tiếng Việt, không hỗ trợ chấm công theo kiểu Việt Nam. Thử ghép Trello + Toggl + một tool HR khác — tốn thêm thời gian sync dữ liệu giữa các tool hơn là quản lý thực sự.
              </p>
              <p>
                Tôi không tìm được thứ mình cần: <span style={{ color: "var(--lp-text)", fontWeight: 600 }}>một workspace duy nhất, đủ chuyên nghiệp, hiểu người Việt, và không yêu cầu tôi phải là chuyên gia HR mới dùng được.</span>
              </p>
              <p>
                Vậy là tôi tự xây. jobihome bắt đầu là internal tool cho team của mình. Khi đồng nghiệp ở các công ty khác xin dùng thử, tôi biết đây không chỉ là vấn đề của riêng mình.
              </p>
            </div>

            {/* Author */}
            <div className="flex items-center gap-4 mt-8 pt-6" style={{ borderTop: "1px solid var(--lp-border)" }}>
              <div
                className="grid place-items-center rounded-full font-bold text-white flex-shrink-0"
                style={{ width: 52, height: 52, fontSize: "1rem", background: "linear-gradient(135deg, #2F6BFF, #7C3AED)" }}
              >
                LĐ
              </div>
              <div>
                <p className="font-bold text-[1rem]" style={{ color: "var(--lp-text)" }}>Lan Đỗ</p>
                <p className="text-[0.85rem]" style={{ color: "var(--lp-text-3)" }}>Founder & CEO · jobihome.vn</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[0.78rem] transition-colors"
                    style={{ color: "var(--lp-accent-ink)" }}
                  >
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                    LinkedIn
                  </a>
                  <span style={{ color: "var(--lp-border-strong)" }}>·</span>
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[0.78rem] transition-colors"
                    style={{ color: "var(--lp-accent-ink)" }}
                  >
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    X / Twitter
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section style={{ padding: "clamp(48px, 6vw, 80px) 0" }}>
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <div className="text-center max-w-[560px] mx-auto mb-14">
            <span className="lp-eyebrow lp-center" style={{ justifyContent: "center" }}>Hành trình</span>
            <h2 className="text-balance mt-4 font-extrabold" style={{ fontSize: "clamp(1.9rem, 3.6vw, 2.9rem)", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
              Từ bảng tính đến workspace thật sự
            </h2>
          </div>

          {/* Timeline list */}
          <div className="relative max-w-[760px] mx-auto">
            {/* Vertical line */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute", left: 19, top: 8, bottom: 8, width: 2,
                background: "linear-gradient(to bottom, var(--lp-accent), transparent)",
                opacity: 0.25,
              }}
            />

            <div className="flex flex-col gap-10">
              {[
                {
                  year: "Q1 2024",
                  title: "Ý tưởng ra đời",
                  desc: "Lan Đỗ mất 3 giờ tổng hợp bảng chấm công cuối tháng từ 4 file Excel. Quyết định: phải có một công cụ tốt hơn, viết cho chính mình.",
                  badge: null,
                  color: "#2F6BFF",
                },
                {
                  year: "Q3 2024",
                  title: "Prototype đầu tiên",
                  desc: "MVP nội bộ với task management + time log chạy cho team 4 người. Tiết kiệm được ~6 giờ/tuần so với quy trình Excel cũ.",
                  badge: "Milestone",
                  color: "#7C3AED",
                },
                {
                  year: "Q4 2024",
                  title: "Beta closed — 10 team đầu tiên",
                  desc: "Mở beta cho 10 team Việt Nam qua referral. Thu thập 200+ feedback trong 60 ngày. Office Time, Leave và Salary được xây trong giai đoạn này.",
                  badge: "10 teams",
                  color: "#0891B2",
                },
                {
                  year: "Q1 2025",
                  title: "Ra mắt chính thức jobihome.vn",
                  desc: "Public launch với 3 gói giá, onboarding flow và hỗ trợ tiếng Việt đầy đủ. 250 tài khoản đăng ký trong tuần đầu tiên.",
                  badge: "Launch 🚀",
                  color: "#059669",
                },
                {
                  year: "Q2 2025",
                  title: "500 tài khoản — cột mốc đầu tiên",
                  desc: "Đạt 500 workspace đang hoạt động. Tính năng Anomaly Detection và Performance Review ra mắt sau phản hồi từ khách hàng Team plan.",
                  badge: "500 users",
                  color: "#D97706",
                },
                {
                  year: "Q4 2025",
                  title: "1.000 tài khoản & tích hợp Slack",
                  desc: "Vượt mốc 1.000 workspace. Ra mắt webhook & Slack notification. Tỷ lệ giữ chân sau 90 ngày đạt 78%.",
                  badge: "1K ✦",
                  color: "#6366F1",
                },
                {
                  year: "2026 →",
                  title: "Tiếp tục xây",
                  desc: "API mở cho tích hợp bên thứ ba, mobile app và gói Enterprise đang trong lộ trình. Mỗi tính năng mới đều xuất phát từ feedback thật của khách hàng.",
                  badge: "Roadmap",
                  color: "#EC4899",
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-6 items-start">
                  {/* Dot */}
                  <div className="flex-shrink-0 relative z-10" style={{ paddingTop: 3 }}>
                    <div
                      style={{
                        width: 38, height: 38, borderRadius: "50%",
                        background: `${item.color}18`,
                        border: `2px solid ${item.color}55`,
                        display: "grid", placeItems: "center",
                      }}
                    >
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: item.color }} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-2">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="lp-mono text-[0.72rem] font-semibold" style={{ color: "var(--lp-text-3)" }}>{item.year}</span>
                      {item.badge && (
                        <span
                          className="lp-mono text-[0.68rem] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: `${item.color}18`, color: item.color, border: `1px solid ${item.color}35` }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-[1rem] mb-1" style={{ color: "var(--lp-text)" }}>{item.title}</p>
                    <p className="text-[0.9rem] leading-relaxed" style={{ color: "var(--lp-text-2)" }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section style={{ background: "var(--lp-bg-elev)", borderTop: "1px solid var(--lp-border)", padding: "clamp(48px, 6vw, 80px) 0" }}>
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <div className="text-center max-w-[560px] mx-auto mb-12">
            <span className="lp-eyebrow lp-center" style={{ justifyContent: "center" }}>Đội ngũ</span>
            <h2 className="text-balance mt-4 font-extrabold" style={{ fontSize: "clamp(1.9rem, 3.6vw, 2.9rem)", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
              Người xây jobihome
            </h2>
            <p className="mt-3 text-lp-text-2">Một team nhỏ, sản phẩm nghiêm túc — và luôn có người thật đứng sau mỗi tính năng.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                name: "Lan Đỗ",
                role: "Founder & CEO",
                focus: "Product · Strategy · Vision",
                bio: "8 năm trong ngành tech, từng lead team tại startup fintech. Xây jobihome vì chính mình cần nó.",
                initials: "LĐ",
                color: "linear-gradient(135deg, #2F6BFF, #1a3fa8)",
                linkedin: "https://linkedin.com",
                twitter: "https://twitter.com",
              },
              {
                name: "Minh Trần",
                role: "Lead Engineer",
                focus: "Next.js · PostgreSQL · Infra",
                bio: "Full-stack 6 năm, obsessed với performance và developer experience. Người viết hầu hết code bạn đang dùng.",
                initials: "MT",
                color: "linear-gradient(135deg, #7C3AED, #4F46E5)",
                linkedin: "https://linkedin.com",
                twitter: null,
              },
              {
                name: "Anh Nguyễn",
                role: "Product Designer",
                focus: "UX · Design System · UI",
                bio: "5 năm thiết kế sản phẩm B2B. Tin rằng phần mềm HR không cần phải xấu để mạnh.",
                initials: "AN",
                color: "linear-gradient(135deg, #0891B2, #0E7490)",
                linkedin: "https://linkedin.com",
                twitter: "https://twitter.com",
              },
              {
                name: "Hùng Lê",
                role: "Customer Success",
                focus: "Onboarding · Support · Feedback",
                bio: "Người đầu tiên bạn gặp khi cần giúp đỡ. Đảm bảo mọi team setup thành công và không bị bỏ lại một mình.",
                initials: "HL",
                color: "linear-gradient(135deg, #059669, #047857)",
                linkedin: "https://linkedin.com",
                twitter: null,
              },
            ].map((m) => (
              <div
                key={m.name}
                className="rounded-2xl flex flex-col"
                style={{ background: "var(--lp-surface)", border: "1px solid var(--lp-border)", overflow: "hidden" }}
              >
                {/* Avatar area */}
                <div className="flex items-center justify-center py-8" style={{ background: "var(--lp-bg)" }}>
                  <div
                    className="grid place-items-center rounded-full font-extrabold text-white"
                    style={{ width: 72, height: 72, fontSize: "1.3rem", background: m.color, boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}
                  >
                    {m.initials}
                  </div>
                </div>

                {/* Info */}
                <div className="flex flex-col gap-2 p-5 flex-1">
                  <div>
                    <p className="font-bold text-[1rem]" style={{ color: "var(--lp-text)" }}>{m.name}</p>
                    <p className="text-[0.8rem] font-semibold mt-0.5" style={{ color: "var(--lp-accent-ink)" }}>{m.role}</p>
                    <p className="lp-mono text-[0.68rem] mt-1" style={{ color: "var(--lp-text-3)" }}>{m.focus}</p>
                  </div>
                  <p className="text-[0.85rem] leading-relaxed flex-1" style={{ color: "var(--lp-text-2)" }}>{m.bio}</p>

                  {/* Social links */}
                  <div className="flex items-center gap-2 pt-3 mt-auto" style={{ borderTop: "1px solid var(--lp-border)" }}>
                    <a href={m.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="lp-social-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                    </a>
                    {m.twitter && (
                      <a href={m.twitter} target="_blank" rel="noopener noreferrer" aria-label="X / Twitter" className="lp-social-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Join CTA */}
          <div className="mt-10 text-center rounded-2xl py-8 px-6" style={{ background: "var(--lp-bg)", border: "1px dashed var(--lp-border-strong)" }}>
            <p className="font-semibold text-[0.97rem]" style={{ color: "var(--lp-text)" }}>Bạn muốn là thành viên tiếp theo?</p>
            <p className="text-[0.87rem] mt-1 mb-4" style={{ color: "var(--lp-text-3)" }}>Chúng tôi đang tìm kỹ sư full-stack và designer có passion với HR tech.</p>
            <a
              href="mailto:hi@jobihome.vn"
              className="lp-btn lp-btn-ghost"
              style={{ height: 38, fontSize: "0.88rem", padding: "0 20px", display: "inline-flex", alignItems: "center" }}
            >
              Gửi CV về hi@jobihome.vn →
            </a>
          </div>
        </div>
      </section>

      {/* Values */}
      <section style={{ background: "var(--lp-bg-elev)", borderTop: "1px solid var(--lp-border)", padding: "clamp(48px, 6vw, 80px) 0" }}>
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <div className="text-center max-w-[680px] mx-auto mb-11">
            <span className="lp-eyebrow lp-center">Giá trị cốt lõi</span>
            <h2 className="text-balance mt-4 font-extrabold" style={{ fontSize: "clamp(1.9rem, 3.6vw, 2.9rem)", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
              Điều chúng tôi tin
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {VALUES.map((v) => (
              <div key={v.title} className="lp-card lp-card-hover">
                <div className="lp-ico">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{v.svg}</svg>
                </div>
                <h3 className="text-[1.12rem] font-bold mb-2">{v.title}</h3>
                <p className="text-lp-text-2 text-[0.95rem]">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Company stats */}
      <section style={{ background: "var(--lp-bg-elev)", borderTop: "1px solid var(--lp-border)", borderBottom: "1px solid var(--lp-border)", padding: "clamp(48px, 6vw, 80px) 0" }}>
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px" style={{ background: "var(--lp-border)", borderRadius: 16, overflow: "hidden" }}>
            {[
              { n: "2024", label: "Năm thành lập", sub: "Ho Chi Minh City" },
              { n: "1.000+", label: "Khách hàng tin dùng", sub: "Tính đến Q4 2025" },
              { n: "4", label: "Thành viên core team", sub: "Remote-first · Việt Nam" },
              { n: "12+", label: "Tỉnh thành có team dùng", sub: "HCM · HN · ĐN & hơn nữa" },
            ].map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center justify-center text-center"
                style={{ background: "var(--lp-surface)", padding: "clamp(28px, 4vw, 48px) 24px" }}
              >
                <p
                  className="font-extrabold lp-mono"
                  style={{ fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-0.04em", color: "var(--lp-text)", lineHeight: 1 }}
                >
                  {s.n}
                </p>
                <p className="mt-2 font-semibold text-[0.92rem]" style={{ color: "var(--lp-text)" }}>{s.label}</p>
                <p className="mt-1 text-[0.75rem]" style={{ color: "var(--lp-text-3)" }}>{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "0 0 clamp(48px, 6vw, 80px)" }}>
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <div className="relative overflow-hidden text-center" style={{ maxWidth: 900, margin: "0 auto", background: "linear-gradient(135deg, #0F1829 0%, #141E35 100%)", border: "1px solid #1E2D5A", borderRadius: 16, padding: "64px 80px" }}>
            <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: -50, left: -50, width: 150, height: 150, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,91,219,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
            <div style={{ fontSize: 18, color: "#6366F1", marginBottom: 16 }} aria-hidden="true">✦</div>
            <h2 style={{ fontSize: 36, fontWeight: 700, color: "#fff", lineHeight: 1.2, letterSpacing: "-0.025em", margin: 0 }}>
              Cùng xây cách quản lý team tốt hơn
            </h2>
            <p style={{ fontSize: 15, color: "#64748B", marginTop: 12, marginBottom: 32 }}>
              Thử jobihome cho đội ngũ của bạn — hoặc nói cho chúng tôi biết bạn cần gì.
            </p>
            <div className="flex flex-wrap justify-center" style={{ gap: 8, marginBottom: 32 }}>
              {["🔒 Bảo mật SSL", "✓ Hủy bất cứ lúc nào", "⚡ Setup trong 5 phút"].map((b) => (
                <span key={b} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #1E2D5A", borderRadius: 100, padding: "5px 14px", fontSize: 12, color: "#94A3B8" }}>{b}</span>
              ))}
            </div>
            <div className="flex flex-wrap justify-center" style={{ gap: 12 }}>
              <Link href="/sign-up" className="lp-cta-primary-indigo" style={{ height: 44, padding: "0 24px", borderRadius: 8, background: "#6366F1", color: "#fff", fontSize: 14, fontWeight: 600, display: "inline-flex", alignItems: "center", textDecoration: "none", whiteSpace: "nowrap", boxShadow: "0 4px 20px rgba(99,102,241,0.3)" }}>
                Dùng thử miễn phí →
              </Link>
              <Link href="/contact" className="lp-cta-demo" style={{ height: 44, padding: "0 24px", borderRadius: 8, background: "transparent", color: "#94A3B8", border: "1px solid #2A3A6E", fontSize: 14, fontWeight: 500, display: "inline-flex", alignItems: "center", textDecoration: "none", whiteSpace: "nowrap" }}>
                Liên hệ
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
