import { useState, useEffect, useRef } from "react"
import { Link } from "react-router"
import { Check, ArrowRight, Star, TrendingUp, CheckSquare } from "lucide-react"
import { BLUE, GREEN } from "../shared"

// ─── Kanban Mockup ────────────────────────────────────────────────────────────
function KanbanMockup() {
  const columns = [
    {
      label: "Cần làm", color: "text-gray-500", dot: "bg-gray-300",
      cards: [
        { title: "Thiết kế màn hình onboarding", tag: "Design", tagClr: "bg-purple-100 text-purple-700", badge: "Cao", bdgClr: "bg-red-100 text-red-600", av: "MT", avBg: BLUE },
        { title: "Review tài liệu API v2.0", tag: "Dev", tagClr: "bg-blue-100 text-blue-700", badge: "TB", bdgClr: "bg-yellow-100 text-yellow-600", av: "DH", avBg: "#7C3AED" },
        { title: "Cập nhật chính sách bảo mật", tag: "Content", tagClr: "bg-green-100 text-green-700", badge: "Thấp", bdgClr: "bg-gray-100 text-gray-500", av: "LA", avBg: GREEN },
      ],
    },
    {
      label: "Đang làm", color: "text-blue-600", dot: "bg-blue-500",
      cards: [
        { title: "Tích hợp cổng thanh toán VNPAY", tag: "Dev", tagClr: "bg-blue-100 text-blue-700", badge: "Cao", bdgClr: "bg-red-100 text-red-600", av: "MT", avBg: BLUE, progress: 65 },
        { title: "Viết bài blog SEO cho Q2/2025", tag: "Marketing", tagClr: "bg-pink-100 text-pink-700", badge: "TB", bdgClr: "bg-yellow-100 text-yellow-600", av: "NK", avBg: "#EA580C", progress: 38 },
      ],
    },
    {
      label: "Hoàn thành", color: "text-emerald-600", dot: "bg-emerald-500",
      cards: [
        { title: "Setup CI/CD môi trường staging", tag: "DevOps", tagClr: "bg-orange-100 text-orange-700", badge: "Cao", bdgClr: "bg-red-100 text-red-600", av: "DH", avBg: "#7C3AED", done: true },
        { title: "Phân tích yêu cầu Sprint 4", tag: "PM", tagClr: "bg-teal-100 text-teal-700", badge: "TB", bdgClr: "bg-yellow-100 text-yellow-600", av: "LA", avBg: GREEN, done: true },
      ],
    },
  ]

  return (
    <div className="rounded-xl overflow-hidden shadow-2xl border border-gray-200 bg-white select-none">
      <div className="bg-gray-100 px-3.5 py-2.5 flex items-center gap-3 border-b border-gray-200">
        <div className="flex gap-1.5 flex-shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 bg-white rounded px-3 py-[3px] text-[10px] text-gray-400 border border-gray-200 text-center max-w-[180px] mx-auto truncate">
          app.jobihome.vn/sprint-4
        </div>
      </div>
      <div className="flex" style={{ height: 330 }}>
        <div className="w-12 bg-gray-50 border-r border-gray-100 flex flex-col items-center py-3 gap-2.5 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-1" style={{ background: BLUE }}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <rect x="0.5" y="0.5" width="4" height="4" rx="0.8" fill="white" />
              <rect x="6.5" y="0.5" width="4" height="4" rx="0.8" fill="white" fillOpacity="0.6" />
              <rect x="0.5" y="6.5" width="4" height="4" rx="0.8" fill="white" fillOpacity="0.6" />
              <rect x="6.5" y="6.5" width="4" height="4" rx="0.8" fill="white" fillOpacity="0.3" />
            </svg>
          </div>
          {[{ icon: "⊞", active: false }, { icon: "☑", active: true }, { icon: "👥", active: false }, { icon: "⏱", active: false }, { icon: "💰", active: false }].map((item, i) => (
            <div key={i} className="w-8 h-8 rounded-lg flex items-center justify-center text-[13px] cursor-pointer"
              style={item.active ? { background: BLUE } : { color: "#9CA3AF" }}>
              {item.icon}
            </div>
          ))}
          <div className="mt-auto w-6 h-6 rounded-full flex items-center justify-center text-white text-[8px] font-bold" style={{ background: BLUE }}>MT</div>
        </div>
        <div className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden">
          <div className="flex items-center justify-between px-3.5 py-2 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-gray-800">Sprint 4</span>
              <span className="text-gray-300 text-[10px]">·</span>
              <span className="text-[10px] text-gray-400">Tháng 5/2025</span>
              <div className="flex ml-1.5">
                {["Board", "Danh sách", "Lịch"].map((t, i) => (
                  <button key={t} className="text-[9px] px-2 py-0.5 rounded font-medium"
                    style={i === 0 ? { background: BLUE, color: "#fff" } : { color: "#9CA3AF" }}>{t}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-1">
                {[BLUE, GREEN, "#7C3AED", "#EA580C"].map((bg, i) => (
                  <div key={i} className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-white text-[7px] font-bold" style={{ background: bg }}>
                    {["MT", "LA", "DH", "NK"][i]}
                  </div>
                ))}
              </div>
              <span className="text-[9px] text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">+ Lọc</span>
            </div>
          </div>
          <div className="flex gap-2 p-2.5 bg-gray-50/60 flex-1 overflow-hidden">
            {columns.map((col) => (
              <div key={col.label} className="flex-1 flex flex-col min-w-0">
                <div className="flex items-center gap-1 mb-1.5 px-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
                  <span className={`text-[9px] font-bold ${col.color}`}>{col.label}</span>
                  <span className="text-[8px] text-gray-400 bg-gray-200 rounded-full px-1 leading-[14px] ml-0.5">{col.cards.length}</span>
                </div>
                <div className="flex flex-col gap-1.5 overflow-hidden">
                  {col.cards.map((card) => (
                    <div key={card.title} className="bg-white rounded-lg p-2 border border-gray-100 shadow-sm"
                      style={{ opacity: card.done ? 0.55 : 1 }}>
                      <p className="text-[9px] font-medium text-gray-800 leading-tight mb-1.5"
                        style={{ textDecoration: card.done ? "line-through" : "none", color: card.done ? "#9CA3AF" : undefined }}>
                        {card.title}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1 flex-wrap">
                          <span className={`text-[8px] font-medium px-1.5 py-px rounded-full ${card.tagClr}`}>{card.tag}</span>
                          <span className={`text-[8px] font-medium px-1.5 py-px rounded-full ${card.bdgClr}`}>{card.badge}</span>
                        </div>
                        <div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[7px] font-bold flex-shrink-0" style={{ background: card.avBg }}>
                          {card.av}
                        </div>
                      </div>
                      {"progress" in card && card.progress && (
                        <div className="mt-1.5">
                          <div className="w-full bg-gray-100 rounded-full h-[3px]">
                            <div className="h-[3px] rounded-full" style={{ width: `${card.progress}%`, background: BLUE }} />
                          </div>
                          <span className="text-[7px] text-gray-400">{card.progress}%</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  const avatars = [
    { initials: "MT", bg: BLUE }, { initials: "LA", bg: GREEN },
    { initials: "DA", bg: "#7C3AED" }, { initials: "DH", bg: "#EA580C" }, { initials: "NK", bg: "#DB2777" },
  ]
  return (
    <section className="pt-24 pb-16 bg-white overflow-hidden">
      <div className="max-w-[1160px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.08fr] gap-10 xl:gap-16 items-center">
          <div className="flex flex-col items-start">
            <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-7 border text-xs font-medium"
              style={{ background: "#EEF2FF", borderColor: "#C7D2FE", color: BLUE }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: GREEN }} />
              Mới: Tích hợp Zalo OA &amp; VNPAY
            </div>
            <h1
              className="mb-5"
              style={{ fontSize: 46, fontWeight: 800, lineHeight: 1.2, maxWidth: 460 }}
            >
              <span className="block text-gray-900">Quản lý team &amp;</span>
              <span className="block text-gray-900">nhân sự,</span>
              <span className="block" style={{ color: BLUE }}>tất cả trong một.</span>
            </h1>
            <p className="text-[16px] text-gray-500 leading-[1.75] mb-8 max-w-[430px]">
              Tasks · Time tracking · Payroll · Audit.{" "}
              <span className="font-semibold text-gray-800">jobihome</span> giúp tech lead Việt Nam quản lý team 5–20 người mà không cần 5 công cụ khác nhau.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-8 w-full sm:w-auto">
              <a href="#" className="cta-btn inline-flex items-center justify-center gap-2 h-12 px-6 text-white text-[14px] font-semibold rounded-xl w-full sm:w-auto"
                style={{ background: BLUE, boxShadow: `0 6px 20px ${BLUE}40` }}>
                Dùng thử miễn phí 14 ngày <ArrowRight size={15} />
              </a>
              <a href="#" className="cta-btn inline-flex items-center justify-center gap-2 h-12 px-5 text-gray-700 text-[14px] font-semibold rounded-xl border border-gray-200 bg-white w-full sm:w-auto">
                <span className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#EEF2FF" }}>
                  <span className="text-[9px]" style={{ color: BLUE }}>▶</span>
                </span>
                Xem bản demo
              </a>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2.5">
                {avatars.map(({ initials, bg }) => (
                  <div key={initials} className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold shadow-sm" style={{ background: bg }}>
                    {initials}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-0.5 mb-0.5">
                  {[1,2,3,4,5].map((i) => <Star key={i} size={11} className="fill-yellow-400 text-yellow-400" />)}
                  <span className="text-[11px] text-gray-400 ml-1">4.8/5</span>
                </div>
                <p className="text-[13px] text-gray-500">
                  Đang được dùng bởi <strong className="text-gray-900 font-semibold">120+ startup Việt</strong>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-5">
              {["Không cần thẻ tín dụng", "Setup trong 2 phút", "Hỗ trợ tiếng Việt"].map((b) => (
                <div key={b} className="flex items-center gap-1.5 text-[12px] text-gray-400">
                  <Check size={12} style={{ color: GREEN }} /> {b}
                </div>
              ))}
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute -inset-8 rounded-3xl -z-10"
              style={{ background: "radial-gradient(ellipse at 55% 45%, #EEF2FF 0%, #F0FDF4 55%, transparent 80%)" }} />
            <KanbanMockup />
            <div className="absolute -bottom-4 -left-5 bg-white rounded-2xl shadow-xl border border-gray-100 px-3.5 py-3 flex items-center gap-3 z-10">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${GREEN}18` }}>
                <TrendingUp size={17} style={{ color: GREEN }} />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 leading-tight">Hiệu suất sprint</p>
                <p className="text-[12px] font-bold text-gray-900 leading-tight">+34% so với Sprint 3</p>
              </div>
            </div>
            <div className="absolute -top-3 -right-4 bg-white rounded-2xl shadow-xl border border-gray-100 px-3 py-2.5 flex items-center gap-2.5 z-10">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#EEF2FF" }}>
                <CheckSquare size={13} style={{ color: BLUE }} />
              </div>
              <div>
                <p className="text-[9px] text-gray-400">Task hoàn thành</p>
                <p className="text-[11px] font-semibold text-gray-900">8 / 12 task Sprint 4</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────
function StatsBar() {
  const stats = [
    { value: "120+", label: "Công ty đang dùng" },
    { value: "4.8★", label: "Đánh giá" },
    { value: "2 phút", label: "Setup" },
    { value: "98%", label: "Gia hạn" },
  ]
  return (
    <section className="w-full bg-[#F8F9FA]" style={{ borderTop: "1px solid #EAECF0", borderBottom: "1px solid #EAECF0" }}>
      <div className="max-w-[1100px] mx-auto px-6 py-14 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {stats.map((s, i) => (
            <div key={s.label} className="stats-item flex flex-col items-center text-center px-4 md:px-6 py-8 md:py-0">
              <span className="font-extrabold leading-none mb-2.5" style={{ fontSize: 42, color: BLUE, letterSpacing: "-0.02em" }}>
                {s.value}
              </span>
              <span className="text-[13px] text-gray-400 font-medium">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Pain Points ──────────────────────────────────────────────────────────────
function PainPoints() {
  const items = [
    "Bacon + Google Sheet đã lỗi thời", "Nhiều việc, không đủ thời gian",
    "Dashboard visual + filter mượt", "Auto timer + heartbeat tự động",
    "Tình trạng cuộc họp mỗi 2 ngày", "Auto tính timesheets, 1 click",
  ]
  return (
    <section className="py-20 bg-white">
      <div className="max-w-[800px] mx-auto px-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Bạn đang gặp khó khăn?</h2>
        <p className="text-sm text-gray-400 mb-10">3 vấn đề chính của mọi tech lead Việt</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 text-left">
          {items.map((item) => (
            <div key={item} className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: BLUE }}>
                <Check size={9} color="white" strokeWidth={3} />
              </div>
              <span className="text-sm text-gray-700">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Features ─────────────────────────────────────────────────────────────────
function Features() {
  const cards = [
    { icon: "☑", title: "Task Management", desc: "Backlog → In Progress → Done. Tuỳ chỉnh workflow, phân công task, đặt deadline. Đồng bộ realtime, không mất dữ liệu." },
    { icon: "⏱", title: "Time Tracking", desc: "Auto-start timer khi bắt đầu task. Tổng hợp timesheet cuối tuần. Phát hiện bất thường, báo cáo chi tiết từng giờ." },
    { icon: "💰", title: "Payroll & Salary", desc: "Tự động tính lương từ timesheet. Hỗ trợ thuế TNCN, BHXH. Xuất payslip PDF, chuyển khoản 1 click qua VNPAY." },
    { icon: "👥", title: "Multi-team & Roles", desc: "Department, Team, Manager. Team Leader, Accountant. Phân quyền linh hoạt theo từng cấp bậc." },
    { icon: "📋", title: "Audit Log + Anomaly", desc: "Mọi hành động đều có log. Tự động phát hiện bất thường, cảnh báo realtime khi có thao tác lạ." },
    { icon: "📊", title: "Activity Heatmap", desc: "Xem heatmap hoạt động theo giờ + ngày. Tag people, actual hours. Dễ nhận biết bottleneck." },
  ]
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-[1000px] mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Mọi thứ mà team bạn cần</h2>
          <p className="text-sm text-gray-400">Không cần Trello + Toggl + Excel + Jira |{" "}
            <span className="font-medium" style={{ color: BLUE }}>jobihome.vn</span>
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {cards.map((c) => (
            <div key={c.title} className="feature-card bg-white rounded-xl p-6 border border-gray-100">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg mb-4" style={{ background: "#EEF2FF" }}>
                {c.icon}
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-2">{c.title}</h3>
              <p className="text-xs text-gray-500 leading-[1.7]">{c.desc}</p>
            </div>
          ))}
        </div>

        {/* ── Inline CTA ── */}
        <div
          className="features-cta mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
          style={{ background: "#EEF2FF", borderRadius: 12 }}
        >
          <div>
            <h3 className="text-[20px] font-bold text-gray-900 leading-snug mb-1">
              Sẵn sàng thử chưa?
            </h3>
            <p className="text-[14px] text-gray-500">
              Miễn phí 14 ngày, không cần thẻ tín dụng.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto flex-shrink-0">
            <Link
              to="/dat-lich-demo"
              className="cta-btn inline-flex items-center justify-center gap-1.5 h-10 px-5 rounded-lg text-[13.5px] font-semibold text-white w-full sm:w-auto"
              style={{ background: BLUE, boxShadow: `0 4px 14px ${BLUE}35` }}
            >
              Dùng thử miễn phí <ArrowRight size={14} />
            </Link>
            <Link
              to="/dat-lich-demo"
              className="cta-btn inline-flex items-center justify-center h-10 px-5 rounded-lg text-[13.5px] font-semibold border w-full sm:w-auto"
              style={{ borderColor: `${BLUE}50`, color: BLUE, background: "transparent" }}
            >
              Xem demo 15 phút
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
function Testimonials() {
  const cards = [
    { quote: "jobihome giúp chúng tôi giảm 3 buổi họp báo cáo mỗi tuần. Manager giờ chỉ cần nhìn dashboard là nắm được tiến độ.", name: "Minh Tuấn", title: "CTO", company: "Finsify", initials: "MT", bg: BLUE },
    { quote: "Tính năng payroll tự động giúp HR của mình tiết kiệm gần 2 ngày làm việc mỗi tháng. Không còn sai sót khi tính lương nữa.", name: "Lan Anh", title: "HR Manager", company: "GrowthHack Agency", initials: "LA", bg: GREEN },
    { quote: "Setup trong 15 phút, team dùng ngay không cần training. Đơn giản hơn Jira rất nhiều mà vẫn đủ tính năng cho startup.", name: "Đức Anh", title: "Founder", company: "Techlab Studio", initials: "DA", bg: "#7C3AED" },
  ]
  return (
    <section className="py-20 bg-white">
      <div className="max-w-[1100px] mx-auto px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold mb-4 border"
            style={{ background: "#EEF2FF", borderColor: "#C7D2FE", color: BLUE }}>
            Đánh giá khách hàng
          </div>
          <h2 className="text-[28px] font-bold text-gray-900 tracking-tight">
            Khách hàng nói gì về <span style={{ color: BLUE }}>jobihome.vn</span>
          </h2>
        </div>
        <div className="testimonial-scroll flex md:grid md:grid-cols-3 gap-4 md:gap-6 overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none -mx-6 md:mx-0 px-6 md:px-0 pb-3 md:pb-0">
          {cards.map((c) => (
            <div key={c.name} className="testimonial-card flex-none md:flex-auto min-w-[82vw] md:min-w-0 snap-start flex flex-col bg-white rounded-2xl p-7 border border-gray-200"
              style={{ boxShadow: "0 2px 16px 0 rgba(0,0,0,0.06)" }}>
              <div className="flex gap-0.5 mb-5">
                {[1,2,3,4,5].map((i) => <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />)}
              </div>
              <p className="text-[14px] text-gray-700 leading-[1.8] flex-1 mb-7">"{c.quote}"</p>
              <div className="flex items-center gap-3 pt-5 border-t border-gray-100">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[12px] font-bold flex-shrink-0" style={{ background: c.bg }}>
                  {c.initials}
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-gray-900 leading-tight">{c.name}</p>
                  <p className="text-[11px] text-gray-400 leading-tight mt-0.5">{c.title} · {c.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
function FAQ() {
  const [open, setOpen] = useState<number | null>(null)
  const faqs = [
    { q: "Có xuất hóa đơn đỏ (VAT) không?", a: "Có. jobihome xuất hóa đơn điện tử đầy đủ theo quy định của Bộ Tài chính Việt Nam. Bạn cung cấp thông tin công ty, chúng tôi xử lý trong 2–3 ngày làm việc." },
    { q: "Thanh toán bằng gì?", a: "Chúng tôi hỗ trợ VNPAY, MoMo, thẻ Visa/Mastercard và chuyển khoản ngân hàng nội địa. Tất cả giao dịch được mã hóa SSL." },
    { q: "Data có bị mất không?", a: "Dữ liệu được mã hóa AES-256, lưu trữ trên AWS Singapore, backup tự động hàng ngày. Bạn có thể xuất toàn bộ dữ liệu bất cứ lúc nào." },
    { q: "Mời nhân viên qua email được không?", a: "Được. Chỉ cần nhập email nhân viên, hệ thống tự gửi lời mời và hướng dẫn setup. Toàn bộ quá trình mất dưới 2 phút." },
    { q: "Hỗ trợ ở đâu?", a: "Gói miễn phí có email support. Gói trả phí có live chat ưu tiên và onboarding 1-1 qua Zalo hoặc Google Meet." },
    { q: "Có app mobile không?", a: "Có. App iOS và Android hỗ trợ check-in chấm công, xem task, nhận thông báo. Miễn phí cho tất cả gói." },
  ]
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-[680px] mx-auto px-6">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Câu hỏi thường gặp</h2>
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
          {faqs.map((faq, i) => (
            <div key={i}>
              <button onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors">
                <span className="text-sm font-medium text-gray-800 pr-4">{faq.q}</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${open === i ? "rotate-180" : ""}`}>
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {open === i && <div className="px-6 pb-4 text-sm text-gray-500 leading-[1.75]">{faq.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Pricing Preview ─────────────────────────────────────────────────────────
function PricingPreview() {
  const plans = [
    {
      name: "Solo",
      price: "0đ",
      period: "Mãi mãi",
      members: "1 thành viên",
      highlight: false,
      cta: "Dùng miễn phí",
      features: [
        "1 thành viên (chủ workspace)",
        "Quản lý tasks & time logs cơ bản",
        "Không giới hạn customers",
        "Audit log 30 ngày",
      ],
    },
    {
      name: "Starter",
      price: "299.000đ",
      period: "/tháng",
      members: "10 thành viên",
      highlight: true,
      badge: "Phổ biến",
      cta: "Bắt đầu trial",
      features: [
        "Tối đa 10 thành viên",
        "Tất cả tính năng Solo",
        "Phân quyền nâng cao (HR, Manager, Accountant)",
        "Office Time tracking + duyệt",
      ],
    },
    {
      name: "Team",
      price: "799.000đ",
      period: "/tháng",
      members: "25 thành viên",
      highlight: false,
      cta: "Bắt đầu trial",
      features: [
        "Tối đa 25 thành viên",
        "Tất cả tính năng Starter",
        "Anomaly detection (alerts bất thường)",
        "Activity heatmap + page stats",
      ],
    },
  ]

  return (
    <section className="py-24 bg-white">
      <div className="max-w-[1060px] mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-[32px] font-bold text-gray-900 tracking-tight leading-tight mb-3">
            Giá rõ ràng, không phụ phí
          </h2>
          <p className="text-[15px] text-gray-400">
            Bắt đầu miễn phí 14 ngày. Hủy bất cứ lúc nào. Không cần thẻ tín dụng.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`pricing-card relative flex flex-col rounded-2xl bg-white${plan.highlight ? " order-first md:order-none" : ""}`}
              style={
                plan.highlight
                  ? { border: `2px solid ${BLUE}`, boxShadow: `0 12px 40px ${BLUE}22` }
                  : { border: "1px solid #E5E7EB", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }
              }
            >
              {(plan as any).badge && (
                <div className="absolute -top-3.5 inset-x-0 flex justify-center">
                  <span
                    className="text-[11px] font-bold px-4 py-1 rounded-full text-white"
                    style={{ background: BLUE, boxShadow: `0 2px 8px ${BLUE}55` }}
                  >
                    {(plan as any).badge}
                  </span>
                </div>
              )}

              <div className="p-7 flex flex-col flex-1">
                <p className="text-[15px] font-bold text-gray-900 mb-4">{plan.name}</p>

                <div className="mb-1">
                  <span
                    className="font-extrabold"
                    style={{ fontSize: 36, color: plan.highlight ? BLUE : "#111827", lineHeight: 1 }}
                  >
                    {plan.price}
                  </span>
                </div>
                <p className="text-[12.5px] text-gray-400 mb-1">{plan.period}</p>
                <p className="text-[12.5px] text-gray-500 mb-5">{plan.members}</p>

                <ul className="flex flex-col gap-2.5 mb-7 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check
                        size={14}
                        className="flex-shrink-0 mt-0.5"
                        style={{ color: plan.highlight ? BLUE : GREEN }}
                        strokeWidth={2.5}
                      />
                      <span className="text-[13px] text-gray-600 leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className="cta-btn w-full h-11 rounded-xl text-[13.5px] font-semibold"
                  style={
                    plan.highlight
                      ? { background: BLUE, color: "#fff", boxShadow: `0 4px 16px ${BLUE}40` }
                      : { background: "#F3F4F6", color: "#374151" }
                  }
                >
                  {plan.cta}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Row 1 — trust badges */}
        <div className="flex items-center justify-center flex-wrap gap-x-7 gap-y-2 mt-8 mb-5">
          {[
            {
              icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#868E96" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              ),
              label: "Bảo mật SSL",
            },
            {
              icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#868E96" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              ),
              label: "Thanh toán VNPAY / MoMo",
            },
            {
              icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#868E96" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>
                </svg>
              ),
              label: "Dữ liệu mã hoá 256-bit",
            },
          ].map((badge, i) => (
            <span key={badge.label} className="flex items-center gap-1.5" style={{ color: "#868E96", fontSize: 12 }}>
              {i > 0 && <span className="hidden sm:inline text-gray-200 mr-5 -ml-1">·</span>}
              {badge.icon}
              {badge.label}
            </span>
          ))}
        </div>

        {/* Row 2 — demo ghost button */}
        <div className="text-center mt-1 mb-6">
          <Link
            to="/dat-lich-demo"
            className="cta-btn inline-flex items-center gap-2 h-10 px-6 text-[13.5px] font-semibold"
            style={{ border: `1px solid ${BLUE}`, color: BLUE, borderRadius: 8 }}
          >
            Chưa chắc? Đặt lịch demo 15 phút với team <ArrowRight size={14} />
          </Link>
        </div>

        <div className="text-center">
          <Link
            to="/bang-gia"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors hover:opacity-70"
            style={{ color: "#9CA3AF" }}
          >
            Xem chi tiết bảng giá <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── Final CTA ────────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-[900px] mx-auto px-6">
        <div
          className="final-cta-box relative overflow-hidden"
          style={{ background: BLUE, borderRadius: 16 }}
        >
          {/* Decorative circles */}
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white opacity-[0.05] pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white opacity-[0.05] pointer-events-none" />

          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

            {/* Left */}
            <div>
              <h2 className="text-[28px] font-extrabold text-white leading-tight tracking-tight mb-3">
                Sẵn sàng quản lý team tốt hơn?
              </h2>
              <p className="mb-8 leading-relaxed" style={{ fontSize: 15, color: "#93C5FD" }}>
                Tạo workspace trong 2 phút. Free trial 14 ngày, không cần thẻ tín dụng.
              </p>
              <Link
                to="/dat-lich-demo"
                className="cta-btn inline-flex items-center justify-center gap-2 h-11 px-7 font-bold w-full sm:w-auto"
                style={{
                  fontSize: 14,
                  color: "#fff",
                  border: "1.5px solid rgba(255,255,255,0.6)",
                  borderRadius: 8,
                }}
              >
                Bắt đầu miễn phí <ArrowRight size={15} />
              </Link>
            </div>

            {/* Right — checklist */}
            <ul className="flex flex-col" style={{ gap: 0 }}>
              {[
                "Không cần thẻ tín dụng",
                "Hủy bất cứ lúc nào",
                "Onboarding miễn phí",
                "Hỗ trợ tiếng Việt 24/7",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3"
                  style={{ fontSize: 15, lineHeight: 2, color: "#fff" }}
                >
                  <span
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,0.20)" }}
                  >
                    <Check size={11} color="#fff" strokeWidth={3} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Sticky Subnav ────────────────────────────────────────────────────────────
function StickySubnav() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      // Show after scrolling ~1 hero height (approx 520px)
      setVisible(window.scrollY > 520)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div
      className="fixed left-0 right-0 z-40 transition-all duration-300"
      style={{
        top: 64, // sits just below the main nav
        background: "#fff",
        borderBottom: "1px solid #E9ECEF",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        height: 56,
        transform: visible ? "translateY(0)" : "translateY(-100%)",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <div className="max-w-[1160px] mx-auto px-6 h-full flex items-center justify-between gap-6">

        {/* Logo (small) */}
        <Link to="/" className="flex items-center gap-1.5 flex-shrink-0">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
            style={{ background: BLUE }}
          >
            <svg width="11" height="11" viewBox="0 0 13 13" fill="none">
              <rect x="1" y="1" width="4.5" height="4.5" rx="1" fill="white" />
              <rect x="7.5" y="1" width="4.5" height="4.5" rx="1" fill="white" fillOpacity="0.65" />
              <rect x="1" y="7.5" width="4.5" height="4.5" rx="1" fill="white" fillOpacity="0.65" />
              <rect x="7.5" y="7.5" width="4.5" height="4.5" rx="1" fill="white" fillOpacity="0.3" />
            </svg>
          </div>
          <span className="font-bold text-gray-900 text-[13px] tracking-tight">
            jobi<span style={{ color: BLUE }}>home</span>
          </span>
        </Link>

        {/* Benefits */}
        <div className="hidden sm:flex items-center flex-1 justify-center">
          <span className="text-[12px] text-gray-500 whitespace-nowrap tracking-tight">
            ✓ Miễn phí 14 ngày
            <span className="mx-2.5 text-gray-300">·</span>
            ✓ Không cần thẻ
            <span className="mx-2.5 text-gray-300">·</span>
            ✓ Setup 2 phút
          </span>
        </div>

        {/* CTA */}
        <Link
          to="/dat-lich-demo"
          className="flex-shrink-0 inline-flex items-center gap-1.5 h-[36px] px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: BLUE, borderRadius: 8 }}
        >
          Dùng thử →
        </Link>

      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <>
      <style>{`
        .feature-card    { transition: border-color 200ms ease, transform 200ms ease, box-shadow 200ms ease; }
        .feature-card:hover { border-color: #3B5BDB !important; transform: translateY(-3px); box-shadow: 0 6px 20px rgba(0,0,0,0.07); }
        .testimonial-card { transition: border-color 180ms ease-out, box-shadow 180ms ease-out; }
        .testimonial-card:hover { border-color: #3B5BDB !important; box-shadow: 0 8px 24px rgba(59,91,219,0.10) !important; }
        .pricing-card    { transition: transform 180ms ease-out, box-shadow 180ms ease-out; }
        .pricing-card:hover { transform: scale(1.01); box-shadow: 0 12px 32px rgba(0,0,0,0.08) !important; }
        .cta-btn         { transition: filter 180ms ease-out, transform 180ms ease-out !important; }
        .cta-btn:hover   { filter: brightness(1.08); transform: scale(1.02); }
        /* Testimonial scroll — hide scrollbar */
        .testimonial-scroll { -webkit-overflow-scrolling: touch; scrollbar-width: none; }
        .testimonial-scroll::-webkit-scrollbar { display: none; }
        /* Stats 2×2 borders on mobile, 4-col on md+ */
        @media (max-width: 767px) {
          .stats-item:nth-child(odd)  { border-right: 1px solid #E5E7EB; }
          .stats-item:nth-child(-n+2) { border-bottom: 1px solid #E5E7EB; }
        }
        @media (min-width: 768px) {
          .stats-item:not(:last-child) { border-right: 1px solid #E5E7EB; }
        }
        /* Responsive padding helpers */
        .features-cta { padding: 40px; }
        @media (max-width: 639px) { .features-cta { padding: 24px; } }
        .final-cta-box { padding: 60px; }
        @media (max-width: 639px) { .final-cta-box { padding: 28px 24px; } }
      `}</style>
      <StickySubnav />
      <Hero />
      <StatsBar />
      <PainPoints />
      <Features />
      <Testimonials />
      <PricingPreview />
      <FAQ />
      <FinalCTA />
    </>
  )
}
