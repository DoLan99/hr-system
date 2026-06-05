import { ArrowRight, Clock, Calendar } from "lucide-react"
import { Link, useNavigate } from "react-router"
import { BLUE } from "../shared"

// ── Category config ───────────────────────────────────────────────────────────
const CATS: Record<string, { label: string; bg: string; text: string }> = {
  HR:           { label: "Nhân sự",      bg: "#EEF2FF", text: BLUE       },
  Payroll:      { label: "Tính lương",   bg: "#FFF3EE", text: "#C2410C"  },
  Productivity: { label: "Năng suất",    bg: "#ECFDF5", text: "#065F46"  },
  Management:   { label: "Quản lý",      bg: "#F5F3FF", text: "#6D28D9"  },
  Culture:      { label: "Văn hóa",      bg: "#FFF1F2", text: "#BE123C"  },
}

// ── Featured post ─────────────────────────────────────────────────────────────
const FEATURED = {
  category: "Productivity",
  title: "5 dấu hiệu team bạn đang lãng phí hơn 10 giờ/tuần vào họp không cần thiết",
  excerpt:
    "Các nghiên cứu cho thấy 71% các cuộc họp ở startup là không cần thiết. Đây là cách nhận ra và cắt giảm chúng mà không làm mất alignment của team.",
  readTime: "8 phút đọc",
  date: "2 tháng 6, 2025",
  author: { initials: "MT", name: "Minh Tuấn", role: "Co-founder, jobihome", bg: BLUE },
  image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWFtJTIwcHJvZHVjdGl2aXR5JTIwb2ZmaWNlJTIwd29ya3xlbnwxfHx8fDE3ODA2Mjk0Nzh8MA&ixlib=rb-4.1.0&q=80&w=1080",
}

// ── Grid posts ────────────────────────────────────────────────────────────────
const POSTS = [
  {
    category: "HR",
    title: "Onboard nhân viên mới trong 1 ngày: checklist đầy đủ cho startup",
    date: "28 tháng 5, 2025",
    image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxIUiUyMHBlb3BsZSUyMG1hbmFnZW1lbnQlMjBzdGFydHVwfGVufDF8fHx8MTc4MDYyOTQ3OHww&ixlib=rb-4.1.0&q=80&w=400",
    readTime: "5 phút",
  },
  {
    category: "Payroll",
    title: "Tính lương theo thời gian thực: tại sao Excel không còn đủ nữa",
    date: "22 tháng 5, 2025",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxwYXlyb2xsJTIwZmluYW5jZSUyMGFjY291bnRpbmclMjBkZXNrfGVufDF8fHx8MTc4MDYyOTQ4Mnww&ixlib=rb-4.1.0&q=80&w=400",
    readTime: "6 phút",
  },
  {
    category: "Management",
    title: "OKR vs KPI: startup ở giai đoạn nào nên dùng cái nào?",
    date: "17 tháng 5, 2025",
    image: "https://images.unsplash.com/photo-1681949103006-70066fb25dfe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHx0ZWFtJTIwcHJvZHVjdGl2aXR5JTIwb2ZmaWNlJTIwd29ya3xlbnwxfHx8fDE3ODA2Mjk0Nzh8MA&ixlib=rb-4.1.0&q=80&w=400",
    readTime: "7 phút",
  },
  {
    category: "Productivity",
    title: "Deep work cho developer: thiết lập môi trường không bị phân tâm",
    date: "11 tháng 5, 2025",
    image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxyZW1vdGUlMjB3b3JrJTIwbGFwdG9wJTIwY29mZmVlJTIwZm9jdXN8ZW58MXx8fHwxNzgwNjI5NDgzfDA&ixlib=rb-4.1.0&q=80&w=400",
    readTime: "4 phút",
  },
  {
    category: "HR",
    title: "Phân quyền trong startup: khi nào cần HR chính thức?",
    date: "5 tháng 5, 2025",
    image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxIUiUyMHBlb3BsZSUyMG1hbmFnZW1lbnQlMjBzdGFydHVwfGVufDF8fHx8MTc4MDYyOTQ3OHww&ixlib=rb-4.1.0&q=80&w=400",
    readTime: "5 phút",
  },
  {
    category: "Culture",
    title: "Xây dựng văn hóa feedback liên tục mà không làm mất lòng ai",
    date: "28 tháng 4, 2025",
    image: "https://images.unsplash.com/photo-1572021335469-31706a17aaef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHx0ZWFtJTIwcHJvZHVjdGl2aXR5JTIwb2ZmaWNlJTIwd29ya3xlbnwxfHx8fDE3ODA2Mjk0Nzh8MA&ixlib=rb-4.1.0&q=80&w=400",
    readTime: "6 phút",
  },
]

// ── Components ────────────────────────────────────────────────────────────────
function CategoryTag({ cat }: { cat: string }) {
  const c = CATS[cat] ?? CATS.HR
  return (
    <span
      className="inline-block text-[11px] font-bold px-2.5 py-1 rounded-full tracking-wide"
      style={{ background: c.bg, color: c.text }}
    >
      {c.label}
    </span>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function BlogPage() {
  const activeCats = ["Tất cả", "Nhân sự", "Tính lương", "Năng suất", "Quản lý", "Văn hóa"]

  return (
    <div className="bg-white min-h-screen">

      {/* ── Header ── */}
      <section
        className="pt-16 pb-14 px-6 text-center"
        style={{ background: "linear-gradient(180deg, #F8F9FF 0%, #fff 100%)" }}
      >
        <div
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold mb-5 border"
          style={{ background: "#EEF2FF", borderColor: "#C7D2FE", color: BLUE }}
        >
          Blog · jobihome.vn
        </div>
        <h1 className="text-[36px] lg:text-[46px] font-extrabold text-gray-900 tracking-tight leading-[1.12] mb-4">
          Kiến thức quản lý<br className="hidden sm:block" />{" "}
          team <span style={{ color: BLUE }}>&amp; nhân sự</span>
        </h1>
        <p className="text-[15px] text-gray-400 max-w-[440px] mx-auto leading-relaxed">
          Bài viết thực chiến từ những người đang xây và vận hành
          startup Việt mỗi ngày.
        </p>

        {/* Category filter pills */}
        <div className="mt-8 flex items-center justify-center gap-2 flex-wrap">
          {activeCats.map((cat, i) => (
            <button
              key={cat}
              className="h-8 px-4 rounded-full text-[12.5px] font-semibold transition-all"
              style={
                i === 0
                  ? { background: BLUE, color: "#fff" }
                  : { background: "#F3F4F6", color: "#6B7280" }
              }
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      <div className="max-w-[1060px] mx-auto px-6 pb-28">

        {/* ── Featured post ── */}
        <Link
          to="/blog/5-dau-hieu-hop"
          className="group block mb-16 rounded-2xl overflow-hidden transition-all duration-300"
          style={{
            border: "1px solid #E5E7EB",
            boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = `0 20px 60px rgba(59,91,219,0.10), 0 4px 20px rgba(0,0,0,0.06)`
            e.currentTarget.style.borderColor = `${BLUE}30`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.05)"
            e.currentTarget.style.borderColor = "#E5E7EB"
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Thumbnail */}
            <div className="relative overflow-hidden" style={{ minHeight: 300 }}>
              <img
                src={FEATURED.image}
                alt={FEATURED.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                style={{ minHeight: 300 }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(135deg, rgba(59,91,219,0.15) 0%, transparent 60%)",
                }}
              />
              <div className="absolute top-5 left-5">
                <span
                  className="text-[11px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest"
                  style={{ background: "#fff", color: BLUE }}
                >
                  Bài nổi bật
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 lg:p-10 flex flex-col justify-center">
              <div className="mb-4">
                <CategoryTag cat={FEATURED.category} />
              </div>

              <h2 className="text-[22px] lg:text-[26px] font-extrabold text-gray-900 leading-[1.25] mb-4 tracking-tight group-hover:text-blue-700 transition-colors">
                {FEATURED.title}
              </h2>

              <p className="text-[14px] text-gray-500 leading-relaxed mb-7 line-clamp-3">
                {FEATURED.excerpt}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0"
                    style={{ background: FEATURED.author.bg }}
                  >
                    {FEATURED.author.initials}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-gray-800 leading-tight">
                      {FEATURED.author.name}
                    </p>
                    <p className="text-[11.5px] text-gray-400 leading-tight">
                      {FEATURED.author.role}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-[12px] text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Clock size={12} /> {FEATURED.readTime}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar size={12} /> {FEATURED.date}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <span
                  className="inline-flex items-center gap-1.5 text-[13.5px] font-bold transition-all group-hover:gap-3"
                  style={{ color: BLUE }}
                >
                  Đọc bài viết <ArrowRight size={14} />
                </span>
              </div>
            </div>
          </div>
        </Link>

        {/* ── Section label ── */}
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-[18px] font-bold text-gray-900 whitespace-nowrap">Bài viết mới nhất</h2>
          <div className="flex-1 h-px bg-gray-100" />
          <a href="#" className="text-[13px] font-semibold whitespace-nowrap transition-colors hover:opacity-70" style={{ color: BLUE }}>
            Xem tất cả
          </a>
        </div>

        {/* ── 3-column grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {POSTS.map((post) => (
            <a
              key={post.title}
              href="#"
              className="group flex flex-col rounded-2xl bg-white overflow-hidden transition-all duration-300"
              style={{
                border: "1px solid #E5E7EB",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 16px 48px rgba(59,91,219,0.10), 0 4px 16px rgba(0,0,0,0.05)`
                e.currentTarget.style.borderColor = `${BLUE}28`
                e.currentTarget.style.transform = "translateY(-3px)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)"
                e.currentTarget.style.borderColor = "#E5E7EB"
                e.currentTarget.style.transform = "translateY(0)"
              }}
            >
              {/* Thumbnail */}
              <div className="relative overflow-hidden" style={{ height: 192 }}>
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `linear-gradient(180deg, transparent 40%, ${BLUE}18 100%)` }}
                />
              </div>

              {/* Content */}
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
                  <span
                    className="flex items-center gap-1 text-[12px] font-semibold opacity-0 group-hover:opacity-100 transition-all"
                    style={{ color: BLUE }}
                  >
                    Đọc <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* ── Load more ── */}
        <div className="mt-12 text-center">
          <button
            className="inline-flex items-center gap-2 h-11 px-8 rounded-xl text-[13.5px] font-semibold border transition-colors hover:bg-gray-50"
            style={{ borderColor: "#D1D5DB", color: "#374151" }}
          >
            Xem thêm bài viết
          </button>
        </div>

        {/* ── Newsletter strip ── */}
        <div
          className="mt-20 rounded-2xl px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-6"
          style={{ background: "#F8F9FF", border: `1px solid ${BLUE}20` }}
        >
          <div>
            <p className="text-[18px] font-bold text-gray-900 mb-1">
              Nhận bài viết mới mỗi tuần
            </p>
            <p className="text-[13.5px] text-gray-400">
              Không spam · Hủy bất cứ lúc nào · Miễn phí hoàn toàn
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <input
              type="email"
              placeholder="email@company.vn"
              className="h-11 px-4 rounded-xl text-[13.5px] outline-none flex-1 sm:w-56"
              style={{ border: "1px solid #E5E7EB", background: "#fff" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = BLUE)}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}
            />
            <button
              className="h-11 px-5 rounded-xl text-[13.5px] font-bold text-white flex-shrink-0 transition-opacity hover:opacity-90"
              style={{ background: BLUE }}
            >
              Đăng ký
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
