"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const BLUE = "#3B5BDB";

export function StickyHeader() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className="fixed inset-x-0 top-0 z-[999] flex items-center justify-between px-6"
      style={{
        height: 56,
        background: "#fff",
        borderBottom: "1px solid #E9ECEF",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-100%)",
        transition: "opacity 200ms ease, transform 200ms ease",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-1.5 flex-shrink-0">
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center"
          style={{ background: BLUE }}
        >
          <svg width="11" height="11" viewBox="0 0 13 13" fill="none">
            <rect x="1" y="1" width="4.5" height="4.5" rx="1" fill="white" />
            <rect x="7.5" y="1" width="4.5" height="4.5" rx="1" fill="white" fillOpacity="0.65" />
            <rect x="1" y="7.5" width="4.5" height="4.5" rx="1" fill="white" fillOpacity="0.65" />
            <rect x="7.5" y="7.5" width="4.5" height="4.5" rx="1" fill="white" fillOpacity="0.3" />
          </svg>
        </div>
        <span className="font-bold text-gray-900 text-[14px] tracking-tight">
          jobi<span style={{ color: BLUE }}>home</span>.vn
        </span>
      </Link>

      {/* Trust badges — hidden on small screens */}
      <p className="hidden md:block text-[12px]" style={{ color: "#6B7280" }}>
        ✓ Miễn phí 14 ngày&nbsp;&nbsp;·&nbsp;&nbsp;✓ Không cần thẻ&nbsp;&nbsp;·&nbsp;&nbsp;✓ Setup 2 phút
      </p>

      {/* CTA */}
      <Link
        href="/sign-up"
        className="flex items-center gap-1.5 px-4 text-white flex-shrink-0"
        style={{
          height: 36,
          background: BLUE,
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        Dùng thử miễn phí <ArrowRight size={13} />
      </Link>
    </div>
  );
}
