import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "jobihome vs Trello — Thay thế Trello cho team HR Việt Nam",
  description: "So sánh jobihome và Trello: quản lý task + chấm công + lương trong 1 tool. Trello chỉ có Kanban — jobihome có cả hệ sinh thái HR.",
};

const ROWS: { criterion: string; trello: string; jobi: string; trelloOk?: "no" | "partial" }[] = [
  { criterion: "Kanban board", trello: "Tốt — giao diện kéo thả trực quan", jobi: "Kanban đầy đủ + Sprint + List view", trelloOk: "partial" },
  { criterion: "Quản lý deadline & reminder", trello: "Power-Up trả phí, tính năng cơ bản", jobi: "Deadline + auto-remind built-in miễn phí", trelloOk: "partial" },
  { criterion: "Time tracking theo task", trello: "Không có — cần Power-Up Toggl/Harvest", jobi: "Timer start/stop gắn trực tiếp mỗi task", trelloOk: "no" },
  { criterion: "Chấm công nhân viên", trello: "Hoàn toàn không có", jobi: "Check-in/out, work rules, manager duyệt", trelloOk: "no" },
  { criterion: "Tính lương tự động", trello: "Không có", jobi: "Tính lương từ time log, xuất phiếu 1 click", trelloOk: "no" },
  { criterion: "Performance reviews", trello: "Không có", jobi: "Self-review + manager review tích hợp", trelloOk: "no" },
  { criterion: "Phân quyền nâng cao", trello: "Board-level chỉ, không theo vai trò", jobi: "RBAC chi tiết: admin / manager / member", trelloOk: "no" },
  { criterion: "Báo cáo & analytics", trello: "Hạn chế — cần Power-Up trả phí", jobi: "Dashboard realtime, không cần plugin", trelloOk: "no" },
];

const TESTIMONIALS = [
  {
    quote: "Trello đẹp và dễ dùng, nhưng khi team lớn lên tôi cần thêm time tracking, lương, review — mỗi thứ một tool. jobihome gom hết vào một chỗ.",
    name: "Trần Minh Hùng", role: "Product Manager", company: "KiotViet",
    initials: "MH", color: "linear-gradient(135deg, #2F6BFF, #1a3fa8)",
  },
  {
    quote: "Tôi tốn $45/tháng cho Trello Business + Toggl + BambooHR. Chuyển sang jobihome còn 499k — tiết kiệm hơn 4 lần và không phải sync dữ liệu thủ công.",
    name: "Nguyễn Lan Anh", role: "HR Lead", company: "Amanotes",
    initials: "LA", color: "linear-gradient(135deg, #7C3AED, #4F46E5)",
  },
  {
    quote: "Trello tốt cho cá nhân, nhưng không phù hợp để quản lý team 30 người có lương, phép năm và KPI. jobihome làm được tất cả.",
    name: "Lê Quốc Bảo", role: "Founder & CEO", company: "Teko Vietnam",
    initials: "QB", color: "linear-gradient(135deg, #0891B2, #0E7490)",
  },
];

function MacDots() {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-2 h-2 rounded-full bg-red-400" />
      <div className="w-2 h-2 rounded-full bg-yellow-400" />
      <div className="w-2 h-2 rounded-full bg-green-400" />
    </div>
  );
}

export default function CompareTrelloPage() {
  return (
    <>
      {/* Hero */}
      <section className="lp-glow relative overflow-hidden" style={{ padding: "clamp(40px, 5vw, 64px) 0 0", textAlign: "center" }}>
        <span className="lp-blob lp-blob-1" />
        <span className="lp-blob lp-blob-2" />
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <div className="inline-flex items-center gap-0 mb-8 rounded-2xl overflow-hidden" style={{ border: "1px solid var(--lp-border-strong)" }}>
            <span className="flex items-center gap-2 px-5 py-2.5 lp-mono text-[0.78rem] font-bold" style={{ background: "var(--lp-surface)", color: "#0079BF" }}>🟦 Trello</span>
            <span className="px-3 py-2.5 lp-mono text-[0.68rem] font-bold uppercase tracking-wider text-lp-text-3" style={{ background: "var(--lp-surface-2)" }}>vs</span>
            <span className="flex items-center gap-2 px-5 py-2.5 lp-mono text-[0.78rem] font-bold" style={{ background: "var(--lp-surface)", color: "var(--lp-accent-ink)" }}>⚡ jobihome</span>
          </div>
          <h1 className="text-balance font-extrabold mx-auto" style={{ fontSize: "clamp(2.4rem, 5.5vw, 3.8rem)", lineHeight: 1.05, letterSpacing: "-0.035em", maxWidth: "22ch" }}>
            Trello chỉ có Kanban — <span className="lp-grad-text">jobihome</span> có cả <span className="lp-grad-text">hệ sinh thái HR</span>
          </h1>
          <p className="mt-6 mx-auto text-lp-text-2" style={{ fontSize: "clamp(1.05rem, 1.6vw, 1.28rem)", maxWidth: "62ch" }}>
            Trello là tool Kanban tuyệt vời. Nhưng khi team bạn cần chấm công, lương, và review — bạn cần nhiều hơn một board.
          </p>
          <div className="flex gap-3 justify-center mt-8 flex-wrap">
            <Link href="/dat-lich-demo" className="lp-btn lp-btn-primary lp-btn-lg">Xem demo miễn phí</Link>
            <Link href="/pricing" className="lp-btn lp-btn-ghost lp-btn-lg">Xem bảng giá</Link>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section style={{ padding: "clamp(48px, 6vw, 80px) 0" }}>
        <div className="w-full max-w-[900px] mx-auto px-7">
          <div className="lp-card overflow-x-auto" style={{ padding: 0 }}>
            <table className="lp-cmp">
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Tiêu chí</th>
                  <th style={{ color: "#0079BF" }}>🟦 Trello</th>
                  <th style={{ color: "var(--lp-accent-ink)" }}>✅ jobihome</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr key={r.criterion}>
                    <th>{r.criterion}</th>
                    <td style={{ textAlign: "left", color: r.trelloOk === "partial" ? "var(--lp-warn)" : "var(--lp-text-3)" }}>{r.trello}</td>
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
                <p className="text-[1.5rem] font-extrabold leading-none" style={{ color: "var(--lp-warn)" }}>2/8</p>
                <p className="text-[0.78rem] text-lp-text-3 mt-1">tiêu chí Trello đạt đủ</p>
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

      {/* Testimonials */}
      <section style={{ padding: "0 0 clamp(48px, 6vw, 80px)" }}>
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="flex flex-col gap-5 rounded-2xl p-7" style={{ background: "var(--lp-surface)", border: "1px solid var(--lp-border)" }}>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="var(--lp-warn)" stroke="none">
                      <path d="M12 2l2.6 6.3L21 9l-5 4.3L17.5 20 12 16.5 6.5 20 8 13.3 3 9l6.4-.7z" />
                    </svg>
                  ))}
                </div>
                <p className="flex-1 text-[0.95rem] leading-relaxed italic" style={{ color: "var(--lp-text-2)" }}>"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="grid place-items-center rounded-full font-bold flex-shrink-0 text-[13px] text-white" style={{ width: 40, height: 40, background: t.color }}>{t.initials}</div>
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
            <span className="lp-eyebrow lp-center" style={{ justifyContent: "center" }}>Migration · Không mất dữ liệu</span>
            <h2 className="text-balance mt-4 font-extrabold" style={{ fontSize: "clamp(1.9rem, 3.6vw, 2.9rem)", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
              Chuyển từ Trello sang jobihome
            </h2>
            <p className="text-lp-text-2 mt-3">Giữ lại Trello cho cá nhân nếu muốn — jobihome lo team và HR.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="lp-card flex flex-col gap-4">
              <div className="rounded-xl overflow-hidden" style={{ background: "var(--lp-bg)", border: "1px solid var(--lp-border)" }}>
                <div className="px-4 pt-4 pb-3">
                  <MacDots />
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
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="lp-mono text-[0.72rem] font-black" style={{ color: "var(--lp-accent-ink)" }}>01</span>
                  <p className="font-bold text-[1rem]">Tạo tài khoản miễn phí</p>
                </div>
                <p className="text-[0.88rem] text-lp-text-3 leading-snug">Không cần thẻ tín dụng, setup trong 2 phút.</p>
              </div>
            </div>

            <div className="lp-card flex flex-col gap-4">
              <div className="rounded-xl overflow-hidden" style={{ background: "var(--lp-bg)", border: "1px solid var(--lp-border)" }}>
                <div className="px-4 pt-4 pb-3">
                  <MacDots />
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { col: "Cần làm", items: ["Design UI", "Write tests"], accent: "var(--lp-text-3)" },
                      { col: "Đang làm", items: ["API auth"], accent: "var(--lp-accent-ink)" },
                      { col: "Done", items: ["Setup DB", "Schema"], accent: "var(--lp-ok)" },
                    ].map((c) => (
                      <div key={c.col}>
                        <div className="text-[0.6rem] lp-mono mb-1 font-bold" style={{ color: c.accent }}>{c.col}</div>
                        {c.items.map((item) => (
                          <div key={item} className="text-[0.62rem] px-1.5 py-1 rounded mb-1 truncate" style={{ background: "var(--lp-surface)", border: "1px solid var(--lp-border)", color: "var(--lp-text-2)" }}>{item}</div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="lp-mono text-[0.72rem] font-black" style={{ color: "var(--lp-accent-ink)" }}>02</span>
                  <p className="font-bold text-[1rem]">Tạo board Kanban đầu tiên</p>
                </div>
                <p className="text-[0.88rem] text-lp-text-3 leading-snug">Giao diện quen với Trello, thêm time tracking.</p>
              </div>
            </div>

            <div className="lp-card flex flex-col gap-4">
              <div className="rounded-xl overflow-hidden" style={{ background: "var(--lp-bg)", border: "1px solid var(--lp-border)" }}>
                <div className="px-4 pt-4 pb-3">
                  <MacDots />
                  <div className="space-y-1.5">
                    {[{ name: "Minh Anh", role: "Dev", color: "#6366F1" }, { name: "Hoàng Bá", role: "Design", color: "#0891B2" }, { name: "Lan Phương", role: "PM", color: "#7C3AED" }].map((m) => (
                      <div key={m.name} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg" style={{ background: "var(--lp-surface)", border: "1px solid var(--lp-border)" }}>
                        <div className="w-6 h-6 rounded-full grid place-items-center text-[0.6rem] font-bold text-white flex-shrink-0" style={{ background: m.color }}>{m.name[0]}</div>
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
                <p className="text-[0.88rem] text-lp-text-3 leading-snug">Email invite, nhân viên active trong vài phút.</p>
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
                q: "Giao diện jobihome có giống Trello không? Team tôi quen kéo thả rồi.",
                a: "Có Kanban board với drag-and-drop đầy đủ. Nếu team bạn quen với Trello, sẽ cảm thấy thoải mái ngay từ ngày đầu — chỉ là có thêm nhiều tính năng hơn phía sau.",
              },
              {
                q: "Trello free plan của tôi đang dùng có thể chuyển sang jobihome không?",
                a: "Hoàn toàn được. jobihome có gói Starter miễn phí cho team nhỏ. Bạn không cần trả thêm để có time tracking và HR cơ bản — những tính năng Trello không có kể cả ở gói trả phí.",
              },
              {
                q: "Power-Ups của Trello (Calendar, Automation) có tương đương trong jobihome không?",
                a: "Có. Calendar view, deadline reminder và automation rule đều built-in trong jobihome — không cần cài thêm Power-Up hay trả phí riêng.",
              },
              {
                q: "Nếu dùng thử xong không muốn tiếp tục thì sao?",
                a: "Export toàn bộ task và dữ liệu nhân sự ra file .xlsx hoặc .csv bất cứ lúc nào, sau đó hủy tài khoản không cần liên hệ support. Không phí ẩn, không lock-in.",
              },
            ].map((item, i) => (
              <details key={i} style={{ borderBottom: "1px solid var(--lp-border)" }}>
                <summary className="flex items-center justify-between cursor-pointer select-none" style={{ padding: "18px 0", fontSize: "0.97rem", fontWeight: 600, color: "var(--lp-text)", listStyle: "none" }}>
                  {item.q}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="flex-shrink-0 ml-4" style={{ color: "var(--lp-text-3)" }}><path d="M6 9l6 6 6-6" /></svg>
                </summary>
                <p style={{ paddingBottom: 18, fontSize: "0.92rem", lineHeight: 1.7, color: "var(--lp-text-2)" }}>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 0" }}>
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <div className="relative overflow-hidden text-center" style={{ maxWidth: 900, margin: "0 auto", background: "linear-gradient(135deg, #0F1829 0%, #141E35 100%)", border: "1px solid #1E2D5A", borderRadius: 16, padding: "64px 80px" }}>
            <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: -50, left: -50, width: 150, height: 150, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,91,219,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
            <div style={{ fontSize: 18, color: "#6366F1", marginBottom: 16 }} aria-hidden="true">✦</div>
            <h2 style={{ fontSize: 36, fontWeight: 700, color: "#fff", lineHeight: 1.2, letterSpacing: "-0.025em", margin: 0 }}>
              Vượt xa Trello,<br />không cần nhiều tool hơn
            </h2>
            <p style={{ fontSize: 15, color: "#64748B", marginTop: 12, marginBottom: 32 }}>
              Kanban + HR + lương + review trong một workspace. Dùng thử 14 ngày miễn phí.
            </p>
            <div className="flex flex-wrap justify-center" style={{ gap: 8, marginBottom: 32 }}>
              {["🟦 Quen Kanban style", "✓ Không cần thẻ tín dụng", "⚡ Setup trong 5 phút"].map((b) => (
                <span key={b} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #1E2D5A", borderRadius: 100, padding: "5px 14px", fontSize: 12, color: "#94A3B8" }}>{b}</span>
              ))}
            </div>
            <div className="flex flex-wrap justify-center" style={{ gap: 12 }}>
              <Link href="/sign-up" className="lp-cta-primary-indigo" style={{ height: 44, padding: "0 24px", borderRadius: 8, background: "#6366F1", color: "#fff", fontSize: 14, fontWeight: 600, display: "inline-flex", alignItems: "center", textDecoration: "none", whiteSpace: "nowrap", boxShadow: "0 4px 20px rgba(99,102,241,0.3)" }}>Bắt đầu miễn phí →</Link>
              <Link href="/dat-lich-demo" className="lp-cta-demo" style={{ height: 44, padding: "0 24px", borderRadius: 8, background: "transparent", color: "#94A3B8", border: "1px solid #2A3A6E", fontSize: 14, fontWeight: 500, display: "inline-flex", alignItems: "center", textDecoration: "none", whiteSpace: "nowrap" }}>Đặt lịch demo 15 phút</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
