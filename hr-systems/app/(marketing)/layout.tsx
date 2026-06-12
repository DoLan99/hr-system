import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { NavHeader } from "./_components/NavHeader";
import { ZaloWidget } from "./_components/ZaloWidget";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-extrabold text-[1.16rem] tracking-tight">
      <span
        className="w-7 h-7 rounded-lg grid place-items-center text-white font-extrabold flex-shrink-0"
        style={{
          background: "linear-gradient(135deg, var(--lp-accent), var(--lp-accent-2))",
          boxShadow: "var(--lp-shadow-accent)",
        }}
      >
        j
      </span>
      <span className="text-lp-text">
        jobihome<span className="text-lp-accent-ink">.</span>vn
      </span>
    </Link>
  );
}

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const isSignedIn = !!session.userId;

  const cols = [
    {
      title: "Sản phẩm",
      links: [
        { label: "Tính năng", href: "/tinh-nang" },
        { label: "Bảng giá", href: "/pricing" },
        { label: "Tích hợp", href: "/tich-hop" },
        { label: "Dùng thử 14 ngày", href: "/sign-up" },
      ],
    },
    {
      title: "Công ty",
      links: [
        { label: "Về chúng tôi", href: "/about" },
        { label: "Khách hàng", href: "/khach-hang" },
        { label: "Blog", href: "/blog" },
        { label: "Liên hệ", href: "/contact" },
      ],
    },
    {
      title: "Tài nguyên",
      links: [
        { label: "Đặt lịch demo", href: "/dat-lich-demo" },
        { label: "So sánh", href: "/so-sanh/jobihome-vs-excel" },
        { label: "Điều khoản", href: "/terms" },
        { label: "Bảo mật", href: "/privacy" },
      ],
    },
  ];

  return (
    <div className="lp-theme min-h-screen flex flex-col">
      <NavHeader isSignedIn={isSignedIn} />

      <main className="flex-1" style={{ paddingTop: 66 }}>{children}</main>

      <footer
        className="border-t pt-[72px] pb-9"
        style={{ borderColor: "var(--lp-border)", background: "var(--lp-bg-elev)" }}
      >
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <div className="grid grid-cols-1 md:grid-cols-[1.6fr_repeat(3,1fr)] gap-10">
            <div className="max-w-[290px]">
              <Logo />
              <p className="mt-4 text-[0.92rem] text-lp-text-2 leading-relaxed">
                Hệ thống quản lý nhân sự & team cho startup và SME Việt Nam. Task, chấm công, lương, đánh giá — trong một workspace duy nhất.
              </p>
            </div>
            {cols.map((col) => (
              <div key={col.title}>
                <h4 className="lp-mono text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-lp-text-3 mb-4">
                  {col.title}
                </h4>
                <ul className="flex flex-col gap-3 list-none p-0">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="text-[0.92rem] text-lp-text-2 transition-colors hover:text-lp-accent-ink"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div
            className="mt-14 pt-7 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-[0.85rem] text-lp-text-3"
            style={{ borderColor: "var(--lp-border)" }}
          >
            <span>© 2026 jobihome.vn · All rights reserved · Made in Vietnam 🇻🇳</span>
            <div className="flex items-center gap-3">
              {/* Facebook */}
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                className="lp-social-icon"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
              {/* LinkedIn */}
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"
                className="lp-social-icon"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
              </a>
              {/* YouTube */}
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube"
                className="lp-social-icon"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" style={{fill:"var(--lp-bg-elev)"}}/></svg>
              </a>
              {/* GitHub */}
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub"
                className="lp-social-icon"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

      <ZaloWidget />
    </div>
  );
}
