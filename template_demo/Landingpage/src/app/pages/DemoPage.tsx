import { useState } from "react"
import { Check, ArrowRight, Calendar, Clock, Users, BarChart2, Shield } from "lucide-react"
import { BLUE } from "../shared"

const HIGHLIGHTS = [
  {
    icon: BarChart2,
    title: "Dashboard năng suất thực tế",
    desc: "Xem kanban, heatmap, time tracking hoạt động trên dữ liệu thật.",
  },
  {
    icon: Clock,
    title: "Chấm công & tính lương tự động",
    desc: "Từ check-in app đến phiếu lương PDF — không cần Excel.",
  },
  {
    icon: Users,
    title: "Phân quyền theo cấu trúc team",
    desc: "HR, Manager, Accountant — mỗi người thấy đúng phần của mình.",
  },
  {
    icon: Shield,
    title: "Audit log & bảo mật nâng cao",
    desc: "Phát hiện bất thường, lịch sử thao tác đầy đủ.",
  },
]

const AVATARS = [
  { initials: "MT", bg: BLUE,     name: "Minh Tuấn",  role: "CTO, Loship" },
  { initials: "NK", bg: "#7C3AED", name: "Ngọc Kim",   role: "Founder, Teko" },
  { initials: "DH", bg: "#0CA678", name: "Đức Hiệp",   role: "PM, Base.vn" },
]

const EMPLOYEE_OPTIONS = [
  "1–5 người",
  "6–15 người",
  "16–30 người",
  "31–50 người",
  "50+ người",
]

export default function DemoPage() {
  const [form, setForm] = useState({
    name: "", email: "", company: "", phone: "", size: "",
  })
  const [submitted, setSubmitted] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <section className="min-h-[calc(100vh-64px)] bg-white">
      {/* Thin top accent */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${BLUE}, #818CF8)` }} />

      <div className="max-w-[1060px] mx-auto px-6 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-start">

          {/* ── Left column ── */}
          <div>
            {/* Badge */}
            <div
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold mb-6 border"
              style={{ background: "#EEF2FF", borderColor: "#C7D2FE", color: BLUE }}
            >
              <Calendar size={11} />
              Demo miễn phí · 15 phút
            </div>

            <h1
              className="text-[34px] lg:text-[40px] font-extrabold text-gray-900 tracking-tight leading-[1.15] mb-5"
            >
              Xem jobihome<br />
              <span style={{ color: BLUE }}>hoạt động thực tế</span>
            </h1>

            <p className="text-[15px] text-gray-500 leading-relaxed mb-10 max-w-[420px]">
              Một buổi demo ngắn, không bán hàng — chúng tôi chạy thử
              trên dữ liệu của bạn và trả lời thẳng câu hỏi.
            </p>

            {/* Bullet highlights */}
            <ul className="flex flex-col gap-5 mb-12">
              {HIGHLIGHTS.map(({ icon: Icon, title, desc }) => (
                <li key={title} className="flex items-start gap-4">
                  <div
                    className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5"
                    style={{ background: "#EEF2FF" }}
                  >
                    <Icon size={16} style={{ color: BLUE }} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-gray-800 leading-snug">{title}</p>
                    <p className="text-[13px] text-gray-400 leading-snug mt-0.5">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>

            {/* Social proof */}
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2.5">
                {AVATARS.map((a) => (
                  <div
                    key={a.initials}
                    className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0"
                    style={{ background: a.bg }}
                    title={`${a.name} — ${a.role}`}
                  >
                    {a.initials}
                  </div>
                ))}
                <div
                  className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-[11px] font-bold text-gray-500 bg-gray-100 flex-shrink-0"
                >
                  +117
                </div>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-gray-800">120+ startup đã onboard</p>
                <p className="text-[12px] text-gray-400">Không cần thẻ tín dụng để bắt đầu</p>
              </div>
            </div>
          </div>

          {/* ── Right column — Form ── */}
          <div>
            <div
              className="rounded-2xl p-8 lg:p-10"
              style={{
                border: "1px solid #E5E7EB",
                boxShadow: "0 8px 40px rgba(59,91,219,0.08), 0 2px 12px rgba(0,0,0,0.05)",
              }}
            >
              {submitted ? (
                <div className="text-center py-8">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
                    style={{ background: "#DCFCE7" }}
                  >
                    <Check size={26} style={{ color: "#15803D" }} strokeWidth={2.5} />
                  </div>
                  <h2 className="text-[20px] font-bold text-gray-900 mb-2">Đã nhận lịch!</h2>
                  <p className="text-[14px] text-gray-500 leading-relaxed max-w-[280px] mx-auto">
                    Chúng tôi sẽ liên hệ xác nhận giờ demo qua email trong vòng
                    <strong className="text-gray-700"> 2 giờ làm việc</strong>.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-7">
                    <h2 className="text-[20px] font-bold text-gray-900 mb-1">Đặt lịch demo</h2>
                    <p className="text-[13px] text-gray-400">
                      Miễn phí · 15 phút · Qua Google Meet hoặc Zalo
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Họ và tên *">
                        <input
                          required
                          type="text"
                          placeholder="Nguyễn Văn A"
                          value={form.name}
                          onChange={set("name")}
                          className="w-full h-11 px-4 rounded-xl text-[14px] text-gray-800 placeholder-gray-300 outline-none transition-all"
                          style={{ border: "1px solid #E5E7EB", background: "#FAFAFA" }}
                          onFocus={(e) => (e.currentTarget.style.borderColor = BLUE)}
                          onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}
                        />
                      </Field>

                      <Field label="Email công ty *">
                        <input
                          required
                          type="email"
                          placeholder="ban@company.vn"
                          value={form.email}
                          onChange={set("email")}
                          className="w-full h-11 px-4 rounded-xl text-[14px] text-gray-800 placeholder-gray-300 outline-none transition-all"
                          style={{ border: "1px solid #E5E7EB", background: "#FAFAFA" }}
                          onFocus={(e) => (e.currentTarget.style.borderColor = BLUE)}
                          onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}
                        />
                      </Field>
                    </div>

                    <Field label="Tên công ty *">
                      <input
                        required
                        type="text"
                        placeholder="Công ty TNHH ABC"
                        value={form.company}
                        onChange={set("company")}
                        className="w-full h-11 px-4 rounded-xl text-[14px] text-gray-800 placeholder-gray-300 outline-none transition-all"
                        style={{ border: "1px solid #E5E7EB", background: "#FAFAFA" }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = BLUE)}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}
                      />
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Số điện thoại">
                        <input
                          type="tel"
                          placeholder="0912 345 678"
                          value={form.phone}
                          onChange={set("phone")}
                          className="w-full h-11 px-4 rounded-xl text-[14px] text-gray-800 placeholder-gray-300 outline-none transition-all"
                          style={{ border: "1px solid #E5E7EB", background: "#FAFAFA" }}
                          onFocus={(e) => (e.currentTarget.style.borderColor = BLUE)}
                          onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}
                        />
                      </Field>

                      <Field label="Số nhân viên *">
                        <div className="relative">
                          <select
                            required
                            value={form.size}
                            onChange={set("size")}
                            className="w-full h-11 px-4 rounded-xl text-[14px] text-gray-800 outline-none appearance-none transition-all"
                            style={{
                              border: "1px solid #E5E7EB",
                              background: "#FAFAFA",
                              color: form.size ? "#111827" : "#9CA3AF",
                            }}
                            onFocus={(e) => (e.currentTarget.style.borderColor = BLUE)}
                            onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}
                          >
                            <option value="" disabled>Chọn quy mô</option>
                            {EMPLOYEE_OPTIONS.map((o) => (
                              <option key={o} value={o}>{o}</option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg width="12" height="7" viewBox="0 0 12 7" fill="none">
                              <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        </div>
                      </Field>
                    </div>

                    <button
                      type="submit"
                      className="mt-2 w-full h-12 rounded-xl text-[14.5px] font-bold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 active:opacity-80"
                      style={{ background: BLUE, boxShadow: `0 4px 20px ${BLUE}40` }}
                    >
                      Đặt lịch ngay <ArrowRight size={15} />
                    </button>

                    <p className="text-center text-[12px] text-gray-400 leading-snug">
                      Bằng cách gửi, bạn đồng ý với{" "}
                      <a href="#" className="underline hover:text-gray-600">Chính sách bảo mật</a>{" "}
                      của jobihome.vn
                    </p>
                  </form>
                </>
              )}
            </div>

            {/* Trust badges */}
            <div className="mt-5 flex items-center justify-center gap-5 flex-wrap">
              {[
                "🔒 Bảo mật SSL",
                "📅 Xác nhận trong 2h",
                "🚫 Không spam",
              ].map((item) => (
                <span key={item} className="text-[12px] text-gray-400">{item}</span>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12.5px] font-semibold text-gray-600">{label}</label>
      {children}
    </div>
  )
}
