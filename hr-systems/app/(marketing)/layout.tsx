import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { NavHeader } from "./_components/NavHeader";
import { ZaloWidget } from "./_components/ZaloWidget";
import { StickyHeader } from "./_components/StickyHeader";

const BLUE = "#3B5BDB";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-1.5">
      <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: BLUE }}>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <rect x="1" y="1" width="4.5" height="4.5" rx="1" fill="white" />
          <rect x="7.5" y="1" width="4.5" height="4.5" rx="1" fill="white" fillOpacity="0.65" />
          <rect x="1" y="7.5" width="4.5" height="4.5" rx="1" fill="white" fillOpacity="0.65" />
          <rect x="7.5" y="7.5" width="4.5" height="4.5" rx="1" fill="white" fillOpacity="0.3" />
        </svg>
      </div>
      <span className="font-bold text-gray-900 text-[15px] tracking-tight">
        jobi<span style={{ color: BLUE }}>home</span>.vn
      </span>
    </Link>
  );
}

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const isSignedIn = !!session.userId;

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <NavHeader isSignedIn={isSignedIn} />
      <StickyHeader />

      <main className="flex-1 pt-14">{children}</main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-[1060px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-8">
            <div>
              <Logo />
              <p className="text-xs text-gray-400 mt-3 leading-[1.7]">
                Nền tảng quản lý team & nhân sự all-in-one cho startup Việt Nam.
              </p>
            </div>
            {[
              {
                title: "Sản phẩm",
                links: [
                  { label: "Tính năng", href: "/tinh-nang" },
                  { label: "Bảng giá", href: "/pricing" },
                  { label: "Tích hợp", href: "/tich-hop" },
                  { label: "Changelog", href: "#" },
                ],
              },
              {
                title: "Công ty",
                links: [
                  { label: "Khách hàng", href: "/khach-hang" },
                  { label: "Blog", href: "/blog" },
                  { label: "Về chúng tôi", href: "/about" },
                  { label: "Liên hệ", href: "/contact" },
                ],
              },
              {
                title: "Hỗ trợ",
                links: [
                  { label: "Đặt lịch demo", href: "/dat-lich-demo" },
                  { label: "Điều khoản dịch vụ", href: "/terms" },
                  { label: "Chính sách bảo mật", href: "/privacy" },
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <p className="text-sm font-semibold text-gray-700 mb-3">{col.title}</p>
                <ul className="flex flex-col gap-2">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-gray-400">© {new Date().getFullYear()} jobihome.vn. All rights reserved.</p>
            <p className="text-xs text-gray-400">Made in Hà Nội 🇻🇳</p>
          </div>
        </div>
      </footer>
      <ZaloWidget />
    </div>
  );
}
