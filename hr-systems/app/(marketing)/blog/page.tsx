"use client";

import Link from "next/link";
import { useState } from "react";

const CATS = ["Tất cả", "Nhân sự", "Tính lương", "Năng suất", "Quản lý", "Văn hóa"];

const POSTS = [
  { slug: "onboard-1-day",        category: "Nhân sự",   title: "Onboard nhân viên mới trong 1 ngày: checklist đầy đủ cho startup",            date: "28 tháng 5, 2026",  readTime: "5 phút", emoji: "📋" },
  { slug: "luong-thoi-gian-thuc", category: "Tính lương", title: "Tính lương theo thời gian thực: tại sao Excel không còn đủ nữa",              date: "22 tháng 5, 2026",  readTime: "6 phút", emoji: "💰" },
  { slug: "okr-vs-kpi",           category: "Quản lý",   title: "OKR vs KPI: startup ở giai đoạn nào nên dùng cái nào?",                       date: "17 tháng 5, 2026",  readTime: "7 phút", emoji: "📊" },
  { slug: "deep-work-dev",        category: "Năng suất",  title: "Deep work cho developer: thiết lập môi trường không bị phân tâm",             date: "11 tháng 5, 2026",  readTime: "4 phút", emoji: "⏱"  },
  { slug: "phan-quyen-startup",   category: "Nhân sự",   title: "Phân quyền trong startup: khi nào cần HR chính thức?",                        date: "5 tháng 5, 2026",   readTime: "5 phút", emoji: "👥" },
  { slug: "feedback-continuous",  category: "Văn hóa",   title: "Xây dựng văn hóa feedback liên tục mà không làm mất lòng ai",                 date: "28 tháng 4, 2026",  readTime: "6 phút", emoji: "🌟" },
  { slug: "remote-team-viet",     category: "Quản lý",   title: "Quản lý remote team Việt: 7 quy tắc giúp mọi người không bị lạc nhau",        date: "20 tháng 4, 2026",  readTime: "6 phút", emoji: "🏠" },
  { slug: "nghi-phep-dung-luat",  category: "Nhân sự",   title: "Nghỉ phép đúng luật lao động Việt Nam: những điều HR hay nhầm nhất",          date: "14 tháng 4, 2026",  readTime: "5 phút", emoji: "📅" },
  { slug: "1-on-1-hieu-qua",      category: "Quản lý",   title: "1-on-1 hiệu quả: khung câu hỏi cho tech lead không biết bắt đầu từ đâu",     date: "7 tháng 4, 2026",   readTime: "5 phút", emoji: "🤝" },
  { slug: "burn-out-dev",         category: "Văn hóa",   title: "Nhận biết burnout trong team tech trước khi người giỏi bỏ việc",              date: "31 tháng 3, 2026",  readTime: "7 phút", emoji: "🔥" },
  { slug: "audit-log-quan-ly",    category: "Năng suất",  title: "Audit log không chỉ để debug: cách dùng nó để quản lý minh bạch hơn",        date: "24 tháng 3, 2026",  readTime: "4 phút", emoji: "🔍" },
  { slug: "tang-luong-dung-ky",   category: "Tính lương", title: "Review lương đúng kỳ: quy trình 3 bước không làm xáo trộn team",             date: "17 tháng 3, 2026",  readTime: "6 phút", emoji: "📈" },
  { slug: "kpi-developer",        category: "Quản lý",   title: "Đo KPI cho developer: những chỉ số nào thực sự có ý nghĩa?",                  date: "10 tháng 3, 2026",  readTime: "8 phút", emoji: "🎯" },
  { slug: "van-hoa-docs",         category: "Văn hóa",   title: "Văn hóa viết docs: tại sao team giỏi nhất luôn ghi chép mọi quyết định",      date: "3 tháng 3, 2026",   readTime: "5 phút", emoji: "📝" },
  { slug: "offboard-dung-cach",   category: "Nhân sự",   title: "Offboard đúng cách: checklist để không mất dữ liệu và giữ được good will",    date: "24 tháng 2, 2026",  readTime: "4 phút", emoji: "🚪" },
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

const PAGE_SIZE = 6;

export default function BlogPage() {
  const [activeCat, setActiveCat] = useState("Tất cả");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [stickyDismissed, setStickyDismissed] = useState(false);

  const filtered = POSTS.filter((p) => {
    const matchCat = activeCat === "Tất cả" || p.category === activeCat;
    const q = query.trim().toLowerCase();
    const matchQ = !q || p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function changeCat(cat: string) { setActiveCat(cat); setPage(1); }
  function changeQuery(q: string)  { setQuery(q);        setPage(1); }

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
                onClick={() => changeCat(c)}
                className={`lp-chip${c === activeCat ? " lp-chip-on" : ""}`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative mx-auto mt-6" style={{ maxWidth: 480 }}>
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--lp-text-3)", pointerEvents: "none" }}
            >
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => changeQuery(e.target.value)}
              placeholder="Tìm bài viết…"
              className="lp-input"
              style={{ width: "100%", paddingLeft: 40, paddingRight: query ? 36 : 14 }}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Xóa tìm kiếm"
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--lp-text-3)", lineHeight: 1, padding: 2, fontSize: 14 }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Featured */}
      <section style={{ padding: "56px 0 clamp(48px, 6vw, 84px)" }}>
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <Link href={`/blog/${FEATURED.slug}`} className="block">
            <div className="lp-card lp-card-hover overflow-hidden" style={{ padding: 0 }}>
              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Featured illustration — "wasted hours" audit card */}
                <div
                  className="relative flex items-center justify-center overflow-hidden"
                  style={{
                    minHeight: 300,
                    borderRight: "1px solid var(--lp-border)",
                    background: "linear-gradient(145deg, #0C1526 0%, #111827 60%, #0F172A 100%)",
                  }}
                >
                  {/* Subtle grid */}
                  <div aria-hidden="true" style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
                  {/* Glow blobs */}
                  <div aria-hidden="true" style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 70%)" }} />
                  <div aria-hidden="true" style={{ position: "absolute", bottom: -30, left: -30, width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)" }} />

                  {/* Mock audit card */}
                  <div style={{ width: 260, position: "relative", zIndex: 1 }}>
                    {/* Card header */}
                    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 16px", marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <span style={{ fontSize: 10, color: "#64748B", fontFamily: "monospace", letterSpacing: "0.06em", textTransform: "uppercase" }}>Báo cáo tuần · W23</span>
                        <span style={{ fontSize: 10, background: "rgba(239,68,68,0.15)", color: "#F87171", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 100, padding: "2px 8px", fontFamily: "monospace" }}>−10.4h</span>
                      </div>
                      {/* Bar chart rows */}
                      {[
                        { label: "Họp không agenda", pct: 78, color: "#EF4444" },
                        { label: "Tổng hợp Excel thủ công", pct: 62, color: "#F97316" },
                        { label: "Tìm file / link cũ", pct: 45, color: "#EAB308" },
                        { label: "Chờ duyệt đơn từ", pct: 30, color: "#6366F1" },
                      ].map((row) => (
                        <div key={row.label} style={{ marginBottom: 8 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                            <span style={{ fontSize: 9.5, color: "#94A3B8" }}>{row.label}</span>
                            <span style={{ fontSize: 9, color: row.color, fontFamily: "monospace" }}>{row.pct}%</span>
                          </div>
                          <div style={{ height: 5, borderRadius: 100, background: "rgba(255,255,255,0.06)" }}>
                            <div style={{ height: "100%", width: `${row.pct}%`, borderRadius: 100, background: row.color, opacity: 0.8 }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Summary row */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                        <p style={{ fontSize: 18, fontWeight: 800, color: "#F87171", lineHeight: 1, fontFamily: "monospace" }}>10.4h</p>
                        <p style={{ fontSize: 9, color: "#64748B", marginTop: 3 }}>lãng phí / tuần</p>
                      </div>
                      <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                        <p style={{ fontSize: 18, fontWeight: 800, color: "#818CF8", lineHeight: 1, fontFamily: "monospace" }}>540h</p>
                        <p style={{ fontSize: 9, color: "#64748B", marginTop: 3 }}>/ năm · 10 người</p>
                      </div>
                    </div>
                  </div>

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
            <h2 className="font-bold text-[1.05rem] whitespace-nowrap">
              {query.trim() ? `Kết quả cho "${query.trim()}"` : "Bài viết mới nhất"}
            </h2>
            <div className="flex-1 h-px" style={{ background: "var(--lp-border)" }} />
            <span className="lp-mono text-[0.78rem] text-lp-text-3">{filtered.length} bài</span>
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-20 rounded-2xl" style={{ background: "var(--lp-surface)", border: "1px solid var(--lp-border)" }}>
              <p className="text-4xl mb-4">🔍</p>
              <p className="font-semibold text-[1rem]" style={{ color: "var(--lp-text)" }}>Không tìm thấy bài viết nào</p>
              <p className="text-[0.88rem] mt-2 mb-5" style={{ color: "var(--lp-text-3)" }}>Thử từ khóa khác hoặc xem tất cả danh mục.</p>
              <button
                onClick={() => { changeQuery(""); changeCat("Tất cả"); }}
                className="lp-btn lp-btn-ghost"
                style={{ height: 36, fontSize: "0.85rem", padding: "0 18px", display: "inline-flex", alignItems: "center" }}
              >
                Xem tất cả bài viết
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginated.map((p, i) => (
              <>
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

                {/* Inline CTA after 3rd card on page 1 */}
                {i === 2 && page === 1 && (
                  <div
                    key="inline-cta"
                    className="col-span-1 sm:col-span-2 lg:col-span-3 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4"
                    style={{
                      background: "linear-gradient(135deg, #0F1829 0%, #141E35 100%)",
                      border: "1px solid #1E2D5A",
                      padding: "22px 28px",
                    }}
                  >
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div className="grid place-items-center rounded-xl flex-shrink-0" style={{ width: 44, height: 44, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <path d="M3 9h18M9 21V9" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-bold text-[0.97rem]" style={{ color: "#fff" }}>
                          Đang dùng Excel để quản lý team?
                        </p>
                        <p className="text-[0.82rem] mt-0.5" style={{ color: "#64748B" }}>
                          1.000+ team Việt đã chuyển sang jobihome — task, chấm công, lương trong một workspace.
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/sign-up"
                      className="lp-cta-primary-indigo flex-shrink-0"
                      style={{ height: 40, padding: "0 20px", borderRadius: 8, background: "#6366F1", color: "#fff", fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", textDecoration: "none", whiteSpace: "nowrap", boxShadow: "0 4px 16px rgba(99,102,241,0.3)" }}
                    >
                      Thử miễn phí 14 ngày →
                    </Link>
                  </div>
                )}
              </>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-12">
              {/* Prev */}
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="lp-btn lp-btn-ghost"
                style={{ height: 38, padding: "0 14px", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: 6, opacity: page === 1 ? 0.35 : 1, cursor: page === 1 ? "default" : "pointer" }}
              >
                ← Trước
              </button>

              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => {
                  const isCurrent = n === page;
                  const isNear = Math.abs(n - page) <= 1 || n === 1 || n === totalPages;
                  if (!isNear) {
                    if (n === page - 2 || n === page + 2) {
                      return <span key={n} className="lp-mono text-[0.78rem]" style={{ color: "var(--lp-text-3)", padding: "0 2px" }}>…</span>;
                    }
                    return null;
                  }
                  return (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className="lp-mono font-semibold"
                      style={{
                        width: 36, height: 36, borderRadius: 8, fontSize: "0.85rem",
                        background: isCurrent ? "var(--lp-accent)" : "transparent",
                        color: isCurrent ? "#fff" : "var(--lp-text-2)",
                        border: isCurrent ? "none" : "1px solid var(--lp-border)",
                        cursor: "pointer",
                      }}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>

              {/* Next */}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="lp-btn lp-btn-ghost"
                style={{ height: 38, padding: "0 14px", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: 6, opacity: page === totalPages ? 0.35 : 1, cursor: page === totalPages ? "default" : "pointer" }}
              >
                Tiếp →
              </button>
            </div>
          )}

          {/* Page context */}
          {totalPages > 1 && (
            <p className="text-center lp-mono text-[0.75rem] mt-3" style={{ color: "var(--lp-text-3)" }}>
              Trang {page} / {totalPages} · {filtered.length} bài viết
            </p>
          )}

          {/* Newsletter */}
          <div className="lp-card mt-16" style={{ padding: "clamp(28px, 4vw, 44px)" }}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-8">
              {/* Copy */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="lp-mono text-[0.7rem] font-bold px-2.5 py-1 rounded-full" style={{ background: "var(--lp-accent-soft)", color: "var(--lp-accent-ink)", border: "1px solid rgba(47,107,255,0.2)" }}>
                    Newsletter · Miễn phí
                  </span>
                </div>
                <p className="font-extrabold text-balance" style={{ fontSize: "clamp(1.1rem, 2vw, 1.4rem)", letterSpacing: "-0.02em", lineHeight: 1.25 }}>
                  1 bài/tuần về quản lý team Việt —<br className="hidden sm:block" /> từ founder đang vận hành startup hàng ngày.
                </p>
                <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-4">
                  {[
                    "Thực chiến, không lý thuyết suông",
                    "Áp dụng ngay cho team 5–25 người",
                    "Không spam · Hủy bất cứ lúc nào",
                  ].map((item) => (
                    <span key={item} className="flex items-center gap-1.5 text-[0.82rem]" style={{ color: "var(--lp-text-3)" }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--lp-ok)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12l5 5L20 6" />
                      </svg>
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Form */}
              <div className="flex flex-col gap-2.5 w-full sm:w-[300px] flex-shrink-0">
                <form className="flex flex-col gap-2.5">
                  <input type="email" placeholder="email@company.vn" className="lp-input" style={{ width: "100%" }} />
                  <button type="submit" className="lp-btn lp-btn-primary lp-btn-block" style={{ height: 42 }}>
                    Đăng ký nhận newsletter →
                  </button>
                </form>
                <p className="lp-mono text-[0.7rem] text-center" style={{ color: "var(--lp-text-3)" }}>
                  Cùng 1.200+ tech lead & founder đang đọc mỗi tuần
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky bottom CTA */}
      {!stickyDismissed && (
        <div
          style={{
            position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
            zIndex: 50, width: "calc(100% - 48px)", maxWidth: 640,
            background: "linear-gradient(135deg, #0F1829 0%, #141E35 100%)",
            border: "1px solid #1E2D5A",
            borderRadius: 14,
            padding: "14px 18px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", gap: 12,
          }}
        >
          <div style={{ fontSize: 20, flexShrink: 0 }}>📊</div>
          <p style={{ flex: 1, fontSize: 13, color: "#CBD5E1", lineHeight: 1.4 }}>
            <span style={{ color: "#fff", fontWeight: 600 }}>Đang dùng Excel để quản lý team?</span>
            {" "}Thử jobihome miễn phí — task, chấm công & lương trong 1 workspace.
          </p>
          <Link
            href="/sign-up"
            className="lp-cta-primary-indigo flex-shrink-0"
            style={{ height: 36, padding: "0 16px", borderRadius: 8, background: "#6366F1", color: "#fff", fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", textDecoration: "none", whiteSpace: "nowrap" }}
          >
            Thử miễn phí →
          </Link>
          <button
            onClick={() => setStickyDismissed(true)}
            aria-label="Đóng"
            style={{ flexShrink: 0, background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 4 }}
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
