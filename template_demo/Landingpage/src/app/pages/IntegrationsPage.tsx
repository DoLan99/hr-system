import { useState, useMemo } from "react"
import { Link } from "react-router"
import { Search, ArrowRight, Zap, Check } from "lucide-react"
import { BLUE, GREEN } from "../shared"

// ── Integration data ──────────────────────────────────────────────────────────
const INTEGRATIONS = [
  {
    id: "slack",
    name: "Slack",
    desc: "Nhận thông báo task, chấm công và lương ngay trong channel của team.",
    category: "Giao tiếp",
    status: "live",
    color: "#4A154B",
    bg: "#F4EFF4",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52z" fill="#E01E5A"/>
        <path d="M6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" fill="#E01E5A"/>
        <path d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834z" fill="#36C5F0"/>
        <path d="M8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" fill="#36C5F0"/>
        <path d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834z" fill="#2EB67D"/>
        <path d="M17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z" fill="#2EB67D"/>
        <path d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52z" fill="#ECB22E"/>
        <path d="M15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#ECB22E"/>
      </svg>
    ),
  },
  {
    id: "google",
    name: "Google Workspace",
    desc: "Đồng bộ lịch Google Calendar, Drive và Gmail với jobihome.",
    category: "Năng suất",
    status: "live",
    color: "#1A73E8",
    bg: "#EAF2FF",
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
  },
  {
    id: "zoom",
    name: "Zoom",
    desc: "Tạo phòng họp Zoom trực tiếp từ task, gắn link meeting vào deadline.",
    category: "Giao tiếp",
    status: "live",
    color: "#2D8CFF",
    bg: "#EBF4FF",
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="#2D8CFF">
        <path d="M4.5 8.25A3.75 3.75 0 0 1 8.25 4.5h7.5A3.75 3.75 0 0 1 19.5 8.25v7.5a3.75 3.75 0 0 1-3.75 3.75h-7.5A3.75 3.75 0 0 1 4.5 15.75v-7.5z"/>
        <path d="M19.5 9.75l4.5-3v10.5l-4.5-3V9.75z" fill="#2D8CFF"/>
      </svg>
    ),
  },
  {
    id: "misa",
    name: "MISA",
    desc: "Xuất dữ liệu lương sang MISA AMIS tự động, hạch toán kế toán 1 click.",
    category: "Kế toán",
    status: "live",
    color: "#E31837",
    bg: "#FFF0F2",
    icon: (
      <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
        <rect width="40" height="40" rx="8" fill="#E31837"/>
        <text x="20" y="27" textAnchor="middle" fill="white" fontSize="14" fontWeight="900" fontFamily="sans-serif">M</text>
      </svg>
    ),
  },
  {
    id: "fast",
    name: "Fast Accounting",
    desc: "Đồng bộ bảng lương và chi phí nhân sự với phần mềm Fast tự động.",
    category: "Kế toán",
    status: "live",
    color: "#FF6600",
    bg: "#FFF4EE",
    icon: (
      <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
        <rect width="40" height="40" rx="8" fill="#FF6600"/>
        <text x="20" y="27" textAnchor="middle" fill="white" fontSize="13" fontWeight="900" fontFamily="sans-serif">FA</text>
      </svg>
    ),
  },
  {
    id: "zalo",
    name: "Zalo",
    desc: "Gửi thông báo chấm công, phiếu lương và nhắc deadline qua Zalo OA.",
    category: "Giao tiếp",
    status: "live",
    color: "#0068FF",
    bg: "#EBF4FF",
    icon: (
      <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
        <rect width="40" height="40" rx="8" fill="#0068FF"/>
        <text x="20" y="27" textAnchor="middle" fill="white" fontSize="13" fontWeight="900" fontFamily="sans-serif">Za</text>
      </svg>
    ),
  },
  {
    id: "notion",
    name: "Notion",
    desc: "Đồng bộ task và tài liệu Notion hai chiều với Kanban board của jobihome.",
    category: "Năng suất",
    status: "live",
    color: "#191919",
    bg: "#F5F5F5",
    icon: (
      <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
        <rect width="40" height="40" rx="8" fill="#191919"/>
        <text x="20" y="27" textAnchor="middle" fill="white" fontSize="18" fontWeight="900" fontFamily="serif">N</text>
      </svg>
    ),
  },
  {
    id: "trello",
    name: "Trello",
    desc: "Import board Trello vào jobihome, giữ nguyên card và assignee.",
    category: "Quản lý dự án",
    status: "live",
    color: "#0052CC",
    bg: "#EBF3FF",
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="#0052CC">
        <path d="M21 0H3C1.343 0 0 1.343 0 3v18c0 1.657 1.343 3 3 3h18c1.657 0 3-1.343 3-3V3c0-1.657-1.343-3-3-3zM10.44 18.18c0 .795-.645 1.44-1.44 1.44H4.56a1.44 1.44 0 0 1-1.44-1.44V4.56c0-.795.645-1.44 1.44-1.44H9c.795 0 1.44.645 1.44 1.44v13.62zm10.44-6c0 .795-.645 1.44-1.44 1.44H15c-.795 0-1.44-.645-1.44-1.44V4.56c0-.795.645-1.44 1.44-1.44h4.44c.795 0 1.44.645 1.44 1.44v7.62z"/>
      </svg>
    ),
  },
  {
    id: "github",
    name: "GitHub",
    desc: "Liên kết commit và PR với task trên jobihome. Tự động cập nhật tiến độ.",
    category: "Phát triển",
    status: "live",
    color: "#24292F",
    bg: "#F5F5F5",
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="#24292F">
        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
      </svg>
    ),
  },
  {
    id: "jira",
    name: "Jira",
    desc: "Đồng bộ sprint và epic từ Jira, xem chéo tiến độ với heatmap jobihome.",
    category: "Quản lý dự án",
    status: "live",
    color: "#0052CC",
    bg: "#EBF3FF",
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7">
        <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.004-1.005z" fill="#2684FF"/>
        <path d="M6.001 6.009H17.57a5.218 5.218 0 0 1 5.232 5.215h-2.13v-2.057A5.215 5.215 0 0 1 15.46 4.052V15.536a1.005 1.005 0 0 1-1.004 1.005H6.001V6.009z" fill="#0052CC"/>
        <path d="M11.617.5H0.046C.046 3.376 2.354 5.693 5.215 5.693h2.178V7.88C7.393 10.75 9.7 13.06 12.562 13.06V1.505A1.005 1.005 0 0 0 11.617.5z" fill="#2684FF"/>
      </svg>
    ),
  },
  {
    id: "vnpay",
    name: "VNPAY",
    desc: "Thanh toán gói jobihome và xử lý lương nhân viên qua cổng VNPAY.",
    category: "Thanh toán",
    status: "live",
    color: "#002F7A",
    bg: "#EBF0FF",
    icon: (
      <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
        <rect width="40" height="40" rx="8" fill="#002F7A"/>
        <text x="20" y="26" textAnchor="middle" fill="white" fontSize="10" fontWeight="800" fontFamily="sans-serif">VN</text>
        <text x="20" y="35" textAnchor="middle" fill="#FFD700" fontSize="8" fontWeight="700" fontFamily="sans-serif">PAY</text>
      </svg>
    ),
  },
  {
    id: "momo",
    name: "MoMo",
    desc: "Chuyển lương và phí dịch vụ qua ví điện tử MoMo, không phí giao dịch.",
    category: "Thanh toán",
    status: "live",
    color: "#A50064",
    bg: "#FFF0F8",
    icon: (
      <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
        <rect width="40" height="40" rx="20" fill="#A50064"/>
        <text x="20" y="27" textAnchor="middle" fill="white" fontSize="12" fontWeight="900" fontFamily="sans-serif">M</text>
      </svg>
    ),
  },
  {
    id: "zapier",
    name: "Zapier",
    desc: "Kết nối jobihome với 6000+ ứng dụng qua Zapier, không cần code.",
    category: "Tự động hóa",
    status: "coming",
    color: "#FF4A00",
    bg: "#FFF2EE",
    icon: (
      <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
        <rect width="40" height="40" rx="8" fill="#FF4A00"/>
        <text x="20" y="27" textAnchor="middle" fill="white" fontSize="14" fontWeight="900" fontFamily="sans-serif">Z</text>
      </svg>
    ),
  },
  {
    id: "make",
    name: "Make (Integromat)",
    desc: "Xây dựng workflow tự động phức tạp kết nối jobihome với mọi hệ thống.",
    category: "Tự động hóa",
    status: "coming",
    color: "#6D00CC",
    bg: "#F5EEFF",
    icon: (
      <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
        <rect width="40" height="40" rx="8" fill="#6D00CC"/>
        <text x="20" y="27" textAnchor="middle" fill="white" fontSize="12" fontWeight="900" fontFamily="sans-serif">Mk</text>
      </svg>
    ),
  },
  {
    id: "hubspot",
    name: "HubSpot",
    desc: "Đồng bộ thông tin nhân sự với CRM, tự động cập nhật vai trò khách hàng.",
    category: "Năng suất",
    status: "coming",
    color: "#FF7A59",
    bg: "#FFF3F0",
    icon: (
      <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
        <rect width="40" height="40" rx="8" fill="#FF7A59"/>
        <text x="20" y="27" textAnchor="middle" fill="white" fontSize="12" fontWeight="900" fontFamily="sans-serif">Hs</text>
      </svg>
    ),
  },
  {
    id: "webhook",
    name: "Webhook / API",
    desc: "Kết nối bất kỳ hệ thống nào qua REST API và Webhook có sẵn của jobihome.",
    category: "Phát triển",
    status: "live",
    color: "#374151",
    bg: "#F3F4F6",
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="#374151">
        <path d="M14 6l-1-2H5v17h2v-7h5l1 2h7V6h-6zm4 8h-4l-1-2H7V6h5l1 2h5v6z"/>
      </svg>
    ),
  },
]

const CATEGORIES = ["Tất cả", "Giao tiếp", "Năng suất", "Kế toán", "Quản lý dự án", "Phát triển", "Thanh toán", "Tự động hóa"]

const STATS = [
  { value: "16+", label: "Tích hợp có sẵn" },
  { value: "6000+", label: "Qua Zapier & Make" },
  { value: "REST", label: "API đầy đủ tài liệu" },
]

export default function IntegrationsPage() {
  const [query, setQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("Tất cả")
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return INTEGRATIONS.filter((item) => {
      const matchesQuery =
        query.trim() === "" ||
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.desc.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      const matchesCat = activeCategory === "Tất cả" || item.category === activeCategory
      return matchesQuery && matchesCat
    })
  }, [query, activeCategory])

  const live = filtered.filter((i) => i.status === "live")
  const coming = filtered.filter((i) => i.status === "coming")

  return (
    <div className="bg-white min-h-screen">

      {/* ── Hero ── */}
      <section
        className="pt-16 pb-14 px-6 text-center relative overflow-hidden"
        style={{ background: "linear-gradient(180deg, #F8F9FF 0%, #fff 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/3 w-96 h-96 rounded-full opacity-[0.05]"
            style={{ background: BLUE, filter: "blur(90px)", transform: "translate(-50%,-40%)" }} />
          <div className="absolute top-0 right-1/4 w-64 h-64 rounded-full opacity-[0.04]"
            style={{ background: "#7C3AED", filter: "blur(70px)", transform: "translate(40%,-30%)" }} />
        </div>

        <div className="relative max-w-[680px] mx-auto">
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold mb-5 border"
            style={{ background: "#EEF2FF", borderColor: "#C7D2FE", color: BLUE }}
          >
            <Zap size={11} /> Tích hợp
          </div>

          <h1 className="text-[36px] lg:text-[48px] font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-4">
            Kết nối với công cụ<br />
            <span style={{ color: BLUE }}>bạn đang dùng</span>
          </h1>

          <p className="text-[16px] text-gray-400 max-w-[460px] mx-auto leading-relaxed mb-10">
            jobihome hoạt động cùng với stack hiện tại của bạn —
            không cần thay đổi quy trình, chỉ cần kết nối thêm.
          </p>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-6 flex-wrap mb-10">
            {STATS.map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <span className="text-[20px] font-extrabold" style={{ color: BLUE }}>{s.value}</span>
                <span className="text-[13px] text-gray-400">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="relative max-w-[480px] mx-auto">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "#9CA3AF" }}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm kiếm tích hợp... (Slack, MISA, GitHub…)"
              className="w-full h-12 pl-11 pr-4 rounded-2xl text-[14px] text-gray-800 placeholder-gray-300 outline-none transition-all"
              style={{
                border: "1.5px solid #E5E7EB",
                background: "#fff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = BLUE
                e.currentTarget.style.boxShadow = `0 0 0 3px ${BLUE}18, 0 2px 8px rgba(0,0,0,0.06)`
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#E5E7EB"
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"
              }}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors text-gray-500 text-[11px] font-bold"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Category filter ── */}
      <div className="sticky top-16 z-30 bg-white border-b border-gray-100" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div className="max-w-[1060px] mx-auto px-6">
          <div className="flex items-center gap-1.5 overflow-x-auto py-3 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="flex-shrink-0 h-8 px-4 rounded-full text-[12.5px] font-semibold transition-all"
                style={
                  activeCategory === cat
                    ? { background: BLUE, color: "#fff", boxShadow: `0 2px 8px ${BLUE}40` }
                    : { background: "#F3F4F6", color: "#6B7280" }
                }
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="max-w-[1060px] mx-auto px-6 py-14 pb-28">

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[40px] mb-4">🔍</p>
            <p className="text-[16px] font-semibold text-gray-700 mb-2">Không tìm thấy kết quả</p>
            <p className="text-[14px] text-gray-400">Thử tìm với từ khóa khác hoặc gửi yêu cầu tích hợp mới.</p>
            <button
              onClick={() => { setQuery(""); setActiveCategory("Tất cả") }}
              className="mt-5 h-9 px-5 rounded-xl text-[13px] font-semibold transition-colors"
              style={{ background: "#EEF2FF", color: BLUE }}
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <>
            {/* Live integrations */}
            {live.length > 0 && (
              <div className="mb-12">
                {coming.length > 0 && (
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-2 h-2 rounded-full" style={{ background: GREEN }} />
                    <h2 className="text-[14px] font-bold text-gray-700">Đang hoạt động</h2>
                    <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#DCFCE7", color: "#15803D" }}>
                      {live.length} tích hợp
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {live.map((item) => (
                    <IntegrationCard
                      key={item.id}
                      item={item}
                      hovered={hoveredId === item.id}
                      onHover={setHoveredId}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Coming soon */}
            {coming.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  <h2 className="text-[14px] font-bold text-gray-700">Sắp ra mắt</h2>
                  <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700">
                    {coming.length} tích hợp
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {coming.map((item) => (
                    <IntegrationCard
                      key={item.id}
                      item={item}
                      hovered={hoveredId === item.id}
                      onHover={setHoveredId}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Request integration banner ── */}
        <div
          className="mt-16 rounded-2xl px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-5"
          style={{ background: "#F8F9FF", border: `1px solid ${BLUE}20` }}
        >
          <div>
            <p className="text-[17px] font-bold text-gray-900 mb-1">
              Không thấy công cụ bạn cần?
            </p>
            <p className="text-[13.5px] text-gray-400 max-w-[380px]">
              Gửi yêu cầu — chúng tôi ưu tiên tích hợp theo số phiếu đề xuất từ khách hàng.
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <Link
              to="/dat-lich-demo"
              className="inline-flex items-center gap-2 h-11 px-6 rounded-xl text-[13.5px] font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: BLUE, boxShadow: `0 4px 16px ${BLUE}35` }}
            >
              Gửi yêu cầu <ArrowRight size={14} />
            </Link>
            <a
              href="https://developers.jobihome.vn"
              className="inline-flex items-center h-11 px-5 rounded-xl text-[13.5px] font-semibold border transition-colors hover:bg-gray-50"
              style={{ borderColor: "#D1D5DB", color: "#374151" }}
            >
              API Docs
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Card component ─────────────────────────────────────────────────────────────
type Integration = typeof INTEGRATIONS[number]

function IntegrationCard({
  item,
  hovered,
  onHover,
}: {
  item: Integration
  hovered: boolean
  onHover: (id: string | null) => void
}) {
  const isComingSoon = item.status === "coming"
  return (
    <div
      className="group relative flex flex-col rounded-2xl bg-white p-5 cursor-pointer transition-all duration-250"
      style={{
        border: hovered && !isComingSoon ? `1.5px solid ${item.color}50` : "1px solid #E5E7EB",
        boxShadow: hovered && !isComingSoon
          ? `0 12px 36px ${item.color}18, 0 4px 12px rgba(0,0,0,0.05)`
          : "0 2px 6px rgba(0,0,0,0.04)",
        transform: hovered && !isComingSoon ? "translateY(-3px)" : "none",
        opacity: isComingSoon ? 0.75 : 1,
      }}
      onMouseEnter={() => onHover(item.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Status badge */}
      {isComingSoon && (
        <div className="absolute top-3.5 right-3.5">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-600 border border-yellow-200">
            Sắp ra
          </span>
        </div>
      )}
      {!isComingSoon && hovered && (
        <div className="absolute top-3.5 right-3.5">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: item.color }}
          >
            <Check size={10} color="#fff" strokeWidth={2.5} />
          </div>
        </div>
      )}

      {/* Logo */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 flex-shrink-0 transition-transform duration-200"
        style={{
          background: item.bg,
          transform: hovered && !isComingSoon ? "scale(1.08)" : "scale(1)",
        }}
      >
        {item.icon}
      </div>

      {/* Category pill */}
      <span
        className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 self-start"
        style={{ background: "#F3F4F6", color: "#6B7280" }}
      >
        {item.category}
      </span>

      {/* Name */}
      <p
        className="text-[14px] font-bold text-gray-900 mb-1 leading-tight transition-colors"
        style={{ color: hovered && !isComingSoon ? item.color : "#111827" }}
      >
        {item.name}
      </p>

      {/* Description */}
      <p className="text-[12.5px] text-gray-400 leading-snug flex-1">{item.desc}</p>

      {/* Connect CTA on hover */}
      {!isComingSoon && (
        <div
          className="mt-4 flex items-center gap-1 text-[12px] font-semibold transition-all duration-200"
          style={{
            color: item.color,
            opacity: hovered ? 1 : 0,
            transform: hovered ? "translateY(0)" : "translateY(4px)",
          }}
        >
          Kết nối <ArrowRight size={12} />
        </div>
      )}
      {isComingSoon && (
        <button
          className="mt-4 w-full h-8 rounded-lg text-[12px] font-semibold border transition-colors hover:bg-yellow-50"
          style={{ borderColor: "#FCD34D", color: "#92400E" }}
        >
          Nhận thông báo
        </button>
      )}
    </div>
  )
}
