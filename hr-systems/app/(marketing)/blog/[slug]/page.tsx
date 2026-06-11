import Link from "next/link";

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  return (
    <section style={{ padding: "clamp(48px, 7vw, 92px) 0 clamp(64px, 9vw, 130px)" }}>
      <div className="w-full max-w-[760px] mx-auto px-7">
        <nav className="flex items-center gap-2 mb-8 text-[13px] text-lp-text-3">
          <Link href="/blog" className="hover:text-lp-text transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-lp-text-2">{params.slug}</span>
        </nav>

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

        <article className="mt-10 text-[15px] leading-[1.85] text-lp-text-2">
          <p>
            Các nghiên cứu cho thấy 71% các cuộc họp ở startup là không cần thiết. Đây là cách nhận ra và cắt giảm chúng mà không làm mất alignment của team.
          </p>
          <h2 className="font-bold text-lp-text mt-10 mb-4" style={{ fontSize: "1.4rem" }}>
            1. Họp để "báo cáo tiến độ" thay vì quyết định
          </h2>
          <p>
            Nếu nội dung chính của cuộc họp là "anh A làm xong task X rồi, chị B đang làm Y"... thì đây là dấu hiệu rõ nhất. Status update có thể được chia sẻ qua tool — không cần block calendar của cả team.
          </p>
          <h2 className="font-bold text-lp-text mt-10 mb-4" style={{ fontSize: "1.4rem" }}>
            2. Mời quá nhiều người không cần thiết
          </h2>
          <p>
            Quy tắc: mỗi người trong phòng phải có một quyết định cần đưa ra hoặc thông tin quan trọng cần chia sẻ. Nếu không, họ không cần có mặt.
          </p>
          <h2 className="font-bold text-lp-text mt-10 mb-4" style={{ fontSize: "1.4rem" }}>
            3. Không có agenda trước buổi họp
          </h2>
          <p>
            Họp không có agenda = đi lang thang không mục đích. Agenda cần được gửi ít nhất 24h trước, có ghi rõ objective và expected outcome.
          </p>
        </article>

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

        <div className="lp-cta-band mt-14" style={{ padding: "44px 32px" }}>
          <h2>Thử jobihome miễn phí 14 ngày</h2>
          <p>Không cần thẻ tín dụng · Setup 2 phút.</p>
          <div className="flex gap-3 justify-center flex-wrap relative">
            <Link href="/sign-up" className="lp-btn lp-btn-primary lp-btn-lg">Bắt đầu miễn phí</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
