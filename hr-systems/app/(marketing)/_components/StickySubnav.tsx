"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const BLUE = "#3B5BDB";

export function StickySubnav() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 520);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="fixed left-0 right-0 z-40 transition-all duration-300"
      style={{
        top: 56,
        background: "#fff",
        borderBottom: "1px solid #E9ECEF",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        height: 52,
        transform: visible ? "translateY(0)" : "translateY(-100%)",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <div className="max-w-[1160px] mx-auto px-6 h-full flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-1.5 flex-shrink-0">
          <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: BLUE }}>
            <svg width="11" height="11" viewBox="0 0 13 13" fill="none">
              <rect x="1" y="1" width="4.5" height="4.5" rx="1" fill="white" />
              <rect x="7.5" y="1" width="4.5" height="4.5" rx="1" fill="white" fillOpacity="0.65" />
              <rect x="1" y="7.5" width="4.5" height="4.5" rx="1" fill="white" fillOpacity="0.65" />
              <rect x="7.5" y="7.5" width="4.5" height="4.5" rx="1" fill="white" fillOpacity="0.3" />
            </svg>
          </div>
          <span className="font-bold text-gray-900 text-[13px] tracking-tight">
            jobi<span style={{ color: BLUE }}>home</span>
          </span>
        </Link>

        <div className="hidden sm:flex items-center flex-1 justify-center">
          <span className="text-[12px] text-gray-500 whitespace-nowrap tracking-tight">
            ✓ Miễn phí 14 ngày
            <span className="mx-2.5 text-gray-300">·</span>
            ✓ Không cần thẻ
            <span className="mx-2.5 text-gray-300">·</span>
            ✓ Setup 2 phút
          </span>
        </div>

        <Link
          href="/sign-up"
          className="flex-shrink-0 inline-flex items-center gap-1.5 h-[36px] px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: BLUE, borderRadius: 8 }}
        >
          Dùng thử →
        </Link>
      </div>
    </div>
  );
}
