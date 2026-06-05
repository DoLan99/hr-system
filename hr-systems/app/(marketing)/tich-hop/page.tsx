"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, ArrowRight, Zap, Check } from "lucide-react";

const BLUE = "#3B5BDB";
const GREEN = "#0CA678";

const INTEGRATIONS = [
  { id: "slack", name: "Slack", desc: "Nhận thông báo task, chấm công và lương ngay trong channel của team.", category: "Giao tiếp", status: "live", color: "#4A154B", bg: "#F4EFF4", icon: "💬" },
  { id: "google", name: "Google Workspace", desc: "Đồng bộ lịch Google Calendar, Drive và Gmail với jobihome.", category: "Năng suất", status: "live", color: "#1A73E8", bg: "#EAF2FF", icon: "🔤" },
  { id: "zoom", name: "Zoom", desc: "Tạo phòng họp Zoom trực tiếp từ task, gắn link meeting vào deadline.", category: "Giao tiếp", status: "live", color: "#2D8CFF", bg: "#EBF4FF", icon: "📹" },
  { id: "misa", name: "MISA", desc: "Xuất dữ liệu lương sang MISA AMIS tự động, hạch toán kế toán 1 click.", category: "Kế toán", status: "live", color: "#E31837", bg: "#FFF0F2", icon: "🧾" },
  { id: "fast", name: "Fast Accounting", desc: "Đồng bộ bảng lương và chi phí nhân sự với phần mềm Fast tự động.", category: "Kế toán", status: "live", color: "#FF6600", bg: "#FFF4EE", icon: "⚡" },
  { id: "zalo", name: "Zalo", desc: "Gửi thông báo chấm công, phiếu lương và nhắc deadline qua Zalo OA.", category: "Giao tiếp", status: "live", color: "#0068FF", bg: "#EBF4FF", icon: "💙" },
  { id: "notion", name: "Notion", desc: "Đồng bộ task và tài liệu Notion hai chiều với Kanban board của jobihome.", category: "Năng suất", status: "live", color: "#191919", bg: "#F5F5F5", icon: "📝" },
  { id: "trello", name: "Trello", desc: "Import board Trello vào jobihome, giữ nguyên card và assignee.", category: "Quản lý dự án", status: "live", color: "#0052CC", bg: "#EBF3FF", icon: "📋" },
  { id: "github", name: "GitHub", desc: "Liên kết commit và PR với task trên jobihome. Tự động cập nhật tiến độ.", category: "Phát triển", status: "live", color: "#24292F", bg: "#F5F5F5", icon: "🐙" },
  { id: "jira", name: "Jira", desc: "Đồng bộ sprint và epic từ Jira, xem chéo tiến độ với heatmap jobihome.", category: "Quản lý dự án", status: "live", color: "#0052CC", bg: "#EBF3FF", icon: "🔷" },
  { id: "vnpay", name: "VNPAY", desc: "Thanh toán gói jobihome và xử lý lương nhân viên qua cổng VNPAY.", category: "Thanh toán", status: "live", color: "#002F7A", bg: "#EBF0FF", icon: "💳" },
  { id: "momo", name: "MoMo", desc: "Chuyển lương và phí dịch vụ qua ví điện tử MoMo, không phí giao dịch.", category: "Thanh toán", status: "live", color: "#A50064", bg: "#FFF0F8", icon: "📱" },
  { id: "zapier", name: "Zapier", desc: "Kết nối jobihome với 6000+ ứng dụng qua Zapier, không cần code.", category: "Tự động hóa", status: "coming", color: "#FF4A00", bg: "#FFF2EE", icon: "⚙️" },
  { id: "make", name: "Make (Integromat)", desc: "Xây dựng workflow tự động phức tạp kết nối jobihome với mọi hệ thống.", category: "Tự động hóa", status: "coming", color: "#6D00CC", bg: "#F5EEFF", icon: "🔧" },
  { id: "hubspot", name: "HubSpot", desc: "Đồng bộ thông tin nhân sự với CRM, tự động cập nhật vai trò khách hàng.", category: "Năng suất", status: "coming", color: "#FF7A59", bg: "#FFF3F0", icon: "🟠" },
  { id: "webhook", name: "Webhook / API", desc: "Kết nối bất kỳ hệ thống nào qua REST API và Webhook có sẵn của jobihome.", category: "Phát triển", status: "live", color: "#374151", bg: "#F3F4F6", icon: "🔗" },
];

const CATEGORIES = ["Tất cả", "Giao tiếp", "Năng suất", "Kế toán", "Quản lý dự án", "Phát triển", "Thanh toán", "Tự động hóa"];

export default function IntegrationsPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Tất cả");

  const filtered = useMemo(() => INTEGRATIONS.filter((item) => {
    const matchesQuery = query.trim() === "" ||
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.desc.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase());
    const matchesCat = activeCategory === "Tất cả" || item.category === activeCategory;
    return matchesQuery && matchesCat;
  }), [query, activeCategory]);

  const live = filtered.filter((i) => i.status === "live");
  const coming = filtered.filter((i) => i.status === "coming");

  return (
    <div className="bg-white min-h-screen">
      {/* Hero */}
      <section className="pt-16 pb-14 px-6 text-center relative overflow-hidden"
        style={{ background: "linear-gradient(180deg, #F8F9FF 0%, #fff 100%)" }}>
        <div className="relative max-w-[680px] mx-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold mb-5 border"
            style={{ background: "#EEF2FF", borderColor: "#C7D2FE", color: BLUE }}>
            <Zap size={11} /> Tích hợp
          </div>
          <h1 className="text-[36px] lg:text-[48px] font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-4">
            Kết nối với công cụ<br /><span style={{ color: BLUE }}>bạn đang dùng</span>
          </h1>
          <p className="text-[16px] text-gray-400 max-w-[460px] mx-auto leading-relaxed mb-10">
            jobihome hoạt động cùng với stack hiện tại của bạn — không cần thay đổi quy trình, chỉ cần kết nối thêm.
          </p>
          <div className="flex items-center justify-center gap-6 flex-wrap mb-10">
            {[{ value: "16+", label: "Tích hợp có sẵn" }, { value: "6000+", label: "Qua Zapier & Make" }, { value: "REST", label: "API đầy đủ tài liệu" }].map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <span className="text-[20px] font-extrabold" style={{ color: BLUE }}>{s.value}</span>
                <span className="text-[13px] text-gray-400">{s.label}</span>
              </div>
            ))}
          </div>
          <div className="relative max-w-[480px] mx-auto">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300" />
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm kiếm tích hợp... (Slack, MISA, GitHub…)"
              className="w-full h-12 pl-11 pr-4 rounded-2xl text-[14px] text-gray-800 placeholder-gray-300 outline-none transition-all border border-gray-200 bg-white focus:border-blue-500"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }} />
          </div>
        </div>
      </section>

      {/* Category filter */}
      <div className="sticky top-14 z-30 bg-white border-b border-gray-100" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div className="max-w-[1060px] mx-auto px-6">
          <div className="flex items-center gap-1.5 overflow-x-auto py-3" style={{ scrollbarWidth: "none" }}>
            {CATEGORIES.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className="flex-shrink-0 h-8 px-4 rounded-full text-[12.5px] font-semibold transition-all"
                style={activeCategory === cat
                  ? { background: BLUE, color: "#fff", boxShadow: `0 2px 8px ${BLUE}40` }
                  : { background: "#F3F4F6", color: "#6B7280" }}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-[1060px] mx-auto px-6 py-14 pb-28">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[40px] mb-4">🔍</p>
            <p className="text-[16px] font-semibold text-gray-700 mb-2">Không tìm thấy kết quả</p>
            <p className="text-[14px] text-gray-400">Thử tìm với từ khóa khác hoặc gửi yêu cầu tích hợp mới.</p>
            <button onClick={() => { setQuery(""); setActiveCategory("Tất cả"); }}
              className="mt-5 h-9 px-5 rounded-xl text-[13px] font-semibold transition-colors"
              style={{ background: "#EEF2FF", color: BLUE }}>
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <>
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
                    <IntCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}
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
                    <IntCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="mt-16 rounded-2xl px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-5"
          style={{ background: "#F8F9FF", border: `1px solid ${BLUE}20` }}>
          <div>
            <p className="text-[17px] font-bold text-gray-900 mb-1">Không thấy công cụ bạn cần?</p>
            <p className="text-[13.5px] text-gray-400 max-w-[380px]">
              Gửi yêu cầu — chúng tôi ưu tiên tích hợp theo số phiếu đề xuất từ khách hàng.
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <Link href="/dat-lich-demo"
              className="inline-flex items-center gap-2 h-11 px-6 rounded-xl text-[13.5px] font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: BLUE, boxShadow: `0 4px 16px ${BLUE}35` }}>
              Gửi yêu cầu <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function IntCard({ item }: { item: typeof INTEGRATIONS[number] }) {
  const isComingSoon = item.status === "coming";
  return (
    <div className="group relative flex flex-col rounded-2xl bg-white p-5 cursor-pointer transition-all duration-250 hover:-translate-y-1"
      style={{
        border: "1px solid #E5E7EB",
        boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
        opacity: isComingSoon ? 0.75 : 1,
      }}>
      {isComingSoon && (
        <div className="absolute top-3.5 right-3.5">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-600 border border-yellow-200">Sắp ra</span>
        </div>
      )}
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 flex-shrink-0 text-2xl" style={{ background: item.bg }}>
        {item.icon}
      </div>
      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 self-start" style={{ background: "#F3F4F6", color: "#6B7280" }}>
        {item.category}
      </span>
      <p className="text-[14px] font-bold text-gray-900 mb-1 leading-tight">{item.name}</p>
      <p className="text-[12.5px] text-gray-400 leading-snug flex-1">{item.desc}</p>
      {!isComingSoon && (
        <div className="mt-4 flex items-center gap-1 text-[12px] font-semibold opacity-0 group-hover:opacity-100 transition-all" style={{ color: item.color }}>
          Kết nối <ArrowRight size={12} />
        </div>
      )}
    </div>
  );
}
