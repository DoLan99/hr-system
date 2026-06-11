"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/tinh-nang", label: "Tính năng" },
  { href: "/so-sanh/jobihome-vs-excel", label: "Giải pháp" },
  { href: "/pricing", label: "Bảng giá" },
  { href: "/about", label: "Về chúng tôi" },
  { href: "/blog", label: "Tài nguyên" },
];

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function isActiveFor(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function NavHeader({ isSignedIn }: { isSignedIn: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 transition-colors"
      style={{
        height: 66,
        background: "color-mix(in srgb, var(--lp-bg) 80%, transparent)",
        backdropFilter: "saturate(180%) blur(16px)",
        WebkitBackdropFilter: "saturate(180%) blur(16px)",
        borderBottom: `1px solid ${scrolled ? "var(--lp-border)" : "transparent"}`,
      }}
    >
      <div className="w-full max-w-[1180px] mx-auto px-7 h-full">
        <nav className="flex items-center h-full" style={{ gap: 30 }}>
          {/* Brand */}
          <Link href="/" aria-label="jobihome" className="flex items-center gap-2 font-extrabold tracking-tight flex-shrink-0" style={{ fontSize: "1.16rem", letterSpacing: "-0.03em" }}>
            <span
              className="grid place-items-center text-white font-extrabold flex-shrink-0"
              style={{
                width: 28, height: 28, borderRadius: 8, fontSize: "1rem",
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

          {/* Desktop links — flat, no dropdowns */}
          <div className="hidden lg:flex items-center" style={{ gap: 4, marginLeft: 8 }}>
            {LINKS.map((l) => {
              const active = isActiveFor(pathname, l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className="transition-colors whitespace-nowrap"
                  style={{
                    fontSize: "0.93rem",
                    fontWeight: active ? 600 : 500,
                    color: active ? "var(--lp-text)" : "var(--lp-text-2)",
                    padding: "8px 13px",
                    borderRadius: 6,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--lp-text)";
                    e.currentTarget.style.background = "var(--lp-accent-soft)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = active ? "var(--lp-text)" : "var(--lp-text-2)";
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>

          {/* Right CTAs */}
          <div className="flex items-center gap-2.5 ml-auto">
            <Link
              href={isSignedIn ? "/welcome" : "/sign-in"}
              className="lp-btn lp-btn-ghost hidden lg:inline-flex"
              style={{ height: 40, fontSize: "0.88rem", padding: "0 16px" }}
            >
              {isSignedIn ? "Vào workspace" : "Đăng nhập"}
            </Link>
            <Link
              href="/sign-up"
              className="lp-btn lp-btn-primary hidden lg:inline-flex"
              style={{ height: 40, fontSize: "0.88rem", padding: "0 18px" }}
            >
              Dùng thử
            </Link>

            {/* Mobile toggle */}
            <button
              type="button"
              aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
              className="lg:hidden grid place-items-center"
              style={{
                width: 40, height: 40, borderRadius: 6,
                border: "1px solid var(--lp-border)",
                color: "var(--lp-text)",
                background: "transparent",
              }}
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="lg:hidden absolute inset-x-0"
          style={{
            top: 66,
            background: "var(--lp-bg-elev)",
            borderBottom: "1px solid var(--lp-border)",
            padding: "14px 20px 22px",
            boxShadow: "var(--lp-shadow)",
          }}
        >
          <div className="flex flex-col" style={{ gap: 4 }}>
            {LINKS.map((l) => {
              const active = isActiveFor(pathname, l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  style={{
                    fontSize: "1rem",
                    fontWeight: active ? 600 : 500,
                    color: active ? "var(--lp-text)" : "var(--lp-text-2)",
                    padding: "12px 13px",
                    borderRadius: 6,
                  }}
                  onClick={() => setMobileOpen(false)}
                >
                  {l.label}
                </Link>
              );
            })}

            <div className="mt-3 pt-4 flex flex-col gap-2" style={{ borderTop: "1px solid var(--lp-border)" }}>
              <Link href={isSignedIn ? "/welcome" : "/sign-in"} className="lp-btn lp-btn-ghost lp-btn-block" onClick={() => setMobileOpen(false)}>
                {isSignedIn ? "Vào workspace" : "Đăng nhập"}
              </Link>
              <Link href="/sign-up" className="lp-btn lp-btn-primary lp-btn-block" onClick={() => setMobileOpen(false)}>
                Dùng thử
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
