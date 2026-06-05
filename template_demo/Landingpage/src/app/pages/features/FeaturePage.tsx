import { useParams, Link, Navigate } from "react-router"
import { ArrowRight, Check, ChevronRight } from "lucide-react"
import { BLUE } from "../../shared"
import { FEATURES_DATA } from "./featureData"

export default function FeaturePage() {
  const { slug } = useParams<{ slug: string }>()
  const data = slug ? FEATURES_DATA[slug] : null

  if (!data) return <Navigate to="/" replace />

  const { color, colorLight } = data

  return (
    <div className="bg-white min-h-screen">

      {/* ── Hero ── */}
      <section
        className="relative pt-16 pb-20 px-6 overflow-hidden"
        style={{ background: `linear-gradient(160deg, ${colorLight} 0%, #fff 55%)` }}
      >
        {/* Decorative blob */}
        <div
          className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none opacity-[0.07]"
          style={{ background: color, filter: "blur(100px)", transform: "translate(30%, -30%)" }}
        />

        <div className="max-w-[1060px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left: copy */}
            <div>
              {/* Breadcrumb */}
              <div className="flex items-center gap-1.5 text-[12px] text-gray-400 mb-5">
                <Link to="/" className="hover:text-gray-600 transition-colors">Trang chủ</Link>
                <ChevronRight size={12} className="text-gray-300" />
                <Link to="/tinh-nang" className="hover:text-gray-600 transition-colors">Tính năng</Link>
                <ChevronRight size={12} className="text-gray-300" />
                <span style={{ color }}>{data.label}</span>
              </div>

              {/* Tag */}
              <div
                className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold mb-5 border"
                style={{ background: colorLight, borderColor: `${color}30`, color }}
              >
                <span className="text-base">{data.icon}</span>
                {data.tagline}
              </div>

              <h1 className="text-[32px] lg:text-[42px] font-extrabold text-gray-900 tracking-tight leading-[1.15] mb-5">
                {data.headline}
              </h1>

              <p className="text-[16px] text-gray-500 leading-relaxed mb-8 max-w-[480px]">
                {data.subheadline}
              </p>

              {/* Stats row */}
              <div className="flex items-center gap-5 flex-wrap mb-8">
                {data.stats.map((s) => (
                  <div key={s.label} className="flex flex-col">
                    <span className="text-[24px] font-extrabold leading-none" style={{ color }}>{s.value}</span>
                    <span className="text-[12px] text-gray-400 mt-0.5">{s.label}</span>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex items-center gap-3 flex-wrap">
                <Link
                  to="/dat-lich-demo"
                  className="inline-flex items-center gap-2 h-12 px-7 rounded-xl text-[14px] font-bold text-white transition-opacity hover:opacity-90"
                  style={{ background: color, boxShadow: `0 4px 20px ${color}40` }}
                >
                  Dùng thử miễn phí <ArrowRight size={15} />
                </Link>
                <Link
                  to="/dat-lich-demo"
                  className="inline-flex items-center gap-2 h-12 px-6 rounded-xl text-[14px] font-semibold border transition-colors hover:bg-gray-50"
                  style={{ borderColor: "#D1D5DB", color: "#374151" }}
                >
                  Đặt lịch demo
                </Link>
              </div>
            </div>

            {/* Right: mockup */}
            <div className="relative">
              {/* Glow behind mockup */}
              <div
                className="absolute inset-x-8 top-8 bottom-0 rounded-3xl opacity-20 pointer-events-none"
                style={{ background: color, filter: "blur(40px)" }}
              />
              <div className="relative">
                {data.mockup}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 px-6" style={{ background: "#F9FAFB" }}>
        <div className="max-w-[1060px] mx-auto">
          <div className="text-center mb-12">
            <p
              className="text-[11px] font-black uppercase tracking-widest mb-3"
              style={{ color }}
            >
              Cách hoạt động
            </p>
            <h2 className="text-[28px] lg:text-[34px] font-extrabold text-gray-900 tracking-tight">
              Từ setup đến kết quả trong một ngày
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.steps.map((step, i) => (
              <div
                key={step.n}
                className="relative bg-white rounded-2xl p-6"
                style={{ border: "1px solid #E5E7EB", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
              >
                {/* Connector arrow (not last) */}
                {i < data.steps.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                    <div className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                      <ChevronRight size={12} className="text-gray-400" />
                    </div>
                  </div>
                )}

                {/* Step number */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-[13px] font-black text-white mb-4"
                  style={{ background: color, boxShadow: `0 3px 10px ${color}35` }}
                >
                  {step.n}
                </div>

                <h3 className="text-[14.5px] font-bold text-gray-900 mb-2 leading-snug">{step.title}</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed mb-3">{step.desc}</p>

                {step.detail && (
                  <p
                    className="text-[11.5px] leading-relaxed border-t pt-2.5 mt-2.5"
                    style={{ color: `${color}CC`, borderColor: `${color}20` }}
                  >
                    {step.detail}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Capabilities grid ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-[1060px] mx-auto">
          <div className="text-center mb-12">
            <p className="text-[11px] font-black uppercase tracking-widest mb-3" style={{ color }}>
              Tính năng chi tiết
            </p>
            <h2 className="text-[28px] lg:text-[34px] font-extrabold text-gray-900 tracking-tight">
              Mọi thứ bạn cần, không thừa không thiếu
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.capabilities.map((cap) => (
              <div
                key={cap.title}
                className="group flex gap-4 p-5 rounded-2xl bg-white transition-all duration-200 hover:shadow-md"
                style={{ border: "1px solid #E5E7EB" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${color}40`
                  e.currentTarget.style.background = colorLight
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#E5E7EB"
                  e.currentTarget.style.background = "#fff"
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 mt-0.5 transition-transform duration-200 group-hover:scale-110"
                  style={{ background: colorLight }}
                >
                  {cap.icon}
                </div>
                <div>
                  <p className="text-[14px] font-bold text-gray-900 mb-1 leading-snug">{cap.title}</p>
                  <p className="text-[13px] text-gray-400 leading-snug">{cap.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonial ── */}
      <section className="py-16 px-6" style={{ background: colorLight }}>
        <div className="max-w-[720px] mx-auto">
          <div
            className="rounded-2xl p-8 lg:p-10 bg-white relative overflow-hidden"
            style={{ boxShadow: `0 12px 40px ${color}14`, border: `1px solid ${color}20` }}
          >
            {/* Big quote mark */}
            <div
              className="absolute top-6 right-8 text-[80px] leading-none font-serif opacity-[0.07] select-none pointer-events-none"
              style={{ color }}
            >
              "
            </div>

            <div
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold mb-6 border"
              style={{ background: colorLight, borderColor: `${color}30`, color }}
            >
              {data.icon} Khách hàng nói gì
            </div>

            <p className="text-[17px] lg:text-[19px] text-gray-700 leading-[1.8] mb-7 italic relative">
              "{data.testimonial.quote}"
            </p>

            <div className="flex items-center gap-3.5">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-[14px] font-bold text-white flex-shrink-0"
                style={{ background: data.testimonial.bg }}
              >
                {data.testimonial.initials}
              </div>
              <div>
                <p className="text-[14px] font-bold text-gray-900">{data.testimonial.name}</p>
                <p className="text-[12.5px] text-gray-400">{data.testimonial.role}</p>
              </div>
              <Link
                to="/khach-hang"
                className="ml-auto text-[12px] font-semibold flex items-center gap-1 hover:opacity-75 transition-opacity"
                style={{ color }}
              >
                Xem thêm <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Related features ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-[1060px] mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-[20px] font-bold text-gray-900 whitespace-nowrap">Tính năng liên quan</h2>
            <div className="flex-1 h-px bg-gray-100" />
            <Link
              to="/tinh-nang"
              className="text-[13px] font-semibold whitespace-nowrap flex items-center gap-1 hover:opacity-75 transition-opacity"
              style={{ color: BLUE }}
            >
              Tất cả tính năng <ArrowRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {data.related.map((rel) => (
              <Link
                key={rel.slug}
                to={`/tinh-nang/${rel.slug}`}
                className="group flex gap-4 p-5 rounded-2xl transition-all duration-200 hover:shadow-md"
                style={{ border: "1px solid #E5E7EB" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${BLUE}35`
                  e.currentTarget.style.background = "#F8F9FF"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#E5E7EB"
                  e.currentTarget.style.background = "#fff"
                }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 bg-gray-50">
                  {rel.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-gray-900 group-hover:text-blue-700 transition-colors mb-0.5">{rel.label}</p>
                  <p className="text-[12.5px] text-gray-400 leading-snug">{rel.desc}</p>
                </div>
                <ArrowRight size={14} className="text-gray-300 group-hover:text-blue-400 flex-shrink-0 self-center transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-12 px-6 pb-24">
        <div className="max-w-[1060px] mx-auto">
          <div
            className="rounded-2xl px-8 lg:px-14 py-12 relative overflow-hidden"
            style={{ background: color }}
          >
            {/* Decorative shapes */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white opacity-[0.05] pointer-events-none" style={{ transform: "translate(30%, -30%)" }} />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white opacity-[0.05] pointer-events-none" style={{ transform: "translate(-30%, 30%)" }} />

            <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8 text-center lg:text-left">
              <div>
                <p className="text-white/60 text-[12px] font-bold uppercase tracking-widest mb-2">
                  Dùng thử {data.label}
                </p>
                <h2 className="text-[26px] lg:text-[32px] font-extrabold text-white leading-tight mb-2">
                  Bắt đầu miễn phí ngay hôm nay
                </h2>
                <p className="text-white/70 text-[14px]">
                  Setup 2 phút · Không cần thẻ tín dụng · Hủy bất cứ lúc nào
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 flex-shrink-0">
                <Link
                  to="/dat-lich-demo"
                  className="inline-flex items-center gap-2 h-12 px-7 rounded-xl text-[14.5px] font-bold transition-all hover:scale-105"
                  style={{ background: "#fff", color }}
                >
                  Bắt đầu miễn phí <ArrowRight size={15} />
                </Link>
                <Link
                  to="/dat-lich-demo"
                  className="inline-flex items-center gap-2 h-12 px-6 rounded-xl text-[14px] font-semibold text-white transition-all hover:bg-white/10"
                  style={{ border: "1.5px solid rgba(255,255,255,0.35)" }}
                >
                  Đặt lịch demo
                </Link>
              </div>
            </div>

            {/* Feature checklist */}
            <div className="relative mt-8 pt-6 border-t border-white/20 flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-2">
              {["14 ngày trial đầy đủ tính năng", "Hỗ trợ onboarding 1-1", "Dữ liệu an toàn & mã hóa", "Không ràng buộc hợp đồng"].map((item) => (
                <span key={item} className="flex items-center gap-1.5 text-[12.5px] text-white/70">
                  <Check size={12} className="text-white/50" strokeWidth={2.5} />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
