"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/tinh-nang", label: "Tính năng" },
  { href: "/pricing", label: "Bảng giá" },
  { href: "/about", label: "Về chúng tôi" },
  { href: "/blog", label: "Tài nguyên" },
];

const COMPARE_LINKS = [
  { href: "/so-sanh/jobihome-vs-excel", label: "jobihome vs Excel", icon: "📊", desc: "Thay thế bảng tính HR" },
  { href: "/so-sanh/jobihome-vs-jira", label: "jobihome vs Jira", icon: "🔵", desc: "HR + task trong một tool" },
  { href: "/so-sanh/jobihome-vs-trello", label: "jobihome vs Trello", icon: "🟦", desc: "Vượt xa Kanban đơn thuần" },
  { href: "/so-sanh/jobihome-vs-slack", label: "jobihome vs Slack", icon: "💬", desc: "Quản lý người, không chỉ chat" },
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
  const [compareOpen, setCompareOpen] = useState(false);
  const pathname = usePathname();
  const compareActive = pathname.startsWith("/so-sanh");

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

          {/* Desktop links */}
          <div className="hidden lg:flex items-center" style={{ gap: 4, marginLeft: 8 }}>
            {/* Giải pháp dropdown */}
            <div className="relative" onMouseEnter={() => setCompareOpen(true)} onMouseLeave={() => setCompareOpen(false)}>
              <button
                className="transition-colors whitespace-nowrap flex items-center gap-1"
                style={{
                  fontSize: "0.93rem",
                  fontWeight: compareActive ? 600 : 500,
                  color: compareActive ? "var(--lp-text)" : "var(--lp-text-2)",
                  padding: "8px 13px",
                  borderRadius: 6,
                  background: compareOpen ? "var(--lp-accent-soft)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Giải pháp
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ transition: "transform 0.15s", transform: compareOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {compareOpen && (
                <div
                  className="absolute top-full left-0 rounded-xl overflow-hidden"
                  style={{
                    marginTop: 4, minWidth: 260,
                    background: "var(--lp-bg-elev)",
                    border: "1px solid var(--lp-border)",
                    boxShadow: "var(--lp-shadow)",
                    padding: "6px",
                    zIndex: 100,
                  }}
                >
                  {COMPARE_LINKS.map((c) => {
                    const active = pathname === c.href;
                    return (
                      <Link
                        key={c.href}
                        href={c.href}
                        className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors"
                        style={{ background: active ? "var(--lp-accent-soft)" : "transparent" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--lp-accent-soft)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = active ? "var(--lp-accent-soft)" : "transparent"; }}
                        onClick={() => setCompareOpen(false)}
                      >
                        <span style={{ fontSize: "1rem", lineHeight: 1, marginTop: 1 }}>{c.icon}</span>
                        <div>
                          <div className="text-[0.88rem] font-semibold" style={{ color: "var(--lp-text)" }}>{c.label}</div>
                          <div className="text-[0.78rem]" style={{ color: "var(--lp-text-3)" }}>{c.desc}</div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

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
              className="hidden lg:inline-flex items-center transition-colors whitespace-nowrap"
              style={{
                height: 40, fontSize: 14, fontWeight: 500,
                color: "rgba(255,255,255,0.85)", padding: "0 14px",
                borderRadius: 6,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#ffffff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.85)"; }}
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
            {/* Giải pháp group */}
            <div className="text-[0.72rem] lp-mono uppercase tracking-[0.08em] px-3 pt-2 pb-1" style={{ color: "var(--lp-text-3)" }}>Giải pháp</div>
            {COMPARE_LINKS.map((c) => {
              const active = pathname === c.href;
              return (
                <Link
                  key={c.href}
                  href={c.href}
                  className="flex items-center gap-2.5"
                  style={{ fontSize: "0.95rem", fontWeight: active ? 600 : 500, color: active ? "var(--lp-text)" : "var(--lp-text-2)", padding: "10px 13px", borderRadius: 6 }}
                  onClick={() => setMobileOpen(false)}
                >
                  <span>{c.icon}</span>{c.label}
                </Link>
              );
            })}
            <div style={{ height: 1, background: "var(--lp-border)", margin: "4px 0" }} />
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
