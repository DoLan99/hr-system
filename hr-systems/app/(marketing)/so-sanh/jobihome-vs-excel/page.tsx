"use client";

import { useState } from "react";
import Link from "next/link";
import { X, Check, ArrowRight, ChevronDown } from "lucide-react";

const BLUE = "#3B5BDB";
const RED = "#E03131";

const ROWS = [
  { criterion: "Cập nhật dữ liệu realtime", detail: "Thay đổi của một người có thể thấy ngay bởi cả team", excel: { verdict: false, label: "File local, phải gửi qua email/Drive" }, jobi: { verdict: true, label: "Đồng bộ tức thì, mọi thiết bị" } },
  { criterion: "Chấm công tự động", detail: "Ghi nhận giờ làm việc mà không cần nhập tay", excel: { verdict: false, label: "Nhập tay, dễ sai, dễ gian lận" }, jobi: { verdict: true, label: "Check-in qua app, GPS hoặc QR code" } },
  { criterion: "Tính lương tự động", detail: "Từ chấm công → phiếu lương PDF không cần công thức", excel: { verdict: false, label: "Hàng chục công thức IF/VLOOKUP dễ lỗi" }, jobi: { verdict: true, label: "Tự động tính, xuất phiếu lương 1 click" } },
  { criterion: "Phân quyền theo vai trò", detail: "HR, Manager, Accountant chỉ thấy dữ liệu của mình", excel: { verdict: false, label: "Không có phân quyền, ai cũng xem được tất" }, jobi: { verdict: true, label: "Phân quyền chi tiết theo từng tính năng" } },
  { criterion: "Audit log & lịch sử thay đổi", detail: "Biết ai thay đổi gì, lúc nào", excel: { verdict: false, label: "Không có — file bị sửa là mất dấu vết" }, jobi: { verdict: true, label: "Log toàn bộ thao tác, không thể xóa" } },
  { criterion: "Quản lý task & deadline", detail: "Giao việc, theo dõi tiến độ trong cùng một nơi", excel: { verdict: false, label: "Cần công thức phức tạp, không có Kanban" }, jobi: { verdict: true, label: "Kanban, Sprint, Gantt view tích hợp sẵn" } },
  { criterion: "Truy cập trên mobile", detail: "Xem và cập nhật khi không ở văn phòng", excel: { verdict: "partial" as const, label: "App giới hạn, trải nghiệm kém trên điện thoại" }, jobi: { verdict: true, label: "App iOS & Android đầy đủ tính năng" } },
  { criterion: "Báo cáo tự động", detail: "Dashboard và báo cáo cập nhật không cần build lại", excel: { verdict: false, label: "Pivot table mất thời gian, dễ outdated" }, jobi: { verdict: true, label: "Dashboard realtime, xuất PDF/Excel 1 click" } },
];

const STEPS = [
  { n: "01", title: "Tạo tài khoản miễn phí", desc: "Không cần thẻ tín dụng, setup trong 2 phút" },
  { n: "02", title: "Import dữ liệu từ Excel", desc: "Upload file .xlsx, hệ thống tự map dữ liệu" },
  { n: "03", title: "Mời team tham gia", desc: "Gửi email mời, nhân viên nhận link setup ngay" },
];

export default function CompareExcelPage() {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  return (
    <div className="bg-white min-h-screen">
      {/* Hero */}
      <section className="pt-16 pb-20 px-6 text-center relative overflow-hidden"
        style={{ background: "linear-gradient(180deg, #F8F9FF 0%, #fff 100%)" }}>
        <div className="relative max-w-[740px] mx-auto">
          <div className="inline-flex items-center gap-0 mb-8 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
            <span className="flex items-center gap-2 px-5 py-2.5 bg-white text-[13px] font-bold" style={{ color: RED }}>
              <span className="text-lg">📊</span> Excel
            </span>
            <span className="px-3 py-2.5 bg-gray-100 text-[11px] font-black text-gray-400 uppercase tracking-widest">vs</span>
            <span className="flex items-center gap-2 px-5 py-2.5 bg-white text-[13px] font-bold" style={{ color: BLUE }}>
              <span className="text-lg">⚡</span> jobihome
            </span>
          </div>
          <h1 className="text-[36px] lg:text-[50px] font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-5">
            Tại sao 120+ startup Việt<br />
            <span style={{ color: BLUE }}>bỏ Excel</span>{" "}
            <span className="text-gray-400">sang</span>{" "}
            <span style={{ color: BLUE }}>jobihome?</span>
          </h1>
          <p className="text-[16px] text-gray-500 leading-relaxed mb-10 max-w-[520px] mx-auto">
            Excel là công cụ tuyệt vời cho số liệu. Nhưng quản lý team bằng Excel giống như dùng búa để vặn vít — được, nhưng có cái tốt hơn.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/dat-lich-demo"
              className="inline-flex items-center gap-2 h-12 px-7 rounded-xl text-[14.5px] font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: BLUE, boxShadow: `0 4px 20px ${BLUE}40` }}>
              Xem demo miễn phí <ArrowRight size={15} />
            </Link>
            <Link href="/pricing"
              className="inline-flex items-center h-12 px-6 rounded-xl text-[14.5px] font-semibold border transition-colors hover:bg-gray-50"
              style={{ borderColor: "#D1D5DB", color: "#374151" }}>
              Xem bảng giá
            </Link>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="max-w-[900px] mx-auto px-6 pb-20">
        <div className="grid grid-cols-[1fr_1fr_1fr] mb-2 gap-2">
          <div className="col-start-2">
            <div className="rounded-t-2xl py-4 px-5 text-center"
              style={{ background: `${RED}0D`, border: `1px solid ${RED}30`, borderBottom: "none" }}>
              <p className="text-[11px] font-black uppercase tracking-widest mb-1" style={{ color: RED }}>❌ Excel</p>
              <p className="text-[12px] text-gray-400">Phần mềm bảng tính</p>
            </div>
          </div>
          <div>
            <div className="rounded-t-2xl py-4 px-5 text-center"
              style={{ background: `${BLUE}0D`, border: `1px solid ${BLUE}30`, borderBottom: "none" }}>
              <p className="text-[11px] font-black uppercase tracking-widest mb-1" style={{ color: BLUE }}>✅ jobihome</p>
              <p className="text-[12px] text-gray-400">All-in-one HR platform</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #E5E7EB" }}>
          {ROWS.map((row, i) => {
            const isExpanded = expandedRow === i;
            return (
              <div key={row.criterion}>
                <button onClick={() => setExpandedRow(isExpanded ? null : i)}
                  className="w-full grid grid-cols-[1fr_1fr_1fr] items-stretch text-left transition-colors hover:bg-gray-50/70"
                  style={{ borderTop: i === 0 ? "none" : "1px solid #F0F1F3", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                  <div className="px-5 py-4 flex flex-col justify-center gap-0.5 border-r border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="text-[13.5px] font-semibold text-gray-800 leading-snug">{row.criterion}</span>
                      <ChevronDown size={13} className="text-gray-300 flex-shrink-0 transition-transform"
                        style={{ transform: isExpanded ? "rotate(180deg)" : "none" }} />
                    </div>
                    <span className="text-[11.5px] text-gray-400 leading-snug hidden sm:block">{row.detail}</span>
                  </div>
                  <div className="px-4 py-4 flex flex-col items-center justify-center gap-2 border-r"
                    style={{ borderColor: `${RED}20`, background: `${RED}04` }}>
                    {row.excel.verdict === "partial" ? (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center bg-yellow-100">
                        <span className="text-[11px] font-black text-yellow-600">~</span>
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: `${RED}18` }}>
                        <X size={13} color={RED} strokeWidth={2.5} />
                      </div>
                    )}
                    <span className="text-[11.5px] text-center text-gray-500 leading-snug hidden sm:block px-1">{row.excel.label}</span>
                  </div>
                  <div className="px-4 py-4 flex flex-col items-center justify-center gap-2" style={{ background: `${BLUE}06` }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: BLUE }}>
                      <Check size={13} color="#fff" strokeWidth={2.5} />
                    </div>
                    <span className="text-[11.5px] text-center leading-snug font-medium hidden sm:block px-1" style={{ color: `${BLUE}CC` }}>
                      {row.jobi.label}
                    </span>
                  </div>
                </button>
                {isExpanded && (
                  <div className="grid grid-cols-2 gap-px sm:hidden bg-gray-100 border-t border-gray-100">
                    <div className="bg-white px-4 py-3" style={{ background: `${RED}04` }}>
                      <p className="text-[10.5px] font-bold mb-1" style={{ color: RED }}>Excel</p>
                      <p className="text-[12px] text-gray-600 leading-snug">{row.excel.label}</p>
                    </div>
                    <div className="bg-white px-4 py-3" style={{ background: `${BLUE}06` }}>
                      <p className="text-[10.5px] font-bold mb-1" style={{ color: BLUE }}>jobihome</p>
                      <p className="text-[12px] text-gray-600 leading-snug">{row.jobi.label}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl px-5 py-4 flex items-center gap-3" style={{ background: `${RED}08`, border: `1px solid ${RED}25` }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${RED}18` }}>
              <X size={18} color={RED} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[22px] font-extrabold leading-none" style={{ color: RED }}>1/8</p>
              <p className="text-[12px] text-gray-400 mt-0.5">tiêu chí Excel đạt</p>
            </div>
          </div>
          <div className="rounded-xl px-5 py-4 flex items-center gap-3" style={{ background: `${BLUE}08`, border: `1px solid ${BLUE}25` }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: BLUE }}>
              <Check size={18} color="#fff" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[22px] font-extrabold leading-none" style={{ color: BLUE }}>8/8</p>
              <p className="text-[12px] text-gray-400 mt-0.5">tiêu chí jobihome đạt</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="max-w-[700px] mx-auto px-6 pb-20">
        <div className="rounded-2xl px-8 py-8" style={{ background: "#F8F9FF", border: `1px solid ${BLUE}20` }}>
          <p className="text-[16px] lg:text-[18px] text-gray-700 leading-[1.8] mb-6 italic">
            "Chúng tôi đã dùng Excel suốt 3 năm. Khi chuyển sang jobihome, tôi không hiểu tại sao mình không làm sớm hơn — tháng đầu tiên tiết kiệm được 2 ngày làm việc chỉ riêng phần lương."
          </p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0" style={{ background: "#7C3AED" }}>NK</div>
            <div>
              <p className="text-[13.5px] font-bold text-gray-900">Ngọc Kim</p>
              <p className="text-[12px] text-gray-400">Kế toán trưởng · Teko Vietnam</p>
            </div>
          </div>
        </div>
      </section>

      {/* Migration steps */}
      <section className="max-w-[900px] mx-auto px-6 pb-20">
        <div className="text-center mb-10">
          <h2 className="text-[26px] lg:text-[30px] font-extrabold text-gray-900 tracking-tight mb-2">Chuyển đổi chỉ mất 2 phút</h2>
          <p className="text-[14.5px] text-gray-400">Không cần xóa Excel. Chạy song song cho đến khi bạn sẵn sàng.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {STEPS.map((step) => (
            <div key={step.n} className="rounded-2xl p-6 text-center bg-white" style={{ border: "1px solid #E5E7EB" }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-[13px] font-black text-white mx-auto mb-4"
                style={{ background: BLUE, boxShadow: `0 4px 12px ${BLUE}40` }}>
                {step.n}
              </div>
              <p className="text-[14px] font-bold text-gray-900 mb-1">{step.title}</p>
              <p className="text-[12.5px] text-gray-400 leading-snug">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="max-w-[900px] mx-auto px-6 pb-28">
        <div className="rounded-2xl px-8 lg:px-14 py-14 text-center relative overflow-hidden" style={{ background: BLUE }}>
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white opacity-[0.06] pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white opacity-[0.06] pointer-events-none" />
          <div className="relative">
            <p className="text-[13px] font-bold uppercase tracking-widest text-blue-200 mb-3">Sẵn sàng nói lời tạm biệt với Excel?</p>
            <h2 className="text-[28px] lg:text-[36px] font-extrabold text-white tracking-tight leading-tight mb-3">
              Chuyển đổi miễn phí trong 2 phút →
            </h2>
            <p className="text-[15px] text-blue-200 mb-8 max-w-[420px] mx-auto leading-relaxed">
              Import toàn bộ dữ liệu từ Excel. Không mất dữ liệu. Không cần kỹ thuật. Hủy bất cứ lúc nào.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href="/sign-up"
                className="inline-flex items-center gap-2 h-12 px-8 rounded-xl text-[14.5px] font-bold text-white transition-all hover:scale-105"
                style={{ background: "rgba(255,255,255,0.18)", border: "1.5px solid rgba(255,255,255,0.35)" }}>
                Bắt đầu miễn phí <ArrowRight size={15} />
              </Link>
              <Link href="/dat-lich-demo"
                className="inline-flex items-center gap-2 h-12 px-7 rounded-xl text-[14.5px] font-bold transition-all hover:opacity-90"
                style={{ background: "#fff", color: BLUE }}>
                Đặt lịch demo 15 phút
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
