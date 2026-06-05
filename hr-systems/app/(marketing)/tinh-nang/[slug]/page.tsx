import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { notFound } from "next/navigation";

const BLUE = "#3B5BDB";

const FEATURE_DATA: Record<string, {
  icon: string; color: string; colorLight: string; label: string;
  headline: string; subheadline: string; tagline: string;
  steps: { n: string; title: string; desc: string }[];
  capabilities: { icon: string; title: string; desc: string }[];
  testimonial: { quote: string; name: string; role: string; initials: string; bg: string };
}> = {
  "quan-ly-cong-viec": {
    icon: "☑", color: BLUE, colorLight: "#EEF2FF",
    label: "Task Management", tagline: "Kanban & Sprint",
    headline: "Quản lý task như một team chuyên nghiệp",
    subheadline: "Từ backlog đến done — mọi task đều minh bạch, có người chịu trách nhiệm và theo dõi được tiến độ realtime.",
    steps: [
      { n: "01", title: "Tạo backlog", desc: "Thêm task, gắn label, set priority và deadline trong vài giây" },
      { n: "02", title: "Phân công & Sprint", desc: "Kéo thả task vào sprint, assign người phụ trách, set estimate" },
      { n: "03", title: "Theo dõi realtime", desc: "Dashboard cập nhật tức thì khi có thay đổi, không cần refresh" },
    ],
    capabilities: [
      { icon: "📋", title: "Kanban Board", desc: "Kéo thả card giữa các cột, tùy chỉnh workflow theo team" },
      { icon: "🏃", title: "Sprint Planning", desc: "Tạo sprint, assign story points, theo dõi velocity" },
      { icon: "🔗", title: "Sub-task & Dependencies", desc: "Phân rã task lớn, gắn dependency để block/unblock" },
      { icon: "🎯", title: "Priority & Labels", desc: "P0/P1/P2, custom labels, filter theo bất kỳ tiêu chí" },
      { icon: "📅", title: "Deadline & Reminder", desc: "Auto reminder trước deadline, escalate khi quá hạn" },
      { icon: "👁️", title: "Guest View", desc: "Chia sẻ board cho khách hàng với quyền view-only" },
    ],
    testimonial: { quote: "jobihome giúp chúng tôi giảm 3 buổi họp báo cáo mỗi tuần. Manager giờ chỉ cần nhìn dashboard là nắm được tiến độ.", name: "Minh Tuấn", role: "CTO · Finsify", initials: "MT", bg: BLUE },
  },
  "cham-cong": {
    icon: "⏱", color: "#0CA678", colorLight: "#ECFDF5",
    label: "Time Tracking", tagline: "Chấm công tự động",
    headline: "Chấm công không cần nhập tay",
    subheadline: "Timer tự động chạy khi bắt đầu task. GPS check-in cho nhân viên thực địa. Tổng hợp timesheet cuối tuần chỉ 1 click.",
    steps: [
      { n: "01", title: "Bắt đầu task", desc: "Click 'Start' trên task — timer tự chạy, không cần làm gì thêm" },
      { n: "02", title: "Manager duyệt", desc: "Cuối ngày/tuần, manager review và approve từng time log" },
      { n: "03", title: "Export timesheet", desc: "Xuất báo cáo theo người, theo dự án, theo tháng — 1 click" },
    ],
    capabilities: [
      { icon: "▶️", title: "Auto Timer", desc: "Timer tự start/stop theo lifecycle của task" },
      { icon: "📍", title: "GPS Check-in", desc: "Check-in qua GPS cho nhân viên làm việc ngoài văn phòng" },
      { icon: "✅", title: "Manager Approval", desc: "Workflow duyệt time log, có thể yêu cầu video proof" },
      { icon: "📊", title: "Timesheet Report", desc: "Báo cáo chi tiết theo người, team, dự án, khách hàng" },
      { icon: "⚠️", title: "Overtime Alert", desc: "Cảnh báo khi vượt estimate, off-hours activity" },
      { icon: "🔄", title: "Billable Hours", desc: "Đánh dấu giờ billable, tính chi phí cho từng khách hàng" },
    ],
    testimonial: { quote: "Auto timer giúp team không phải nhớ log giờ nữa. Accuracy tăng lên 99%, sai số về 0.", name: "Đức Hiệp", role: "Head of People · Base.vn", initials: "DH", bg: "#0CA678" },
  },
  "tinh-luong": {
    icon: "💰", color: "#D97706", colorLight: "#FFFBEB",
    label: "Payroll & Salary", tagline: "Tính lương tự động",
    headline: "Từ timesheet ra phiếu lương PDF chỉ 1 click",
    subheadline: "Hệ thống tự động tính lương dựa trên time logs đã duyệt. Hỗ trợ đầy đủ thuế TNCN, BHXH, KPI bonus.",
    steps: [
      { n: "01", title: "Duyệt time logs", desc: "Manager approve timesheet — dữ liệu đưa vào payroll tự động" },
      { n: "02", title: "Review payroll", desc: "Xem bản nháp lương, điều chỉnh bonus/deduction nếu cần" },
      { n: "03", title: "Xuất & chuyển khoản", desc: "Xuất payslip PDF, chuyển khoản hàng loạt qua VNPAY/MoMo" },
    ],
    capabilities: [
      { icon: "🧮", title: "Auto Calculation", desc: "Tính lương từ approved time logs, không cần Excel" },
      { icon: "🏛️", title: "Tax & BHXH", desc: "Tự động tính thuế TNCN, BHXH theo quy định hiện hành" },
      { icon: "🎁", title: "KPI Bonus", desc: "Tích hợp KPI score vào công thức lương, tự động tính bonus" },
      { icon: "📄", title: "Payslip PDF", desc: "Xuất phiếu lương PDF cho từng nhân viên, gửi email tự động" },
      { icon: "💳", title: "VNPAY/MoMo", desc: "Chuyển khoản hàng loạt qua VNPAY hoặc MoMo" },
      { icon: "📈", title: "Payroll History", desc: "Lịch sử tất cả các kỳ lương, so sánh tháng này vs tháng trước" },
    ],
    testimonial: { quote: "Tính năng payroll tự động giúp HR của mình tiết kiệm gần 2 ngày làm việc mỗi tháng. Không còn sai sót khi tính lương nữa.", name: "Lan Anh", role: "HR Manager · GrowthHack Agency", initials: "LA", bg: "#0CA678" },
  },
  "audit-log": {
    icon: "📋", color: "#7C3AED", colorLight: "#F5F3FF",
    label: "Audit Log", tagline: "Full traceability",
    headline: "Biết chính xác ai làm gì, lúc nào",
    subheadline: "Mọi thao tác đều có log với đầy đủ context: ai, khi nào, từ IP nào, thay đổi gì. Không thể xóa, không thể giả mạo.",
    steps: [
      { n: "01", title: "Tự động ghi log", desc: "Mọi create/update/delete đều tự động có audit entry" },
      { n: "02", title: "Phát hiện bất thường", desc: "AI phát hiện off-hours access, bulk delete, IP lạ..." },
      { n: "03", title: "Alert & Review", desc: "Nhận alert ngay lập tức, review và dismiss hoặc escalate" },
    ],
    capabilities: [
      { icon: "📝", title: "Full Audit Trail", desc: "Log toàn bộ thao tác với before/after values" },
      { icon: "🔍", title: "Advanced Search", desc: "Filter theo user, model, action, time range, IP address" },
      { icon: "🤖", title: "Anomaly Detection", desc: "8 loại bất thường: off-hours vault, bulk delete, IP lạ..." },
      { icon: "🔔", title: "Real-time Alerts", desc: "Push notification khi phát hiện hoạt động đáng ngờ" },
      { icon: "📊", title: "Timeline View", desc: "Xem toàn bộ hoạt động của một ngày theo timeline" },
      { icon: "📤", title: "Export CSV", desc: "Xuất audit log ra CSV/Excel cho báo cáo compliance" },
    ],
    testimonial: { quote: "Audit log giúp chúng tôi yên tâm hoàn toàn. Mọi thay đổi đều có dấu vết, không ai có thể 'quên' đã sửa gì.", name: "Ngọc Kim", role: "Kế toán trưởng · Teko Vietnam", initials: "NK", bg: "#7C3AED" },
  },
  "heatmap": {
    icon: "📊", color: "#E03131", colorLight: "#FFF5F5",
    label: "Activity Heatmap", tagline: "Team insights",
    headline: "Hiểu team đang làm gì qua dữ liệu thực",
    subheadline: "Heatmap hoạt động theo giờ và ngày. Biết ai đang active, ai đang idle, top pages được xem, giờ làm việc thực tế.",
    steps: [
      { n: "01", title: "Thu thập tự động", desc: "Activity tracker chạy ngầm, không làm phiền nhân viên" },
      { n: "02", title: "Visualize", desc: "Dashboard heatmap cập nhật realtime, drill-down theo người/team" },
      { n: "03", title: "Insights", desc: "AI gợi ý bottleneck, peak hours, cần tăng/giảm resource ở đâu" },
    ],
    capabilities: [
      { icon: "🗓️", title: "Daily Heatmap", desc: "Ma trận giờ × ngày, màu sắc theo mức độ hoạt động" },
      { icon: "👥", title: "Per-Person View", desc: "Xem chi tiết từng nhân viên, so sánh với team average" },
      { icon: "📱", title: "Top Pages", desc: "Trang nào được xem nhiều nhất, thời gian trung bình" },
      { icon: "⏰", title: "Active Hours", desc: "Giờ làm việc thực tế vs scheduled, overtime detection" },
      { icon: "🎯", title: "Team Benchmark", desc: "So sánh productivity giữa các team, department" },
      { icon: "📤", title: "Weekly Report", desc: "Báo cáo tự động gửi mỗi thứ 2, tóm tắt tuần trước" },
    ],
    testimonial: { quote: "Heatmap giúp tôi hiểu team mà không cần micromanage. Thấy ai cần support ngay từ data, không phải từ họp.", name: "Minh Tuấn", role: "CTO · Finsify", initials: "MT", bg: BLUE },
  },
};

export default function FeaturePage({ params }: { params: { slug: string } }) {
  const f = FEATURE_DATA[params.slug];
  if (!f) notFound();

  return (
    <div className="bg-white min-h-screen">
      {/* Hero */}
      <section className="pt-16 pb-20 px-6" style={{ background: "linear-gradient(180deg, #F8F9FF 0%, #fff 100%)" }}>
        <div className="max-w-[1060px] mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Link href="/tinh-nang" className="text-[13px] text-gray-400 hover:text-gray-700 transition-colors">Tính năng</Link>
            <span className="text-gray-300">/</span>
            <span className="text-[13px] font-medium text-gray-700">{f.label}</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-6 text-xs font-bold uppercase tracking-widest"
                style={{ background: f.colorLight, color: f.color }}>
                <span className="text-base">{f.icon}</span> {f.tagline}
              </div>
              <h1 className="text-[36px] lg:text-[44px] font-extrabold text-gray-900 tracking-tight leading-[1.12] mb-4">
                {f.headline}
              </h1>
              <p className="text-[16px] text-gray-500 leading-relaxed mb-8">{f.subheadline}</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/sign-up"
                  className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl text-[14px] font-bold text-white transition-opacity hover:opacity-90"
                  style={{ background: f.color, boxShadow: `0 4px 16px ${f.color}40` }}>
                  Dùng thử miễn phí <ArrowRight size={15} />
                </Link>
                <Link href="/dat-lich-demo"
                  className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-xl text-[14px] font-semibold border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
                  Xem demo
                </Link>
              </div>
            </div>
            <div className="rounded-2xl p-8 flex items-center justify-center" style={{ background: f.colorLight, minHeight: 300 }}>
              <span className="text-8xl">{f.icon}</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-[1060px] mx-auto px-6">
          <h2 className="text-[28px] font-extrabold text-gray-900 tracking-tight mb-12 text-center">Hoạt động như thế nào?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {f.steps.map((step) => (
              <div key={step.n} className="rounded-2xl bg-white p-6 text-center" style={{ border: "1px solid #E5E7EB" }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-[13px] font-black text-white mx-auto mb-4"
                  style={{ background: f.color, boxShadow: `0 4px 12px ${f.color}40` }}>
                  {step.n}
                </div>
                <p className="text-[15px] font-bold text-gray-900 mb-2">{step.title}</p>
                <p className="text-[13px] text-gray-400 leading-snug">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-20 bg-white">
        <div className="max-w-[1060px] mx-auto px-6">
          <h2 className="text-[28px] font-extrabold text-gray-900 tracking-tight mb-12 text-center">Tất cả những gì bạn cần</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {f.capabilities.map((c) => (
              <div key={c.title} className="rounded-xl p-6 border border-gray-100 hover:border-blue-200 transition-colors">
                <div className="text-2xl mb-3">{c.icon}</div>
                <h3 className="text-[14px] font-bold text-gray-900 mb-1">{c.title}</h3>
                <p className="text-[13px] text-gray-500 leading-snug">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-[680px] mx-auto px-6">
          <div className="rounded-2xl px-8 py-8" style={{ background: "#F8F9FF", border: `1px solid ${f.color}20` }}>
            <p className="text-[16px] text-gray-700 leading-[1.8] mb-6 italic">"{f.testimonial.quote}"</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0"
                style={{ background: f.testimonial.bg }}>
                {f.testimonial.initials}
              </div>
              <div>
                <p className="text-[13.5px] font-bold text-gray-900">{f.testimonial.name}</p>
                <p className="text-[12px] text-gray-400">{f.testimonial.role}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-[700px] mx-auto px-6 text-center">
          <h2 className="text-[28px] font-extrabold text-gray-900 mb-3">Sẵn sàng dùng thử {f.label}?</h2>
          <p className="text-[15px] text-gray-400 mb-8">Miễn phí 14 ngày. Không cần thẻ tín dụng. Setup trong 2 phút.</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/sign-up"
              className="inline-flex items-center gap-2 h-12 px-8 rounded-xl text-[14px] font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: f.color, boxShadow: `0 4px 16px ${f.color}40` }}>
              Dùng thử miễn phí <ArrowRight size={15} />
            </Link>
            <Link href="/tinh-nang"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-xl text-[14px] font-semibold border border-gray-200 hover:bg-gray-50 transition-colors text-gray-700">
              Xem tính năng khác
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export function generateStaticParams() {
  return ["quan-ly-cong-viec", "cham-cong", "tinh-luong", "audit-log", "heatmap"].map((slug) => ({ slug }));
}
