import Link from "next/link";
import { ArrowRight } from "lucide-react";

const BLUE = "#3B5BDB";

const FEATURES = [
  { slug: "quan-ly-cong-viec", icon: "☑", color: BLUE, colorLight: "#EEF2FF", tagline: "Task Management", headline: "Kanban & Sprint cho startup Việt", subheadline: "Backlog → In Progress → Done. Tuỳ chỉnh workflow, phân công task, đặt deadline. Đồng bộ realtime, không mất dữ liệu.", stats: [{ value: "3×", label: "nhanh hơn" }, { value: "0", label: "cuộc họp status" }], capabilities: ["Kanban Board", "Sprint Planning", "Sub-task", "Deadline & Priority"] },
  { slug: "cham-cong", icon: "⏱", color: "#0CA678", colorLight: "#ECFDF5", tagline: "Time Tracking", headline: "Chấm công tự động, báo cáo realtime", subheadline: "Auto-start timer khi bắt đầu task. Tổng hợp timesheet cuối tuần. Phát hiện bất thường, báo cáo chi tiết từng giờ.", stats: [{ value: "2 phút", label: "setup" }, { value: "99%", label: "chính xác" }], capabilities: ["Auto Timer", "Timesheet", "GPS Check-in", "Overtime Alert"] },
  { slug: "tinh-luong", icon: "💰", color: "#D97706", colorLight: "#FFFBEB", tagline: "Payroll & Salary", headline: "Tính lương tự động từ timesheet", subheadline: "Tự động tính lương từ timesheet. Hỗ trợ thuế TNCN, BHXH. Xuất payslip PDF, chuyển khoản 1 click qua VNPAY.", stats: [{ value: "1 click", label: "xuất payslip" }, { value: "0 lỗi", label: "tính lương" }], capabilities: ["Auto Payroll", "Tax & BHXH", "Payslip PDF", "VNPAY Transfer"] },
  { slug: "audit-log", icon: "📋", color: "#7C3AED", colorLight: "#F5F3FF", tagline: "Audit Log + Anomaly", headline: "Mọi thao tác đều có log và bảo vệ", subheadline: "Mọi hành động đều có log. Tự động phát hiện bất thường, cảnh báo realtime khi có thao tác lạ.", stats: [{ value: "100%", label: "traceability" }, { value: "Realtime", label: "alerts" }], capabilities: ["Full Audit Log", "Anomaly Detection", "Real-time Alerts", "Export CSV"] },
  { slug: "heatmap", icon: "📊", color: "#E03131", colorLight: "#FFF5F5", tagline: "Activity Heatmap", headline: "Trực quan hóa năng suất team", subheadline: "Xem heatmap hoạt động theo giờ + ngày. Tag people, actual hours. Dễ nhận biết bottleneck.", stats: [{ value: "24/7", label: "monitoring" }, { value: "100+", label: "metrics" }], capabilities: ["Activity Heatmap", "Top Pages", "Active Hours", "Team Insights"] },
];

export default function FeaturesIndexPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <section className="pt-16 pb-14 px-6 text-center" style={{ background: "linear-gradient(180deg, #F8F9FF 0%, #fff 100%)" }}>
        <div className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold mb-5 border"
          style={{ background: "#EEF2FF", borderColor: "#C7D2FE", color: BLUE }}>
          Tính năng
        </div>
        <h1 className="text-[36px] lg:text-[46px] font-extrabold text-gray-900 tracking-tight leading-[1.12] mb-4">
          Mọi thứ team bạn cần,<br /><span style={{ color: BLUE }}>trong một nơi</span>
        </h1>
        <p className="text-[16px] text-gray-400 max-w-[460px] mx-auto leading-relaxed">
          Từ task management đến tính lương — jobihome thay thế 5 công cụ riêng lẻ bằng một platform gắn kết.
        </p>
      </section>

      {/* Feature list */}
      <div className="max-w-[1060px] mx-auto px-6 pb-24">
        <div className="flex flex-col gap-5">
          {FEATURES.map((f) => (
            <Link key={f.slug} href={`/tinh-nang/${f.slug}`}
              className="group grid grid-cols-1 lg:grid-cols-[1fr_auto] items-center gap-6 p-7 rounded-2xl bg-white transition-all duration-250 hover:shadow-lg hover:-translate-y-0.5"
              style={{ border: "1px solid #E5E7EB" }}>
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                  style={{ background: f.colorLight, border: `1px solid ${f.color}20` }}>
                  {f.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                    <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: f.color }}>{f.tagline}</span>
                    <span className="text-gray-200">·</span>
                    <div className="flex items-center gap-2">
                      {f.stats.map((s) => (
                        <span key={s.label} className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: f.colorLight, color: f.color }}>
                          {s.value} {s.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <h2 className="text-[18px] font-extrabold text-gray-900 leading-snug mb-2">{f.headline}</h2>
                  <p className="text-[13.5px] text-gray-400 leading-relaxed max-w-[580px]">{f.subheadline}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {f.capabilities.map((c) => (
                      <span key={c} className="inline-flex items-center h-6 px-2.5 rounded-full text-[11px] font-medium"
                        style={{ background: "#F3F4F6", color: "#6B7280" }}>
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[13px] font-bold whitespace-nowrap transition-all group-hover:gap-3"
                style={{ color: f.color }}>
                Xem chi tiết <ArrowRight size={14} />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 rounded-2xl px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-5"
          style={{ background: "#F8F9FF", border: `1px solid ${BLUE}20` }}>
          <div>
            <p className="text-[18px] font-bold text-gray-900 mb-1">🔗 Kết nối với công cụ bạn đang dùng</p>
            <p className="text-[13.5px] text-gray-400">Slack, Zalo, MISA, GitHub và 16+ tích hợp khác.</p>
          </div>
          <Link href="/tich-hop"
            className="inline-flex items-center gap-2 h-11 px-6 rounded-xl text-[13.5px] font-bold text-white flex-shrink-0 transition-opacity hover:opacity-90"
            style={{ background: BLUE, boxShadow: `0 4px 16px ${BLUE}35` }}>
            Xem tích hợp <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
