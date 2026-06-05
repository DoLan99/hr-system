import React, { useState } from "react"
import { Link } from "react-router"
import { ChevronDown, ArrowRight, Menu, X } from "lucide-react"

export const BLUE = "#3B5BDB"
export const GREEN = "#0CA678"
export const FONT = "'Plus Jakarta Sans', sans-serif"

// ─── Logo ─────────────────────────────────────────────────────────────────────
export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-1.5">
      <div
        className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
        style={{ background: BLUE }}
      >
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
  )
}

// ─── Nav data ─────────────────────────────────────────────────────────────────
export const FEATURES_ITEMS = [
  { icon: "☑", label: "Task Management",  desc: "Kanban, sprint, deadline cho team",       href: "/tinh-nang/quan-ly-cong-viec" },
  { icon: "⏱", label: "Time Tracking",    desc: "Chấm công tự động, báo cáo realtime",    href: "/tinh-nang/cham-cong" },
  { icon: "💰", label: "Payroll & Salary", desc: "Tính lương tự động, xuất phiếu PDF",     href: "/tinh-nang/tinh-luong" },
  { icon: "📋", label: "Audit Log",        desc: "Lịch sử thao tác, phát hiện bất thường", href: "/tinh-nang/audit-log" },
  { icon: "📊", label: "Activity Heatmap", desc: "Trực quan hoá năng suất theo ngày",       href: "/tinh-nang/heatmap" },
  { icon: "🔗", label: "Tích hợp",         desc: "Slack, MISA, GitHub, Zalo và hơn 16+",   href: "/tich-hop" },
]

export const COMPARE_ITEMS = [
  { label: "jobihome vs Excel",  desc: "Tại sao bảng tính không đủ nữa",  href: "/so-sanh/jobihome-vs-excel" },
  { label: "jobihome vs Trello", desc: "Vượt xa task board đơn thuần",     href: "#" },
  { label: "jobihome vs Jira",   desc: "Đơn giản hơn, phù hợp startup Việt", href: "#" },
]

// ─── Dropdown ─────────────────────────────────────────────────────────────────
export function Dropdown({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

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
  )
}

// ─── Navigation ───────────────────────────────────────────────────────────────
export function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileSection, setMobileSection] = useState<string | null>(null)

  return (
    <nav className="fixed inset-x-0 top-0 z-50 bg-white" style={{ borderBottom: "1px solid #F0F0F0", height: 64 }}>
      <div className="max-w-[1160px] mx-auto px-6 h-full flex items-center justify-between gap-8">
        <Logo />

        {/* Desktop centre links */}
        <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
          <Dropdown label="Tính năng">
            <div className="grid grid-cols-1 gap-0.5" style={{ minWidth: 280 }}>
              {FEATURES_ITEMS.map((item) => (
                <Link key={item.label} to={item.href}
                  className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group">
                  <span className="text-[18px] mt-px flex-shrink-0">{item.icon}</span>
                  <div>
                    <p className="text-[13px] font-semibold text-gray-800 group-hover:text-gray-900 leading-tight">{item.label}</p>
                    <p className="text-[11.5px] text-gray-400 leading-snug mt-0.5">{item.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </Dropdown>

          <Link to="/bang-gia"
            className="px-3 py-1 text-[13.5px] font-medium text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-50">
            Bảng giá
          </Link>

          <Link to="/khach-hang"
            className="px-3 py-1 text-[13.5px] font-medium text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-50">
            Khách hàng
          </Link>

          <Dropdown label="So sánh">
            <div className="grid grid-cols-1 gap-0.5" style={{ minWidth: 260 }}>
              {COMPARE_ITEMS.map((item) => (
                <Link key={item.label} to={item.href}
                  className="flex flex-col px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group">
                  <p className="text-[13px] font-semibold text-gray-800 group-hover:text-gray-900 leading-tight">{item.label}</p>
                  <p className="text-[11.5px] text-gray-400 leading-snug mt-0.5">{item.desc}</p>
                </Link>
              ))}
            </div>
          </Dropdown>

          <Link to="/blog" className="px-3 py-1 text-[13.5px] font-medium text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-50">
            Blog
          </Link>
        </div>

        {/* Desktop right */}
        <div className="hidden lg:flex items-center gap-2">
          <a href="#" className="h-9 px-4 text-[13.5px] font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg flex items-center transition-colors hover:border-gray-300">
            Đăng nhập
          </a>
          <Link to="/dat-lich-demo" className="h-9 px-4 text-[13.5px] font-semibold text-white rounded-lg flex items-center gap-1.5 transition-opacity hover:opacity-90"
            style={{ background: BLUE }}>
            Dùng thử miễn phí <ArrowRight size={13} />
          </Link>
        </div>

        <button className="lg:hidden p-2 text-gray-500 rounded-lg hover:bg-gray-50" onClick={() => setMobileOpen((v) => !v)}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden absolute inset-x-0 top-16 bg-white border-t border-gray-100 overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 64px)", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}>
          <div className="px-5 py-4 flex flex-col gap-1">
            <button onClick={() => setMobileSection(mobileSection === "features" ? null : "features")}
              className="flex items-center justify-between w-full py-2.5 text-[14px] font-medium text-gray-700 text-left">
              Tính năng
              <ChevronDown size={14} className="text-gray-400 transition-transform"
                style={{ transform: mobileSection === "features" ? "rotate(180deg)" : "none" }} />
            </button>
            {mobileSection === "features" && (
              <div className="pl-3 flex flex-col gap-0.5 mb-1">
                {FEATURES_ITEMS.map((item) => (
                  <a key={item.label} href="#" className="flex items-center gap-2.5 py-2 text-[13px] text-gray-600 hover:text-gray-900">
                    <span>{item.icon}</span> {item.label}
                  </a>
                ))}
              </div>
            )}

            <Link to="/bang-gia" className="py-2.5 text-[14px] font-medium text-gray-700 block" onClick={() => setMobileOpen(false)}>
              Bảng giá
            </Link>
            <Link to="/khach-hang" className="py-2.5 text-[14px] font-medium text-gray-700 block" onClick={() => setMobileOpen(false)}>Khách hàng</Link>

            <button onClick={() => setMobileSection(mobileSection === "compare" ? null : "compare")}
              className="flex items-center justify-between w-full py-2.5 text-[14px] font-medium text-gray-700 text-left">
              So sánh
              <ChevronDown size={14} className="text-gray-400 transition-transform"
                style={{ transform: mobileSection === "compare" ? "rotate(180deg)" : "none" }} />
            </button>
            {mobileSection === "compare" && (
              <div className="pl-3 flex flex-col gap-0.5 mb-1">
                {COMPARE_ITEMS.map((item) => (
                  <a key={item.label} href="#" className="py-2 text-[13px] text-gray-600 hover:text-gray-900 block">{item.label}</a>
                ))}
              </div>
            )}

            <Link to="/blog" className="py-2.5 text-[14px] font-medium text-gray-700 block" onClick={() => setMobileOpen(false)}>Blog</Link>

            <div className="border-t border-gray-100 mt-2 pt-4 flex flex-col gap-2">
              <a href="#" className="h-10 flex items-center justify-center border border-gray-200 rounded-lg text-[14px] font-medium text-gray-700">
                Đăng nhập
              </a>
              <Link to="/dat-lich-demo" className="h-10 flex items-center justify-center rounded-lg text-[14px] font-semibold text-white" style={{ background: BLUE }} onClick={() => setMobileOpen(false)}>
                Dùng thử miễn phí
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
export function Footer() {
  return (
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
            { title: "Sản phẩm", links: ["Tính năng", "Bảng giá", "Changelog", "Roadmap"] },
            { title: "Công ty",  links: ["Về chúng tôi", "Blog", "Tuyển dụng", "Liên hệ"] },
            { title: "Hỗ trợ",  links: ["Tài liệu", "FAQ", "Trung tâm trợ giúp", "Trạng thái"] },
          ].map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-gray-700 mb-3">{col.title}</p>
              <ul className="flex flex-col gap-2">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-400">© 2025 jobihome.vn. All rights reserved.</p>
          <div className="flex gap-4">
            {["Chính sách bảo mật", "Điều khoản dịch vụ"].map((l) => (
              <a key={l} href="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
