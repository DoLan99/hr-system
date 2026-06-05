import { BLUE, GREEN } from "../../shared"

const RED = "#E03131"

export interface FeatureStat { value: string; label: string }
export interface FeatureStep { n: string; title: string; desc: string; detail?: string }
export interface FeatureCapability { icon: string; title: string; desc: string }
export interface FeatureTestimonial { quote: string; name: string; role: string; initials: string; bg: string }
export interface RelatedFeature { slug: string; icon: string; label: string; desc: string }

export interface FeatureData {
  slug: string
  icon: string
  color: string
  colorLight: string
  label: string
  headline: string
  subheadline: string
  tagline: string
  stats: FeatureStat[]
  steps: FeatureStep[]
  capabilities: FeatureCapability[]
  testimonial: FeatureTestimonial
  related: RelatedFeature[]
  mockup: React.ReactNode
}

// ── Mockups ───────────────────────────────────────────────────────────────────

export const KanbanMockup = () => (
  <div
    className="rounded-2xl overflow-hidden select-none"
    style={{ border: "1px solid #E5E7EB", boxShadow: "0 20px 60px rgba(59,91,219,0.12)" }}
  >
    {/* Toolbar */}
    <div className="bg-gray-50 px-4 py-2.5 flex items-center gap-2 border-b border-gray-200">
      <div className="flex gap-1.5">
        {["#F87171","#FBBF24","#34D399"].map(c => (
          <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
        ))}
      </div>
      <div className="flex-1 bg-white rounded-md px-3 py-1 text-[10px] text-gray-300 border border-gray-200 text-center max-w-[160px] mx-auto">
        app.jobihome.vn/kanban
      </div>
    </div>
    {/* Kanban columns */}
    <div className="bg-gray-50 p-3 flex gap-2.5 overflow-hidden" style={{ minHeight: 280 }}>
      {[
        { col: "Cần làm", dot: "#9CA3AF", cards: [
          { title: "Thiết kế onboarding UI", tag: "Design", tagC: "#EDE9FE", tagT: "#6D28D9", p: null, av: "MT", avC: BLUE },
          { title: "Review API docs v2", tag: "Dev", tagC: "#DBEAFE", tagT: "#1D4ED8", p: null, av: "DH", avC: "#7C3AED" },
        ]},
        { col: "Đang làm", dot: BLUE, cards: [
          { title: "Tích hợp VNPAY", tag: "Dev", tagC: "#DBEAFE", tagT: "#1D4ED8", p: 65, av: "NK", avC: "#0CA678" },
          { title: "Viết blog SEO Q2", tag: "Marketing", tagC: "#FCE7F3", tagT: "#BE185D", p: 38, av: "LA", avC: "#EA580C" },
        ]},
        { col: "Xong", dot: GREEN, cards: [
          { title: "Setup CI/CD staging", tag: "DevOps", tagC: "#D1FAE5", tagT: "#065F46", p: 100, av: "MT", avC: BLUE },
        ]},
      ].map((col) => (
        <div key={col.col} className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-2 px-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: col.dot }} />
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{col.col}</span>
            <span className="ml-auto text-[9px] font-bold text-gray-300">{col.cards.length}</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {col.cards.map((card) => (
              <div key={card.title} className="bg-white rounded-xl p-2.5 shadow-sm border border-gray-100">
                <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-md mb-1.5" style={{ background: card.tagC, color: card.tagT }}>{card.tag}</span>
                <p className="text-[10px] font-semibold text-gray-700 leading-snug mb-2">{card.title}</p>
                {card.p !== null && (
                  <div className="mb-2">
                    <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${card.p}%`, background: card.p === 100 ? GREEN : BLUE }} />
                    </div>
                    <p className="text-[8px] text-gray-400 mt-0.5 text-right">{card.p}%</p>
                  </div>
                )}
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ background: card.avC }}>{card.av}</div>
              </div>
            ))}
            <div className="border border-dashed border-gray-200 rounded-xl py-2 text-center text-[9px] text-gray-300 cursor-pointer hover:border-blue-200">+ Thêm task</div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

export const TimeMockup = () => (
  <div className="rounded-2xl overflow-hidden select-none" style={{ border: "1px solid #E5E7EB", boxShadow: "0 20px 60px rgba(59,91,219,0.12)" }}>
    <div className="bg-gray-50 px-4 py-2.5 flex items-center gap-2 border-b border-gray-200">
      <div className="flex gap-1.5">{["#F87171","#FBBF24","#34D399"].map(c=><div key={c} className="w-2.5 h-2.5 rounded-full" style={{background:c}}/>)}</div>
      <div className="flex-1 bg-white rounded-md px-3 py-1 text-[10px] text-gray-300 border border-gray-200 text-center max-w-[160px] mx-auto">Chấm công · Tháng 6/2025</div>
    </div>
    <div className="bg-white p-4">
      {/* Summary row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: "Đúng giờ", value: "18", unit: "ngày", color: GREEN, bg: "#ECFDF5" },
          { label: "Đi muộn", value: "2", unit: "ngày", color: "#F59E0B", bg: "#FFFBEB" },
          { label: "Tổng giờ", value: "168", unit: "giờ", color: BLUE, bg: "#EEF2FF" },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-2.5 text-center" style={{ background: s.bg }}>
            <p className="text-[18px] font-extrabold leading-none" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[8px] text-gray-500 mt-0.5">{s.unit}</p>
            <p className="text-[9px] font-semibold text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>
      {/* Log entries */}
      <div className="flex flex-col gap-1.5">
        {[
          { name: "Minh Tuấn", in: "08:58", out: "18:05", hrs: "9h07", status: "ok" },
          { name: "Ngọc Kim", in: "09:14", out: "17:52", hrs: "8h38", status: "late" },
          { name: "Đức Hiệp", in: "08:45", out: "19:20", hrs: "10h35", status: "ot" },
          { name: "Lan Anh", in: "09:02", out: "18:10", hrs: "9h08", status: "ok" },
        ].map(row => (
          <div key={row.name} className="grid items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100" style={{ gridTemplateColumns: "1fr auto auto auto auto" }}>
            <span className="text-[10px] font-semibold text-gray-700 truncate">{row.name}</span>
            <span className="text-[9px] text-gray-400">▶ {row.in}</span>
            <span className="text-[9px] text-gray-400">■ {row.out}</span>
            <span className="text-[9px] font-bold" style={{ color: row.status === "ot" ? BLUE : "#374151" }}>{row.hrs}</span>
            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{
              background: row.status === "ok" ? "#DCFCE7" : row.status === "late" ? "#FFFBEB" : "#EEF2FF",
              color: row.status === "ok" ? "#15803D" : row.status === "late" ? "#92400E" : BLUE,
            }}>
              {row.status === "ok" ? "Đúng giờ" : row.status === "late" ? "Muộn" : "OT"}
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
)

export const PayrollMockup = () => (
  <div className="rounded-2xl overflow-hidden select-none" style={{ border: "1px solid #E5E7EB", boxShadow: "0 20px 60px rgba(59,91,219,0.12)" }}>
    <div className="bg-gray-50 px-4 py-2.5 flex items-center gap-2 border-b border-gray-200">
      <div className="flex gap-1.5">{["#F87171","#FBBF24","#34D399"].map(c=><div key={c} className="w-2.5 h-2.5 rounded-full" style={{background:c}}/>)}</div>
      <div className="flex-1 bg-white rounded-md px-3 py-1 text-[10px] text-gray-300 border border-gray-200 text-center max-w-[160px] mx-auto">Bảng lương · Tháng 6/2025</div>
    </div>
    <div className="bg-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[11px] font-bold text-gray-800">Tháng 6 / 2025</p>
          <p className="text-[9px] text-gray-400">8 nhân viên · Tự động tính</p>
        </div>
        <div className="flex gap-1.5">
          <div className="h-6 px-3 rounded-lg text-[9px] font-bold flex items-center" style={{ background: "#DCFCE7", color: "#15803D" }}>✓ Đã duyệt</div>
          <div className="h-6 px-3 rounded-lg text-[9px] font-bold flex items-center" style={{ background: BLUE, color: "#fff" }}>↓ PDF</div>
        </div>
      </div>
      {/* Payslip rows */}
      <div className="rounded-xl overflow-hidden border border-gray-100">
        <div className="grid text-[9px] font-bold text-gray-400 uppercase px-3 py-2 bg-gray-50" style={{ gridTemplateColumns: "1fr auto auto auto" }}>
          <span>Nhân viên</span><span>Ngày công</span><span>Gross</span><span>Net</span>
        </div>
        {[
          { name: "Minh Tuấn", days: "22/22", gross: "25.000.000", net: "21.500.000", color: BLUE },
          { name: "Ngọc Kim", days: "20/22", gross: "18.000.000", net: "15.800.000", color: "#7C3AED" },
          { name: "Đức Hiệp", days: "22/22", gross: "22.000.000", net: "19.200.000", color: GREEN },
          { name: "Lan Anh", days: "21/22", gross: "15.000.000", net: "13.500.000", color: "#EA580C" },
        ].map((row, i) => (
          <div key={row.name} className="grid items-center px-3 py-2 border-t border-gray-50" style={{ gridTemplateColumns: "1fr auto auto auto", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold text-white" style={{ background: row.color }}>
                {row.name[0]}
              </div>
              <span className="text-[10px] font-semibold text-gray-700">{row.name}</span>
            </div>
            <span className="text-[9px] text-gray-500 text-right pr-4">{row.days}</span>
            <span className="text-[9px] text-gray-600 text-right pr-4">{row.gross}đ</span>
            <span className="text-[10px] font-bold text-right" style={{ color: GREEN }}>{row.net}đ</span>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-2.5 border-t border-gray-100 flex justify-between items-center">
        <span className="text-[9px] text-gray-400">Tổng chi phí nhân sự</span>
        <span className="text-[12px] font-extrabold" style={{ color: BLUE }}>80.000.000đ</span>
      </div>
    </div>
  </div>
)

export const AuditMockup = () => (
  <div className="rounded-2xl overflow-hidden select-none" style={{ border: "1px solid #E5E7EB", boxShadow: "0 20px 60px rgba(59,91,219,0.12)" }}>
    <div className="bg-gray-50 px-4 py-2.5 flex items-center gap-2 border-b border-gray-200">
      <div className="flex gap-1.5">{["#F87171","#FBBF24","#34D399"].map(c=><div key={c} className="w-2.5 h-2.5 rounded-full" style={{background:c}}/>)}</div>
      <div className="flex-1 bg-white rounded-md px-3 py-1 text-[10px] text-gray-300 border border-gray-200 text-center max-w-[160px] mx-auto">Audit Log · Realtime</div>
    </div>
    <div className="bg-white p-4">
      {/* Alert banner */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl mb-3" style={{ background: "#FFF7ED", border: "1px solid #FED7AA" }}>
        <span className="text-base flex-shrink-0">⚠️</span>
        <div>
          <p className="text-[10px] font-bold text-orange-700">Phát hiện thao tác bất thường</p>
          <p className="text-[9px] text-orange-500 mt-0.5">admin@loship.vn đã tải xuống toàn bộ danh sách lương lúc 02:14 SA từ IP lạ</p>
        </div>
      </div>
      {/* Log entries */}
      <div className="flex flex-col gap-1.5">
        {[
          { time: "02:14 SA", user: "admin", action: "Export salary list", type: "danger", ip: "103.x.x.x" },
          { time: "18:32", user: "NK Kim", action: "Approved payroll Jun", type: "success", ip: "10.0.1.4" },
          { time: "16:05", user: "MT Tuấn", action: "Updated task deadline", type: "info", ip: "10.0.1.2" },
          { time: "14:22", user: "DH Hiệp", action: "Changed user role → Manager", type: "warn", ip: "10.0.1.8" },
          { time: "11:48", user: "LA Anh", action: "Logged in via mobile", type: "info", ip: "Mobile" },
        ].map((log) => (
          <div key={log.time + log.action} className="flex items-start gap-2.5 px-3 py-2 rounded-xl" style={{ background: log.type === "danger" ? "#FFF7ED" : "#FAFAFA", border: `1px solid ${log.type === "danger" ? "#FED7AA" : "#F0F0F0"}` }}>
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full mt-1" style={{ background: log.type === "danger" ? "#F97316" : log.type === "success" ? GREEN : log.type === "warn" ? "#F59E0B" : "#93C5FD" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-gray-700 truncate">{log.action}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] text-gray-400">{log.user}</span>
                <span className="text-[8px] text-gray-300">·</span>
                <span className="text-[9px] text-gray-400">{log.ip}</span>
              </div>
            </div>
            <span className="text-[9px] text-gray-300 flex-shrink-0">{log.time}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
)

export const HeatmapMockup = () => {
  const days = ["T2","T3","T4","T5","T6","T7","CN"]
  const hours = ["8h","10h","12h","14h","16h","18h","20h"]
  const data = [
    [3,5,8,9,7,4,1],[6,8,9,10,8,5,2],[2,4,6,8,9,6,3],
    [7,9,10,9,7,4,1],[5,8,9,8,6,3,0],[1,2,3,2,1,0,0],
    [0,1,1,1,0,0,0],
  ]
  const colorFor = (v: number) => {
    if (v === 0) return "#F3F4F6"
    if (v <= 2) return `${BLUE}25`
    if (v <= 4) return `${BLUE}50`
    if (v <= 6) return `${BLUE}80`
    if (v <= 8) return `${BLUE}BB`
    return BLUE
  }
  return (
    <div className="rounded-2xl overflow-hidden select-none" style={{ border: "1px solid #E5E7EB", boxShadow: "0 20px 60px rgba(59,91,219,0.12)" }}>
      <div className="bg-gray-50 px-4 py-2.5 flex items-center gap-2 border-b border-gray-200">
        <div className="flex gap-1.5">{["#F87171","#FBBF24","#34D399"].map(c=><div key={c} className="w-2.5 h-2.5 rounded-full" style={{background:c}}/>)}</div>
        <div className="flex-1 bg-white rounded-md px-3 py-1 text-[10px] text-gray-300 border border-gray-200 text-center max-w-[160px] mx-auto">Activity Heatmap</div>
      </div>
      <div className="bg-white p-4">
        {/* Member selector */}
        <div className="flex items-center gap-2 mb-3">
          {["Toàn team","MT Tuấn","NK Kim"].map((m,i)=>(
            <button key={m} className="h-6 px-2.5 rounded-lg text-[9px] font-bold" style={i===0 ? { background: BLUE, color: "#fff" } : { background: "#F3F4F6", color: "#6B7280" }}>{m}</button>
          ))}
          <div className="ml-auto flex items-center gap-1 text-[9px] text-gray-400">
            <div className="flex gap-0.5 items-center">
              {[0,2,4,6,8,10].map(v=>(
                <div key={v} className="w-3 h-3 rounded-sm" style={{ background: colorFor(v) }}/>
              ))}
            </div>
            <span>Ít → Nhiều</span>
          </div>
        </div>
        {/* Heatmap grid */}
        <div className="flex gap-1.5">
          <div className="flex flex-col gap-1 justify-around pt-4">
            {hours.map(h=><span key={h} className="text-[8px] text-gray-300 w-5 text-right">{h}</span>)}
          </div>
          <div className="flex-1">
            <div className="flex justify-around mb-1">
              {days.map(d=><span key={d} className="text-[8px] text-gray-400 font-semibold">{d}</span>)}
            </div>
            <div className="flex flex-col gap-1">
              {data.map((row, ri)=>(
                <div key={ri} className="flex gap-1 justify-around">
                  {row.map((v,ci)=>(
                    <div key={ci} className="rounded-sm flex-1 aspect-square" style={{ background: colorFor(v), minHeight: 18 }} title={`${v * 10}% hoạt động`}/>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Peak time callout */}
        <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[9px] text-gray-400">⚡ Giờ vàng team: <strong className="text-gray-700">T4, 14–16h</strong></span>
          <span className="text-[9px] text-gray-400">Bottleneck: <strong style={{ color: RED }}>Thứ 6 chiều</strong></span>
        </div>
      </div>
    </div>
  )
}

// ── Feature data ──────────────────────────────────────────────────────────────

export const FEATURES_DATA: Record<string, FeatureData> = {
  "quan-ly-cong-viec": {
    slug: "quan-ly-cong-viec",
    icon: "☑",
    color: BLUE,
    colorLight: "#EEF2FF",
    label: "Task Management",
    headline: "Mọi task rõ ràng, mọi người đúng việc",
    subheadline: "Từ ý tưởng đến deadline — Kanban, Sprint và Gantt trong một nơi. Không cần Trello, không cần Jira riêng.",
    tagline: "Quản lý công việc",
    stats: [
      { value: "3×", label: "ít cuộc họp hơn" },
      { value: "40%", label: "tăng tốc độ giao việc" },
      { value: "2 phút", label: "setup workspace" },
    ],
    steps: [
      { n: "01", title: "Tạo dự án & sprint", desc: "Đặt tên dự án, thêm thành viên, chọn view (Kanban / Sprint / Gantt).", detail: "Mặc định có 3 cột Cần làm → Đang làm → Xong. Thêm cột tuỳ ý." },
      { n: "02", title: "Giao task cho đúng người", desc: "Kéo thả task vào cột, assign cho thành viên, gắn deadline và priority.", detail: "Sub-task, checklist, file đính kèm — mọi thứ trong 1 card." },
      { n: "03", title: "Theo dõi tiến độ realtime", desc: "Progress bar tự cập nhật. Manager xem toàn bộ team mà không cần hỏi.", detail: "Activity feed, comment inline, @mention — cộng tác ngay trên task." },
      { n: "04", title: "Review & sprint planning", desc: "Burndown chart, velocity report sau mỗi sprint. Planning sprint tiếp trong 30 phút.", detail: "Tự động carry-over task chưa xong sang sprint sau." },
    ],
    capabilities: [
      { icon: "🗂", title: "Kanban & Sprint board", desc: "Drag-drop trực quan. Lọc theo người, tag, deadline, priority." },
      { icon: "📅", title: "Gantt & Timeline view", desc: "Xem phụ thuộc giữa task, milestone, critical path." },
      { icon: "✅", title: "Sub-task & Checklist", desc: "Chia nhỏ task phức tạp. Progress tự tính từ checklist." },
      { icon: "🔔", title: "Thông báo thông minh", desc: "Nhận alert khi task sắp deadline, bị block hoặc có comment mới." },
      { icon: "🏷", title: "Label & Priority", desc: "Phân loại task bằng label màu + 4 mức priority (Urgent/High/Normal/Low)." },
      { icon: "📊", title: "Burndown & Velocity", desc: "Biểu đồ tiến độ sprint tự động — không cần vẽ tay trong Excel." },
    ],
    testimonial: {
      quote: "Trước đây team tôi dùng Trello + Slack + Google Sheet. Từ khi chuyển sang jobihome, mọi thứ ở một nơi — tôi tiết kiệm ít nhất 1 tiếng mỗi ngày không phải check nhiều tab.",
      name: "Đức Hiệp", role: "Product Manager · Base.vn", initials: "DH", bg: GREEN,
    },
    related: [
      { slug: "cham-cong", icon: "⏱", label: "Time Tracking", desc: "Gắn timer vào task, tự động ghi giờ làm." },
      { slug: "heatmap", icon: "📊", label: "Activity Heatmap", desc: "Xem năng suất team theo giờ và ngày." },
      { slug: "audit-log", icon: "📋", label: "Audit Log", desc: "Toàn bộ thao tác trên task đều có log." },
    ],
    mockup: <KanbanMockup />,
  },

  "cham-cong": {
    slug: "cham-cong",
    icon: "⏱",
    color: "#7C3AED",
    colorLight: "#F5F3FF",
    label: "Time Tracking",
    headline: "Chấm công chính xác, không cần máy chấm công",
    subheadline: "Check-in qua app mobile, GPS hoặc QR code. Tự động phát hiện đi muộn, tăng ca — báo cáo realtime không cần tổng hợp.",
    tagline: "Chấm công & Thời gian",
    stats: [
      { value: "0đ", label: "chi phí máy chấm công" },
      { value: "98%", label: "độ chính xác GPS" },
      { value: "30 giây", label: "check-in qua app" },
    ],
    steps: [
      { n: "01", title: "Nhân viên check-in qua app", desc: "Mở app jobihome, nhấn Check-in. GPS xác nhận vị trí tự động.", detail: "Hỗ trợ iOS và Android. Offline mode — sync khi có mạng." },
      { n: "02", title: "Timer tự chạy khi bắt đầu task", desc: "Nhận task trên Kanban → timer tự bắt đầu. Dừng khi done.", detail: "Có thể ghi giờ thủ công cho work từ hôm trước." },
      { n: "03", title: "Hệ thống phát hiện bất thường", desc: "Đi muộn, về sớm, tăng ca — tự động flag và thông báo manager.", detail: "Cấu hình giờ làm việc, policy OT theo từng team/vị trí." },
      { n: "04", title: "Báo cáo tự động cuối tháng", desc: "Bảng chấm công PDF/Excel tổng hợp sẵn, gửi thẳng cho kế toán.", detail: "Link thẳng sang module Payroll để tính lương." },
    ],
    capabilities: [
      { icon: "📱", title: "Check-in mobile & GPS", desc: "Xác thực vị trí qua GPS, không thể check-in hộ người khác." },
      { icon: "🎯", title: "QR Code check-in", desc: "In QR tại văn phòng — quét là xong, không cần mở app." },
      { icon: "⚡", title: "Timer gắn với task", desc: "Thời gian làm việc được gắn trực tiếp vào task đang chạy." },
      { icon: "🚨", title: "Phát hiện đi muộn & OT", desc: "Alert tự động đến Slack/Zalo khi có vi phạm chính sách." },
      { icon: "📈", title: "Báo cáo realtime", desc: "Dashboard giờ làm theo ngày/tuần/tháng. Filter theo team." },
      { icon: "🔗", title: "Kết nối với Payroll", desc: "Dữ liệu chấm công đưa thẳng vào tính lương — không nhập lại." },
    ],
    testimonial: {
      quote: "Chúng tôi có team remote ở 3 thành phố. jobihome giúp tôi biết ai đang làm gì, check-in lúc nào, mà không phải ping hỏi từng người trên Slack.",
      name: "Minh Tuấn", role: "CTO · Loship", initials: "MT", bg: BLUE,
    },
    related: [
      { slug: "tinh-luong", icon: "💰", label: "Payroll & Salary", desc: "Tính lương tự động từ dữ liệu chấm công." },
      { slug: "heatmap", icon: "📊", label: "Activity Heatmap", desc: "Xem pattern làm việc của cả team." },
      { slug: "quan-ly-cong-viec", icon: "☑", label: "Task Management", desc: "Timer gắn trực tiếp với task Kanban." },
    ],
    mockup: <TimeMockup />,
  },

  "tinh-luong": {
    slug: "tinh-luong",
    icon: "💰",
    color: "#059669",
    colorLight: "#ECFDF5",
    label: "Payroll & Salary",
    headline: "Tính lương tự động — từ 2 ngày còn 20 phút",
    subheadline: "Từ bảng chấm công đến phiếu lương PDF — không công thức Excel, không nhập tay, không sai số. Thuế TNCN và BHXH tự động theo luật Việt Nam.",
    tagline: "Lương & Tài chính",
    stats: [
      { value: "2 ngày", label: "→ 20 phút tính lương" },
      { value: "0 lỗi", label: "tính lương mỗi tháng" },
      { value: "100%", label: "tự động từ chấm công" },
    ],
    steps: [
      { n: "01", title: "Import quy tắc lương", desc: "Nhập mức lương cơ bản, hệ số, phụ cấp cho từng nhân viên. Một lần duy nhất.", detail: "Import từ Excel nếu bạn đã có. Sau đó hệ thống tự nhớ." },
      { n: "02", title: "Kết nối dữ liệu chấm công", desc: "Bảng lương tự tính dựa trên ngày công từ module Time Tracking.", detail: "Xử lý OT, đi muộn, nghỉ phép theo đúng policy đã cấu hình." },
      { n: "03", title: "Review và phê duyệt", desc: "Manager/Kế toán xem bảng lương, điều chỉnh nếu cần, nhấn Duyệt.", detail: "Lịch sử chỉnh sửa được ghi lại đầy đủ trong Audit Log." },
      { n: "04", title: "Gửi phiếu lương & thanh toán", desc: "Phiếu lương PDF gửi qua email tự động. Chuyển khoản qua VNPAY/MoMo.", detail: "Xuất file báo cáo kế toán sang MISA/Fast Accounting." },
    ],
    capabilities: [
      { icon: "🧮", title: "Tính lương tự động", desc: "Gross → Net với thuế TNCN, BHXH, BHYT, BHTN đúng luật 2025." },
      { icon: "📄", title: "Phiếu lương điện tử", desc: "PDF đẹp, có chữ ký số. Gửi email tự động cho từng nhân viên." },
      { icon: "🏦", title: "Thanh toán 1 click", desc: "Chuyển khoản hàng loạt qua VNPAY, MoMo, ngân hàng nội địa." },
      { icon: "📋", title: "Hóa đơn VAT", desc: "Xuất hóa đơn điện tử đầy đủ theo quy định Bộ Tài chính." },
      { icon: "🔗", title: "Tích hợp kế toán", desc: "Đồng bộ tự động sang MISA AMIS và Fast Accounting." },
      { icon: "📊", title: "Phân tích chi phí nhân sự", desc: "Biểu đồ chi phí theo phòng ban, so sánh tháng, dự báo." },
    ],
    testimonial: {
      quote: "Tháng đầu dùng jobihome, kế toán team tôi không tin là bảng lương đã xong trong 20 phút. Trước đây mất cả thứ Sáu + Thứ Bảy để check số liệu.",
      name: "Ngọc Kim", role: "Kế toán trưởng · Teko Vietnam", initials: "NK", bg: "#7C3AED",
    },
    related: [
      { slug: "cham-cong", icon: "⏱", label: "Time Tracking", desc: "Nguồn dữ liệu chấm công cho bảng lương." },
      { slug: "audit-log", icon: "📋", label: "Audit Log", desc: "Mọi chỉnh sửa bảng lương đều có lịch sử." },
      { slug: "quan-ly-nhan-su", icon: "👥", label: "Nhân sự", desc: "Hồ sơ nhân viên và phân quyền vai trò." },
    ],
    mockup: <PayrollMockup />,
  },

  "audit-log": {
    slug: "audit-log",
    icon: "📋",
    color: "#B45309",
    colorLight: "#FFFBEB",
    label: "Audit Log",
    headline: "Mọi thao tác đều có dấu vết — không gì bị che giấu",
    subheadline: "Lịch sử đầy đủ mọi hành động trong hệ thống. Phát hiện bất thường tự động. Bằng chứng rõ ràng khi có tranh chấp.",
    tagline: "Bảo mật & Kiểm toán",
    stats: [
      { value: "100%", label: "thao tác được ghi lại" },
      { value: "<1 giây", label: "phát hiện bất thường" },
      { value: "∞", label: "lịch sử (gói Team)" },
    ],
    steps: [
      { n: "01", title: "Mọi thao tác tự động ghi log", desc: "Đăng nhập, thay đổi dữ liệu, export, xóa — tất cả đều được ghi với timestamp và IP.", detail: "Không ai có thể xóa hoặc sửa audit log — kể cả admin." },
      { n: "02", title: "Phát hiện hành động bất thường", desc: "AI phân tích pattern — cảnh báo khi có truy cập lúc bất thường, địa điểm lạ, export hàng loạt.", detail: "Tùy chỉnh ngưỡng cảnh báo theo chính sách công ty." },
      { n: "03", title: "Nhận alert realtime", desc: "Thông báo tức thì qua Slack, Zalo, email khi có event cần xem xét.", detail: "Phân loại alert theo severity: Info / Warning / Critical." },
      { n: "04", title: "Export báo cáo kiểm toán", desc: "Xuất log theo khoảng thời gian, người dùng, loại hành động — định dạng PDF hoặc CSV.", detail: "Dùng cho kiểm toán nội bộ, cơ quan thuế, board review." },
    ],
    capabilities: [
      { icon: "🗒", title: "Log toàn diện", desc: "Ghi lại tên người, hành động, thời gian, IP, thiết bị — không bỏ sót." },
      { icon: "🤖", title: "Phát hiện bất thường tự động", desc: "Machine learning nhận diện pattern lạ: giờ truy cập, địa điểm, volume." },
      { icon: "🔔", title: "Alert realtime đa kênh", desc: "Push notification, Slack, Zalo OA, email — chọn kênh và mức ưu tiên." },
      { icon: "🔍", title: "Tìm kiếm & lọc nâng cao", desc: "Filter log theo user, action type, IP, thời gian — tìm đúng điều cần trong vài giây." },
      { icon: "🔒", title: "Log bất khả xâm phạm", desc: "Lưu trữ append-only, mã hóa SHA-256. Không ai có thể sửa hoặc xóa." },
      { icon: "📤", title: "Export cho kiểm toán", desc: "PDF, CSV chuẩn định dạng để nộp cho kiểm toán nội bộ hoặc cơ quan thuế." },
    ],
    testimonial: {
      quote: "Chúng tôi phát hiện ra một nhân viên đã export toàn bộ danh sách lương trước khi nghỉ việc — nhờ Audit Log của jobihome. Không có tool này, chúng tôi sẽ không bao giờ biết.",
      name: "Hùng Nguyễn", role: "CEO · DataHouse Vietnam", initials: "HN", bg: "#B45309",
    },
    related: [
      { slug: "tinh-luong", icon: "💰", label: "Payroll", desc: "Mọi thay đổi bảng lương đều có log chi tiết." },
      { slug: "quan-ly-cong-viec", icon: "☑", label: "Task Management", desc: "Lịch sử thao tác trên task và dự án." },
      { slug: "cham-cong", icon: "⏱", label: "Time Tracking", desc: "Log check-in/out với GPS và IP address." },
    ],
    mockup: <AuditMockup />,
  },

  "heatmap": {
    slug: "heatmap",
    icon: "📊",
    color: "#0891B2",
    colorLight: "#ECFEFF",
    label: "Activity Heatmap",
    headline: "Nhìn thấy năng suất team — không cần hỏi",
    subheadline: "Visualize giờ làm việc, giờ peak, bottleneck theo ngày và giờ. Biết khi nào team đang tập trung nhất để lên lịch họp đúng lúc.",
    tagline: "Báo cáo & Phân tích",
    stats: [
      { value: "24/7", label: "tracking tự động" },
      { value: "giờ vàng", label: "xác định chính xác" },
      { value: "0 can thiệp", label: "thủ công" },
    ],
    steps: [
      { n: "01", title: "Tự động thu thập dữ liệu", desc: "Mọi hoạt động trên jobihome — check-in, task update, comment — đều được ghi theo timestamp.", detail: "Không cần cài plugin hay tracker riêng. Tích hợp sẵn." },
      { n: "02", title: "Heatmap tự tạo theo ngày/giờ", desc: "Biểu đồ màu hiển thị mật độ hoạt động theo từng khung giờ trong tuần.", detail: "Chọn xem toàn team, theo phòng ban hoặc theo cá nhân." },
      { n: "03", title: "Phát hiện pattern & bottleneck", desc: "jobihome tự highlight giờ peak, giờ dead zone, và cá nhân có pattern bất thường.", detail: "So sánh tuần này vs tuần trước, team A vs team B." },
      { n: "04", title: "Ứng dụng vào lịch họp & sprint", desc: "Gợi ý thời điểm họp, deadline sprint dựa trên khi nào team đang productive nhất.", detail: "Export báo cáo cho leader review hàng tuần." },
    ],
    capabilities: [
      { icon: "🗓", title: "Heatmap ngày × giờ", desc: "Ma trận 7 ngày × 24 giờ, màu càng đậm = càng productive." },
      { icon: "👥", title: "Xem theo team / cá nhân", desc: "Drill down từ toàn tổ chức → phòng ban → từng người." },
      { icon: "📉", title: "Phát hiện bottleneck", desc: "Tự động mark khung giờ có nhiều task bị block hoặc overdue." },
      { icon: "⚡", title: "Giờ vàng team", desc: "AI xác định peak hour khi team productive nhất — gợi ý lên lịch." },
      { icon: "📅", title: "So sánh theo tuần/tháng", desc: "Trend năng suất theo thời gian. Nhận ra impact của thay đổi quy trình." },
      { icon: "🔗", title: "Gắn với dữ liệu task", desc: "Click vào ô heatmap xem cụ thể task nào được làm trong khung giờ đó." },
    ],
    testimonial: {
      quote: "Heatmap cho tôi thấy team dev của tôi productive nhất từ 10h-12h và 15h-17h. Tôi chuyển toàn bộ họp ra ngoài khung đó — năng suất tăng rõ rệt ngay tháng đầu.",
      name: "Lan Anh", role: "Engineering Lead · Ahamove", initials: "LA", bg: "#0891B2",
    },
    related: [
      { slug: "quan-ly-cong-viec", icon: "☑", label: "Task Management", desc: "Dữ liệu task là nguồn chính của heatmap." },
      { slug: "cham-cong", icon: "⏱", label: "Time Tracking", desc: "Giờ check-in/out ảnh hưởng trực tiếp đến heatmap." },
      { slug: "audit-log", icon: "📋", label: "Audit Log", desc: "Mọi hoạt động được log và hiển thị trên heatmap." },
    ],
    mockup: <HeatmapMockup />,
  },
}
