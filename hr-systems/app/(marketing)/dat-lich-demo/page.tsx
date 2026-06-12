"use client";

import { useState } from "react";
import Link from "next/link";

const HIGHLIGHTS = [
  { icon: "⏱", title: "15 phút", desc: "Demo nhanh, đúng trọng tâm" },
  { icon: "🎯", title: "Cá nhân hóa", desc: "Theo usecase của team bạn" },
  { icon: "💬", title: "Q&A trực tiếp", desc: "Hỏi bất kỳ điều gì" },
  { icon: "🚀", title: "Setup ngay", desc: "Workspace ready sau call" },
];

const TESTIMONIALS = [
  { quote: "Demo 15 phút đủ để tôi quyết định. Setup trong 2 tiếng, team dùng ngay hôm sau.", name: "Minh Tuấn", role: "CTO · Finsify", initials: "MT" },
  { quote: "Presenter rất hiểu pain point của startup Việt. Không phải nghe script bán hàng.", name: "Lan Anh", role: "HR Manager · GrowthHack", initials: "LA" },
];

export default function DemoPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", company: "", size: "", note: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section className="lp-glow relative overflow-hidden" style={{ padding: "clamp(40px, 5vw, 64px) 0 clamp(48px, 6vw, 80px)" }}>
      <span className="lp-blob lp-blob-1" />
      <span className="lp-blob lp-blob-2" />
      <div className="w-full max-w-[1180px] mx-auto px-7">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-14 items-start">
          {/* Left */}
          <div>
            <span className="lp-eyebrow">Demo · 15 phút</span>
            <h1 className="text-balance mt-5 font-extrabold" style={{ fontSize: "clamp(2.2rem, 5vw, 3.4rem)", lineHeight: 1.05, letterSpacing: "-0.035em" }}>
              Đặt lịch demo <span className="lp-grad-text">15 phút</span> với team
            </h1>
            <p className="mt-5 text-lp-text-2" style={{ fontSize: "clamp(1.05rem, 1.6vw, 1.2rem)", lineHeight: 1.6 }}>
              Chúng tôi sẽ show đúng những tính năng phù hợp với team của bạn — không pitch generic, không waste time.
            </p>

            <div className="grid grid-cols-2 gap-4 mt-9">
              {HIGHLIGHTS.map((h) => (
                <div key={h.title} className="lp-card" style={{ padding: 18 }}>
                  <div className="text-2xl mb-2">{h.icon}</div>
                  <p className="font-bold text-[0.96rem]">{h.title}</p>
                  <p className="text-[0.85rem] text-lp-text-3 mt-0.5">{h.desc}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-4 mt-10">
              {TESTIMONIALS.map((t) => (
                <div key={t.name} className="lp-card" style={{ padding: 18 }}>
                  <p className="text-[0.95rem] text-lp-text-2 italic mb-3">"{t.quote}"</p>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full grid place-items-center text-[9px] font-bold text-white" style={{ background: "linear-gradient(135deg, var(--lp-accent-2), var(--lp-accent))" }}>
                      {t.initials}
                    </div>
                    <span className="text-[0.82rem] font-semibold">{t.name}</span>
                    <span className="text-[0.78rem] text-lp-text-3">· {t.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Form */}
          <div className="lp-card" style={{ padding: "clamp(24px, 4vw, 40px)" }}>
            {submitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full grid place-items-center mx-auto mb-5" style={{ background: "rgba(74, 222, 128, 0.18)" }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--lp-ok)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l5 5L20 6" />
                  </svg>
                </div>
                <h2 className="text-[1.4rem] font-extrabold mb-2">Đã nhận yêu cầu!</h2>
                <p className="text-lp-text-2 mb-6">Team sẽ liên hệ trong vòng 2 giờ làm việc để xác nhận lịch demo.</p>
                <Link href="/" className="lp-btn lp-btn-primary">Về trang chủ</Link>
              </div>
            ) : (
              <>
                <h2 className="text-[1.25rem] font-extrabold">Đặt lịch demo</h2>
                <p className="text-[0.92rem] text-lp-text-3 mt-1 mb-6">Điền thông tin — team sẽ liên hệ trong 2h làm việc.</p>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  {[
                    { key: "name", label: "Họ và tên *", placeholder: "Nguyễn Minh Tuấn", type: "text" },
                    { key: "email", label: "Email công ty *", placeholder: "minhtuan@company.vn", type: "email" },
                    { key: "company", label: "Tên công ty *", placeholder: "Finsify, Teko, Base.vn...", type: "text" },
                  ].map(({ key, label, placeholder, type }) => (
                    <div key={key}>
                      <label className="block text-[13px] font-semibold text-lp-text mb-1.5">{label}</label>
                      <input
                        type={type}
                        required
                        placeholder={placeholder}
                        value={form[key as keyof typeof form]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        className="lp-input"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-[13px] font-semibold text-lp-text mb-1.5">Quy mô team</label>
                    <select value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} className="lp-select">
                      <option value="">Chọn quy mô...</option>
                      <option>1–5 người</option>
                      <option>6–15 người</option>
                      <option>16–30 người</option>
                      <option>30+ người</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-lp-text mb-1.5">Bạn muốn xem tính năng nào?</label>
                    <textarea
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                      placeholder="VD: Tôi muốn xem payroll tự động và time tracking..."
                      className="lp-textarea"
                      style={{ minHeight: 90 }}
                    />
                  </div>
                  <button type="submit" className="lp-btn lp-btn-primary lp-btn-block lp-btn-lg mt-2">
                    Đặt lịch demo miễn phí
                  </button>
                  <p className="text-center text-[0.82rem] text-lp-text-3 mt-1">
                    Hoặc tự dùng thử:{" "}
                    <Link href="/sign-up" className="font-semibold text-lp-accent-ink underline">
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
  );
}
