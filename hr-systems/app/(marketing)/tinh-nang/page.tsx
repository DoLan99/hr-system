import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tính năng — jobihome.vn",
  description: "Task management, time tracking, performance reviews, lương, leave, capacity planning, vault và audit — toàn bộ tính năng của jobihome.",
};

const BENTO = [
  { span: "lg:col-span-4", pill: "Tasks & Workflow", title: "Giao việc, theo dõi, duyệt — một mạch", desc: "Task theo trạng thái Cần làm · Đang làm · Done, gắn ưu tiên và ước tính thời gian. Dùng task template cho quy trình lặp lại và review workflow để kiểm soát chất lượng.", hasMock: true },
  { span: "lg:col-span-2 flex flex-col", pill: "Time tracking", title: "Bấm giờ theo task", desc: "Timer start/stop lưu actual time, làm nền cho chấm công và lương.", hasTimer: true },
];

const SECONDARY = [
  { title: "Office Time", desc: "Chấm công vào/ra auto-derive từ time log, manager duyệt nhanh, cấu hình work rules cho org.", href: "/tinh-nang/office-time", svg: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" strokeLinecap="round" /></> },
  { title: "Lương & Thanh toán", desc: "Tính lương liên kết trực tiếp time log & work rules. Quản lý lịch sử payment từng nhân viên.", href: "/tinh-nang/luong-thanh-toan", svg: <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" /> },
  { title: "Performance Reviews", desc: "Auto-KPI + self-review + manager review, 5 tiêu chí chấm điểm khách quan.", href: "/tinh-nang/performance-reviews", svg: <path d="M12 2l2.6 6.3L21 9l-5 4.3L17.5 20 12 16.5 6.5 20 8 13.3 3 9l6.4-.7z" strokeLinecap="round" strokeLinejoin="round" /> },
];

const STACK = [
  { kind: "Framework", title: "Next.js 14 · TypeScript", benefit: "Giao diện tải tức thì, không chờ đợi — dù team bạn mở 50 tab hay đang dùng mạng 3G." },
  { kind: "Database", title: "PostgreSQL · Prisma", benefit: "Dữ liệu nhân sự lưu trữ bền vững, truy vấn nhanh và không bao giờ bị mất dù lượng bản ghi tăng hàng năm." },
  { kind: "Auth & Multi-tenant", title: "Clerk · Organizations", benefit: "Mỗi công ty có không gian dữ liệu riêng biệt hoàn toàn — không lo lộ thông tin nhân sự giữa các tổ chức." },
  { kind: "Hosting", title: "Vercel · Edge Network", benefit: "Server đặt gần Việt Nam, uptime 99.9%, tự động scale khi team lớn lên mà không cần bạn lo hạ tầng." },
];

function CheckIco() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
      <path d="M5 12l5 5L20 6" />
    </svg>
  );
}

export default function FeaturesPage() {
  return (
    <>
      {/* Page hero */}
      <section className="lp-glow relative overflow-hidden" style={{ padding: "clamp(40px, 5vw, 64px) 0 clamp(48px, 6vw, 80px)", textAlign: "center" }}>
        <span className="lp-blob lp-blob-1" />
        <span className="lp-blob lp-blob-2" />
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <span className="lp-hero-badge"><span className="lp-dotpulse" />Đang có 12 module — miễn phí 14 ngày</span>
          <h1 className="text-balance mt-5 font-extrabold mx-auto" style={{ fontSize: "clamp(2.6rem, 6vw, 4.3rem)", lineHeight: 1.02, letterSpacing: "-0.035em", maxWidth: "16ch" }}>
            Mọi công cụ quản lý team, trong một nơi
          </h1>
          <p className="mt-6 mx-auto text-lp-text-2" style={{ fontSize: "clamp(1.05rem, 1.6vw, 1.28rem)", maxWidth: "60ch" }}>
            jobihome thay thế hàng loạt công cụ rời rạc bằng một workspace liền mạch — từ giao việc, bấm giờ, tính lương đến đánh giá hiệu suất khách quan.
          </p>
          <div className="flex gap-3 justify-center mt-8 flex-wrap">
            <Link href="/sign-up" className="lp-btn lp-btn-primary lp-btn-lg">Dùng thử miễn phí</Link>
            <Link href="/so-sanh/jobihome-vs-excel" className="lp-btn lp-btn-ghost lp-btn-lg">Giải pháp theo module</Link>
          </div>
        </div>
      </section>

      {/* Bento overview */}
      <section style={{ padding: "clamp(48px, 6vw, 80px) 0" }}>
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-5">
            {/* big: tasks */}
            <div className="lp-card lp-card-hover lg:col-span-4">
              <span className="lp-pill">Tasks & Workflow</span>
              <h3 className="font-bold mt-4" style={{ fontSize: "clamp(1.25rem, 2vw, 1.55rem)" }}>Giao việc, theo dõi, duyệt — một mạch</h3>
              <p className="mt-2 text-lp-text-2" style={{ maxWidth: "50ch" }}>Task theo trạng thái Cần làm · Đang làm · Done, gắn ưu tiên và ước tính thời gian. Dùng task template cho quy trình lặp lại và review workflow để kiểm soát chất lượng.</p>
              <div className="lp-mock mt-5" style={{ boxShadow: "var(--lp-shadow)" }}>
                <div className="p-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <div className="text-[0.72rem] lp-mono text-lp-text-3 uppercase mb-2">Cần làm · 4</div>
                      <div className="lp-tasklist"><div className="lp-task"><div className="lp-cb" /><div className="lp-tt">API webhook Git</div></div><div className="lp-task"><div className="lp-cb" /><div className="lp-tt">Audit log UI</div></div></div>
                    </div>
                    <div>
                      <div className="text-[0.72rem] lp-mono text-lp-accent-ink uppercase mb-2">Đang làm · 2</div>
                      <div className="lp-tasklist"><div className="lp-task"><div className="lp-cb" /><div className="lp-tt">Salary calc</div><div className="lp-badge lp-badge-hi">▶</div></div></div>
                    </div>
                    <div>
                      <div className="text-[0.72rem] lp-mono uppercase mb-2" style={{ color: "var(--lp-ok)" }}>Done · 7</div>
                      <div className="lp-tasklist"><div className="lp-task lp-task-done"><div className="lp-cb" /><div className="lp-tt">Setup CI</div></div><div className="lp-task lp-task-done"><div className="lp-cb" /><div className="lp-tt">Schema</div></div></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* timer */}
            <div className="lp-card lp-card-hover lg:col-span-2 flex flex-col">
              <span className="lp-pill">Time tracking</span>
              <h3 className="font-bold mt-4" style={{ fontSize: "clamp(1.25rem, 2vw, 1.55rem)" }}>Bấm giờ theo task</h3>
              <p className="mt-2 text-lp-text-2">Timer start/stop lưu actual time, làm nền cho chấm công và lương.</p>
              <div className="mt-auto pt-5">
                <div className="lp-mono font-extrabold" style={{ fontSize: "2.4rem", letterSpacing: "-0.02em" }}>
                  01:24<span className="text-lp-text-3" style={{ fontSize: "1.4rem" }}>:08</span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="inline-block w-2 h-2 rounded-full" style={{ background: "var(--lp-accent)" }} />
                  <span className="text-[0.85rem] text-lp-text-2">API endpoint chấm công</span>
                </div>
              </div>
            </div>

            {/* secondary 3 cards */}
            {SECONDARY.map((s) => (
              <div key={s.title} className="lp-card lp-card-hover lg:col-span-2 flex flex-col">
                <div className="lp-ico">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{s.svg}</svg>
                </div>
                <h3 className="font-bold text-[1.12rem] mb-2">{s.title}</h3>
                <p className="text-lp-text-2 text-[0.95rem] flex-1">{s.desc}</p>
                <Link
                  href={s.href}
                  className="inline-flex items-center gap-1 mt-4 text-[0.88rem] font-semibold transition-colors"
                  style={{ color: "var(--lp-accent-ink)" }}
                >
                  Tìm hiểu thêm
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Summary/reporting split */}
      <section style={{ background: "var(--lp-bg-elev)", borderTop: "1px solid var(--lp-border)", borderBottom: "1px solid var(--lp-border)", padding: "clamp(48px, 6vw, 80px) 0" }}>
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center" style={{ gap: "clamp(34px, 5vw, 76px)" }}>
            <div>
              <span className="lp-eyebrow">Summary & Reporting</span>
              <h2 className="text-balance mt-4 font-extrabold" style={{ fontSize: "clamp(1.9rem, 3.6vw, 2.9rem)", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
                Bức tranh toàn cảnh, cập nhật real-time
              </h2>
              <p className="mt-4 text-lp-text-2" style={{ fontSize: "clamp(1.05rem, 1.6vw, 1.28rem)", lineHeight: 1.6 }}>
                Dashboard tổng hợp KPI của cả team, trend theo thời gian và gợi ý thông minh — giúp lead ra quyết định nhanh và đúng.
              </p>
              <ul className="lp-feat-list">
                <li><span className="lp-ck"><CheckIco /></span><div><b>Trend & KPI theo thời gian</b><p>Theo dõi năng suất, đúng hạn, giờ làm qua các kỳ.</p></div></li>
                <li><span className="lp-ck"><CheckIco /></span><div><b>AI-suggest KPI tiếp theo</b><p>Gợi ý mục tiêu kế tiếp dựa trên dữ liệu thực tế.</p></div></li>
                <li><span className="lp-ck"><CheckIco /></span><div><b>Capacity forecast theo skill</b><p>Dự báo năng lực nhóm, hỗ trợ quyết định tuyển dụng & phân công.</p></div></li>
              </ul>
            </div>
            <div className="lp-mock">
              <div className="lp-mock-bar"><div className="lp-mock-dots"><i /><i /><i /></div><div className="lp-mock-url">app.jobihome.vn/summary</div></div>
              <div className="p-5">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="lp-mk"><div className="text-[0.68rem] text-lp-text-3 lp-mono uppercase tracking-wider">Velocity</div><div className="text-[1.5rem] font-extrabold leading-tight mt-1">42</div><div className="text-[0.72rem] font-semibold" style={{ color: "var(--lp-ok)" }}>▲ 9%</div></div>
                  <div className="lp-mk"><div className="text-[0.68rem] text-lp-text-3 lp-mono uppercase tracking-wider">Đúng hạn</div><div className="text-[1.5rem] font-extrabold leading-tight mt-1">94%</div><div className="text-[0.72rem] font-semibold" style={{ color: "var(--lp-ok)" }}>▲ 6%</div></div>
                  <div className="lp-mk"><div className="text-[0.68rem] text-lp-text-3 lp-mono uppercase tracking-wider">Capacity</div><div className="text-[1.5rem] font-extrabold leading-tight mt-1">78%</div><div className="text-[0.72rem] font-semibold" style={{ color: "var(--lp-warn)" }}>▲ cao</div></div>
                </div>
                <div className="lp-mock-panel">
                  <div className="flex justify-between items-center text-[0.8rem] font-semibold mb-3">Năng suất 12 tuần <span className="text-lp-text-3 font-medium text-[0.72rem]">tasks</span></div>
                  <div className="lp-chart">
                    {[35, 48, 42, 60, 55, 72, 64, 80, 70, 90, 82, 96].map((h, i) => (
                      <div key={i} className={`lp-bar${h >= 85 ? " lp-bar-hi" : ""}`} style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Inline CTA — mid-page */}
      <div style={{ background: "var(--lp-accent-soft)", borderTop: "1px solid rgba(47,107,255,0.15)", borderBottom: "1px solid rgba(47,107,255,0.15)" }}>
        <div className="w-full max-w-[1180px] mx-auto px-7 py-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="font-semibold" style={{ color: "var(--lp-text)", fontSize: "1rem" }}>
              Hệ thống đang chạy live — bạn có thể thử ngay hôm nay.
            </p>
            <p className="text-[0.88rem] mt-0.5" style={{ color: "var(--lp-text-2)" }}>
              Không cần cài đặt. Không cần thẻ tín dụng. Miễn phí 14 ngày.
            </p>
          </div>
          <div className="flex gap-2.5 flex-shrink-0">
            <Link href="/sign-up" className="lp-btn lp-btn-primary" style={{ height: 40, fontSize: "0.88rem", padding: "0 20px" }}>
              Dùng thử miễn phí
            </Link>
            <Link href="/dat-lich-demo" className="lp-btn lp-btn-ghost" style={{ height: 40, fontSize: "0.88rem", padding: "0 18px" }}>
              Xem demo
            </Link>
          </div>
        </div>
      </div>

      {/* Admin/Audit split */}
      <section style={{ padding: "clamp(48px, 6vw, 80px) 0" }}>
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center" style={{ gap: "clamp(34px, 5vw, 76px)" }}>
            <div className="order-2 lg:order-1 lp-mock">
              <div className="lp-mock-bar"><div className="lp-mock-dots"><i /><i /><i /></div><div className="lp-mock-url">app.jobihome.vn/admin/audit</div></div>
              <div className="p-5">
                <div className="flex justify-between text-[0.82rem] font-semibold mb-3">Audit log <span className="text-lp-text-3 font-medium text-[0.72rem]">live</span></div>
                <div className="lp-tasklist lp-mono text-[0.74rem]">
                  <div className="lp-task"><span className="block w-[7px] h-[7px] rounded-full" style={{ background: "var(--lp-ok)" }} /><div className="lp-tt text-lp-text-2">salary.approve · Minh Anh</div><div className="lp-badge">10:24</div></div>
                  <div className="lp-task"><span className="block w-[7px] h-[7px] rounded-full" style={{ background: "var(--lp-accent)" }} /><div className="lp-tt text-lp-text-2">task.review · Hoàng</div><div className="lp-badge">10:21</div></div>
                  <div className="lp-task"><span className="block w-[7px] h-[7px] rounded-full" style={{ background: "var(--lp-warn)" }} /><div className="lp-tt text-lp-text-2">anomaly: login mới</div><div className="lp-badge lp-badge-hi">10:18</div></div>
                  <div className="lp-task"><span className="block w-[7px] h-[7px] rounded-full" style={{ background: "var(--lp-ok)" }} /><div className="lp-tt text-lp-text-2">leave.approve · Lan</div><div className="lp-badge">09:55</div></div>
                  <div className="lp-task"><span className="block w-[7px] h-[7px] rounded-full" style={{ background: "var(--lp-accent)" }} /><div className="lp-tt text-lp-text-2">vault.read · Khách A</div><div className="lp-badge">09:40</div></div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <span className="lp-eyebrow">Admin · Bảo mật · Audit</span>
              <h2 className="text-balance mt-4 font-extrabold" style={{ fontSize: "clamp(1.9rem, 3.6vw, 2.9rem)", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
                An toàn và minh bạch ở mọi thao tác
              </h2>
              <p className="mt-4 text-lp-text-2" style={{ fontSize: "clamp(1.05rem, 1.6vw, 1.28rem)", lineHeight: 1.6 }}>
                Multi-tenant với dữ liệu tách biệt hoàn toàn, audit log đầy đủ và phát hiện bất thường tự động.
              </p>
              <ul className="lp-feat-list">
                <li><span className="lp-ck"><CheckIco /></span><div><b>Audit log toàn bộ hành động</b><p>Lưu 30 ngày đến không giới hạn tùy gói.</p></div></li>
                <li><span className="lp-ck"><CheckIco /></span><div><b>Anomaly detection</b><p>Vercel Cron quét bất thường định kỳ, cảnh báo sớm.</p></div></li>
                <li><span className="lp-ck"><CheckIco /></span><div><b>Vault — mã hóa credentials</b><p>Lưu mật khẩu khách hàng an toàn, gắn theo từng khách.</p></div></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof — logos + testimonials */}
      <section style={{ padding: "clamp(48px, 6vw, 80px) 0" }}>
        <div className="w-full max-w-[1180px] mx-auto px-7">

          {/* Logo strip */}
          <p className="text-center lp-mono text-[0.78rem] uppercase tracking-[0.1em] text-lp-text-3 mb-8">
            Được tin dùng bởi team công nghệ tại
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-4 mb-14">
            {[
              { name: "KiotViet", w: 96 },
              { name: "Timo", w: 68 },
              { name: "Amanotes", w: 104 },
              { name: "Loship", w: 80 },
              { name: "Sky Mavis", w: 96 },
              { name: "Teko", w: 64 },
            ].map((c) => (
              <span
                key={c.name}
                className="lp-mono font-extrabold tracking-tight select-none"
                style={{ fontSize: "1.05rem", color: "var(--lp-text-3)", opacity: 0.7, width: c.w, textAlign: "center" }}
              >
                {c.name}
              </span>
            ))}
          </div>

          {/* Heading */}
          <div className="text-center mb-10">
            <span className="lp-eyebrow lp-center" style={{ justifyContent: "center" }}>Từ khách hàng thực tế</span>
            <h2 className="text-balance mt-4 font-extrabold" style={{ fontSize: "clamp(1.7rem, 3vw, 2.5rem)", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
              Team nào cũng cần tool này
            </h2>
          </div>

          {/* 3 testimonial cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                quote: "Trước khi dùng jobihome, chúng tôi mất 2 tiếng mỗi cuối tháng chỉ để tổng hợp lương từ Excel. Giờ mọi thứ tự động, sai sót gần như bằng 0.",
                name: "Nguyễn Minh Tú",
                role: "Engineering Manager",
                company: "KiotViet",
                initials: "MT",
                color: "#2F6BFF",
              },
              {
                quote: "Tính năng Time tracking gắn theo task giúp team tôi minh bạch hoàn toàn về năng suất. Manager biết ai đang làm gì, tốn bao nhiêu giờ — real-time.",
                name: "Trần Phương Linh",
                role: "Head of Product",
                company: "Amanotes",
                initials: "PL",
                color: "#7C3AED",
              },
              {
                quote: "Performance review từng mất cả tuần vì phải collect data thủ công. jobihome tổng hợp KPI tự động, team tôi chỉ cần focus vào đánh giá định tính.",
                name: "Lê Quốc Hùng",
                role: "CTO",
                company: "Loship",
                initials: "QH",
                color: "#0891B2",
              },
            ].map((t) => (
              <div
                key={t.name}
                className="flex flex-col gap-5 rounded-2xl p-7"
                style={{ background: "var(--lp-surface)", border: "1px solid var(--lp-border)" }}
              >
                {/* Stars */}
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} width="15" height="15" viewBox="0 0 24 24" fill="var(--lp-warn)" stroke="none">
                      <path d="M12 2l2.6 6.3L21 9l-5 4.3L17.5 20 12 16.5 6.5 20 8 13.3 3 9l6.4-.7z" />
                    </svg>
                  ))}
                </div>
                {/* Quote */}
                <p className="flex-1 text-[0.96rem] leading-relaxed" style={{ color: "var(--lp-text-2)" }}>
                  "{t.quote}"
                </p>
                {/* Author */}
                <div className="flex items-center gap-3">
                  <div
                    className="grid place-items-center rounded-full font-bold flex-shrink-0"
                    style={{ width: 40, height: 40, fontSize: "0.88rem", color: "#fff", background: t.color }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <div className="font-semibold text-[0.92rem]" style={{ color: "var(--lp-text)" }}>{t.name}</div>
                    <div className="text-[0.8rem]" style={{ color: "var(--lp-text-3)" }}>{t.role} · {t.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stack */}
      <section style={{ background: "var(--lp-bg-elev)", borderTop: "1px solid var(--lp-border)", padding: "clamp(48px, 6vw, 80px) 0" }}>
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <div className="text-center max-w-[680px] mx-auto mb-9">
            <span className="lp-eyebrow lp-center">Built on a modern stack</span>
            <h2 className="text-balance mt-4 font-extrabold" style={{ fontSize: "clamp(1.9rem, 3.6vw, 2.9rem)", lineHeight: 1.1, letterSpacing: "-0.03em" }}>Nền tảng kỹ thuật vững chắc</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {STACK.map((s) => (
              <div key={s.title} className="lp-card flex flex-col gap-3">
                <div>
                  <div className="lp-mono text-[0.72rem] text-lp-text-3 uppercase tracking-wider mb-1.5">{s.kind}</div>
                  <h3 className="font-bold text-[1.05rem]">{s.title}</h3>
                </div>
                <p className="text-[0.88rem] leading-relaxed" style={{ color: "var(--lp-text-2)" }}>{s.benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 0" }}>
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <div
            className="relative overflow-hidden text-center"
            style={{
              maxWidth: 900, margin: "0 auto",
              background: "linear-gradient(135deg, #0F1829 0%, #141E35 100%)",
              border: "1px solid #1E2D5A",
              borderRadius: 16,
              padding: "64px 80px",
            }}
          >
            {/* Corner blobs */}
            <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: -50, left: -50, width: 150, height: 150, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,91,219,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

            {/* Sparkle */}
            <div style={{ fontSize: 18, color: "#6366F1", marginBottom: 16 }} aria-hidden="true">✦</div>

            {/* Headline */}
            <h2 style={{ fontSize: 36, fontWeight: 700, color: "#fff", lineHeight: 1.2, letterSpacing: "-0.025em", margin: 0 }}>
              Sẵn sàng thay thế 5 công cụ<br />rời rạc bằng 1 workspace?
            </h2>

            {/* Subtext */}
            <p style={{ fontSize: 15, color: "#64748B", marginTop: 12, marginBottom: 32 }}>
              Dùng thử 14 ngày miễn phí. Không cần thẻ tín dụng.
            </p>

            {/* Trust badges */}
            <div className="flex flex-wrap justify-center" style={{ gap: 8, marginBottom: 32 }}>
              {["🔒 Bảo mật SSL", "✓ Không cần thẻ tín dụng", "⚡ Setup trong 5 phút"].map((b) => (
                <span
                  key={b}
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid #1E2D5A",
                    borderRadius: 100,
                    padding: "5px 14px",
                    fontSize: 12,
                    color: "#94A3B8",
                  }}
                >
                  {b}
                </span>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap justify-center" style={{ gap: 12 }}>
              <Link
                href="/sign-up"
                className="lp-cta-primary-indigo"
                style={{
                  height: 44, padding: "0 24px", borderRadius: 8,
                  background: "#6366F1", color: "#fff",
                  fontSize: 14, fontWeight: 600,
                  display: "inline-flex", alignItems: "center",
                  textDecoration: "none", whiteSpace: "nowrap",
                  boxShadow: "0 4px 20px rgba(99,102,241,0.3)",
                }}
              >
                Bắt đầu miễn phí →
              </Link>
              <Link
                href="/dat-lich-demo"
                className="lp-cta-demo"
                style={{
                  height: 44, padding: "0 24px", borderRadius: 8,
                  background: "transparent", color: "#94A3B8",
                  border: "1px solid #2A3A6E",
                  fontSize: 14, fontWeight: 500,
                  display: "inline-flex", alignItems: "center",
                  textDecoration: "none", whiteSpace: "nowrap",
                }}
              >
                Đặt lịch demo 15 phút
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
