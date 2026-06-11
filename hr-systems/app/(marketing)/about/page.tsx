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
      <section className="lp-glow relative overflow-hidden" style={{ padding: "clamp(56px, 8vw, 96px) 0 0", textAlign: "center" }}>
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
      <section style={{ padding: "56px 0 clamp(64px, 9vw, 130px)" }}>
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
      <section style={{ padding: "clamp(64px, 9vw, 130px) 0" }}>
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
            <div className="lp-ph-media rounded-2xl" style={{ aspectRatio: "4 / 3", border: "1px solid var(--lp-border)" }}>
              <span className="lp-ph-lab">team / founder photo</span>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section style={{ background: "var(--lp-bg-elev)", borderTop: "1px solid var(--lp-border)", padding: "clamp(64px, 9vw, 130px) 0" }}>
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

      {/* Why stats */}
      <section style={{ padding: "clamp(64px, 9vw, 130px) 0" }}>
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <div className="text-center max-w-[680px] mx-auto mb-10">
            <span className="lp-eyebrow lp-center">Vì sao jobihome</span>
            <h2 className="text-balance mt-4 font-extrabold" style={{ fontSize: "clamp(1.9rem, 3.6vw, 2.9rem)", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
              Thay nhiều công cụ bằng một
            </h2>
          </div>
          <div className="lp-stats">
            <div className="lp-stat"><div className="n">1</div><div className="l">workspace thay vì 5–6 công cụ</div></div>
            <div className="lp-stat"><div className="n">11</div><div className="l">module liền mạch một nguồn dữ liệu</div></div>
            <div className="lp-stat"><div className="n">5 tiêu chí</div><div className="l">Auto-KPI đánh giá khách quan</div></div>
            <div className="lp-stat"><div className="n">🇻🇳</div><div className="l">made & hosted cho người Việt</div></div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "0 0 clamp(64px, 9vw, 130px)" }}>
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <div className="lp-cta-band">
            <h2 className="text-balance">Cùng xây cách quản lý team tốt hơn</h2>
            <p>Thử jobihome cho đội ngũ của bạn — hoặc nói cho chúng tôi biết bạn cần gì.</p>
            <div className="flex gap-3 justify-center flex-wrap relative">
              <Link href="/sign-up" className="lp-btn lp-btn-primary lp-btn-lg">Dùng thử miễn phí</Link>
              <Link href="/contact" className="lp-btn lp-btn-ghost lp-btn-lg">Liên hệ</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
