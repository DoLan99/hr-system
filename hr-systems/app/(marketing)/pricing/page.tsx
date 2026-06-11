import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { PLANS, formatVnd } from "@/lib/pricing";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bảng giá — jobihome.vn",
  description: "Ba gói linh hoạt: Solo miễn phí, Starter và Team. Dùng thử 14 ngày, không cần thẻ.",
};

function CheckIco() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12l5 5L20 6" />
    </svg>
  );
}

const FAQ = [
  { q: "Dùng thử có cần thẻ tín dụng không?", a: "Không. Bạn dùng thử đầy đủ tính năng trong 14 ngày mà không cần nhập thẻ. Hết hạn, workspace tự chuyển về gói Solo miễn phí cho đến khi bạn chọn nâng cấp." },
  { q: "Thanh toán bằng cách nào?", a: "Hiện tại jobihome nhận thanh toán qua chuyển khoản ngân hàng (Vietcombank). Sau khi chuyển khoản, gói của bạn được kích hoạt và chúng tôi xuất hóa đơn VAT nếu cần." },
  { q: "Tôi có thể đổi gói giữa chừng không?", a: "Có. Bạn nâng hoặc hạ cấp bất kỳ lúc nào; phần chênh lệch được tính theo tỷ lệ thời gian còn lại trong chu kỳ." },
  { q: "Dữ liệu của team có được tách biệt không?", a: "Mỗi tổ chức là một tenant riêng với dữ liệu hoàn toàn tách biệt (tenant isolation ở tầng database). Không tổ chức nào thấy dữ liệu của tổ chức khác." },
  { q: "Vượt quá số thành viên của gói thì sao?", a: "Hệ thống sẽ nhắc bạn nâng lên gói cao hơn. Gói Team hỗ trợ tới 25 người; nếu team lớn hơn, hãy liên hệ để được tư vấn gói riêng." },
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
      <section className="lp-glow relative overflow-hidden" style={{ padding: "clamp(56px, 8vw, 96px) 0 0", textAlign: "center" }}>
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
      <section style={{ padding: "56px 0 clamp(64px, 9vw, 130px)" }}>
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
            {plans.map((plan) => (
              <div key={plan.id} className={`lp-plan${plan.recommended ? " lp-plan-feature" : ""}`}>
                <div className="pname">{plan.name}</div>
                <div className="pprice">
                  {plan.priceVnd === 0 ? "Miễn phí" : (
                    <>{formatVnd(plan.priceVnd)}<small> /tháng</small></>
                  )}
                </div>
                <p className="pdesc">
                  {plan.priceVnd === 0 ? "Cho freelancer & cá nhân mới bắt đầu quản lý công việc." :
                    plan.id === "STARTER" ? "Cho team đang tăng tốc cần phân quyền và tính lương." :
                      "Cho đội ngũ trưởng thành cần quan sát & bảo mật nâng cao."}
                </p>
                <ul>
                  {plan.features.map((f) => (
                    <li key={f}><CheckIco />{f}</li>
                  ))}
                </ul>
                <Link
                  href={isSignedIn ? "/billing" : "/sign-up"}
                  className={`lp-btn ${plan.recommended ? "lp-btn-primary" : "lp-btn-ghost"} lp-btn-block`}
                >
                  {plan.priceVnd === 0 ? "Bắt đầu miễn phí" : isSignedIn ? "Upgrade ngay" : "Dùng thử 14 ngày"}
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center lp-mono text-[0.88rem] text-lp-text-3 mt-7">
            Thanh toán qua chuyển khoản ngân hàng (Vietcombank) · Xuất hóa đơn VAT theo yêu cầu
          </p>
        </div>
      </section>

      {/* Comparison */}
      <section style={{ background: "var(--lp-bg-elev)", borderTop: "1px solid var(--lp-border)", padding: "clamp(64px, 9vw, 130px) 0" }}>
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <div className="text-center max-w-[680px] mx-auto mb-11">
            <span className="lp-eyebrow lp-center">Compare · So sánh chi tiết</span>
            <h2 className="text-balance mt-4 font-extrabold" style={{ fontSize: "clamp(1.9rem, 3.6vw, 2.9rem)", lineHeight: 1.1, letterSpacing: "-0.03em" }}>Mỗi gói có gì?</h2>
          </div>
          <div className="lp-card overflow-x-auto" style={{ padding: 8 }}>
            <table className="lp-cmp">
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Tính năng</th>
                  <th>Solo</th><th>Starter</th><th>Team</th>
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
      <section style={{ padding: "clamp(64px, 9vw, 130px) 0" }}>
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
      <section style={{ padding: "0 0 clamp(64px, 9vw, 130px)" }}>
        <div className="w-full max-w-[1180px] mx-auto px-7">
          <div className="lp-cta-band">
            <h2 className="text-balance">Thử miễn phí trong 14 ngày</h2>
            <p>Không cần thẻ. Tạo workspace và mời cả team trong vài phút.</p>
            <div className="flex gap-3 justify-center flex-wrap relative">
              <Link href="/sign-up" className="lp-btn lp-btn-primary lp-btn-lg">Bắt đầu ngay</Link>
              <Link href="/tinh-nang" className="lp-btn lp-btn-ghost lp-btn-lg">Xem tính năng</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
