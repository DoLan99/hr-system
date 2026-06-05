"use client";

import Link from "next/link";
import { ArrowRight, Clock, Calendar } from "lucide-react";

const BLUE = "#3B5BDB";

const CATS: Record<string, { label: string; bg: string; text: string }> = {
  HR:           { label: "Nhân sự",    bg: "#EEF2FF", text: BLUE       },
  Payroll:      { label: "Tính lương", bg: "#FFF3EE", text: "#C2410C"  },
  Productivity: { label: "Năng suất",  bg: "#ECFDF5", text: "#065F46"  },
  Management:   { label: "Quản lý",    bg: "#F5F3FF", text: "#6D28D9"  },
  Culture:      { label: "Văn hóa",    bg: "#FFF1F2", text: "#BE123C"  },
};

const POSTS = [
  { category: "HR", title: "Onboard nhân viên mới trong 1 ngày: checklist đầy đủ cho startup", date: "28 tháng 5, 2025", readTime: "5 phút" },
  { category: "Payroll", title: "Tính lương theo thời gian thực: tại sao Excel không còn đủ nữa", date: "22 tháng 5, 2025", readTime: "6 phút" },
  { category: "Management", title: "OKR vs KPI: startup ở giai đoạn nào nên dùng cái nào?", date: "17 tháng 5, 2025", readTime: "7 phút" },
  { category: "Productivity", title: "Deep work cho developer: thiết lập môi trường không bị phân tâm", date: "11 tháng 5, 2025", readTime: "4 phút" },
  { category: "HR", title: "Phân quyền trong startup: khi nào cần HR chính thức?", date: "5 tháng 5, 2025", readTime: "5 phút" },
  { category: "Culture", title: "Xây dựng văn hóa feedback liên tục mà không làm mất lòng ai", date: "28 tháng 4, 2025", readTime: "6 phút" },
];

const ACTIVE_CATS = ["Tất cả", "Nhân sự", "Tính lương", "Năng suất", "Quản lý", "Văn hóa"];

function CategoryTag({ cat }: { cat: string }) {
  const c = CATS[cat] ?? CATS.HR;
  return (
    <span className="inline-block text-[11px] font-bold px-2.5 py-1 rounded-full tracking-wide"
      style={{ background: c.bg, color: c.text }}>
      {c.label}
    </span>
  );
}

export default function BlogPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <section className="pt-16 pb-14 px-6 text-center"
        style={{ background: "linear-gradient(180deg, #F8F9FF 0%, #fff 100%)" }}>
        <div className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold mb-5 border"
          style={{ background: "#EEF2FF", borderColor: "#C7D2FE", color: BLUE }}>
          Blog · jobihome.vn
        </div>
        <h1 className="text-[36px] lg:text-[46px] font-extrabold text-gray-900 tracking-tight leading-[1.12] mb-4">
          Kiến thức quản lý<br className="hidden sm:block" />{" "}
          team <span style={{ color: BLUE }}>&amp; nhân sự</span>
        </h1>
        <p className="text-[15px] text-gray-400 max-w-[440px] mx-auto leading-relaxed">
          Bài viết thực chiến từ những người đang xây và vận hành startup Việt mỗi ngày.
        </p>
        <div className="mt-8 flex items-center justify-center gap-2 flex-wrap">
          {ACTIVE_CATS.map((cat, i) => (
            <button key={cat} className="h-8 px-4 rounded-full text-[12.5px] font-semibold transition-all"
              style={i === 0 ? { background: BLUE, color: "#fff" } : { background: "#F3F4F6", color: "#6B7280" }}>
              {cat}
            </button>
          ))}
        </div>
      </section>

      <div className="max-w-[1060px] mx-auto px-6 pb-28">
        {/* Featured post */}
        <div className="mb-16 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl"
          style={{ border: "1px solid #E5E7EB", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center"
              style={{ minHeight: 300 }}>
              <div className="text-center p-12">
                <div className="text-7xl mb-4">📊</div>
                <div className="absolute top-5 left-5">
                  <span className="text-[11px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest"
                    style={{ background: "#fff", color: BLUE }}>
                    Bài nổi bật
                  </span>
                </div>
              </div>
            </div>
            <div className="p-8 lg:p-10 flex flex-col justify-center">
              <div className="mb-4"><CategoryTag cat="Productivity" /></div>
              <h2 className="text-[22px] lg:text-[26px] font-extrabold text-gray-900 leading-[1.25] mb-4 tracking-tight">
                5 dấu hiệu team bạn đang lãng phí hơn 10 giờ/tuần vào họp không cần thiết
              </h2>
              <p className="text-[14px] text-gray-500 leading-relaxed mb-7">
                Các nghiên cứu cho thấy 71% các cuộc họp ở startup là không cần thiết. Đây là cách nhận ra và cắt giảm chúng mà không làm mất alignment của team.
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0"
                    style={{ background: BLUE }}>MT</div>
                  <div>
                    <p className="text-[13px] font-semibold text-gray-800 leading-tight">Minh Tuấn</p>
                    <p className="text-[11.5px] text-gray-400 leading-tight">Co-founder, jobihome</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-[12px] text-gray-400">
                  <span className="flex items-center gap-1.5"><Clock size={12} /> 8 phút đọc</span>
                  <span className="flex items-center gap-1.5"><Calendar size={12} /> 2 tháng 6, 2025</span>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-100">
                <span className="inline-flex items-center gap-1.5 text-[13.5px] font-bold" style={{ color: BLUE }}>
                  Đọc bài viết <ArrowRight size={14} />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section label */}
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-[18px] font-bold text-gray-900 whitespace-nowrap">Bài viết mới nhất</h2>
          <div className="flex-1 h-px bg-gray-100" />
          <a href="#" className="text-[13px] font-semibold whitespace-nowrap transition-colors hover:opacity-70" style={{ color: BLUE }}>
            Xem tất cả
          </a>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {POSTS.map((post, i) => (
            <a key={post.title} href="#"
              className="group flex flex-col rounded-2xl bg-white overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              style={{ border: "1px solid #E5E7EB", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div className="overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center"
                style={{ height: 192 }}>
                <span className="text-5xl opacity-40">
                  {["📋", "💰", "📊", "⏱", "👥", "🌟"][i]}
                </span>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-3">
                  <CategoryTag cat={post.category} />
                  <span className="flex items-center gap-1 text-[11.5px] text-gray-400">
                    <Clock size={11} /> {post.readTime}
                  </span>
                </div>
                <h3 className="text-[14.5px] font-bold text-gray-900 leading-snug mb-3 flex-1 group-hover:text-blue-700 transition-colors line-clamp-3">
                  {post.title}
                </h3>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
                  <span className="flex items-center gap-1.5 text-[11.5px] text-gray-400">
                    <Calendar size={11} /> {post.date}
                  </span>
                  <span className="flex items-center gap-1 text-[12px] font-semibold opacity-0 group-hover:opacity-100 transition-all"
                    style={{ color: BLUE }}>
                    Đọc <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>

        <div className="mt-12 text-center">
          <button className="inline-flex items-center gap-2 h-11 px-8 rounded-xl text-[13.5px] font-semibold border transition-colors hover:bg-gray-50"
            style={{ borderColor: "#D1D5DB", color: "#374151" }}>
            Xem thêm bài viết
          </button>
        </div>

        {/* Newsletter */}
        <div className="mt-20 rounded-2xl px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-6"
          style={{ background: "#F8F9FF", border: `1px solid ${BLUE}20` }}>
          <div>
            <p className="text-[18px] font-bold text-gray-900 mb-1">Nhận bài viết mới mỗi tuần</p>
            <p className="text-[13.5px] text-gray-400">Không spam · Hủy bất cứ lúc nào · Miễn phí hoàn toàn</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <input type="email" placeholder="email@company.vn"
              className="h-11 px-4 rounded-xl text-[13.5px] outline-none flex-1 sm:w-56 border border-gray-200 focus:border-blue-500 transition-colors bg-white" />
            <button className="h-11 px-5 rounded-xl text-[13.5px] font-bold text-white flex-shrink-0 transition-opacity hover:opacity-90"
              style={{ background: BLUE }}>
              Đăng ký
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
