import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Briefcase } from "lucide-react";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const isSignedIn = !!session.userId;

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <Briefcase className="w-5 h-5 text-blue-600" />
            <span>jobihome.vn</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/#features" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">Tính năng</Link>
            <Link href="/pricing" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">Bảng giá</Link>
            <Link href="/#faq" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">FAQ</Link>
          </nav>

          <div className="flex items-center gap-2">
            {isSignedIn ? (
              <Link
                href="/welcome"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
              >
                Vào workspace
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/sign-up"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
                >
                  Dùng thử miễn phí
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-slate-200 dark:border-slate-800 mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div className="col-span-2">
            <div className="flex items-center gap-2 font-bold mb-3">
              <Briefcase className="w-5 h-5 text-blue-600" />
              <span>jobihome.vn</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 max-w-xs">
              Hệ thống quản lý team & nhân sự cho startup Việt — quản lý tasks, time tracking, payroll trong 1 workspace.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Sản phẩm</h4>
            <ul className="space-y-2 text-slate-600 dark:text-slate-400">
              <li><Link href="/#features" className="hover:text-slate-900 dark:hover:text-slate-100">Tính năng</Link></li>
              <li><Link href="/pricing" className="hover:text-slate-900 dark:hover:text-slate-100">Bảng giá</Link></li>
              <li><Link href="/#faq" className="hover:text-slate-900 dark:hover:text-slate-100">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Liên hệ</h4>
            <ul className="space-y-2 text-slate-600 dark:text-slate-400">
              <li><a href="mailto:support@jobihome.vn" className="hover:text-slate-900 dark:hover:text-slate-100">support@jobihome.vn</a></li>
              <li><Link href="/terms" className="hover:text-slate-900 dark:hover:text-slate-100">Điều khoản</Link></li>
              <li><Link href="/privacy" className="hover:text-slate-900 dark:hover:text-slate-100">Bảo mật</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 text-xs text-slate-500">
            © {new Date().getFullYear()} jobihome.vn — Made in Hà Nội 🇻🇳
          </div>
        </div>
      </footer>
    </div>
  );
}
