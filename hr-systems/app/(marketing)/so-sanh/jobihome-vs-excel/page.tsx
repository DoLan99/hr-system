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
      <section className="lp-glow relative overflow-hidden" style={{ padding: "clamp(40px, 5vw, 64px) 0 0", textAlign: "center" }}>
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
      <section style={{ padding: "clamp(48px, 6vw, 80px) 0 clamp(48px, 6vw, 80px)" }}>
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

      {/* Testimonials — 3 cards */}
      <section style={{ padding: "0 0 clamp(48px, 6vw, 80px)" }}>
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                quote: "Tháng đầu tiên chuyển sang jobihome, tôi tiết kiệm được 2 ngày làm việc chỉ riêng phần lương. Không hiểu tại sao mình không làm sớm hơn.",
                name: "Ngọc Kim", role: "Kế toán trưởng", company: "Teko Vietnam",
                initials: "NK", color: "linear-gradient(135deg, var(--lp-accent-2), var(--lp-accent))",
              },
              {
                quote: "Excel không sai, nhưng khi team lên 20 người thì nó trở thành cơn ác mộng. jobihome xử lý hết mà tôi không phải nghĩ gì thêm.",
                name: "Trần Bá Hoàng", role: "Founder & CEO", company: "Loship",
                initials: "BH", color: "linear-gradient(135deg, #7C3AED, #4F46E5)",
              },
              {
                quote: "Import xong trong 10 phút, dữ liệu 2 năm không mất một dòng. Team tôi bắt đầu dùng ngay hôm đó.",
                name: "Phạm Thị Lan", role: "HR Manager", company: "Amanotes",
                initials: "TL", color: "linear-gradient(135deg, #0891B2, #0E7490)",
              },
            ].map((t) => (
              <div
                key={t.name}
                className="flex flex-col gap-5 rounded-2xl p-7"
                style={{ background: "var(--lp-surface)", border: "1px solid var(--lp-border)" }}
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="var(--lp-warn)" stroke="none">
                      <path d="M12 2l2.6 6.3L21 9l-5 4.3L17.5 20 12 16.5 6.5 20 8 13.3 3 9l6.4-.7z" />
                    </svg>
                  ))}
                </div>
                <p className="flex-1 text-[0.95rem] leading-relaxed italic" style={{ color: "var(--lp-text-2)" }}>
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="grid place-items-center rounded-full font-bold flex-shrink-0 text-[13px] text-white"
                    style={{ width: 40, height: 40, background: t.color }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-[0.92rem] font-semibold" style={{ color: "var(--lp-text)" }}>{t.name}</p>
                    <p className="text-[0.78rem]" style={{ color: "var(--lp-text-3)" }}>{t.role} · {t.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Migration steps */}
      <section style={{ padding: "0 0 clamp(48px, 6vw, 80px)" }}>
        <div className="w-full max-w-[900px] mx-auto px-7">
          <div className="text-center mb-10">
            <span className="lp-eyebrow lp-center" style={{ justifyContent: "center" }}>Migration · 2 phút</span>
            <h2 className="text-balance mt-4 font-extrabold" style={{ fontSize: "clamp(1.9rem, 3.6vw, 2.9rem)", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
              Chuyển đổi chỉ mất 2 phút
            </h2>
            <p className="text-lp-text-2 mt-3">Không cần xóa Excel. Chạy song song cho đến khi bạn sẵn sàng.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Step 1 — Tạo tài khoản */}
            <div className="lp-card flex flex-col gap-4">
              <div className="rounded-xl overflow-hidden" style={{ background: "var(--lp-bg)", border: "1px solid var(--lp-border)" }}>
                <div className="px-4 pt-4 pb-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-red-400" /><div className="w-2 h-2 rounded-full bg-yellow-400" /><div className="w-2 h-2 rounded-full bg-green-400" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-[0.7rem] lp-mono text-lp-text-3 mb-2">jobihome.vn/sign-up</div>
                    <div className="rounded-lg p-3 text-center" style={{ background: "var(--lp-surface)", border: "1px solid var(--lp-border)" }}>
                      <div className="w-8 h-8 rounded-full mx-auto mb-2 grid place-items-center" style={{ background: "linear-gradient(135deg, var(--lp-accent-2), var(--lp-accent))" }}>
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      </div>
                      <div className="h-2 rounded w-20 mx-auto mb-1.5" style={{ background: "var(--lp-border-strong)" }} />
                      <div className="h-2 rounded w-16 mx-auto mb-3" style={{ background: "var(--lp-border)" }} />
                      <div className="h-7 rounded-lg w-full" style={{ background: "var(--lp-accent)", opacity: 0.85 }} />
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="lp-mono text-[0.72rem] font-black" style={{ color: "var(--lp-accent-ink)" }}>01</span>
                  <p className="font-bold text-[1rem]">Tạo tài khoản miễn phí</p>
                </div>
                <p className="text-[0.88rem] text-lp-text-3 leading-snug">Không cần thẻ tín dụng, setup trong 2 phút.</p>
              </div>
            </div>

            {/* Step 2 — Import Excel */}
            <div className="lp-card flex flex-col gap-4">
              <div className="rounded-xl overflow-hidden" style={{ background: "var(--lp-bg)", border: "1px solid var(--lp-border)" }}>
                <div className="px-4 pt-4 pb-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-red-400" /><div className="w-2 h-2 rounded-full bg-yellow-400" /><div className="w-2 h-2 rounded-full bg-green-400" />
                  </div>
                  <div className="rounded-xl p-4 text-center" style={{ background: "var(--lp-surface)", border: "2px dashed var(--lp-border-strong)" }}>
                    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-2" style={{ color: "var(--lp-accent-ink)" }}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round"/>
                      <polyline points="17 8 12 3 7 8" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round"/>
                    </svg>
                    <div className="text-[0.72rem] font-semibold mb-1" style={{ color: "var(--lp-text-2)" }}>nhansu_2024.xlsx</div>
                    <div className="text-[0.65rem] text-lp-text-3">Kéo thả hoặc click để upload</div>
                    <div className="mt-2.5 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--lp-border)" }}>
                      <div className="h-full rounded-full" style={{ width: "75%", background: "var(--lp-accent)" }} />
                    </div>
                    <div className="text-[0.65rem] mt-1" style={{ color: "var(--lp-ok)" }}>✓ 247 dòng — mapping thành công</div>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="lp-mono text-[0.72rem] font-black" style={{ color: "var(--lp-accent-ink)" }}>02</span>
                  <p className="font-bold text-[1rem]">Import dữ liệu từ Excel</p>
                </div>
                <p className="text-[0.88rem] text-lp-text-3 leading-snug">Upload file .xlsx, hệ thống tự map dữ liệu.</p>
              </div>
            </div>

            {/* Step 3 — Mời team */}
            <div className="lp-card flex flex-col gap-4">
              <div className="rounded-xl overflow-hidden" style={{ background: "var(--lp-bg)", border: "1px solid var(--lp-border)" }}>
                <div className="px-4 pt-4 pb-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-red-400" /><div className="w-2 h-2 rounded-full bg-yellow-400" /><div className="w-2 h-2 rounded-full bg-green-400" />
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { name: "Minh Anh", role: "Dev", color: "#6366F1" },
                      { name: "Hoàng Bá", role: "Design", color: "#0891B2" },
                      { name: "Lan Phương", role: "PM", color: "#7C3AED" },
                    ].map((m) => (
                      <div key={m.name} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg" style={{ background: "var(--lp-surface)", border: "1px solid var(--lp-border)" }}>
                        <div className="w-6 h-6 rounded-full grid place-items-center text-[0.6rem] font-bold text-white flex-shrink-0" style={{ background: m.color }}>
                          {m.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[0.75rem] font-semibold leading-none" style={{ color: "var(--lp-text)" }}>{m.name}</div>
                          <div className="text-[0.65rem] text-lp-text-3">{m.role}</div>
                        </div>
                        <span className="text-[0.6rem] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(74,222,128,0.12)", color: "var(--lp-ok)" }}>Joined</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="lp-mono text-[0.72rem] font-black" style={{ color: "var(--lp-accent-ink)" }}>03</span>
                  <p className="font-bold text-[1rem]">Mời team tham gia</p>
                </div>
                <p className="text-[0.88rem] text-lp-text-3 leading-snug">Gửi email mời, nhân viên nhận link setup ngay.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: "0 0 clamp(48px, 6vw, 80px)" }}>
        <div className="w-full max-w-[760px] mx-auto px-7">
          <h2 className="text-center font-extrabold mb-8" style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)", letterSpacing: "-0.025em" }}>
            Câu hỏi thường gặp
          </h2>
          <div className="flex flex-col" style={{ gap: 2 }}>
            {[
              {
                q: "Dữ liệu Excel cũ có bị mất không?",
                a: "Không. jobihome đọc file .xlsx và map tự động vào đúng trường dữ liệu. Dữ liệu gốc của bạn không bị xóa — bạn có thể chạy song song Excel và jobihome cho đến khi sẵn sàng chuyển hoàn toàn.",
              },
              {
                q: "File Excel của tôi có nhiều sheet và công thức phức tạp — import được không?",
                a: "Được. Hệ thống hỗ trợ import theo từng sheet, bạn chọn sheet nào cần map. Công thức không cần import — jobihome tự tính lại từ dữ liệu thô (giờ làm, rate, phụ cấp).",
              },
              {
                q: "Import mất bao lâu nếu có hàng nghìn dòng dữ liệu?",
                a: "Thường dưới 2 phút cho file dưới 10.000 dòng. Với dữ liệu lớn hơn, hệ thống xử lý ngầm và thông báo khi xong — bạn không cần chờ màn hình.",
              },
              {
                q: "Nếu dùng thử xong không muốn tiếp tục thì sao?",
                a: "Bạn có thể xuất toàn bộ dữ liệu ra file .xlsx bất cứ lúc nào, rồi hủy tài khoản — không cần liên hệ support. Không có phí ẩn, không bị giữ dữ liệu.",
              },
            ].map((item, i) => (
              <details
                key={i}
                className="group"
                style={{ borderBottom: "1px solid var(--lp-border)", padding: "0" }}
              >
                <summary
                  className="flex items-center justify-between cursor-pointer select-none"
                  style={{ padding: "18px 0", fontSize: "0.97rem", fontWeight: 600, color: "var(--lp-text)", listStyle: "none" }}
                >
                  {item.q}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="flex-shrink-0 ml-4" style={{ color: "var(--lp-text-3)", transition: "transform 0.2s" }}>
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </summary>
                <p style={{ paddingBottom: 18, fontSize: "0.92rem", lineHeight: 1.7, color: "var(--lp-text-2)" }}>
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 0" }}>
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <div
            className="relative overflow-hidden text-center"
            style={{
              maxWidth: 900, margin: "0 auto",
              background: "linear-gradient(135deg, #0F1829 0%, #141E35 100%)",
              border: "1px solid #1E2D5A",
              borderRadius: 16,
              padding: "64px 80px",
            }}
          >
            {/* Corner blobs */}
            <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: -50, left: -50, width: 150, height: 150, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,91,219,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

            <div style={{ fontSize: 18, color: "#6366F1", marginBottom: 16 }} aria-hidden="true">✦</div>

            <h2 style={{ fontSize: 36, fontWeight: 700, color: "#fff", lineHeight: 1.2, letterSpacing: "-0.025em", margin: 0 }}>
              Sẵn sàng nói lời tạm biệt<br />với Excel?
            </h2>

            <p style={{ fontSize: 15, color: "#64748B", marginTop: 12, marginBottom: 32 }}>
              Import toàn bộ dữ liệu từ Excel. Không mất dữ liệu. Không cần kỹ thuật.
            </p>

            <div className="flex flex-wrap justify-center" style={{ gap: 8, marginBottom: 32 }}>
              {["📥 Import từ Excel", "✓ Không mất dữ liệu", "⚡ Hủy bất cứ lúc nào"].map((b) => (
                <span
                  key={b}
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid #1E2D5A",
                    borderRadius: 100,
                    padding: "5px 14px",
                    fontSize: 12,
                    color: "#94A3B8",
                  }}
                >
                  {b}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap justify-center" style={{ gap: 12 }}>
              <Link
                href="/sign-up"
                className="lp-cta-primary-indigo"
                style={{
                  height: 44, padding: "0 24px", borderRadius: 8,
                  background: "#6366F1", color: "#fff",
                  fontSize: 14, fontWeight: 600,
                  display: "inline-flex", alignItems: "center",
                  textDecoration: "none", whiteSpace: "nowrap",
                  boxShadow: "0 4px 20px rgba(99,102,241,0.3)",
                }}
              >
                Bắt đầu miễn phí →
              </Link>
              <Link
                href="/dat-lich-demo"
                className="lp-cta-demo"
                style={{
                  height: 44, padding: "0 24px", borderRadius: 8,
                  background: "transparent", color: "#94A3B8",
                  border: "1px solid #2A3A6E",
                  fontSize: 14, fontWeight: 500,
                  display: "inline-flex", alignItems: "center",
                  textDecoration: "none", whiteSpace: "nowrap",
                }}
              >
                Đặt lịch demo 15 phút
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
