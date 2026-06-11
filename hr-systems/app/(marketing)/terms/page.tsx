import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Điều khoản sử dụng — jobihome.vn",
  description: "Điều khoản sử dụng dịch vụ jobihome.vn — hệ thống quản lý team & nhân sự cho startup Việt.",
};

export default function TermsPage() {
  return (
    <article className="w-full max-w-[760px] mx-auto px-7" style={{ padding: "clamp(48px, 7vw, 92px) 28px clamp(64px, 9vw, 130px)" }}>
      <header className="mb-10">
        <span className="lp-eyebrow">Legal · Terms</span>
        <h1 className="font-extrabold mt-4" style={{ fontSize: "clamp(2rem, 4vw, 2.7rem)", lineHeight: 1.15, letterSpacing: "-0.03em" }}>
          Điều khoản sử dụng
        </h1>
        <p className="lp-mono text-[0.82rem] text-lp-text-3 mt-3">Cập nhật lần cuối: 25/05/2026</p>
      </header>

      <Section title="1. Chấp nhận điều khoản">
        <p>
          Bằng việc đăng ký tài khoản và sử dụng dịch vụ <strong>jobihome.vn</strong> ("Dịch vụ"), bạn đồng ý
          tuân thủ các điều khoản dưới đây. Nếu không đồng ý, vui lòng không sử dụng Dịch vụ.
        </p>
      </Section>

      <Section title="2. Mô tả dịch vụ">
        <p>
          jobihome.vn cung cấp nền tảng phần mềm dạng SaaS giúp các team quản lý nhân sự, công việc,
          thời gian làm việc và bảng lương. Dịch vụ cung cấp dưới dạng "as-is" và có thể thay đổi
          theo thời gian.
        </p>
      </Section>

      <Section title="3. Đăng ký tài khoản">
        <ul>
          <li>Bạn phải đủ 18 tuổi và có năng lực hành vi dân sự đầy đủ để đăng ký.</li>
          <li>Thông tin đăng ký phải chính xác và được cập nhật khi có thay đổi.</li>
          <li>Bạn chịu trách nhiệm bảo mật thông tin đăng nhập của mình.</li>
          <li>Một tài khoản chỉ dành cho 1 cá nhân/tổ chức. Không chia sẻ tài khoản với bên thứ 3.</li>
        </ul>
      </Section>

      <Section title="4. Thanh toán & gia hạn">
        <ul>
          <li>Gói <strong>Free</strong> miễn phí vĩnh viễn với 1 thành viên.</li>
          <li>Gói trả phí: thanh toán theo tháng/năm qua chuyển khoản ngân hàng.</li>
          <li>Sau khi chuyển khoản, gói được kích hoạt trong vòng 24h làm việc.</li>
          <li>Hết hạn không thanh toán → workspace bị chuyển sang trạng thái suspended (chỉ đọc).</li>
          <li>Data không bị xóa trong vòng 90 ngày kể từ ngày suspended.</li>
        </ul>
      </Section>

      <Section title="5. Hoàn tiền">
        <p>
          Chúng tôi áp dụng chính sách hoàn 100% trong vòng <strong>7 ngày</strong> kể từ ngày thanh toán đầu tiên
          nếu bạn không hài lòng với Dịch vụ. Sau 7 ngày, không hoàn tiền cho thời gian đã sử dụng.
        </p>
      </Section>

      <Section title="6. Sử dụng được phép">
        <p>Bạn KHÔNG được sử dụng Dịch vụ để:</p>
        <ul>
          <li>Vi phạm pháp luật Việt Nam hoặc quốc tế</li>
          <li>Upload nội dung độc hại, virus, malware</li>
          <li>Spam, phishing hoặc tấn công người dùng khác</li>
          <li>Reverse engineer, decompile hoặc copy source code</li>
          <li>Bán/cho thuê lại Dịch vụ cho bên thứ 3 không được phép</li>
        </ul>
      </Section>

      <Section title="7. Quyền sở hữu dữ liệu">
        <ul>
          <li>Bạn giữ <strong>toàn quyền sở hữu</strong> dữ liệu bạn đưa vào hệ thống (nhân viên, tasks, time logs...).</li>
          <li>Chúng tôi chỉ có quyền sử dụng dữ liệu để cung cấp Dịch vụ cho bạn.</li>
          <li>Bạn có thể export toàn bộ dữ liệu bất cứ lúc nào qua tính năng Export.</li>
        </ul>
      </Section>

      <Section title="8. Sở hữu trí tuệ">
        <p>
          Source code, design, logo của jobihome.vn là tài sản của chúng tôi. Mọi sao chép, phân phối lại
          mà không có sự đồng ý đều là vi phạm bản quyền.
        </p>
      </Section>

      <Section title="9. Chấm dứt dịch vụ">
        <p>
          Bạn có thể hủy tài khoản bất cứ lúc nào trong phần Settings. Chúng tôi có quyền tạm dừng hoặc
          chấm dứt tài khoản của bạn nếu vi phạm các điều khoản trên.
        </p>
      </Section>

      <Section title="10. Giới hạn trách nhiệm">
        <p>
          jobihome.vn không chịu trách nhiệm cho thiệt hại gián tiếp, mất lợi nhuận, mất dữ liệu phát sinh
          từ việc sử dụng Dịch vụ. Trách nhiệm tối đa giới hạn ở số tiền bạn đã thanh toán trong 12 tháng gần nhất.
        </p>
      </Section>

      <Section title="11. Thay đổi điều khoản">
        <p>
          Chúng tôi có thể cập nhật điều khoản này theo thời gian. Thay đổi quan trọng sẽ được thông báo
          qua email trước 30 ngày.
        </p>
      </Section>

      <Section title="12. Luật áp dụng">
        <p>
          Điều khoản này tuân theo pháp luật <strong>Việt Nam</strong>. Mọi tranh chấp sẽ được giải quyết
          tại Tòa án có thẩm quyền tại Hà Nội.
        </p>
      </Section>

      <Section title="13. Liên hệ">
        <p>
          Email: <a href="mailto:support@jobihome.vn">support@jobihome.vn</a>
        </p>
      </Section>

      <p className="lp-mono text-[0.78rem] text-lp-text-3 italic mt-12 pt-6" style={{ borderTop: "1px solid var(--lp-border)" }}>
        Tài liệu này có giá trị tham khảo. Đối với hợp đồng pháp lý chính thức, vui lòng liên hệ trực tiếp.
      </p>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="font-bold text-lp-text mt-10 mb-3" style={{ fontSize: "1.25rem" }}>{title}</h2>
      <div className="text-lp-text-2 leading-relaxed text-[0.95rem] space-y-2 [&_a]:text-lp-accent-ink [&_a]:underline [&_strong]:text-lp-text [&_ul]:list-disc [&_ul]:pl-6 [&_ul>li]:my-1.5">{children}</div>
    </section>
  );
}
