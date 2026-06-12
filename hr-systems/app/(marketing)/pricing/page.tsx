import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { PLANS } from "@/lib/pricing";
import { PricingCards } from "./_components/PricingCards";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bảng giá — jobihome.vn",
  description: "Ba gói linh hoạt: Solo miễn phí, Starter và Team. Dùng thử 14 ngày, không cần thẻ.",
};


const FAQ = [
  { q: "Dùng thử có cần thẻ tín dụng không?", a: "Không. Bạn dùng thử đầy đủ tính năng trong 14 ngày mà không cần nhập thẻ. Hết hạn, workspace tự chuyển về gói Solo miễn phí cho đến khi bạn chọn nâng cấp." },
  { q: "Thanh toán bằng cách nào?", a: "Hiện tại jobihome nhận thanh toán qua chuyển khoản ngân hàng (Vietcombank). Sau khi chuyển khoản, gói của bạn được kích hoạt và chúng tôi xuất hóa đơn VAT nếu cần." },
  { q: "Tôi có thể đổi gói giữa chừng không?", a: "Có. Bạn nâng hoặc hạ cấp bất kỳ lúc nào; phần chênh lệch được tính theo tỷ lệ thời gian còn lại trong chu kỳ." },
  { q: "Dữ liệu của team có được tách biệt không?", a: "Mỗi tổ chức là một tenant riêng với dữ liệu hoàn toàn tách biệt (tenant isolation ở tầng database). Không tổ chức nào thấy dữ liệu của tổ chức khác." },
  { q: "Vượt quá số thành viên của gói thì sao?", a: "Hệ thống sẽ nhắc bạn nâng lên gói cao hơn. Gói Team hỗ trợ tới 25 người; nếu team lớn hơn, hãy liên hệ để được tư vấn gói riêng." },
  { q: "Có hoàn tiền nếu không hài lòng không?", a: "Có. Nếu bạn không hài lòng trong vòng 7 ngày đầu sau khi thanh toán, chúng tôi hoàn tiền 100% — không hỏi lý do. Sau 7 ngày, phí đã thanh toán không hoàn lại nhưng bạn vẫn dùng được đến hết chu kỳ." },
];

const CMP_ROWS: { label: string; values: [string, string, string] }[] = [
  { label: "Số thành viên", values: ["1", "≤ 10", "≤ 25"] },
  { label: "Task management & time log", values: ["✓", "✓", "✓"] },
  { label: "Leave management", values: ["✓", "✓", "✓"] },
  { label: "Phân quyền nâng cao", values: ["—", "✓", "✓"] },
  { label: "Office Time + duyệt", values: ["—", "✓", "✓"] },
  { label: "Salary & Payments", values: ["—", "✓", "✓"] },
  { label: "Performance reviews", values: ["—", "✓", "✓"] },
  { label: "Anomaly detection", values: ["—", "—", "✓"] },
  { label: "Activity heatmap", values: ["—", "—", "✓"] },
  { label: "Vault (password manager)", values: ["—", "—", "✓"] },
  { label: "Lưu trữ audit log", values: ["30 ngày", "90 ngày", "Không giới hạn"] },
  { label: "Hỗ trợ", values: ["Cộng đồng", "Email", "Priority"] },
];

export default async function PricingPage() {
  const session = await auth();
  const isSignedIn = !!session.userId;
  const plans = Object.values(PLANS);

  return (
    <>
      {/* Page hero */}
      <section className="lp-glow relative overflow-hidden" style={{ padding: "clamp(40px, 5vw, 64px) 0 0", textAlign: "center" }}>
        <span className="lp-blob lp-blob-1" />
        <span className="lp-blob lp-blob-2" />
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <span className="lp-eyebrow lp-center" style={{ justifyContent: "center" }}>Pricing · Minh bạch</span>
          <h1 className="text-balance mt-5 font-extrabold mx-auto" style={{ fontSize: "clamp(2.6rem, 6vw, 4.3rem)", lineHeight: 1.02, letterSpacing: "-0.035em", maxWidth: "18ch" }}>
            Giá đơn giản, lớn lên cùng team
          </h1>
          <p className="mt-6 mx-auto text-lp-text-2" style={{ fontSize: "clamp(1.05rem, 1.6vw, 1.28rem)", maxWidth: "60ch" }}>
            Bắt đầu miễn phí một mình, nâng cấp khi đội ngũ phát triển. Dùng thử 14 ngày mọi tính năng trả phí — không cần thẻ tín dụng.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section style={{ padding: "56px 0 clamp(48px, 6vw, 80px)" }}>
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <PricingCards plans={plans} isSignedIn={isSignedIn} />
        </div>
      </section>

      {/* Social proof */}
      <section style={{ padding: "0 0 clamp(48px, 6vw, 80px)" }}>
        <div className="w-full max-w-[1180px] mx-auto px-7">

          {/* Logo strip */}
          <p className="text-center lp-mono text-[0.76rem] uppercase tracking-[0.1em] text-lp-text-3 mb-6">
            Đang được dùng bởi team tại
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-3 mb-14">
            {["KiotViet", "Timo", "Amanotes", "Loship", "Sky Mavis", "Teko"].map((name) => (
              <span key={name} className="lp-mono font-extrabold tracking-tight select-none" style={{ fontSize: "1rem", color: "var(--lp-text-3)", opacity: 0.65 }}>
                {name}
              </span>
            ))}
          </div>

          {/* 3 quote cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                quote: "Starter plan đủ cho team 8 người của tôi. Tính lương, chấm công, phân quyền — không cần thêm tool nào khác. ROI rõ ràng từ tháng đầu tiên.",
                name: "Nguyễn Hoàng Nam", role: "Founder", company: "Teko Vietnam",
                plan: "Starter", initials: "HN", color: "#2F6BFF",
              },
              {
                quote: "Trước đây tốn $120/tháng cho 3 tool riêng lẻ. Chuyển sang Team plan 799k, có thêm audit log và anomaly detection mà không cần hire thêm ops.",
                name: "Trần Minh Châu", role: "CTO", company: "Sky Mavis",
                plan: "Team", initials: "MC", color: "#7C3AED",
              },
              {
                quote: "Dùng thử 14 ngày rồi quyết định ngay — không cần pitch với ban giám đốc vì giá quá hợp lý so với giá trị. Team 15 người, upgrade lên Team plan sau 2 tuần.",
                name: "Lê Thị Phương", role: "HR Manager", company: "Amanotes",
                plan: "Team", initials: "TP", color: "#0891B2",
              },
            ].map((t) => (
              <div key={t.name} className="flex flex-col gap-4 rounded-2xl p-6" style={{ background: "var(--lp-surface)", border: "1px solid var(--lp-border)" }}>
                {/* Stars + plan badge */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill="var(--lp-warn)" stroke="none">
                        <path d="M12 2l2.6 6.3L21 9l-5 4.3L17.5 20 12 16.5 6.5 20 8 13.3 3 9l6.4-.7z" />
                      </svg>
                    ))}
                  </div>
                  <span className="lp-mono text-[0.68rem] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--lp-accent-soft)", color: "var(--lp-accent-ink)", border: "1px solid rgba(47,107,255,0.2)" }}>
                    {t.plan}
                  </span>
                </div>
                <p className="flex-1 text-[0.92rem] leading-relaxed" style={{ color: "var(--lp-text-2)" }}>
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="grid place-items-center rounded-full font-bold flex-shrink-0 text-[12px] text-white" style={{ width: 36, height: 36, background: t.color }}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-[0.88rem] font-semibold" style={{ color: "var(--lp-text)" }}>{t.name}</p>
                    <p className="text-[0.75rem]" style={{ color: "var(--lp-text-3)" }}>{t.role} · {t.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section style={{ background: "var(--lp-bg-elev)", borderTop: "1px solid var(--lp-border)", padding: "clamp(48px, 6vw, 80px) 0" }}>
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <div className="text-center max-w-[680px] mx-auto mb-11">
            <span className="lp-eyebrow lp-center">Compare · So sánh chi tiết</span>
            <h2 className="text-balance mt-4 font-extrabold" style={{ fontSize: "clamp(1.9rem, 3.6vw, 2.9rem)", lineHeight: 1.1, letterSpacing: "-0.03em" }}>Mỗi gói có gì?</h2>
          </div>
          <div className="lp-card overflow-x-auto" style={{ padding: 8 }}>
            <table className="lp-cmp">
              <thead style={{ position: "sticky", top: 66, zIndex: 10 }}>
                <tr style={{ background: "var(--lp-surface)" }}>
                  <th style={{ textAlign: "left", background: "var(--lp-surface)" }}>Tính năng</th>
                  <th style={{ background: "var(--lp-surface)" }}>Solo</th>
                  <th style={{ background: "var(--lp-bg-elev)", color: "var(--lp-accent-ink)", borderBottom: "2px solid var(--lp-accent)" }}>Starter ⭐</th>
                  <th style={{ background: "var(--lp-surface)" }}>Team</th>
                </tr>
              </thead>
              <tbody>
                {CMP_ROWS.map((r) => (
                  <tr key={r.label}>
                    <th>{r.label}</th>
                    {r.values.map((v, i) => (
                      <td key={i} className={v === "✓" ? "yes" : ""}>{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: "clamp(48px, 6vw, 80px) 0" }}>
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <div className="text-center max-w-[680px] mx-auto mb-10">
            <span className="lp-eyebrow lp-center">FAQ · Câu hỏi thường gặp</span>
            <h2 className="text-balance mt-4 font-extrabold" style={{ fontSize: "clamp(1.9rem, 3.6vw, 2.9rem)", lineHeight: 1.1, letterSpacing: "-0.03em" }}>Còn thắc mắc?</h2>
          </div>
          <div className="lp-faq max-w-[760px] mx-auto">
            {FAQ.map((f, i) => (
              <details key={f.q} open={i === 0}>
                <summary>{f.q}<span className="pm" /></summary>
                <p>{f.a}</p>
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
              Thử miễn phí trong 14 ngày
            </h2>
            <p style={{ fontSize: 15, color: "#64748B", marginTop: 12, marginBottom: 32 }}>
              Không cần thẻ tín dụng. Tạo workspace và mời cả team trong vài phút.
            </p>
            <div className="flex flex-wrap justify-center" style={{ gap: 8, marginBottom: 32 }}>
              {["🔒 Bảo mật SSL", "✓ Hủy bất cứ lúc nào", "⚡ Setup trong 5 phút"].map((b) => (
                <span key={b} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #1E2D5A", borderRadius: 100, padding: "5px 14px", fontSize: 12, color: "#94A3B8" }}>{b}</span>
              ))}
            </div>
            <div className="flex flex-wrap justify-center" style={{ gap: 12 }}>
              <Link href="/sign-up" className="lp-cta-primary-indigo" style={{ height: 44, padding: "0 24px", borderRadius: 8, background: "#6366F1", color: "#fff", fontSize: 14, fontWeight: 600, display: "inline-flex", alignItems: "center", textDecoration: "none", whiteSpace: "nowrap", boxShadow: "0 4px 20px rgba(99,102,241,0.3)" }}>
                Bắt đầu miễn phí →
              </Link>
              <Link href="/tinh-nang" className="lp-cta-demo" style={{ height: 44, padding: "0 24px", borderRadius: 8, background: "transparent", color: "#94A3B8", border: "1px solid #2A3A6E", fontSize: 14, fontWeight: 500, display: "inline-flex", alignItems: "center", textDecoration: "none", whiteSpace: "nowrap" }}>
                Xem tính năng
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
