import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Khách hàng — jobihome.vn",
  description: "Các startup và doanh nghiệp Việt đã thay đổi cách quản lý team như thế nào.",
};

const STORIES = [
  {
    initials: "LS", company: "Loship",
    industry: "Logistics & Giao vận",
    result: "Giảm 3 buổi họp/tuần",
    resultDesc: "Toàn bộ cập nhật tiến độ chuyển lên jobihome — team lead không cần họp daily nữa.",
    quote: "jobihome giúp chúng tôi biết ai đang làm gì mà không cần hỏi. Tiết kiệm cả tiếng mỗi ngày.",
    name: "Minh Tuấn", title: "CTO",
    metrics: [{ value: "3×", label: "ít cuộc họp hơn" }, { value: "40%", label: "tăng năng suất" }],
  },
  {
    initials: "TK", company: "Teko Vietnam",
    industry: "Fintech & Công nghệ",
    result: "Tính lương tự động 100%",
    resultDesc: "Từ 2 ngày làm thủ công trong Excel xuống còn 20 phút — kế toán dành thời gian cho việc khác.",
    quote: "Trước đây mỗi tháng tôi mất 2 ngày tính lương. Bây giờ jobihome làm hết, tôi chỉ ký duyệt.",
    name: "Ngọc Kim", title: "Kế toán trưởng",
    metrics: [{ value: "2 ngày", label: "→ 20 phút" }, { value: "0 lỗi", label: "tính lương/tháng" }],
  },
  {
    initials: "BV", company: "Base.vn",
    industry: "SaaS & Phần mềm",
    result: "Onboard nhân viên mới trong 1 ngày",
    resultDesc: "Workflow tự động gửi checklist, phân quyền, mời workspace — HR không cần làm thủ công từng bước.",
    quote: "Nhân viên mới ngày đầu đã có đủ tool, task và quyền truy cập. Không ai phải hỏi lại nữa.",
    name: "Đức Hiệp", title: "Head of People",
    metrics: [{ value: "1 ngày", label: "onboarding hoàn chỉnh" }, { value: "5×", label: "nhanh hơn trước" }],
  },
];

const LOGOS = ["Loship", "Teko", "Base.vn", "MoMo", "VNPAY", "Ahamove"];

export default function CustomersPage() {
  return (
    <>
      {/* Hero */}
      <section className="lp-glow relative overflow-hidden" style={{ padding: "clamp(40px, 5vw, 64px) 0 0", textAlign: "center" }}>
        <span className="lp-blob lp-blob-1" />
        <span className="lp-blob lp-blob-2" />
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <span className="lp-eyebrow lp-center" style={{ justifyContent: "center" }}>Customers · Khách hàng</span>
          <h1 className="text-balance mt-5 font-extrabold mx-auto" style={{ fontSize: "clamp(2.6rem, 6vw, 4.3rem)", lineHeight: 1.02, letterSpacing: "-0.035em", maxWidth: "16ch" }}>
            Khách hàng của <span className="lp-grad-text">jobihome.vn</span>
          </h1>
          <p className="mt-6 mx-auto text-lp-text-2" style={{ fontSize: "clamp(1.05rem, 1.6vw, 1.28rem)", maxWidth: "60ch" }}>
            Các startup và doanh nghiệp Việt đã thay đổi cách quản lý team như thế nào — bằng số liệu thực tế.
          </p>
        </div>
      </section>

      {/* Logo strip */}
      <section style={{ padding: "44px 0", borderTop: "1px solid var(--lp-border)", borderBottom: "1px solid var(--lp-border)", background: "var(--lp-bg-elev)", marginTop: 44 }}>
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <p className="text-center lp-mono text-[0.78rem] uppercase tracking-wider text-lp-text-3 mb-6">
            Tin dùng bởi các công ty
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 max-w-[860px] mx-auto">
            {LOGOS.map((name) => (
              <span key={name} className="lp-mono font-semibold text-[1.05rem] text-lp-text-3 opacity-80 hover:opacity-100 transition-opacity tracking-tight">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Case studies */}
      <section style={{ padding: "clamp(48px, 6vw, 80px) 0" }}>
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {STORIES.map((s) => (
              <article key={s.company} className="lp-card lp-card-hover flex flex-col">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-xl grid place-items-center text-white font-black text-[14px] flex-shrink-0" style={{ background: "linear-gradient(135deg, var(--lp-accent-2), var(--lp-accent))" }}>
                    {s.initials}
                  </div>
                  <div>
                    <p className="font-bold text-[1rem]">{s.company}</p>
                    <span className="lp-tag mt-1 inline-flex">{s.industry}</span>
                  </div>
                </div>

                <div className="lp-mock-panel mb-4">
                  <p className="text-[1.25rem] font-extrabold leading-tight mb-1 text-lp-accent-ink">{s.result}</p>
                  <p className="text-[0.82rem] text-lp-text-3 leading-snug">{s.resultDesc}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  {s.metrics.map((m) => (
                    <div key={m.label} className="lp-mk text-center" style={{ padding: "10px 8px" }}>
                      <p className="text-[1.1rem] font-extrabold leading-none mb-1">{m.value}</p>
                      <p className="text-[0.7rem] text-lp-text-3 leading-snug">{m.label}</p>
                    </div>
                  ))}
                </div>

                <div className="flex-1 mb-5">
                  <p className="text-[0.92rem] text-lp-text-2 leading-relaxed italic">"{s.quote}"</p>
                </div>

                <div className="flex items-center gap-2.5 pt-5" style={{ borderTop: "1px solid var(--lp-border)" }}>
                  <div className="w-8 h-8 rounded-full grid place-items-center text-[11px] font-bold text-white flex-shrink-0" style={{ background: "linear-gradient(135deg, var(--lp-accent-2), var(--lp-accent))" }}>
                    {s.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-[0.84rem] font-semibold leading-tight">{s.name}</p>
                    <p className="text-[0.74rem] text-lp-text-3 leading-tight">{s.title} · {s.company}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="lp-card mt-14 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
            <div>
              <p className="font-bold text-[1.1rem]">Câu chuyện tiếp theo có thể là của bạn</p>
              <p className="text-[0.92rem] text-lp-text-3 mt-1">Tham gia các startup Việt đang dùng jobihome mỗi ngày.</p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <Link href="/dat-lich-demo" className="lp-btn lp-btn-primary">Đặt lịch demo</Link>
              <Link href="/pricing" className="lp-btn lp-btn-ghost">Xem bảng giá</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
