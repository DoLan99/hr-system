import Link from "next/link";
import { notFound } from "next/navigation";

const FEATURE_DATA: Record<string, {
  icon: string; label: string; tagline: string;
  headline: string; subheadline: string;
  steps: { n: string; title: string; desc: string }[];
  capabilities: { icon: string; title: string; desc: string }[];
  testimonial: { quote: string; name: string; role: string; initials: string };
}> = {
  "quan-ly-cong-viec": {
    icon: "☑", label: "Task Management", tagline: "Kanban & Sprint",
    headline: "Quản lý task như một team chuyên nghiệp",
    subheadline: "Từ backlog đến done — mọi task đều minh bạch, có người chịu trách nhiệm và theo dõi được tiến độ realtime.",
    steps: [
      { n: "01", title: "Tạo backlog", desc: "Thêm task, gắn label, set priority và deadline trong vài giây." },
      { n: "02", title: "Phân công & Sprint", desc: "Kéo thả task vào sprint, assign người phụ trách, set estimate." },
      { n: "03", title: "Theo dõi realtime", desc: "Dashboard cập nhật tức thì khi có thay đổi, không cần refresh." },
    ],
    capabilities: [
      { icon: "📋", title: "Kanban Board", desc: "Kéo thả card giữa các cột, tùy chỉnh workflow theo team." },
      { icon: "🏃", title: "Sprint Planning", desc: "Tạo sprint, assign story points, theo dõi velocity." },
      { icon: "🔗", title: "Sub-task & Dependencies", desc: "Phân rã task lớn, gắn dependency để block/unblock." },
      { icon: "🎯", title: "Priority & Labels", desc: "P0/P1/P2, custom labels, filter theo bất kỳ tiêu chí." },
      { icon: "📅", title: "Deadline & Reminder", desc: "Auto reminder trước deadline, escalate khi quá hạn." },
      { icon: "👁️", title: "Guest View", desc: "Chia sẻ board cho khách hàng với quyền view-only." },
    ],
    testimonial: { quote: "jobihome giúp chúng tôi giảm 3 buổi họp báo cáo mỗi tuần. Manager giờ chỉ cần nhìn dashboard là nắm được tiến độ.", name: "Minh Tuấn", role: "CTO · Finsify", initials: "MT" },
  },
  "cham-cong": {
    icon: "⏱", label: "Time Tracking", tagline: "Chấm công tự động",
    headline: "Chấm công không cần nhập tay",
    subheadline: "Timer tự động chạy khi bắt đầu task. GPS check-in cho nhân viên thực địa. Tổng hợp timesheet cuối tuần chỉ 1 click.",
    steps: [
      { n: "01", title: "Bắt đầu task", desc: "Click 'Start' trên task — timer tự chạy, không cần làm gì thêm." },
      { n: "02", title: "Manager duyệt", desc: "Cuối ngày/tuần, manager review và approve từng time log." },
      { n: "03", title: "Export timesheet", desc: "Xuất báo cáo theo người, theo dự án, theo tháng — 1 click." },
    ],
    capabilities: [
      { icon: "▶️", title: "Auto Timer", desc: "Timer tự start/stop theo lifecycle của task." },
      { icon: "📍", title: "GPS Check-in", desc: "Check-in qua GPS cho nhân viên làm việc ngoài văn phòng." },
      { icon: "✅", title: "Manager Approval", desc: "Workflow duyệt time log, có thể yêu cầu video proof." },
      { icon: "📊", title: "Timesheet Report", desc: "Báo cáo chi tiết theo người, team, dự án, khách hàng." },
      { icon: "⚠️", title: "Overtime Alert", desc: "Cảnh báo khi vượt estimate, off-hours activity." },
      { icon: "🔄", title: "Billable Hours", desc: "Đánh dấu giờ billable, tính chi phí cho từng khách hàng." },
    ],
    testimonial: { quote: "Auto timer giúp team không phải nhớ log giờ nữa. Accuracy tăng lên 99%, sai số về 0.", name: "Đức Hiệp", role: "Head of People · Base.vn", initials: "DH" },
  },
  "tinh-luong": {
    icon: "💰", label: "Payroll & Salary", tagline: "Tính lương tự động",
    headline: "Từ timesheet ra phiếu lương PDF chỉ 1 click",
    subheadline: "Hệ thống tự động tính lương dựa trên time logs đã duyệt. Hỗ trợ đầy đủ thuế TNCN, BHXH, KPI bonus.",
    steps: [
      { n: "01", title: "Duyệt time logs", desc: "Manager approve timesheet — dữ liệu đưa vào payroll tự động." },
      { n: "02", title: "Review payroll", desc: "Xem bản nháp lương, điều chỉnh bonus/deduction nếu cần." },
      { n: "03", title: "Xuất & chuyển khoản", desc: "Xuất payslip PDF, chuyển khoản hàng loạt qua VNPAY/MoMo." },
    ],
    capabilities: [
      { icon: "🧮", title: "Auto Calculation", desc: "Tính lương từ approved time logs, không cần Excel." },
      { icon: "🏛️", title: "Tax & BHXH", desc: "Tự động tính thuế TNCN, BHXH theo quy định hiện hành." },
      { icon: "🎁", title: "KPI Bonus", desc: "Tích hợp KPI score vào công thức lương, tự động tính bonus." },
      { icon: "📄", title: "Payslip PDF", desc: "Xuất phiếu lương PDF cho từng nhân viên, gửi email tự động." },
      { icon: "💳", title: "VNPAY/MoMo", desc: "Chuyển khoản hàng loạt qua VNPAY hoặc MoMo." },
      { icon: "📈", title: "Payroll History", desc: "Lịch sử tất cả các kỳ lương, so sánh tháng này vs tháng trước." },
    ],
    testimonial: { quote: "Tính năng payroll tự động giúp HR của mình tiết kiệm gần 2 ngày làm việc mỗi tháng. Không còn sai sót khi tính lương nữa.", name: "Lan Anh", role: "HR Manager · GrowthHack Agency", initials: "LA" },
  },
  "audit-log": {
    icon: "📋", label: "Audit Log", tagline: "Full traceability",
    headline: "Biết chính xác ai làm gì, lúc nào",
    subheadline: "Mọi thao tác đều có log với đầy đủ context: ai, khi nào, từ IP nào, thay đổi gì. Không thể xóa, không thể giả mạo.",
    steps: [
      { n: "01", title: "Tự động ghi log", desc: "Mọi create/update/delete đều tự động có audit entry." },
      { n: "02", title: "Phát hiện bất thường", desc: "AI phát hiện off-hours access, bulk delete, IP lạ..." },
      { n: "03", title: "Alert & Review", desc: "Nhận alert ngay lập tức, review và dismiss hoặc escalate." },
    ],
    capabilities: [
      { icon: "📝", title: "Full Audit Trail", desc: "Log toàn bộ thao tác với before/after values." },
      { icon: "🔍", title: "Advanced Search", desc: "Filter theo user, model, action, time range, IP address." },
      { icon: "🤖", title: "Anomaly Detection", desc: "8 loại bất thường: off-hours vault, bulk delete, IP lạ..." },
      { icon: "🔔", title: "Real-time Alerts", desc: "Push notification khi phát hiện hoạt động đáng ngờ." },
      { icon: "📊", title: "Timeline View", desc: "Xem toàn bộ hoạt động của một ngày theo timeline." },
      { icon: "📤", title: "Export CSV", desc: "Xuất audit log ra CSV/Excel cho báo cáo compliance." },
    ],
    testimonial: { quote: "Audit log giúp chúng tôi yên tâm hoàn toàn. Mọi thay đổi đều có dấu vết, không ai có thể 'quên' đã sửa gì.", name: "Ngọc Kim", role: "Kế toán trưởng · Teko Vietnam", initials: "NK" },
  },
  "heatmap": {
    icon: "📊", label: "Activity Heatmap", tagline: "Team insights",
    headline: "Hiểu team đang làm gì qua dữ liệu thực",
    subheadline: "Heatmap hoạt động theo giờ và ngày. Biết ai đang active, ai đang idle, top pages được xem, giờ làm việc thực tế.",
    steps: [
      { n: "01", title: "Thu thập tự động", desc: "Activity tracker chạy ngầm, không làm phiền nhân viên." },
      { n: "02", title: "Visualize", desc: "Dashboard heatmap cập nhật realtime, drill-down theo người/team." },
      { n: "03", title: "Insights", desc: "AI gợi ý bottleneck, peak hours, cần tăng/giảm resource ở đâu." },
    ],
    capabilities: [
      { icon: "🗓️", title: "Daily Heatmap", desc: "Ma trận giờ × ngày, màu sắc theo mức độ hoạt động." },
      { icon: "👥", title: "Per-Person View", desc: "Xem chi tiết từng nhân viên, so sánh với team average." },
      { icon: "📱", title: "Top Pages", desc: "Trang nào được xem nhiều nhất, thời gian trung bình." },
      { icon: "⏰", title: "Active Hours", desc: "Giờ làm việc thực tế vs scheduled, overtime detection." },
      { icon: "🎯", title: "Team Benchmark", desc: "So sánh productivity giữa các team, department." },
      { icon: "📤", title: "Weekly Report", desc: "Báo cáo tự động gửi mỗi thứ 2, tóm tắt tuần trước." },
    ],
    testimonial: { quote: "Heatmap giúp tôi hiểu team mà không cần micromanage. Thấy ai cần support ngay từ data, không phải từ họp.", name: "Minh Tuấn", role: "CTO · Finsify", initials: "MT" },
  },
};

export default function FeaturePage({ params }: { params: { slug: string } }) {
  const f = FEATURE_DATA[params.slug];
  if (!f) notFound();

  return (
    <>
      {/* Hero */}
      <section className="lp-glow relative overflow-hidden" style={{ padding: "clamp(48px, 7vw, 92px) 0 clamp(56px, 8vw, 96px)" }}>
        <span className="lp-blob lp-blob-1" />
        <span className="lp-blob lp-blob-2" />
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <nav className="flex items-center gap-2 mb-6 text-[13px] text-lp-text-3">
            <Link href="/tinh-nang" className="hover:text-lp-text transition-colors">Tính năng</Link>
            <span>/</span>
            <span className="text-lp-text-2">{f.label}</span>
          </nav>
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center" style={{ gap: "clamp(34px, 5vw, 76px)" }}>
            <div>
              <span className="lp-pill"><span className="text-base mr-1">{f.icon}</span>{f.tagline}</span>
              <h1 className="text-balance mt-5 font-extrabold" style={{ fontSize: "clamp(2.2rem, 5vw, 3.4rem)", lineHeight: 1.05, letterSpacing: "-0.035em" }}>
                {f.headline}
              </h1>
              <p className="mt-5 text-lp-text-2" style={{ fontSize: "clamp(1.05rem, 1.6vw, 1.2rem)", lineHeight: 1.6 }}>
                {f.subheadline}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <Link href="/sign-up" className="lp-btn lp-btn-primary lp-btn-lg">Dùng thử miễn phí</Link>
                <Link href="/dat-lich-demo" className="lp-btn lp-btn-ghost lp-btn-lg">Xem demo</Link>
              </div>
            </div>
            <div className="lp-mock flex items-center justify-center" style={{ minHeight: 300 }}>
              <span className="text-8xl">{f.icon}</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: "var(--lp-bg-elev)", borderTop: "1px solid var(--lp-border)", borderBottom: "1px solid var(--lp-border)", padding: "clamp(64px, 9vw, 130px) 0" }}>
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <div className="text-center max-w-[680px] mx-auto mb-12">
            <span className="lp-eyebrow lp-center">How it works</span>
            <h2 className="text-balance mt-4 font-extrabold" style={{ fontSize: "clamp(1.9rem, 3.6vw, 2.9rem)", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
              Hoạt động như thế nào?
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {f.steps.map((step) => (
              <div key={step.n} className="lp-card text-center">
                <div className="w-12 h-12 rounded-full grid place-items-center lp-mono font-black text-white mx-auto mb-4" style={{ background: "linear-gradient(135deg, var(--lp-accent-2), var(--lp-accent))", boxShadow: "var(--lp-shadow-accent)" }}>
                  {step.n}
                </div>
                <p className="font-bold text-[1rem] mb-2">{step.title}</p>
                <p className="text-[0.9rem] text-lp-text-3 leading-snug">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section style={{ padding: "clamp(64px, 9vw, 130px) 0" }}>
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <div className="text-center max-w-[680px] mx-auto mb-12">
            <span className="lp-eyebrow lp-center">Capabilities</span>
            <h2 className="text-balance mt-4 font-extrabold" style={{ fontSize: "clamp(1.9rem, 3.6vw, 2.9rem)", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
              Tất cả những gì bạn cần
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {f.capabilities.map((c) => (
              <div key={c.title} className="lp-card lp-card-hover">
                <div className="text-2xl mb-3">{c.icon}</div>
                <h3 className="font-bold text-[1rem] mb-1.5">{c.title}</h3>
                <p className="text-[0.9rem] text-lp-text-2 leading-snug">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section style={{ background: "var(--lp-bg-elev)", borderTop: "1px solid var(--lp-border)", padding: "clamp(48px, 6vw, 84px) 0" }}>
        <div className="w-full max-w-[760px] mx-auto px-7">
          <div className="lp-card" style={{ background: "var(--lp-accent-soft)", borderColor: "var(--lp-accent-soft-2)" }}>
            <p className="text-[1.05rem] leading-[1.8] italic mb-6">"{f.testimonial.quote}"</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full grid place-items-center text-[12px] font-bold text-white flex-shrink-0" style={{ background: "linear-gradient(135deg, var(--lp-accent-2), var(--lp-accent))" }}>
                {f.testimonial.initials}
              </div>
              <div>
                <p className="text-[0.92rem] font-bold">{f.testimonial.name}</p>
                <p className="text-[0.8rem] text-lp-text-3">{f.testimonial.role}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "clamp(64px, 9vw, 130px) 0" }}>
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <div className="lp-cta-band">
            <h2 className="text-balance">Sẵn sàng dùng thử {f.label}?</h2>
            <p>Miễn phí 14 ngày. Không cần thẻ tín dụng. Setup trong 2 phút.</p>
            <div className="flex gap-3 justify-center flex-wrap relative">
              <Link href="/sign-up" className="lp-btn lp-btn-primary lp-btn-lg">Dùng thử miễn phí</Link>
              <Link href="/tinh-nang" className="lp-btn lp-btn-ghost lp-btn-lg">Xem tính năng khác</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export function generateStaticParams() {
  return ["quan-ly-cong-viec", "cham-cong", "tinh-luong", "audit-log", "heatmap"].map((slug) => ({ slug }));
}
