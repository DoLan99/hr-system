"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

const INTEGRATIONS = [
  { id: "slack", name: "Slack", desc: "Nhận thông báo task, chấm công và lương ngay trong channel của team.", category: "Giao tiếp", status: "live", icon: "💬" },
  { id: "google", name: "Google Workspace", desc: "Đồng bộ lịch Google Calendar, Drive và Gmail với jobihome.", category: "Năng suất", status: "live", icon: "🔤" },
  { id: "zoom", name: "Zoom", desc: "Tạo phòng họp Zoom trực tiếp từ task, gắn link meeting vào deadline.", category: "Giao tiếp", status: "live", icon: "📹" },
  { id: "misa", name: "MISA", desc: "Xuất dữ liệu lương sang MISA AMIS tự động, hạch toán kế toán 1 click.", category: "Kế toán", status: "live", icon: "🧾" },
  { id: "fast", name: "Fast Accounting", desc: "Đồng bộ bảng lương và chi phí nhân sự với phần mềm Fast tự động.", category: "Kế toán", status: "live", icon: "⚡" },
  { id: "zalo", name: "Zalo", desc: "Gửi thông báo chấm công, phiếu lương và nhắc deadline qua Zalo OA.", category: "Giao tiếp", status: "live", icon: "💙" },
  { id: "notion", name: "Notion", desc: "Đồng bộ task và tài liệu Notion hai chiều với Kanban board của jobihome.", category: "Năng suất", status: "live", icon: "📝" },
  { id: "trello", name: "Trello", desc: "Import board Trello vào jobihome, giữ nguyên card và assignee.", category: "Quản lý dự án", status: "live", icon: "📋" },
  { id: "github", name: "GitHub", desc: "Liên kết commit và PR với task trên jobihome. Tự động cập nhật tiến độ.", category: "Phát triển", status: "live", icon: "🐙" },
  { id: "jira", name: "Jira", desc: "Đồng bộ sprint và epic từ Jira, xem chéo tiến độ với heatmap jobihome.", category: "Quản lý dự án", status: "live", icon: "🔷" },
  { id: "vnpay", name: "VNPAY", desc: "Thanh toán gói jobihome và xử lý lương nhân viên qua cổng VNPAY.", category: "Thanh toán", status: "live", icon: "💳" },
  { id: "momo", name: "MoMo", desc: "Chuyển lương và phí dịch vụ qua ví điện tử MoMo, không phí giao dịch.", category: "Thanh toán", status: "live", icon: "📱" },
  { id: "zapier", name: "Zapier", desc: "Kết nối jobihome với 6000+ ứng dụng qua Zapier, không cần code.", category: "Tự động hóa", status: "coming", icon: "⚙️" },
  { id: "make", name: "Make", desc: "Xây dựng workflow tự động phức tạp kết nối jobihome với mọi hệ thống.", category: "Tự động hóa", status: "coming", icon: "🔧" },
  { id: "hubspot", name: "HubSpot", desc: "Đồng bộ thông tin nhân sự với CRM, tự động cập nhật vai trò khách hàng.", category: "Năng suất", status: "coming", icon: "🟠" },
  { id: "webhook", name: "Webhook / API", desc: "Kết nối bất kỳ hệ thống nào qua REST API và Webhook có sẵn của jobihome.", category: "Phát triển", status: "live", icon: "🔗" },
];

const CATEGORIES = ["Tất cả", "Giao tiếp", "Năng suất", "Kế toán", "Quản lý dự án", "Phát triển", "Thanh toán", "Tự động hóa"];

function IntCard({ item }: { item: typeof INTEGRATIONS[number] }) {
  const isComingSoon = item.status === "coming";
  return (
    <div className="lp-card lp-card-hover relative flex flex-col" style={{ opacity: isComingSoon ? 0.75 : 1 }}>
      {isComingSoon && (
        <span className="absolute top-3.5 right-3.5 lp-mono text-[0.62rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: "rgba(251,191,36,0.13)", color: "var(--lp-warn)", border: "1px solid rgba(251,191,36,0.3)" }}>
          Sắp ra
        </span>
      )}
      <div className="lp-ico text-2xl">{item.icon}</div>
      <span className="lp-tag self-start mb-2">{item.category}</span>
      <p className="font-bold text-[1rem] mb-1.5">{item.name}</p>
      <p className="text-[0.88rem] text-lp-text-2 leading-snug flex-1">{item.desc}</p>
    </div>
  );
}

export default function IntegrationsPage() {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("Tất cả");

  const filtered = useMemo(() => INTEGRATIONS.filter((item) => {
    const matchesQuery = query.trim() === "" ||
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.desc.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase());
    const matchesCat = activeCat === "Tất cả" || item.category === activeCat;
    return matchesQuery && matchesCat;
  }), [query, activeCat]);

  const live = filtered.filter((i) => i.status === "live");
  const coming = filtered.filter((i) => i.status === "coming");

  return (
    <>
      {/* Hero */}
      <section className="lp-glow relative overflow-hidden" style={{ padding: "clamp(56px, 8vw, 96px) 0 0", textAlign: "center" }}>
        <span className="lp-blob lp-blob-1" />
        <span className="lp-blob lp-blob-2" />
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <span className="lp-eyebrow lp-center" style={{ justifyContent: "center" }}>Integrations · Tích hợp</span>
          <h1 className="text-balance mt-5 font-extrabold mx-auto" style={{ fontSize: "clamp(2.4rem, 5.5vw, 3.8rem)", lineHeight: 1.05, letterSpacing: "-0.035em", maxWidth: "20ch" }}>
            Kết nối với công cụ <span className="lp-grad-text">bạn đang dùng</span>
          </h1>
          <p className="mt-6 mx-auto text-lp-text-2" style={{ fontSize: "clamp(1.05rem, 1.6vw, 1.28rem)", maxWidth: "60ch" }}>
            jobihome hoạt động cùng với stack hiện tại của bạn — không cần thay đổi quy trình, chỉ cần kết nối thêm.
          </p>

          <div className="flex items-center justify-center gap-8 flex-wrap mt-8 mb-8">
            {[{ value: "16+", label: "Tích hợp có sẵn" }, { value: "6000+", label: "Qua Zapier & Make" }, { value: "REST", label: "API đầy đủ" }].map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <span className="text-[1.4rem] font-extrabold lp-grad-text">{s.value}</span>
                <span className="text-[0.9rem] text-lp-text-3">{s.label}</span>
              </div>
            ))}
          </div>

          <div className="relative max-w-[480px] mx-auto">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-lp-text-3 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm kiếm tích hợp... (Slack, MISA, GitHub…)"
              className="lp-input"
              style={{ paddingLeft: 42, height: 48 }}
            />
          </div>
        </div>
      </section>

      {/* Category filter */}
      <div className="sticky z-30" style={{ top: 66, background: "color-mix(in srgb, var(--lp-bg) 90%, transparent)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--lp-border)" }}>
        <div className="max-w-[1180px] mx-auto px-7">
          <div className="flex items-center gap-2 overflow-x-auto py-3" style={{ scrollbarWidth: "none" }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                className={`lp-chip flex-shrink-0${activeCat === cat ? " lp-chip-on" : ""}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <section style={{ padding: "56px 0 clamp(64px, 9vw, 130px)" }}>
        <div className="w-full max-w-[1180px] mx-auto px-7">
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">🔍</p>
              <p className="font-bold text-[1.1rem] mb-1">Không tìm thấy kết quả</p>
              <p className="text-lp-text-2 mb-5">Thử tìm với từ khóa khác hoặc gửi yêu cầu tích hợp mới.</p>
              <button onClick={() => { setQuery(""); setActiveCat("Tất cả"); }} className="lp-btn lp-btn-ghost">
                Xóa bộ lọc
              </button>
            </div>
          ) : (
            <>
              {live.length > 0 && (
                <div className="mb-12">
                  {coming.length > 0 && (
                    <div className="flex items-center gap-3 mb-6">
                      <span className="block w-2 h-2 rounded-full" style={{ background: "var(--lp-ok)" }} />
                      <h2 className="font-bold text-[0.95rem]">Đang hoạt động</h2>
                      <span className="lp-mono text-[0.72rem] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(74,222,128,0.13)", color: "var(--lp-ok)" }}>
                        {live.length} tích hợp
                      </span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {live.map((item) => <IntCard key={item.id} item={item} />)}
                  </div>
                </div>
              )}
              {coming.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="block w-2 h-2 rounded-full" style={{ background: "var(--lp-warn)" }} />
                    <h2 className="font-bold text-[0.95rem]">Sắp ra mắt</h2>
                    <span className="lp-mono text-[0.72rem] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(251,191,36,0.13)", color: "var(--lp-warn)" }}>
                      {coming.length} tích hợp
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {coming.map((item) => <IntCard key={item.id} item={item} />)}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="lp-card mt-14 flex flex-col sm:flex-row items-center justify-between gap-5">
            <div>
              <p className="font-bold text-[1.1rem]">Không thấy công cụ bạn cần?</p>
              <p className="text-[0.92rem] text-lp-text-3 mt-1 max-w-[380px]">
                Gửi yêu cầu — chúng tôi ưu tiên tích hợp theo số phiếu đề xuất từ khách hàng.
              </p>
            </div>
            <Link href="/dat-lich-demo" className="lp-btn lp-btn-primary flex-shrink-0">
              Gửi yêu cầu
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
