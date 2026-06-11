import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Liên hệ — jobihome.vn",
  description: "Kênh liên hệ với đội ngũ jobihome.vn — support, hợp tác, báo bug.",
};

const CHANNELS = [
  {
    title: "Email Support",
    value: "support@jobihome.vn",
    href: "mailto:support@jobihome.vn",
    desc: "Phản hồi trong vòng 24h (T2-T6).",
    svg: (
      <>
        <path d="M4 6h16v12H4z" />
        <path d="M4 6l8 7 8-7" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  {
    title: "Zalo OA",
    value: "@jobihome",
    desc: "Hỗ trợ nhanh qua Zalo.",
    svg: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    title: "Báo bug / Feature request",
    value: "bugs@jobihome.vn",
    href: "mailto:bugs@jobihome.vn",
    desc: "Dành cho người dùng kỹ thuật.",
    svg: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 4v2M12 18v2M4 12H2M22 12h-2M6 6l-1.5-1.5M19.5 19.5L18 18M6 18l-1.5 1.5M19.5 4.5L18 6" strokeLinecap="round" />
      </>
    ),
  },
  {
    title: "Giờ làm việc",
    value: "T2 - T6 · 9h - 18h",
    desc: "Email ngoài giờ phản hồi vào T2 tiếp theo.",
    svg: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" strokeLinecap="round" />
      </>
    ),
  },
];

const CHECKLIST = [
  "Tên workspace (slug) của bạn",
  "Email tài khoản",
  "Mô tả vấn đề + screenshot (nếu có)",
  "Browser + OS",
  "Mã đơn hàng / số tiền chuyển khoản (nếu liên quan billing)",
];

function CheckIco() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
      <path d="M5 12l5 5L20 6" />
    </svg>
  );
}

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <section className="lp-glow relative overflow-hidden" style={{ padding: "clamp(56px, 8vw, 96px) 0 0", textAlign: "center" }}>
        <span className="lp-blob lp-blob-1" />
        <span className="lp-blob lp-blob-2" />
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <span className="lp-eyebrow lp-center" style={{ justifyContent: "center" }}>Contact · Liên hệ</span>
          <h1 className="text-balance mt-5 font-extrabold mx-auto" style={{ fontSize: "clamp(2.6rem, 6vw, 4.3rem)", lineHeight: 1.02, letterSpacing: "-0.035em", maxWidth: "16ch" }}>
            Chúng tôi sẵn sàng hỗ trợ
          </h1>
          <p className="mt-6 mx-auto text-lp-text-2" style={{ fontSize: "clamp(1.05rem, 1.6vw, 1.28rem)", maxWidth: "60ch" }}>
            Câu hỏi về sản phẩm, hợp tác kinh doanh hay báo bug — chọn kênh phù hợp dưới đây.
          </p>
        </div>
      </section>

      {/* Channels grid */}
      <section style={{ padding: "56px 0 clamp(64px, 9vw, 130px)" }}>
        <div className="w-full max-w-[920px] mx-auto px-7">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {CHANNELS.map((c) => {
              const inner = (
                <div className="lp-card lp-card-hover h-full">
                  <div className="lp-ico">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{c.svg}</svg>
                  </div>
                  <p className="lp-mono text-[0.72rem] text-lp-text-3 uppercase tracking-wider">{c.title}</p>
                  <p className="font-bold text-[1.05rem] mt-1.5">{c.value}</p>
                  <p className="text-lp-text-2 text-[0.92rem] mt-1.5">{c.desc}</p>
                </div>
              );
              return c.href ? (
                <a key={c.title} href={c.href} className="block">{inner}</a>
              ) : (
                <div key={c.title}>{inner}</div>
              );
            })}
          </div>

          <div className="lp-card mt-8" style={{ background: "var(--lp-accent-soft)", borderColor: "var(--lp-accent-soft-2)" }}>
            <h2 className="font-bold text-[1.1rem] mb-3">📋 Khi liên hệ support, vui lòng kèm:</h2>
            <ul className="flex flex-col gap-2.5">
              {CHECKLIST.map((c) => (
                <li key={c} className="flex gap-2.5 items-start text-[0.92rem] text-lp-text-2">
                  <span className="lp-ck mt-0.5" style={{ display: "inline-grid", width: 18, height: 18, borderRadius: 6, placeItems: "center", background: "var(--lp-accent-soft-2)", color: "var(--lp-accent-ink)", flexShrink: 0 }}>
                    <CheckIco />
                  </span>
                  {c}
                </li>
              ))}
            </ul>
          </div>

          <div className="text-center mt-12">
            <h3 className="font-bold text-[1.1rem] text-lp-text">Doanh nghiệp / Hợp tác</h3>
            <p className="text-lp-text-2 mt-2">
              Cần gói custom enterprise, white-label, hoặc tích hợp riêng?<br />
              Email: <a href="mailto:business@jobihome.vn" className="text-lp-accent-ink hover:underline">business@jobihome.vn</a>
            </p>
            <div className="flex gap-3 justify-center mt-6">
              <Link href="/dat-lich-demo" className="lp-btn lp-btn-primary">Đặt lịch demo</Link>
              <Link href="/sign-up" className="lp-btn lp-btn-ghost">Dùng thử miễn phí</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
