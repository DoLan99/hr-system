import { useState } from "react"
import { Outlet } from "react-router"
import { Nav, Footer, FONT } from "./shared"

const ZALO_BLUE = "#0068FF"

function FloatingSupport() {
  const [zaloHovered, setZaloHovered] = useState(false)
  const [chatHovered, setChatHovered] = useState(false)

  return (
    <div
      className="fixed z-50 flex flex-col items-center gap-2.5"
      style={{ bottom: 24, right: 24 }}
    >
      {/* Zalo button */}
      <div className="relative flex items-center">
        {/* Tooltip */}
        <div
          className="absolute right-full mr-3 whitespace-nowrap px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white pointer-events-none transition-all duration-200"
          style={{
            background: "rgba(0,0,0,0.75)",
            opacity: zaloHovered ? 1 : 0,
            transform: zaloHovered ? "translateX(0)" : "translateX(6px)",
          }}
        >
          Chat Zalo hỗ trợ ngay
          {/* Arrow */}
          <span
            className="absolute top-1/2 -translate-y-1/2 -right-1.5 border-4 border-transparent"
            style={{ borderLeftColor: "rgba(0,0,0,0.75)" }}
          />
        </div>

        <button
          onMouseEnter={() => setZaloHovered(true)}
          onMouseLeave={() => setZaloHovered(false)}
          className="flex items-center justify-center rounded-full transition-all duration-200"
          style={{
            width: 52,
            height: 52,
            background: ZALO_BLUE,
            boxShadow: zaloHovered
              ? `0 8px 24px ${ZALO_BLUE}60, 0 2px 8px rgba(0,0,0,0.15)`
              : `0 4px 14px ${ZALO_BLUE}45, 0 2px 6px rgba(0,0,0,0.10)`,
            transform: zaloHovered ? "scale(1.08)" : "scale(1)",
          }}
          aria-label="Chat Zalo hỗ trợ ngay"
        >
          {/* Zalo wordmark-style icon */}
          <svg width="26" height="26" viewBox="0 0 40 40" fill="none">
            <path
              d="M20 4C11.163 4 4 10.716 4 19c0 4.382 1.95 8.33 5.09 11.15-.18 1.96-.96 4.2-2.09 5.85 2.9-.3 6.01-1.56 7.98-2.84A17.6 17.6 0 0 0 20 34c8.837 0 16-6.716 16-15S28.837 4 20 4z"
              fill="white"
            />
            <text x="20" y="25" textAnchor="middle" fill={ZALO_BLUE} fontSize="12" fontWeight="900" fontFamily="Arial, sans-serif">Za</text>
          </svg>
        </button>
      </div>

      {/* Chat bubble button */}
      <div className="relative flex items-center">
        {/* Tooltip */}
        <div
          className="absolute right-full mr-3 whitespace-nowrap px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white pointer-events-none transition-all duration-200"
          style={{
            background: "rgba(0,0,0,0.75)",
            opacity: chatHovered ? 1 : 0,
            transform: chatHovered ? "translateX(0)" : "translateX(6px)",
          }}
        >
          Chat với jobihome
          <span
            className="absolute top-1/2 -translate-y-1/2 -right-1.5 border-4 border-transparent"
            style={{ borderLeftColor: "rgba(0,0,0,0.75)" }}
          />
        </div>

        <button
          onMouseEnter={() => setChatHovered(true)}
          onMouseLeave={() => setChatHovered(false)}
          className="flex items-center justify-center rounded-full bg-white transition-all duration-200"
          style={{
            width: 44,
            height: 44,
            border: "1px solid #E9ECEF",
            boxShadow: chatHovered
              ? "0 8px 24px rgba(59,91,219,0.18), 0 2px 8px rgba(0,0,0,0.10)"
              : "0 2px 8px rgba(0,0,0,0.08)",
            transform: chatHovered ? "scale(1.08)" : "scale(1)",
          }}
          aria-label="Chat với jobihome"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
              fill="#3B5BDB"
              opacity="0.15"
              stroke="#3B5BDB"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="9" cy="10" r="1" fill="#3B5BDB" />
            <circle cx="12" cy="10" r="1" fill="#3B5BDB" />
            <circle cx="15" cy="10" r="1" fill="#3B5BDB" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default function Root() {
  return (
    <div style={{ fontFamily: FONT }}>
      <Nav />
      <main className="pt-16">
        <Outlet />
      </main>
      <Footer />
      <FloatingSupport />
    </div>
  )
}
