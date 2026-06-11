"use client";

import { useState } from "react";
import { Check } from "lucide-react";

const BLUE = "#3B5BDB";
const GREEN = "#2F9E44";

const TABS = [
  {
    id: "task",
    label: "Task Management",
    icon: "☑",
    headline: "Quản lý công việc như một pro",
    subtext: "Kanban board, sprint, backlog — mọi thứ trong một màn hình. Đồng bộ realtime, không mất dữ liệu.",
    features: [
      { title: "Kanban board tùy biến", desc: "Kéo thả task giữa các cột, tùy chỉnh workflow theo team" },
      { title: "Phân công & deadline rõ ràng", desc: "Gán người, đặt due date, nhắc nhở tự động qua Zalo" },
      { title: "Sprint planning & backlog", desc: "Tổ chức sprint, ưu tiên backlog, báo cáo velocity" },
      { title: "Đồng bộ realtime", desc: "Mọi thành viên thấy cập nhật ngay lập tức, không cần F5" },
    ],
    mockup: {
      title: "Sprint 4 — Task Board",
      url: "app.jobihome.vn/sprint-4",
      columns: [
        { label: "Cần làm", dot: "#9CA3AF", items: ["Thiết kế onboarding", "Review API v2.0", "Cập nhật chính sách"] },
        { label: "Đang làm", dot: "#3B5BDB", items: ["Tích hợp VNPAY", "Viết blog SEO"] },
        { label: "Hoàn thành", dot: "#2F9E44", items: ["Setup CI/CD staging", "Phân tích Sprint 4"] },
      ],
    },
  },
  {
    id: "time",
    label: "Time Tracking",
    icon: "⏱",
    headline: "Chấm công tự động, không cần nhập tay",
    subtext: "Timer tự động bắt đầu khi làm task. Heartbeat kiểm tra hoạt động. Timesheet tổng hợp cuối tuần.",
    features: [
      { title: "Auto-start timer theo task", desc: "Bắt đầu làm việc → timer tự chạy, không cần nhớ bấm giờ" },
      { title: "Activity heartbeat 5 phút/lần", desc: "Phát hiện idle time, báo cáo giờ thực tế vs ước tính" },
      { title: "Heatmap hoạt động", desc: "Biểu đồ nhiệt theo giờ và ngày, nhìn ra bottleneck ngay" },
      { title: "Timesheet & báo cáo", desc: "Xuất báo cáo theo tuần/tháng, tích hợp trực tiếp vào payroll" },
    ],
    mockup: {
      title: "Time Tracking — Tuần này",
      url: "app.jobihome.vn/time",
      heatmap: [
        { day: "T2", hours: [0.2, 0.8, 1.0, 0.9, 0.7, 0.5, 0.3, 0.9] },
        { day: "T3", hours: [0.4, 0.9, 0.8, 1.0, 0.6, 0.4, 0.8, 0.7] },
        { day: "T4", hours: [0.1, 0.6, 0.9, 0.8, 1.0, 0.9, 0.5, 0.4] },
        { day: "T5", hours: [0.5, 0.7, 0.6, 0.9, 0.8, 0.7, 0.6, 0.8] },
        { day: "T6", hours: [0.3, 0.5, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2] },
      ],
    },
  },
  {
    id: "payroll",
    label: "Payroll & Lương",
    icon: "💰",
    headline: "Tính lương tự động, 1 click",
    subtext: "Từ timesheet → lương → payslip PDF. Hỗ trợ thuế TNCN, BHXH. Chuyển khoản qua VNPAY.",
    features: [
      { title: "Tính lương từ timesheet", desc: "Lấy giờ thực tế từ time log, tính tự động theo formula" },
      { title: "Khấu trừ thuế TNCN & BHXH", desc: "Tự động tính theo biểu thuế hiện hành, cập nhật tự động" },
      { title: "Xuất payslip PDF", desc: "Phiếu lương chuyên nghiệp, gửi email tự động cho nhân viên" },
      { title: "Chuyển khoản VNPAY", desc: "Thanh toán lương hàng loạt, lịch sử rõ ràng, không sai sót" },
    ],
    mockup: {
      title: "Payroll — Tháng 5/2025",
      url: "app.jobihome.vn/payroll",
      rows: [
        { name: "Minh Tuấn", role: "CTO", hours: "168h", gross: "45,000,000đ", status: "Đã duyệt" },
        { name: "Lan Anh", role: "HR Manager", hours: "160h", gross: "28,000,000đ", status: "Đã duyệt" },
        { name: "Đức Anh", role: "Dev Lead", hours: "172h", gross: "38,000,000đ", status: "Chờ duyệt" },
        { name: "Duy Hoàng", role: "Backend Dev", hours: "164h", gross: "30,000,000đ", status: "Đã duyệt" },
      ],
    },
  },
];

function TaskMockup({ data }: { data: typeof TABS[0]["mockup"] }) {
  const m = data as typeof TABS[0]["mockup"] & { columns?: { label: string; dot: string; items: string[] }[] };
  if (!m.columns) return null;
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 bg-white shadow-xl select-none">
      <div className="bg-gray-100 px-3 py-2 flex items-center gap-2 border-b border-gray-200">
        <div className="flex gap-1 flex-shrink-0">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <div className="w-2 h-2 rounded-full bg-yellow-400" />
          <div className="w-2 h-2 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 bg-white rounded px-3 py-0.5 text-[10px] text-gray-400 border border-gray-200 text-center max-w-[200px] mx-auto truncate">
          {m.url}
        </div>
      </div>
      <div className="p-3 bg-white">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-[11px] font-bold text-gray-700">{m.title}</span>
          <div className="flex gap-1">
            {["Board", "List", "Calendar"].map((t, i) => (
              <button key={t} className="text-[9px] px-2 py-0.5 rounded font-medium"
                style={i === 0 ? { background: BLUE, color: "#fff" } : { color: "#9CA3AF" }}>{t}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {m.columns.map((col) => (
            <div key={col.label}>
              <div className="flex items-center gap-1 mb-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: col.dot }} />
                <span className="text-[9px] font-bold text-gray-500">{col.label}</span>
                <span className="text-[8px] text-gray-400 bg-gray-100 rounded-full px-1">{col.items.length}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {col.items.map((item) => (
                  <div key={item} className="bg-gray-50 rounded-lg p-2 border border-gray-100 text-[9px] text-gray-700 leading-snug">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TimeMockup({ data }: { data: typeof TABS[1]["mockup"] }) {
  const m = data as typeof TABS[1]["mockup"] & { heatmap?: { day: string; hours: number[] }[] };
  if (!m.heatmap) return null;
  const timeLabels = ["9h", "10h", "11h", "12h", "13h", "14h", "15h", "16h"];
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 bg-white shadow-xl select-none">
      <div className="bg-gray-100 px-3 py-2 flex items-center gap-2 border-b border-gray-200">
        <div className="flex gap-1 flex-shrink-0">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <div className="w-2 h-2 rounded-full bg-yellow-400" />
          <div className="w-2 h-2 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 bg-white rounded px-3 py-0.5 text-[10px] text-gray-400 border border-gray-200 text-center max-w-[200px] mx-auto truncate">
          {m.url}
        </div>
      </div>
      <div className="p-4 bg-white">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-bold text-gray-700">{m.title}</span>
          <span className="text-[9px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Tổng: 41.2h</span>
        </div>
        <div className="flex gap-1 mb-2">
          <div className="w-6 flex-shrink-0" />
          {timeLabels.map((t) => (
            <div key={t} className="flex-1 text-center text-[8px] text-gray-400">{t}</div>
          ))}
        </div>
        {m.heatmap.map((row) => (
          <div key={row.day} className="flex gap-1 mb-1.5">
            <div className="w-6 flex-shrink-0 text-[8px] font-medium text-gray-400 flex items-center">{row.day}</div>
            {row.hours.map((intensity, i) => (
              <div
                key={i}
                className="flex-1 h-6 rounded-sm"
                style={{ background: `rgba(59,91,219,${intensity * 0.85 + 0.05})` }}
              />
            ))}
          </div>
        ))}
        <div className="mt-4 flex gap-3">
          {[{ label: "Giờ làm việc", val: "41.2h" }, { label: "Hiệu suất", val: "94%" }, { label: "Idle time", val: "2.1h" }].map((s) => (
            <div key={s.label} className="flex-1 bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-[11px] font-bold text-gray-800">{s.val}</p>
              <p className="text-[9px] text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PayrollMockup({ data }: { data: typeof TABS[2]["mockup"] }) {
  const m = data as typeof TABS[2]["mockup"] & { rows?: { name: string; role: string; hours: string; gross: string; status: string }[] };
  if (!m.rows) return null;
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 bg-white shadow-xl select-none">
      <div className="bg-gray-100 px-3 py-2 flex items-center gap-2 border-b border-gray-200">
        <div className="flex gap-1 flex-shrink-0">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <div className="w-2 h-2 rounded-full bg-yellow-400" />
          <div className="w-2 h-2 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 bg-white rounded px-3 py-0.5 text-[10px] text-gray-400 border border-gray-200 text-center max-w-[200px] mx-auto truncate">
          {m.url}
        </div>
      </div>
      <div className="p-3 bg-white">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-[11px] font-bold text-gray-700">{m.title}</span>
          <button className="text-[9px] px-2.5 py-1 rounded-lg font-bold text-white" style={{ background: BLUE }}>
            Xuất PDF
          </button>
        </div>
        <div className="rounded-lg overflow-hidden border border-gray-100">
          <div className="grid grid-cols-4 bg-gray-50 px-3 py-1.5 border-b border-gray-100">
            {["Nhân viên", "Giờ làm", "Gross", "Trạng thái"].map((h) => (
              <span key={h} className="text-[8.5px] font-bold text-gray-400 uppercase tracking-wide">{h}</span>
            ))}
          </div>
          {m.rows.map((row, i) => (
            <div key={row.name} className={`grid grid-cols-4 px-3 py-2 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
              <div>
                <p className="text-[9px] font-semibold text-gray-800">{row.name}</p>
                <p className="text-[8px] text-gray-400">{row.role}</p>
              </div>
              <span className="text-[9px] text-gray-600 flex items-center">{row.hours}</span>
              <span className="text-[9px] font-semibold text-gray-800 flex items-center">{row.gross}</span>
              <span className={`text-[8px] font-bold flex items-center`}
                style={{ color: row.status === "Đã duyệt" ? GREEN : "#F59E0B" }}>
                {row.status}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-between items-center px-1">
          <span className="text-[9px] text-gray-400">4 nhân viên · Tổng: 141,000,000đ</span>
          <button className="text-[9px] font-bold px-2 py-1 rounded-lg border" style={{ borderColor: BLUE, color: BLUE }}>
            Chuyển khoản VNPAY
          </button>
        </div>
      </div>
    </div>
  );
}

export function FeaturesTabSection() {
  const [active, setActive] = useState(0);
  const tab = TABS[active];

  return (
    <section id="features" className="py-24" style={{ background: "#F9FAFB" }}>
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center rounded-full px-4 py-1.5 text-[12px] font-semibold mb-4"
            style={{ background: "#EEF2FF", color: BLUE }}>
            Tính năng
          </span>
          <h2 className="lp-headline mb-4"
            style={{ fontSize: 36, fontWeight: 800, color: "#111827", lineHeight: 1.15 }}>
            Mọi thứ team bạn cần
          </h2>
          <p className="text-[16px] leading-relaxed mx-auto" style={{ color: "#6B7280", maxWidth: 520 }}>
            Thay thế Trello + Toggl + Excel + Jira bằng một workspace duy nhất, tiếng Việt, giá hợp lý.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex justify-center mb-10">
          <div className="flex p-1 rounded-xl gap-1" style={{ background: "#F3F4F6", border: "1px solid #E5E7EB" }}>
            {TABS.map((t, i) => (
              <button
                key={t.id}
                onClick={() => setActive(i)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13.5px] font-semibold transition-all duration-150"
                style={
                  active === i
                    ? { background: "#fff", color: BLUE, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }
                    : { color: "#6B7280" }
                }
              >
                <span className="text-[15px]">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2-column content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: feature list */}
          <div>
            <h3 className="lp-headline mb-3" style={{ fontSize: 24, fontWeight: 700, color: "#111827" }}>
              {tab.headline}
            </h3>
            <p className="mb-8 leading-relaxed text-[15px]" style={{ color: "#6B7280" }}>
              {tab.subtext}
            </p>
            <div className="flex flex-col gap-5">
              {tab.features.map((f) => (
                <div key={f.title} className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${BLUE}15` }}>
                    <Check size={13} strokeWidth={2.5} style={{ color: BLUE }} />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold mb-0.5" style={{ color: "#111827" }}>{f.title}</p>
                    <p className="text-[13px] leading-snug" style={{ color: "#6B7280" }}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: mockup */}
          <div className="hidden lg:block">
            {active === 0 && <TaskMockup data={tab.mockup} />}
            {active === 1 && <TimeMockup data={tab.mockup} />}
            {active === 2 && <PayrollMockup data={tab.mockup} />}
          </div>
        </div>
      </div>
    </section>
  );
}
