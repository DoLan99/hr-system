"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Star } from "lucide-react";

const BLUE = "#3B5BDB";
const GREEN = "#0CA678";

const HIGHLIGHTS = [
  { icon: "⏱", title: "15 phút", desc: "Demo nhanh, đúng trọng tâm" },
  { icon: "🎯", title: "Cá nhân hóa", desc: "Theo usecase của team bạn" },
  { icon: "💬", title: "Q&A trực tiếp", desc: "Hỏi bất kỳ điều gì" },
  { icon: "🚀", title: "Setup ngay", desc: "Workspace ready sau call" },
];

const TESTIMONIALS = [
  { quote: "Demo 15 phút đủ để tôi quyết định. Setup trong 2 tiếng, team dùng ngay hôm sau.", name: "Minh Tuấn", role: "CTO · Finsify", initials: "MT", bg: BLUE },
  { quote: "Presenter rất hiểu pain point của startup Việt. Không phải nghe script bán hàng.", name: "Lan Anh", role: "HR Manager · GrowthHack", initials: "LA", bg: GREEN },
];

export default function DemoPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", company: "", size: "", note: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="bg-white min-h-screen">
      <section className="pt-16 pb-24 px-6">
        <div className="max-w-[1060px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-12 items-start">

            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold mb-6 border"
                style={{ background: "#EEF2FF", borderColor: "#C7D2FE", color: BLUE }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: GREEN }} />
                Demo miễn phí · Slot tuần này còn
              </div>
              <h1 className="text-[36px] lg:text-[44px] font-extrabold text-gray-900 tracking-tight leading-[1.12] mb-4">
                Đặt lịch demo<br /><span style={{ color: BLUE }}>15 phút</span> với team
              </h1>
              <p className="text-[16px] text-gray-500 leading-relaxed mb-10">
                Chúng tôi sẽ show đúng những tính năng phù hợp với team của bạn — không pitch generic, không waste time.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-10">
                {HIGHLIGHTS.map((h) => (
                  <div key={h.title} className="rounded-xl p-4" style={{ background: "#F8F9FF", border: `1px solid ${BLUE}15` }}>
                    <div className="text-2xl mb-2">{h.icon}</div>
                    <p className="text-[14px] font-bold text-gray-900">{h.title}</p>
                    <p className="text-[12.5px] text-gray-400 mt-0.5">{h.desc}</p>
                  </div>
                ))}
              </div>

              {/* Testimonials */}
              <div className="flex flex-col gap-4">
                {TESTIMONIALS.map((t) => (
                  <div key={t.name} className="rounded-xl px-5 py-4 flex items-start gap-4"
                    style={{ background: "#FAFAFA", border: "1px solid #F0F0F0" }}>
                    <div className="flex gap-0.5 flex-shrink-0 mt-0.5">
                      {[1,2,3,4,5].map((i) => <Star key={i} size={11} className="fill-yellow-400 text-yellow-400" />)}
                    </div>
                    <div>
                      <p className="text-[13px] text-gray-600 italic mb-2">"{t.quote}"</p>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                          style={{ background: t.bg }}>{t.initials}</div>
                        <span className="text-[12px] font-semibold text-gray-700">{t.name}</span>
                        <span className="text-[11px] text-gray-400">· {t.role}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Form */}
            <div className="rounded-2xl p-8 lg:p-10" style={{ border: "1.5px solid #E5E7EB", boxShadow: "0 8px 32px rgba(0,0,0,0.06)" }}>
              {submitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                    style={{ background: `${GREEN}18` }}>
                    <Check size={28} style={{ color: GREEN }} strokeWidth={2.5} />
                  </div>
                  <h2 className="text-[22px] font-extrabold text-gray-900 mb-2">Đã nhận yêu cầu!</h2>
                  <p className="text-[14px] text-gray-500 mb-6">
                    Team sẽ liên hệ trong vòng 2 giờ làm việc để xác nhận lịch demo.
                  </p>
                  <Link href="/"
                    className="inline-flex items-center gap-2 h-11 px-6 rounded-xl text-[13.5px] font-semibold text-white"
                    style={{ background: BLUE }}>
                    Về trang chủ <ArrowRight size={14} />
                  </Link>
                </div>
              ) : (
                <>
                  <h2 className="text-[20px] font-extrabold text-gray-900 mb-1">Đặt lịch demo</h2>
                  <p className="text-[13.5px] text-gray-400 mb-7">Điền thông tin — team sẽ liên hệ trong 2h làm việc</p>
                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {[
                      { key: "name", label: "Họ và tên *", placeholder: "Nguyễn Minh Tuấn", type: "text" },
                      { key: "email", label: "Email công ty *", placeholder: "minhtuan@company.vn", type: "email" },
                      { key: "company", label: "Tên công ty *", placeholder: "Finsify, Teko, Base.vn...", type: "text" },
                    ].map(({ key, label, placeholder, type }) => (
                      <div key={key}>
                        <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">{label}</label>
                        <input
                          type={type}
                          required
                          placeholder={placeholder}
                          value={form[key as keyof typeof form]}
                          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                          className="w-full h-11 px-4 rounded-xl text-[13.5px] outline-none border border-gray-200 bg-white focus:border-blue-500 transition-colors"
                        />
                      </div>
                    ))}
                    <div>
                      <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Quy mô team</label>
                      <select value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl text-[13.5px] outline-none border border-gray-200 bg-white focus:border-blue-500 transition-colors">
                        <option value="">Chọn quy mô...</option>
                        <option>1–5 người</option>
                        <option>6–15 người</option>
                        <option>16–30 người</option>
                        <option>30+ người</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Bạn muốn xem tính năng nào?</label>
                      <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}
                        placeholder="VD: Tôi muốn xem payroll tự động và time tracking..."
                        className="w-full h-20 px-4 py-3 rounded-xl text-[13.5px] outline-none border border-gray-200 bg-white focus:border-blue-500 transition-colors resize-none" />
                    </div>
                    <button type="submit"
                      className="w-full h-12 rounded-xl text-[14px] font-bold text-white transition-opacity hover:opacity-90 flex items-center justify-center gap-2 mt-1"
                      style={{ background: BLUE, boxShadow: `0 4px 16px ${BLUE}40` }}>
                      Đặt lịch demo miễn phí <ArrowRight size={15} />
                    </button>
                    <p className="text-center text-[12px] text-gray-400">
                      Hoặc tự dùng thử:{" "}
                      <Link href="/sign-up" className="font-semibold underline" style={{ color: BLUE }}>
                        Tạo tài khoản miễn phí
                      </Link>
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
