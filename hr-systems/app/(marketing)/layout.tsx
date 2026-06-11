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
            className="mt-14 pt-7 border-t flex flex-col sm:flex-row sm:justify-between gap-3 text-[0.85rem] text-lp-text-3"
            style={{ borderColor: "var(--lp-border)" }}
          >
            <span>© {new Date().getFullYear()} jobihome.vn — Made in Vietnam 🇻🇳</span>
            <span className="lp-mono">v2.4 · hr-system</span>
          </div>
        </div>
      </footer>

      <ZaloWidget />
    </div>
  );
}
