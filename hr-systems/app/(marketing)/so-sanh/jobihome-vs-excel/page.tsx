"use client";

import Link from "next/link";

const ROWS: { criterion: string; excel: string; jobi: string; excelOk?: "no" | "partial" }[] = [
  { criterion: "Cập nhật dữ liệu realtime", excel: "File local, phải gửi qua email/Drive", jobi: "Đồng bộ tức thì, mọi thiết bị", excelOk: "no" },
  { criterion: "Chấm công tự động", excel: "Nhập tay, dễ sai, dễ gian lận", jobi: "Check-in qua app, GPS hoặc QR code", excelOk: "no" },
  { criterion: "Tính lương tự động", excel: "Hàng chục công thức IF/VLOOKUP dễ lỗi", jobi: "Tự động tính, xuất phiếu lương 1 click", excelOk: "no" },
  { criterion: "Phân quyền theo vai trò", excel: "Không có phân quyền, ai cũng xem được tất", jobi: "Phân quyền chi tiết theo từng tính năng", excelOk: "no" },
  { criterion: "Audit log & lịch sử thay đổi", excel: "Không có — file bị sửa là mất dấu vết", jobi: "Log toàn bộ thao tác, không thể xóa", excelOk: "no" },
  { criterion: "Quản lý task & deadline", excel: "Cần công thức phức tạp, không có Kanban", jobi: "Kanban, Sprint, Gantt view tích hợp sẵn", excelOk: "no" },
  { criterion: "Truy cập trên mobile", excel: "App giới hạn, trải nghiệm kém trên điện thoại", jobi: "App iOS & Android đầy đủ tính năng", excelOk: "partial" },
  { criterion: "Báo cáo tự động", excel: "Pivot table mất thời gian, dễ outdated", jobi: "Dashboard realtime, xuất PDF/Excel 1 click", excelOk: "no" },
];

const STEPS = [
  { n: "01", title: "Tạo tài khoản miễn phí", desc: "Không cần thẻ tín dụng, setup trong 2 phút." },
  { n: "02", title: "Import dữ liệu từ Excel", desc: "Upload file .xlsx, hệ thống tự map dữ liệu." },
  { n: "03", title: "Mời team tham gia", desc: "Gửi email mời, nhân viên nhận link setup ngay." },
];

export default function CompareExcelPage() {
  return (
    <>
      {/* Hero */}
      <section className="lp-glow relative overflow-hidden" style={{ padding: "clamp(56px, 8vw, 96px) 0 0", textAlign: "center" }}>
        <span className="lp-blob lp-blob-1" />
        <span className="lp-blob lp-blob-2" />
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <div className="inline-flex items-center gap-0 mb-8 rounded-2xl overflow-hidden" style={{ border: "1px solid var(--lp-border-strong)" }}>
            <span className="flex items-center gap-2 px-5 py-2.5 lp-mono text-[0.78rem] font-bold" style={{ background: "var(--lp-surface)", color: "var(--lp-warn)" }}>📊 Excel</span>
            <span className="px-3 py-2.5 lp-mono text-[0.68rem] font-bold uppercase tracking-wider text-lp-text-3" style={{ background: "var(--lp-surface-2)" }}>vs</span>
            <span className="flex items-center gap-2 px-5 py-2.5 lp-mono text-[0.78rem] font-bold" style={{ background: "var(--lp-surface)", color: "var(--lp-accent-ink)" }}>⚡ jobihome</span>
          </div>
          <h1 className="text-balance font-extrabold mx-auto" style={{ fontSize: "clamp(2.4rem, 5.5vw, 3.8rem)", lineHeight: 1.05, letterSpacing: "-0.035em", maxWidth: "20ch" }}>
            Tại sao startup Việt <span className="lp-grad-text">bỏ Excel</span> sang <span className="lp-grad-text">jobihome?</span>
          </h1>
          <p className="mt-6 mx-auto text-lp-text-2" style={{ fontSize: "clamp(1.05rem, 1.6vw, 1.28rem)", maxWidth: "60ch" }}>
            Excel là công cụ tuyệt vời cho số liệu. Nhưng quản lý team bằng Excel giống như dùng búa để vặn vít — được, nhưng có cái tốt hơn.
          </p>
          <div className="flex gap-3 justify-center mt-8 flex-wrap">
            <Link href="/dat-lich-demo" className="lp-btn lp-btn-primary lp-btn-lg">Xem demo miễn phí</Link>
            <Link href="/pricing" className="lp-btn lp-btn-ghost lp-btn-lg">Xem bảng giá</Link>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section style={{ padding: "clamp(64px, 9vw, 100px) 0 clamp(64px, 9vw, 130px)" }}>
        <div className="w-full max-w-[900px] mx-auto px-7">
          <div className="lp-card overflow-x-auto" style={{ padding: 0 }}>
            <table className="lp-cmp">
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Tiêu chí</th>
                  <th style={{ color: "var(--lp-warn)" }}>❌ Excel</th>
                  <th style={{ color: "var(--lp-accent-ink)" }}>✅ jobihome</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr key={r.criterion}>
                    <th>{r.criterion}</th>
                    <td style={{ textAlign: "left", color: "var(--lp-text-3)" }}>{r.excel}</td>
                    <td className="yes" style={{ textAlign: "left", fontWeight: 500 }}>{r.jobi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="lp-card flex items-center gap-3" style={{ padding: 18 }}>
              <div className="w-10 h-10 rounded-full grid place-items-center flex-shrink-0" style={{ background: "rgba(217,119,6,0.18)" }}>
                <span className="text-xl" style={{ color: "var(--lp-warn)" }}>✕</span>
              </div>
              <div>
                <p className="text-[1.5rem] font-extrabold leading-none" style={{ color: "var(--lp-warn)" }}>1/8</p>
                <p className="text-[0.78rem] text-lp-text-3 mt-1">tiêu chí Excel đạt</p>
              </div>
            </div>
            <div className="lp-card flex items-center gap-3" style={{ padding: 18 }}>
              <div className="w-10 h-10 rounded-full grid place-items-center flex-shrink-0" style={{ background: "var(--lp-accent)" }}>
                <span className="text-xl text-white">✓</span>
              </div>
              <div>
                <p className="text-[1.5rem] font-extrabold leading-none text-lp-accent-ink">8/8</p>
                <p className="text-[0.78rem] text-lp-text-3 mt-1">tiêu chí jobihome đạt</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section style={{ padding: "0 0 clamp(64px, 9vw, 130px)" }}>
        <div className="w-full max-w-[760px] mx-auto px-7">
          <div className="lp-card" style={{ background: "var(--lp-accent-soft)", borderColor: "var(--lp-accent-soft-2)" }}>
            <p className="text-[1.05rem] leading-[1.8] italic mb-6 text-lp-text">
              "Chúng tôi đã dùng Excel suốt 3 năm. Khi chuyển sang jobihome, tôi không hiểu tại sao mình không làm sớm hơn — tháng đầu tiên tiết kiệm được 2 ngày làm việc chỉ riêng phần lương."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full grid place-items-center text-[13px] font-bold text-white flex-shrink-0" style={{ background: "linear-gradient(135deg, var(--lp-accent-2), var(--lp-accent))" }}>NK</div>
              <div>
                <p className="text-[0.92rem] font-bold">Ngọc Kim</p>
                <p className="text-[0.78rem] text-lp-text-3">Kế toán trưởng · Teko Vietnam</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Migration steps */}
      <section style={{ padding: "0 0 clamp(64px, 9vw, 130px)" }}>
        <div className="w-full max-w-[900px] mx-auto px-7">
          <div className="text-center mb-10">
            <span className="lp-eyebrow lp-center" style={{ justifyContent: "center" }}>Migration · 2 phút</span>
            <h2 className="text-balance mt-4 font-extrabold" style={{ fontSize: "clamp(1.9rem, 3.6vw, 2.9rem)", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
              Chuyển đổi chỉ mất 2 phút
            </h2>
            <p className="text-lp-text-2 mt-3">Không cần xóa Excel. Chạy song song cho đến khi bạn sẵn sàng.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {STEPS.map((step) => (
              <div key={step.n} className="lp-card text-center">
                <div className="w-12 h-12 rounded-full grid place-items-center lp-mono font-black text-white mx-auto mb-4" style={{ background: "linear-gradient(135deg, var(--lp-accent-2), var(--lp-accent))", boxShadow: "var(--lp-shadow-accent)" }}>
                  {step.n}
                </div>
                <p className="font-bold text-[1rem] mb-1">{step.title}</p>
                <p className="text-[0.88rem] text-lp-text-3 leading-snug">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "0 0 clamp(64px, 9vw, 130px)" }}>
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <div className="lp-cta-band">
            <h2 className="text-balance">Sẵn sàng nói lời tạm biệt với Excel?</h2>
            <p>Import toàn bộ dữ liệu từ Excel. Không mất dữ liệu. Không cần kỹ thuật. Hủy bất cứ lúc nào.</p>
            <div className="flex gap-3 justify-center flex-wrap relative">
              <Link href="/sign-up" className="lp-btn lp-btn-primary lp-btn-lg">Bắt đầu miễn phí</Link>
              <Link href="/dat-lich-demo" className="lp-btn lp-btn-ghost lp-btn-lg">Đặt lịch demo 15 phút</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
