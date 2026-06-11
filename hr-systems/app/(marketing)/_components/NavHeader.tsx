"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ArrowRight, Menu, X } from "lucide-react";

const BLUE = "#3B5BDB";

const FEATURES_ITEMS = [
  { icon: "☑", label: "Task Management",  desc: "Kanban, sprint, deadline cho team",        href: "/tinh-nang/quan-ly-cong-viec" },
  { icon: "⏱", label: "Time Tracking",    desc: "Chấm công tự động, báo cáo realtime",     href: "/tinh-nang/cham-cong" },
  { icon: "💰", label: "Payroll & Salary", desc: "Tính lương tự động, xuất phiếu PDF",      href: "/tinh-nang/tinh-luong" },
  { icon: "📋", label: "Audit Log",        desc: "Lịch sử thao tác, phát hiện bất thường",  href: "/tinh-nang/audit-log" },
  { icon: "📊", label: "Activity Heatmap", desc: "Trực quan hoá năng suất theo ngày",        href: "/tinh-nang/heatmap" },
  { icon: "🔗", label: "Tích hợp",         desc: "Slack, MISA, GitHub, Zalo và hơn 16+",    href: "/tich-hop" },
];

const COMPARE_ITEMS = [
  { label: "jobihome vs Excel",  desc: "Tại sao bảng tính không đủ nữa",     href: "/so-sanh/jobihome-vs-excel" },
  { label: "jobihome vs Trello", desc: "Vượt xa task board đơn thuần",        href: "#" },
  { label: "jobihome vs Jira",   desc: "Đơn giản hơn, phù hợp startup Việt", href: "#" },
];

function Dropdown({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-[13.5px] font-medium text-gray-600 hover:text-gray-900 transition-colors py-1"
      >
        {label}
        <ChevronDown
          size={13}
          className="transition-transform duration-200 mt-px text-gray-400"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      {open && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-white rounded-2xl z-50"
          style={{
            minWidth: 260,
            border: "1px solid #E5E7EB",
            boxShadow: "0 8px 30px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <div className="absolute -top-[5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-l border-t border-gray-200 rotate-45" />
          <div className="p-2">{children}</div>
        </div>
      )}
    </div>
  );
}

export function NavHeader({ isSignedIn }: { isSignedIn: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<string | null>(null);
  const pathname = usePathname();

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 bg-white"
      style={{ borderBottom: "1px solid #F0F0F0", height: 56 }}
    >
      <div className="max-w-[1160px] mx-auto px-6 h-full flex items-center justify-between gap-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 flex-shrink-0">
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: BLUE }}>
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

        {/* Desktop links */}
        <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
          <Dropdown label="Tính năng">
            <div className="grid grid-cols-1 gap-0.5" style={{ minWidth: 280 }}>
              {FEATURES_ITEMS.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <span className="text-[18px] mt-px flex-shrink-0">{item.icon}</span>
                  <div>
                    <p className="text-[13px] font-semibold text-gray-800 leading-tight">{item.label}</p>
                    <p className="text-[11.5px] text-gray-400 leading-snug mt-0.5">{item.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </Dropdown>

          <Link href="/pricing" className="px-3 py-1 text-[13.5px] font-medium text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-50">
            Bảng giá
          </Link>
          <Link href="/khach-hang" className="px-3 py-1 text-[13.5px] font-medium text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-50">
            Khách hàng
          </Link>

          <Dropdown label="So sánh">
            <div className="grid grid-cols-1 gap-0.5" style={{ minWidth: 260 }}>
              {COMPARE_ITEMS.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex flex-col px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <p className="text-[13px] font-semibold text-gray-800 leading-tight">{item.label}</p>
                  <p className="text-[11.5px] text-gray-400 leading-snug mt-0.5">{item.desc}</p>
                </Link>
              ))}
            </div>
          </Dropdown>

          <Link href="/blog" className="px-3 py-1 text-[13.5px] font-medium text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-50">
            Blog
          </Link>
        </div>

        {/* Desktop right */}
        <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
          <Link
            href="/sign-in"
            className="h-9 px-4 text-[13.5px] font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg flex items-center transition-colors hover:border-gray-300"
          >
            Đăng nhập
          </Link>
          <Link
            href="/sign-up"
            className="h-9 px-4 text-[13.5px] font-semibold text-white rounded-lg flex items-center gap-1.5 transition-opacity hover:opacity-90"
            style={{ background: BLUE }}
          >
            Dùng thử miễn phí <ArrowRight size={13} />
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="lg:hidden p-2 text-gray-500 rounded-lg hover:bg-gray-50"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="lg:hidden absolute inset-x-0 top-14 bg-white border-t border-gray-100 overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 56px)", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
        >
          <div className="px-5 py-4 flex flex-col gap-1">
            <button
              onClick={() => setMobileSection(mobileSection === "features" ? null : "features")}
              className="flex items-center justify-between w-full py-2.5 text-[14px] font-medium text-gray-700 text-left"
            >
              Tính năng
              <ChevronDown size={14} className="text-gray-400 transition-transform"
                style={{ transform: mobileSection === "features" ? "rotate(180deg)" : "none" }} />
            </button>
            {mobileSection === "features" && (
              <div className="pl-3 flex flex-col gap-0.5 mb-1">
                {FEATURES_ITEMS.map((item) => (
                  <Link key={item.label} href={item.href}
                    className="flex items-center gap-2.5 py-2 text-[13px] text-gray-600 hover:text-gray-900"
                    onClick={() => setMobileOpen(false)}>
                    <span>{item.icon}</span> {item.label}
                  </Link>
                ))}
              </div>
            )}

            <Link href="/pricing" className="py-2.5 text-[14px] font-medium text-gray-700 block" onClick={() => setMobileOpen(false)}>
              Bảng giá
            </Link>
            <Link href="/khach-hang" className="py-2.5 text-[14px] font-medium text-gray-700 block" onClick={() => setMobileOpen(false)}>
              Khách hàng
            </Link>

            <button
              onClick={() => setMobileSection(mobileSection === "compare" ? null : "compare")}
              className="flex items-center justify-between w-full py-2.5 text-[14px] font-medium text-gray-700 text-left"
            >
              So sánh
              <ChevronDown size={14} className="text-gray-400 transition-transform"
                style={{ transform: mobileSection === "compare" ? "rotate(180deg)" : "none" }} />
            </button>
            {mobileSection === "compare" && (
              <div className="pl-3 flex flex-col gap-0.5 mb-1">
                {COMPARE_ITEMS.map((item) => (
                  <Link key={item.label} href={item.href}
                    className="py-2 text-[13px] text-gray-600 hover:text-gray-900 block"
                    onClick={() => setMobileOpen(false)}>
                    {item.label}
                  </Link>
                ))}
              </div>
            )}

            <Link href="/blog" className="py-2.5 text-[14px] font-medium text-gray-700 block" onClick={() => setMobileOpen(false)}>
              Blog
            </Link>

            <div className="border-t border-gray-100 mt-2 pt-4 flex flex-col gap-2">
              <Link href="/sign-in"
                className="h-10 flex items-center justify-center border border-gray-200 rounded-lg text-[14px] font-medium text-gray-700"
                onClick={() => setMobileOpen(false)}>
                Đăng nhập
              </Link>
              <Link href="/sign-up"
                className="h-10 flex items-center justify-center rounded-lg text-[14px] font-semibold text-white"
                style={{ background: BLUE }} onClick={() => setMobileOpen(false)}>
                Dùng thử miễn phí
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
