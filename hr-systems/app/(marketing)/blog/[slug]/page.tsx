import Link from "next/link";
import { ReadingProgress } from "../_components/ReadingProgress";
import { TableOfContents } from "../_components/TableOfContents";
import { ShareButtons } from "../_components/ShareButtons";

const TOC = [
  { id: "dau-hieu-1", title: "1. Họp để báo cáo tiến độ thay vì quyết định", level: 2 },
  { id: "dau-hieu-2", title: "2. Mời quá nhiều người không cần thiết",         level: 2 },
  { id: "dau-hieu-3", title: "3. Không có agenda trước buổi họp",              level: 2 },
];

const POPULAR = [
  { slug: "onboard-1-day", cat: "Nhân sự", emoji: "📋", title: "Onboard nhân viên mới trong 1 ngày: checklist đầy đủ cho startup", readTime: "5 phút" },
  { slug: "okr-vs-kpi", cat: "Quản lý", emoji: "📊", title: "OKR vs KPI: startup ở giai đoạn nào nên dùng cái nào?", readTime: "7 phút" },
  { slug: "luong-thoi-gian-thuc", cat: "Tính lương", emoji: "💰", title: "Tính lương theo thời gian thực: tại sao Excel không còn đủ nữa", readTime: "6 phút" },
  { slug: "phan-quyen-startup", cat: "Nhân sự", emoji: "👥", title: "Phân quyền trong startup: khi nào cần HR chính thức?", readTime: "5 phút" },
];

const TAGS = ["Năng suất", "Quản lý", "Nhân sự", "Tính lương", "Văn hóa", "Onboarding", "OKR", "Remote work"];

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  return (
    <>
    <ReadingProgress />
    <section style={{ padding: "clamp(48px, 7vw, 92px) 0 clamp(64px, 9vw, 130px)" }}>
      <div className="w-full max-w-[1180px] mx-auto px-7">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 mb-8 text-[13px] text-lp-text-3">
          <Link href="/blog" className="hover:text-lp-text transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-lp-text-2">{params.slug}</span>
        </nav>

        {/* Two-col layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-12 items-start">

          {/* ── Main article ── */}
          <div>
            <span className="lp-tag mb-4 inline-flex">Năng suất</span>
            <h1 className="text-balance font-extrabold" style={{ fontSize: "clamp(2rem, 4vw, 2.7rem)", lineHeight: 1.15, letterSpacing: "-0.03em", marginTop: 12 }}>
              5 dấu hiệu team bạn đang lãng phí hơn 10 giờ/tuần vào họp không cần thiết
            </h1>

            <div className="flex items-center gap-5 mt-6 pb-8" style={{ borderBottom: "1px solid var(--lp-border)" }}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full grid place-items-center text-[11px] font-bold text-white" style={{ background: "linear-gradient(135deg, var(--lp-accent-2), var(--lp-accent))" }}>
                  MT
                </div>
                <div>
                  <p className="text-[13px] font-semibold">Minh Tuấn</p>
                  <p className="text-[11px] text-lp-text-3">Co-founder, jobihome</p>
                </div>
              </div>
              <div className="flex items-center gap-4 lp-mono text-[0.72rem] text-lp-text-3">
                <span>2 tháng 6, 2026</span>
                <span>·</span>
                <span>8 phút đọc</span>
              </div>
            </div>

            <article className="mt-10 text-lp-text-2" style={{ fontSize: "clamp(15px, 1.15vw, 17px)", lineHeight: 1.8, maxWidth: 680 }}>
              <p style={{ fontSize: "clamp(16px, 1.25vw, 18px)", lineHeight: 1.75, color: "var(--lp-text)", fontWeight: 450, marginBottom: "1.5em" }}>
                Các nghiên cứu cho thấy 71% các cuộc họp ở startup là không cần thiết. Đây là cách nhận ra và cắt giảm chúng mà không làm mất alignment của team.
              </p>
              <h2 id="dau-hieu-1" className="flex items-start gap-4" style={{ marginTop: "2.6em", marginBottom: "0.8em" }}>
                <span className="lp-mono font-extrabold flex-shrink-0 select-none" style={{ fontSize: "0.8rem", lineHeight: 1, marginTop: 6, color: "var(--lp-accent-ink)", background: "var(--lp-accent-soft)", border: "1px solid rgba(47,107,255,0.2)", borderRadius: 6, padding: "3px 7px" }}>01</span>
                <span className="font-extrabold" style={{ fontSize: "clamp(1.2rem, 1.6vw, 1.45rem)", lineHeight: 1.3, letterSpacing: "-0.02em", color: "#fff" }}>Họp để "báo cáo tiến độ" thay vì quyết định</span>
              </h2>
              <p style={{ marginBottom: "1.25em" }}>
                Nếu nội dung chính của cuộc họp là "anh A làm xong task X rồi, chị B đang làm Y"... thì đây là dấu hiệu rõ nhất. Status update có thể được chia sẻ qua tool — không cần block calendar của cả team.
              </p>
              <h2 id="dau-hieu-2" className="flex items-start gap-4" style={{ marginTop: "2.6em", marginBottom: "0.8em" }}>
                <span className="lp-mono font-extrabold flex-shrink-0 select-none" style={{ fontSize: "0.8rem", lineHeight: 1, marginTop: 6, color: "var(--lp-accent-ink)", background: "var(--lp-accent-soft)", border: "1px solid rgba(47,107,255,0.2)", borderRadius: 6, padding: "3px 7px" }}>02</span>
                <span className="font-extrabold" style={{ fontSize: "clamp(1.2rem, 1.6vw, 1.45rem)", lineHeight: 1.3, letterSpacing: "-0.02em", color: "#fff" }}>Mời quá nhiều người không cần thiết</span>
              </h2>
              <p style={{ marginBottom: "1.25em" }}>
                Quy tắc: mỗi người trong phòng phải có một quyết định cần đưa ra hoặc thông tin quan trọng cần chia sẻ. Nếu không, họ không cần có mặt.
              </p>
              <h2 id="dau-hieu-3" className="flex items-start gap-4" style={{ marginTop: "2.6em", marginBottom: "0.8em" }}>
                <span className="lp-mono font-extrabold flex-shrink-0 select-none" style={{ fontSize: "0.8rem", lineHeight: 1, marginTop: 6, color: "var(--lp-accent-ink)", background: "var(--lp-accent-soft)", border: "1px solid rgba(47,107,255,0.2)", borderRadius: 6, padding: "3px 7px" }}>03</span>
                <span className="font-extrabold" style={{ fontSize: "clamp(1.2rem, 1.6vw, 1.45rem)", lineHeight: 1.3, letterSpacing: "-0.02em", color: "#fff" }}>Không có agenda trước buổi họp</span>
              </h2>
              <p style={{ marginBottom: "1.25em" }}>
                Họp không có agenda = đi lang thang không mục đích. Agenda cần được gửi ít nhất 24h trước, có ghi rõ objective và expected outcome.
              </p>
            </article>

            {/* Key takeaway box */}
            <div className="rounded-2xl mt-12" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)", padding: "28px 32px" }}>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="grid place-items-center rounded-lg flex-shrink-0" style={{ width: 32, height: 32, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
                  </svg>
                </div>
                <p className="font-bold text-[0.9rem]" style={{ color: "#818CF8" }}>Key takeaway</p>
              </div>
              <p className="font-semibold text-[0.97rem] leading-relaxed mb-5" style={{ color: "#fff" }}>
                71% cuộc họp ở startup là không cần thiết — và mỗi tuần team bạn đang lãng phí trung bình <span style={{ color: "#A5B4FC" }}>10,4 giờ</span> vì 5 thói quen này.
              </p>
              <ul className="flex flex-col gap-2.5">
                {[
                  "Thay status-update meeting bằng async tool (jobihome, Notion, Slack)",
                  "Mỗi cuộc họp phải có owner, agenda và expected outcome rõ ràng",
                  "Nếu không cần quyết định → không cần họp, gửi update bằng văn bản",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-[0.88rem] leading-snug" style={{ color: "#94A3B8" }}>
                    <span className="lp-mono font-bold flex-shrink-0 mt-0.5" style={{ fontSize: "0.7rem", color: "#6366F1", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 4, padding: "2px 5px" }}>
                      0{i + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Inline share strip */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-12 pt-8 pb-8" style={{ borderTop: "1px solid var(--lp-border)", borderBottom: "1px solid var(--lp-border)" }}>
              <p className="text-[0.88rem] font-medium flex-shrink-0" style={{ color: "var(--lp-text-2)" }}>
                Bài viết hữu ích? Chia sẻ với đồng nghiệp:
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { label: "LinkedIn", color: "#0A66C2", bg: "rgba(10,102,194,0.1)", border: "rgba(10,102,194,0.25)", href: () => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}` },
                  { label: "Facebook", color: "#1877F2", bg: "rgba(24,119,242,0.1)", border: "rgba(24,119,242,0.25)", href: () => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}` },
                  { label: "X / Twitter", color: "#fff", bg: "rgba(255,255,255,0.07)", border: "rgba(255,255,255,0.12)", href: () => `https://twitter.com/intent/tweet?url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}&text=${encodeURIComponent("5 dấu hiệu team bạn đang lãng phí hơn 10 giờ/tuần")}` },
                ].map((s) => (
                  <a
                    key={s.label}
                    href={s.href()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="lp-mono text-[0.75rem] font-bold px-3 py-1.5 rounded-lg"
                    style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, textDecoration: "none" }}
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Related posts */}
            <div className="mt-16 pt-8" style={{ borderTop: "1px solid var(--lp-border)" }}>
              <p className="lp-mono text-[0.78rem] text-lp-text-3 uppercase tracking-wider mb-6">Bài viết liên quan</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { slug: "onboard-1-day", cat: "Nhân sự", title: "Onboard nhân viên mới trong 1 ngày" },
                  { slug: "luong-thoi-gian-thuc", cat: "Tính lương", title: "Tính lương theo thời gian thực" },
                ].map((r) => (
                  <Link key={r.slug} href={`/blog/${r.slug}`} className="lp-card lp-card-hover" style={{ padding: 20 }}>
                    <span className="lp-tag mb-2 inline-flex">{r.cat}</span>
                    <p className="font-semibold text-[0.95rem] leading-snug mt-2">{r.title}</p>
                    <span className="text-lp-accent-ink text-[0.82rem] font-semibold mt-3 inline-block">Đọc →</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* In-article CTA */}
            <div className="relative overflow-hidden text-center rounded-2xl mt-14" style={{ background: "linear-gradient(135deg, #0F1829 0%, #141E35 100%)", border: "1px solid #1E2D5A", padding: "52px 48px" }}>
              <div aria-hidden="true" style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
              <div aria-hidden="true" style={{ position: "absolute", bottom: -50, left: -50, width: 150, height: 150, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,91,219,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
              <div style={{ fontSize: 18, color: "#6366F1", marginBottom: 16 }} aria-hidden="true">✦</div>
              <h2 style={{ fontSize: "clamp(1.4rem, 2.4vw, 1.9rem)", fontWeight: 700, color: "#fff", lineHeight: 1.2, letterSpacing: "-0.025em", margin: 0 }}>
                Thử jobihome miễn phí 14 ngày
              </h2>
              <p style={{ fontSize: 15, color: "#64748B", marginTop: 12, marginBottom: 28 }}>
                Không cần thẻ tín dụng · Setup 2 phút.
              </p>
              <div className="flex flex-wrap justify-center" style={{ gap: 8, marginBottom: 28 }}>
                {["🔒 Bảo mật SSL", "✓ Hủy bất cứ lúc nào", "⚡ Setup trong 5 phút"].map((b) => (
                  <span key={b} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #1E2D5A", borderRadius: 100, padding: "5px 14px", fontSize: 12, color: "#94A3B8" }}>{b}</span>
                ))}
              </div>
              <div className="flex flex-wrap justify-center" style={{ gap: 12 }}>
                <Link href="/sign-up" className="lp-cta-primary-indigo" style={{ height: 44, padding: "0 24px", borderRadius: 8, background: "#6366F1", color: "#fff", fontSize: 14, fontWeight: 600, display: "inline-flex", alignItems: "center", textDecoration: "none", whiteSpace: "nowrap", boxShadow: "0 4px 20px rgba(99,102,241,0.3)" }}>
                  Bắt đầu miễn phí →
                </Link>
                <Link href="/tinh-nang" className="lp-cta-demo" style={{ height: 44, padding: "0 24px", borderRadius: 8, background: "transparent", color: "#94A3B8", border: "1px solid #2A3A6E", fontSize: 14, fontWeight: 500, display: "inline-flex", alignItems: "center", textDecoration: "none", whiteSpace: "nowrap" }}>
                  Xem tính năng
                </Link>
              </div>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <aside style={{ position: "sticky", top: 88, display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Table of contents */}
            <TableOfContents items={TOC} />

            {/* Popular posts */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "var(--lp-surface)", border: "1px solid var(--lp-border)" }}>
              <div className="px-5 pt-5 pb-3" style={{ borderBottom: "1px solid var(--lp-border)" }}>
                <p className="font-bold text-[0.93rem]" style={{ color: "var(--lp-text)" }}>Bài đọc nhiều nhất</p>
              </div>
              <div className="flex flex-col">
                {POPULAR.map((p, i) => (
                  <Link
                    key={p.slug}
                    href={`/blog/${p.slug}`}
                    className="flex items-start gap-3 px-5 py-4 transition-colors"
                    style={{ borderBottom: i < POPULAR.length - 1 ? "1px solid var(--lp-border)" : "none" }}
                  >
                    {/* Rank number */}
                    <span
                      className="lp-mono font-extrabold flex-shrink-0 mt-0.5"
                      style={{ fontSize: "1.1rem", lineHeight: 1, color: i === 0 ? "var(--lp-accent-ink)" : "var(--lp-border-strong)", width: 20 }}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.83rem] font-semibold leading-snug line-clamp-2" style={{ color: "var(--lp-text)" }}>
                        {p.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="lp-tag" style={{ fontSize: "0.65rem", padding: "1px 6px" }}>{p.cat}</span>
                        <span className="lp-mono text-[0.68rem]" style={{ color: "var(--lp-text-3)" }}>{p.readTime}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Newsletter */}
            <div className="rounded-2xl p-5" style={{ background: "var(--lp-surface)", border: "1px solid var(--lp-border)" }}>
              <p className="font-bold text-[0.93rem] mb-1" style={{ color: "var(--lp-text)" }}>Newsletter jobihome</p>
              <p className="text-[0.8rem] mb-4" style={{ color: "var(--lp-text-3)" }}>Bài mới + tip quản lý team mỗi tuần. Không spam.</p>
              <input
                type="email"
                placeholder="email@company.vn"
                className="lp-input"
                style={{ width: "100%", marginBottom: 8 }}
              />
              <button
                className="lp-btn lp-btn-primary lp-btn-block"
                style={{ height: 38, fontSize: "0.85rem" }}
              >
                Đăng ký miễn phí
              </button>
              <p className="lp-mono text-[0.68rem] text-center mt-2" style={{ color: "var(--lp-text-3)" }}>
                1.200+ người đang nhận · Hủy bất cứ lúc nào
              </p>
            </div>

            {/* Tags */}
            <div className="rounded-2xl p-5" style={{ background: "var(--lp-surface)", border: "1px solid var(--lp-border)" }}>
              <p className="font-bold text-[0.93rem] mb-3" style={{ color: "var(--lp-text)" }}>Chủ đề</p>
              <div className="flex flex-wrap gap-2">
                {TAGS.map((tag) => (
                  <Link
                    key={tag}
                    href="/blog"
                    className="lp-chip"
                    style={{ fontSize: "0.78rem" }}
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>

            {/* Share */}
            <ShareButtons title="5 dấu hiệu team bạn đang lãng phí hơn 10 giờ/tuần vào họp không cần thiết" />

          </aside>
        </div>
      </div>
    </section>
    </>
  );
}
