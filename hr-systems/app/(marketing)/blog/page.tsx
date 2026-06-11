"use client";

import Link from "next/link";
import { useState } from "react";

const CATS = ["Tất cả", "Nhân sự", "Tính lương", "Năng suất", "Quản lý", "Văn hóa"];

const POSTS = [
  { slug: "onboard-1-day", category: "Nhân sự", title: "Onboard nhân viên mới trong 1 ngày: checklist đầy đủ cho startup", date: "28 tháng 5, 2026", readTime: "5 phút", emoji: "📋" },
  { slug: "luong-thoi-gian-thuc", category: "Tính lương", title: "Tính lương theo thời gian thực: tại sao Excel không còn đủ nữa", date: "22 tháng 5, 2026", readTime: "6 phút", emoji: "💰" },
  { slug: "okr-vs-kpi", category: "Quản lý", title: "OKR vs KPI: startup ở giai đoạn nào nên dùng cái nào?", date: "17 tháng 5, 2026", readTime: "7 phút", emoji: "📊" },
  { slug: "deep-work-dev", category: "Năng suất", title: "Deep work cho developer: thiết lập môi trường không bị phân tâm", date: "11 tháng 5, 2026", readTime: "4 phút", emoji: "⏱" },
  { slug: "phan-quyen-startup", category: "Nhân sự", title: "Phân quyền trong startup: khi nào cần HR chính thức?", date: "5 tháng 5, 2026", readTime: "5 phút", emoji: "👥" },
  { slug: "feedback-continuous", category: "Văn hóa", title: "Xây dựng văn hóa feedback liên tục mà không làm mất lòng ai", date: "28 tháng 4, 2026", readTime: "6 phút", emoji: "🌟" },
];

const FEATURED = {
  slug: "5-dau-hieu-lang-phi-hop",
  category: "Năng suất",
  title: "5 dấu hiệu team bạn đang lãng phí hơn 10 giờ/tuần vào họp không cần thiết",
  excerpt: "Các nghiên cứu cho thấy 71% các cuộc họp ở startup là không cần thiết. Đây là cách nhận ra và cắt giảm chúng mà không làm mất alignment của team.",
  author: "Minh Tuấn",
  role: "Co-founder, jobihome",
  initials: "MT",
  date: "2 tháng 6, 2026",
  readTime: "8 phút đọc",
};

export default function BlogPage() {
  const [activeCat, setActiveCat] = useState("Tất cả");
  const filtered = activeCat === "Tất cả" ? POSTS : POSTS.filter((p) => p.category === activeCat);

  return (
    <>
      {/* Hero */}
      <section className="lp-glow relative overflow-hidden" style={{ padding: "clamp(56px, 8vw, 96px) 0 0", textAlign: "center" }}>
        <span className="lp-blob lp-blob-1" />
        <span className="lp-blob lp-blob-2" />
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <span className="lp-eyebrow lp-center" style={{ justifyContent: "center" }}>Blog · jobihome.vn</span>
          <h1 className="text-balance mt-5 font-extrabold mx-auto" style={{ fontSize: "clamp(2.6rem, 6vw, 4.3rem)", lineHeight: 1.02, letterSpacing: "-0.035em", maxWidth: "16ch" }}>
            Kiến thức quản lý team <span className="lp-grad-text">& nhân sự</span>
          </h1>
          <p className="mt-6 mx-auto text-lp-text-2" style={{ fontSize: "clamp(1.05rem, 1.6vw, 1.28rem)", maxWidth: "60ch" }}>
            Bài viết thực chiến từ những người đang xây và vận hành startup Việt mỗi ngày.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {CATS.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCat(c)}
                className={`lp-chip${c === activeCat ? " lp-chip-on" : ""}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      <section style={{ padding: "56px 0 clamp(48px, 6vw, 84px)" }}>
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <Link href={`/blog/${FEATURED.slug}`} className="block">
            <div className="lp-card lp-card-hover overflow-hidden" style={{ padding: 0 }}>
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div
                  className="lp-ph-media flex items-center justify-center relative"
                  style={{ minHeight: 300, borderRight: "1px solid var(--lp-border)" }}
                >
                  <span className="text-7xl">📊</span>
                  <span className="lp-pill absolute top-5 left-5">Bài nổi bật</span>
                </div>
                <div className="p-8 lg:p-10 flex flex-col justify-center">
                  <span className="lp-tag">{FEATURED.category}</span>
                  <h2 className="text-balance font-extrabold mt-4" style={{ fontSize: "clamp(1.4rem, 2.4vw, 1.7rem)", lineHeight: 1.25, letterSpacing: "-0.02em" }}>
                    {FEATURED.title}
                  </h2>
                  <p className="text-lp-text-2 mt-4">{FEATURED.excerpt}</p>
                  <div className="mt-6 pt-6 flex items-center justify-between" style={{ borderTop: "1px solid var(--lp-border)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full grid place-items-center text-[12px] font-bold text-white" style={{ background: "linear-gradient(135deg, var(--lp-accent-2), var(--lp-accent))" }}>
                        {FEATURED.initials}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold">{FEATURED.author}</p>
                        <p className="text-[11.5px] text-lp-text-3">{FEATURED.role}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 lp-mono text-[0.72rem] text-lp-text-3">
                      <span>{FEATURED.readTime}</span>
                      <span>{FEATURED.date}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Grid */}
      <section style={{ padding: "0 0 clamp(64px, 9vw, 130px)" }}>
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="font-bold text-[1.05rem] whitespace-nowrap">Bài viết mới nhất</h2>
            <div className="flex-1 h-px" style={{ background: "var(--lp-border)" }} />
            <span className="lp-mono text-[0.78rem] text-lp-text-3">{filtered.length} bài</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((p) => (
              <Link key={p.slug} href={`/blog/${p.slug}`} className="lp-card lp-card-hover flex flex-col overflow-hidden" style={{ padding: 0 }}>
                <div className="lp-ph-media flex items-center justify-center" style={{ height: 180, borderBottom: "1px solid var(--lp-border)" }}>
                  <span className="text-5xl opacity-60">{p.emoji}</span>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <span className="lp-tag">{p.category}</span>
                    <span className="lp-mono text-[0.7rem] text-lp-text-3">{p.readTime}</span>
                  </div>
                  <h3 className="font-bold text-[1rem] leading-snug flex-1">{p.title}</h3>
                  <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: "1px solid var(--lp-border)" }}>
                    <span className="lp-mono text-[0.72rem] text-lp-text-3">{p.date}</span>
                    <span className="text-[0.78rem] font-semibold text-lp-accent-ink">Đọc →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Newsletter */}
          <div className="lp-card mt-16 flex flex-col sm:flex-row items-center gap-6 justify-between">
            <div>
              <p className="font-bold text-[1.1rem]">Nhận bài viết mới mỗi tuần</p>
              <p className="text-[0.92rem] text-lp-text-3 mt-1">Không spam · Hủy bất cứ lúc nào · Miễn phí hoàn toàn</p>
            </div>
            <form className="flex gap-2 w-full sm:w-auto">
              <input type="email" placeholder="email@company.vn" className="lp-input" style={{ width: 240 }} />
              <button type="submit" className="lp-btn lp-btn-primary">Đăng ký</button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
