import { useState, useEffect, useRef } from "react"
import { Link } from "react-router"
import { ArrowLeft, ArrowRight, Clock, Calendar, Share2, Bookmark, Twitter, Linkedin, Link2, Check } from "lucide-react"
import { BLUE, GREEN } from "../shared"

// ── Article data ──────────────────────────────────────────────────────────────
const POST = {
  category: "Productivity",
  categoryLabel: "Năng suất",
  categoryBg: "#ECFDF5",
  categoryText: "#065F46",
  title: "5 dấu hiệu team bạn đang lãng phí hơn 10 giờ/tuần vào họp không cần thiết",
  subtitle: "Các nghiên cứu cho thấy 71% các cuộc họp ở startup là không cần thiết. Đây là cách nhận ra và cắt giảm chúng mà không làm mất alignment của team.",
  readTime: "8 phút đọc",
  date: "2 tháng 6, 2025",
  updatedDate: "3 tháng 6, 2025",
  hero: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWFtJTIwcHJvZHVjdGl2aXR5JTIwb2ZmaWNlJTIwd29ya3xlbnwxfHx8fDE3ODA2Mjk0Nzh8MA&ixlib=rb-4.1.0&q=80&w=1080",
  author: {
    initials: "MT",
    name: "Minh Tuấn",
    role: "Co-founder & CTO",
    company: "jobihome.vn",
    bg: BLUE,
    bio: "10 năm kinh nghiệm xây dựng và vận hành product team. Từng là engineering lead tại VNG và Tiki trước khi thành lập jobihome.",
  },
  tags: ["Họp nhóm", "Productivity", "Startup", "Quản lý team"],
}

const TOC = [
  { id: "dau-hieu-1", label: "Dấu hiệu 1: Họp daily kéo dài hơn 20 phút" },
  { id: "dau-hieu-2", label: "Dấu hiệu 2: Không có agenda trước" },
  { id: "dau-hieu-3", label: "Dấu hiệu 3: Quyết định bị postpone sau họp" },
  { id: "dau-hieu-4", label: "Dấu hiệu 4: Hơn 6 người trong mỗi cuộc họp" },
  { id: "dau-hieu-5", label: "Dấu hiệu 5: Không có follow-up action items" },
  { id: "giai-phap", label: "Giải pháp: Framework async-first" },
  { id: "cong-cu", label: "Công cụ hỗ trợ" },
]

const RELATED = [
  {
    category: "HR",
    categoryLabel: "Nhân sự",
    categoryBg: "#EEF2FF",
    categoryText: BLUE,
    title: "Onboard nhân viên mới trong 1 ngày: checklist đầy đủ cho startup",
    date: "28 tháng 5, 2025",
    readTime: "5 phút",
    image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxIUiUyMHBlb3BsZSUyMG1hbmFnZW1lbnQlMjBzdGFydHVwfGVufDF8fHx8MTc4MDYyOTQ3OHww&ixlib=rb-4.1.0&q=80&w=400",
  },
  {
    category: "Management",
    categoryLabel: "Quản lý",
    categoryBg: "#F5F3FF",
    categoryText: "#6D28D9",
    title: "OKR vs KPI: startup ở giai đoạn nào nên dùng cái nào?",
    date: "17 tháng 5, 2025",
    readTime: "7 phút",
    image: "https://images.unsplash.com/photo-1681949103006-70066fb25dfe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHx0ZWFtJTIwcHJvZHVjdGl2aXR5JTIwb2ZmaWNlJTIwd29ya3xlbnwxfHx8fDE3ODA2Mjk0Nzh8MA&ixlib=rb-4.1.0&q=80&w=400",
  },
  {
    category: "Productivity",
    categoryLabel: "Năng suất",
    categoryBg: "#ECFDF5",
    categoryText: "#065F46",
    title: "Deep work cho developer: thiết lập môi trường không bị phân tâm",
    date: "11 tháng 5, 2025",
    readTime: "4 phút",
    image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxyZW1vdGUlMjB3b3JrJTIwbGFwdG9wJTIwY29mZmVlJTIwZm9jdXN8ZW58MXx8fHwxNzgwNjI5NDgzfDA&ixlib=rb-4.1.0&q=80&w=400",
  },
]

// ── Share button ──────────────────────────────────────────────────────────────
function ShareButton() {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-semibold transition-all"
      style={copied
        ? { background: "#DCFCE7", color: "#15803D" }
        : { background: "#F3F4F6", color: "#374151" }
      }
    >
      {copied ? <Check size={12} /> : <Link2 size={12} />}
      {copied ? "Đã sao chép" : "Sao chép link"}
    </button>
  )
}

// ── Sticky TOC ────────────────────────────────────────────────────────────────
function TableOfContents({ activeId }: { activeId: string }) {
  return (
    <div className="sticky top-24">
      <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-4">
        Nội dung bài viết
      </p>
      <nav className="flex flex-col gap-0.5">
        {TOC.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="flex items-start gap-2.5 py-1.5 px-3 rounded-lg text-[12.5px] leading-snug transition-all"
            style={
              activeId === item.id
                ? { color: BLUE, background: "#EEF2FF", fontWeight: 600 }
                : { color: "#6B7280" }
            }
          >
            <span
              className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0 transition-all"
              style={{ background: activeId === item.id ? BLUE : "#D1D5DB" }}
            />
            {item.label}
          </a>
        ))}
      </nav>

      {/* Progress */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <p className="text-[11px] font-semibold text-gray-400 mb-2">Chia sẻ bài viết</p>
        <div className="flex gap-2">
          {[
            { icon: Twitter,  label: "Twitter",  color: "#1DA1F2" },
            { icon: Linkedin, label: "LinkedIn",  color: "#0A66C2" },
          ].map(({ icon: Icon, label, color }) => (
            <a
              key={label}
              href="#"
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-opacity hover:opacity-75"
              style={{ background: `${color}15`, color }}
              title={label}
            >
              <Icon size={14} />
            </a>
          ))}
          <ShareButton />
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function BlogPostPage() {
  const [activeId, setActiveId] = useState(TOC[0].id)
  const [saved, setSaved] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = () => {
      const sections = TOC.map((t) => document.getElementById(t.id)).filter(Boolean) as HTMLElement[]
      const scrollY = window.scrollY + 120
      let current = TOC[0].id
      for (const el of sections) {
        if (el.offsetTop <= scrollY) current = el.id
      }
      setActiveId(current)
    }
    window.addEventListener("scroll", handler, { passive: true })
    return () => window.removeEventListener("scroll", handler)
  }, [])

  return (
    <div className="bg-white min-h-screen">

      {/* ── Hero ── */}
      <div className="relative w-full overflow-hidden" style={{ height: 460 }}>
        <img
          src={POST.hero}
          alt={POST.title}
          className="w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)" }}
        />
        <div className="absolute inset-0 flex flex-col justify-end pb-12 px-6">
          <div className="max-w-[760px] mx-auto w-full">
            <span
              className="inline-block text-[11px] font-bold px-3 py-1.5 rounded-full mb-4"
              style={{ background: POST.categoryBg, color: POST.categoryText }}
            >
              {POST.categoryLabel}
            </span>
            <h1 className="text-[28px] lg:text-[36px] font-extrabold text-white leading-[1.2] tracking-tight">
              {POST.title}
            </h1>
          </div>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="max-w-[1060px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-12 lg:gap-16 items-start">

          {/* ── Article body ── */}
          <div>

            {/* Back link + meta bar */}
            <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
              <Link
                to="/blog"
                className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-500 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft size={14} /> Tất cả bài viết
              </Link>
              <div className="flex items-center gap-4 text-[12.5px] text-gray-400">
                <span className="flex items-center gap-1.5"><Clock size={12} />{POST.readTime}</span>
                <span className="flex items-center gap-1.5"><Calendar size={12} />{POST.date}</span>
                <button
                  onClick={() => setSaved((v) => !v)}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-semibold transition-all"
                  style={saved
                    ? { background: "#EEF2FF", color: BLUE }
                    : { background: "#F3F4F6", color: "#374151" }
                  }
                >
                  <Bookmark size={12} fill={saved ? BLUE : "none"} />
                  {saved ? "Đã lưu" : "Lưu lại"}
                </button>
              </div>
            </div>

            {/* Subtitle */}
            <p className="text-[17px] text-gray-500 leading-[1.8] mb-10 font-normal border-l-4 pl-5" style={{ borderColor: BLUE }}>
              {POST.subtitle}
            </p>

            {/* Author card */}
            <div
              className="flex items-center gap-4 p-5 rounded-2xl mb-10"
              style={{ background: "#F8F9FA", border: "1px solid #F0F0F0" }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-[14px] font-bold text-white flex-shrink-0"
                style={{ background: POST.author.bg }}
              >
                {POST.author.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-gray-900">{POST.author.name}</p>
                <p className="text-[12.5px] text-gray-400">{POST.author.role} · {POST.author.company}</p>
                <p className="text-[12px] text-gray-400 mt-1 leading-snug line-clamp-2">{POST.author.bio}</p>
              </div>
            </div>

            {/* Article content */}
            <div ref={contentRef} className="prose-article">

              <Section id="dau-hieu-1" title="Dấu hiệu 1: Họp daily kéo dài hơn 20 phút">
                <p>Daily standup chỉ nên kéo dài 10–15 phút. Nếu buổi họp của team bạn thường xuyên vượt qua mốc 20 phút, đó là dấu hiệu rõ ràng rằng thứ đang xảy ra không phải là standup — mà là một buổi problem-solving session bị ngụy trang.</p>
                <p>Nguyên nhân phổ biến nhất là thiếu <strong>async context</strong> trước họp. Khi mọi người đến họp mà không biết gì về tiến độ của nhau, phần lớn thời gian bị dùng để "catch up" thay vì thực sự đưa ra quyết định.</p>
                <Callout type="tip">
                  <strong>Thử ngay:</strong> Dùng jobihome để mỗi thành viên cập nhật tiến độ task trên Kanban board trước 9:00 sáng. Daily standup khi đó chỉ cần tập trung vào blockers — không cần ai báo cáo "hôm qua tôi làm gì" nữa.
                </Callout>
              </Section>

              <Section id="dau-hieu-2" title="Dấu hiệu 2: Không có agenda trước cuộc họp">
                <p>Một cuộc họp không có agenda là một cuộc họp chờ thất bại. Không phải vì mọi người không có thiện chí — mà vì não người cần <em>context switching time</em> để chuyển từ deep work sang collaborative thinking.</p>
                <p>Nghiên cứu của Harvard Business Review cho thấy các cuộc họp có agenda được gửi trước ít nhất 24 giờ hiệu quả hơn <strong>40%</strong> so với họp ngẫu nhiên, và ra được quyết định cụ thể nhiều hơn 3 lần.</p>
                <img
                  src="https://images.unsplash.com/photo-1532622785990-d2c36a76f5a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800"
                  alt="Team planning on whiteboard"
                  className="rounded-xl my-6 w-full object-cover"
                  style={{ height: 280 }}
                />
                <p>Rule đơn giản: <strong>không có agenda = không có meeting</strong>. Nếu không ai có thể viết ra được 3 câu hỏi cần trả lời sau buổi họp, thì buổi họp đó có thể thay bằng một thread async.</p>
              </Section>

              <Section id="dau-hieu-3" title="Dấu hiệu 3: Quyết định bị postpone sau họp">
                <p>Bạn họp xong và rời phòng với cảm giác... chưa quyết định được gì, cần họp thêm một buổi nữa? Đây là triệu chứng của <em>meeting theater</em> — một hiện tượng phổ biến ở các org đang scale nhanh.</p>
                <p>Nguyên nhân thường là người có quyền quyết định không có mặt trong buổi họp, hoặc dữ liệu cần thiết không được chuẩn bị sẵn trước.</p>
                <Callout type="warning">
                  Nếu sau 3 cuộc họp liên tiếp về cùng một vấn đề mà vẫn chưa có quyết định, đó là signal cho thấy ownership chưa được define rõ ràng — không phải vì team thiếu thông tin.
                </Callout>
              </Section>

              <Section id="dau-hieu-4" title="Dấu hiệu 4: Hơn 6 người trong mỗi cuộc họp">
                <p>Bezos có "two-pizza rule" nổi tiếng: nếu bạn cần hơn 2 cái pizza để nuôi team trong một cuộc họp, team đó quá lớn. Với một startup Việt Nam điển hình 10–20 người, điều này có nghĩa là không nên có quá 5–6 người trong bất kỳ cuộc họp nào.</p>
                <p>Mỗi người thêm vào một cuộc họp làm tăng <strong>n(n-1)/2</strong> kết nối cần được quản lý — đây là tại sao meeting với 8 người thường mất thời gian gần gấp đôi meeting với 4 người để đạt được cùng một quyết định.</p>
                <StatBlock items={[
                  { value: "73%", label: "team thừa nhận họp với quá nhiều người" },
                  { value: "2.4×", label: "thời gian ra quyết định khi >6 người" },
                  { value: "47%", label: "người không cần thiết trong mỗi cuộc họp" },
                ]} />
              </Section>

              <Section id="dau-hieu-5" title="Dấu hiệu 5: Không có follow-up action items">
                <p>Một buổi họp không có action items là buổi họp không thể đo được hiệu quả. Và thứ không đo được thường không được cải thiện.</p>
                <p>Format đơn giản nhất là <strong>Who + What + When</strong>: ai sẽ làm gì, và deadline là khi nào. Không cần document dài — chỉ cần 3–5 dòng gửi lên channel chung trong vòng 30 phút sau họp.</p>
                <p>jobihome có thể tự động tạo task từ meeting notes và assign cho đúng người — bước này thường bị bỏ qua nhất trong quy trình họp của các startup.</p>
              </Section>

              <Section id="giai-phap" title="Giải pháp: Framework async-first">
                <p>Async-first không có nghĩa là không bao giờ họp. Có nghĩa là <strong>default là async</strong>, và họp chỉ được tổ chức khi async thực sự không đủ.</p>
                <p>Framework gợi ý:</p>
                <ul>
                  <li><strong>Daily updates</strong> → Kanban board update (async, trước 9:00 AM)</li>
                  <li><strong>Blockers</strong> → Thread trên tool chat, escalate nếu cần &gt;30 phút giải quyết</li>
                  <li><strong>Decisions</strong> → RFC document (Request for Comments) với deadline phản hồi</li>
                  <li><strong>Alignment</strong> → Weekly sync 30 phút, có agenda cố định</li>
                  <li><strong>Brainstorming</strong> → Họp có giới hạn — tối đa 60 phút, không quá 5 người</li>
                </ul>
              </Section>

              <Section id="cong-cu" title="Công cụ hỗ trợ">
                <p>Một framework tốt cần được hỗ trợ bởi công cụ phù hợp. jobihome được thiết kế để giảm overhead của các cuộc họp thông qua visibility tự động:</p>
                <ul>
                  <li>Kanban board realtime — mọi người biết tiến độ của nhau mà không cần hỏi</li>
                  <li>Activity heatmap — manager thấy được pattern làm việc của cả team</li>
                  <li>Audit log — mọi thay đổi đều có history, không cần "recap" trong họp</li>
                  <li>Time tracking tự động — biết ai đang dành thời gian cho gì</li>
                </ul>
                <Callout type="cta">
                  Bạn muốn thấy cụ thể jobihome giúp team bạn giảm họp như thế nào?{" "}
                  <a href="/dat-lich-demo" style={{ color: BLUE }} className="font-semibold underline">
                    Đặt lịch demo 15 phút →
                  </a>
                </Callout>
              </Section>

            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-gray-100">
              {POST.tags.map((tag) => (
                <span
                  key={tag}
                  className="h-7 px-3 rounded-full text-[12px] font-semibold"
                  style={{ background: "#F3F4F6", color: "#374151" }}
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Author bio card */}
            <div
              className="mt-10 p-6 rounded-2xl flex gap-5"
              style={{ background: "#F8F9FF", border: `1px solid ${BLUE}20` }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-[16px] font-bold text-white flex-shrink-0"
                style={{ background: POST.author.bg }}
              >
                {POST.author.initials}
              </div>
              <div>
                <p className="text-[14px] font-bold text-gray-900 mb-0.5">
                  Viết bởi {POST.author.name}
                </p>
                <p className="text-[12.5px] text-gray-400 mb-2">{POST.author.role} · {POST.author.company}</p>
                <p className="text-[13px] text-gray-600 leading-relaxed">{POST.author.bio}</p>
              </div>
            </div>

            {/* Share row */}
            <div className="mt-8 flex items-center justify-between flex-wrap gap-3">
              <p className="text-[13px] font-semibold text-gray-500">Chia sẻ bài viết này:</p>
              <div className="flex gap-2">
                {[
                  { icon: Twitter,  label: "Twitter",  color: "#1DA1F2" },
                  { icon: Linkedin, label: "LinkedIn",  color: "#0A66C2" },
                ].map(({ icon: Icon, label, color }) => (
                  <a
                    key={label}
                    href="#"
                    className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-semibold transition-opacity hover:opacity-80"
                    style={{ background: `${color}15`, color }}
                  >
                    <Icon size={13} /> {label}
                  </a>
                ))}
                <ShareButton />
              </div>
            </div>

            {/* Prev/Next nav */}
            <div className="mt-10 grid grid-cols-2 gap-4">
              <Link
                to="/blog"
                className="flex items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-blue-200 hover:bg-blue-50 transition-all group"
              >
                <ArrowLeft size={14} className="text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10.5px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Bài trước</p>
                  <p className="text-[13px] font-semibold text-gray-700 group-hover:text-blue-700 truncate">Xem tất cả bài viết</p>
                </div>
              </Link>
              <Link
                to="/blog"
                className="flex items-center justify-end gap-2 p-4 rounded-xl border border-gray-200 hover:border-blue-200 hover:bg-blue-50 transition-all group text-right"
              >
                <div className="min-w-0">
                  <p className="text-[10.5px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Bài tiếp</p>
                  <p className="text-[13px] font-semibold text-gray-700 group-hover:text-blue-700 truncate">OKR vs KPI: startup nên dùng cái nào?</p>
                </div>
                <ArrowRight size={14} className="text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
              </Link>
            </div>

          </div>

          {/* ── Sidebar TOC ── */}
          <aside className="hidden lg:block">
            <TableOfContents activeId={activeId} />
          </aside>
        </div>

        {/* ── Related posts ── */}
        <div className="mt-20 pt-12 border-t border-gray-100">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-[20px] font-bold text-gray-900 whitespace-nowrap">Bài viết liên quan</h2>
            <div className="flex-1 h-px bg-gray-100" />
            <Link to="/blog" className="text-[13px] font-semibold whitespace-nowrap hover:opacity-70 transition-opacity" style={{ color: BLUE }}>
              Xem tất cả
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {RELATED.map((p) => (
              <a
                key={p.title}
                href="#"
                className="group flex flex-col rounded-2xl overflow-hidden transition-all duration-300"
                style={{ border: "1px solid #E5E7EB", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 16px 48px rgba(59,91,219,0.10), 0 4px 16px rgba(0,0,0,0.05)`
                  e.currentTarget.style.transform = "translateY(-3px)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)"
                  e.currentTarget.style.transform = "translateY(0)"
                }}
              >
                <div className="overflow-hidden" style={{ height: 160 }}>
                  <img src={p.image} alt={p.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="p-5">
                  <span
                    className="inline-block text-[10.5px] font-bold px-2.5 py-1 rounded-full mb-3"
                    style={{ background: p.categoryBg, color: p.categoryText }}
                  >
                    {p.categoryLabel}
                  </span>
                  <h3 className="text-[13.5px] font-bold text-gray-900 leading-snug mb-3 group-hover:text-blue-700 transition-colors line-clamp-3">
                    {p.title}
                  </h3>
                  <div className="flex items-center gap-3 text-[11.5px] text-gray-400">
                    <span className="flex items-center gap-1"><Calendar size={11} />{p.date}</span>
                    <span className="flex items-center gap-1"><Clock size={11} />{p.readTime}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* ── Newsletter ── */}
        <div
          className="mt-16 rounded-2xl px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-6"
          style={{ background: "#F8F9FF", border: `1px solid ${BLUE}20` }}
        >
          <div>
            <p className="text-[18px] font-bold text-gray-900 mb-1">Nhận bài viết mới mỗi tuần</p>
            <p className="text-[13.5px] text-gray-400">Không spam · Hủy bất cứ lúc nào · Miễn phí hoàn toàn</p>
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

// ── Article sub-components ─────────────────────────────────────────────────────
function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-10 scroll-mt-28">
      <h2
        className="text-[22px] font-extrabold text-gray-900 mb-4 leading-snug tracking-tight"
        style={{ borderLeft: `4px solid ${BLUE}`, paddingLeft: 16 }}
      >
        {title}
      </h2>
      <div className="article-body">{children}</div>
    </section>
  )
}

function Callout({ type, children }: { type: "tip" | "warning" | "cta"; children: React.ReactNode }) {
  const styles = {
    tip:     { bg: "#ECFDF5", border: "#6EE7B7", icon: "💡", text: "#065F46" },
    warning: { bg: "#FFFBEB", border: "#FCD34D", icon: "⚠️", text: "#92400E" },
    cta:     { bg: "#EEF2FF", border: `${BLUE}50`, icon: "🚀", text: "#1E40AF" },
  }
  const s = styles[type]
  return (
    <div
      className="flex gap-3 px-5 py-4 rounded-xl my-6 text-[13.5px] leading-relaxed"
      style={{ background: s.bg, borderLeft: `3px solid ${s.border}`, color: s.text }}
    >
      <span className="flex-shrink-0 text-base">{s.icon}</span>
      <div>{children}</div>
    </div>
  )
}

function StatBlock({ items }: { items: { value: string; label: string }[] }) {
  return (
    <div className="grid grid-cols-3 gap-4 my-6">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl p-4 text-center"
          style={{ background: "#F8F9FF", border: `1px solid ${BLUE}18` }}
        >
          <p className="text-[24px] font-extrabold leading-none mb-1" style={{ color: BLUE }}>{item.value}</p>
          <p className="text-[11.5px] text-gray-500 leading-snug">{item.label}</p>
        </div>
      ))}
    </div>
  )
}

// Inline article styles
const articleStyles = `
  .article-body p { font-size: 15px; line-height: 1.85; color: #374151; margin-bottom: 1rem; }
  .article-body strong { color: #111827; font-weight: 700; }
  .article-body em { font-style: italic; }
  .article-body ul { list-style: none; padding: 0; margin: 1rem 0 1.25rem; display: flex; flex-direction: column; gap: 0.5rem; }
  .article-body ul li { display: flex; align-items: flex-start; gap: 0.625rem; font-size: 14px; line-height: 1.7; color: #374151; }
  .article-body ul li::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: ${BLUE}; margin-top: 0.55rem; flex-shrink: 0; }
  .article-body a { color: ${BLUE}; text-decoration: underline; }
`

// Inject styles once
if (typeof document !== "undefined" && !document.getElementById("article-styles")) {
  const el = document.createElement("style")
  el.id = "article-styles"
  el.textContent = articleStyles
  document.head.appendChild(el)
}
