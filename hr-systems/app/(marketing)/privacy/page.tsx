import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chính sách bảo mật — jobihome.vn",
  description: "Chính sách bảo mật và xử lý dữ liệu của jobihome.vn — cam kết bảo vệ thông tin của bạn.",
};

export default function PrivacyPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">Chính sách bảo mật</h1>
        <p className="text-sm text-slate-500 mt-2">Cập nhật lần cuối: 25/05/2026</p>
      </header>

      <Section title="1. Cam kết">
        <p>
          jobihome.vn cam kết bảo vệ dữ liệu cá nhân và thông tin doanh nghiệp của bạn. Chính sách này
          mô tả cách chúng tôi thu thập, sử dụng và bảo vệ thông tin của bạn.
        </p>
      </Section>

      <Section title="2. Thông tin chúng tôi thu thập">
        <p><strong>2.1. Thông tin bạn cung cấp:</strong></p>
        <ul>
          <li>Email, tên, ảnh đại diện (qua Clerk authentication)</li>
          <li>Tên workspace, slug, thông tin tổ chức</li>
          <li>Dữ liệu HR: nhân viên, lương, tasks, time logs</li>
          <li>Mật khẩu khách hàng lưu trong Password Vault (mã hóa AES-256)</li>
        </ul>
        <p><strong>2.2. Thông tin tự động thu thập:</strong></p>
        <ul>
          <li>IP address, user agent, browser, OS</li>
          <li>Activity tracking: thời gian active/idle, page views</li>
          <li>API access log: endpoint, method, duration</li>
          <li>Audit log: mọi thay đổi dữ liệu kèm context</li>
        </ul>
      </Section>

      <Section title="3. Cách chúng tôi sử dụng thông tin">
        <ul>
          <li>Cung cấp và vận hành Dịch vụ</li>
          <li>Authentication, authorization, audit</li>
          <li>Hỗ trợ khách hàng khi có yêu cầu</li>
          <li>Gửi email thông báo quan trọng (billing, security)</li>
          <li>Phân tích usage để cải thiện Dịch vụ (aggregated, anonymous)</li>
        </ul>
        <p>
          Chúng tôi <strong>KHÔNG</strong> bán dữ liệu của bạn cho bên thứ 3.
        </p>
      </Section>

      <Section title="4. Bảo mật dữ liệu">
        <ul>
          <li><strong>Tenant isolation:</strong> Mỗi workspace có dữ liệu cách ly hoàn toàn ở DB level.</li>
          <li><strong>HTTPS/TLS:</strong> Mọi kết nối mã hóa TLS 1.3.</li>
          <li><strong>Mã hóa at-rest:</strong> Password Vault dùng AES-256.</li>
          <li><strong>Backup:</strong> Sao lưu hàng ngày, lưu trữ 30 ngày.</li>
          <li><strong>Audit log:</strong> Mọi thay đổi đều có log với context (ai, khi nào, ở đâu, làm gì).</li>
          <li><strong>Anomaly detection:</strong> Phát hiện hành vi bất thường tự động (off-hours access, bulk delete).</li>
        </ul>
      </Section>

      <Section title="5. Bên thứ 3 chúng tôi sử dụng">
        <ul>
          <li><strong>Clerk</strong> (clerk.com): Authentication & user management.</li>
          <li><strong>Vercel</strong> (vercel.com): Hosting + edge network.</li>
          <li><strong>Neon/Supabase</strong>: Database hosting.</li>
          <li><strong>Resend</strong>: Transactional emails.</li>
        </ul>
        <p>Tất cả các đối tác đều có chính sách bảo mật phù hợp GDPR/SOC 2.</p>
      </Section>

      <Section title="6. Quyền của bạn">
        <p>Bạn có quyền:</p>
        <ul>
          <li><strong>Truy cập:</strong> Xem mọi dữ liệu của workspace qua UI.</li>
          <li><strong>Chỉnh sửa:</strong> Cập nhật/xóa dữ liệu bất cứ lúc nào.</li>
          <li><strong>Export:</strong> Xuất toàn bộ dữ liệu sang CSV/JSON.</li>
          <li><strong>Xóa tài khoản:</strong> Email <a href="mailto:support@jobihome.vn">support@jobihome.vn</a> yêu cầu xóa vĩnh viễn.</li>
        </ul>
      </Section>

      <Section title="7. Thời gian lưu trữ dữ liệu">
        <ul>
          <li>Active workspace: Vô thời hạn (đến khi bạn xóa)</li>
          <li>Workspace suspended: 90 ngày, sau đó xóa</li>
          <li>Audit log: 30/90/Không giới hạn ngày tùy gói</li>
          <li>Backup: 30 ngày rolling</li>
        </ul>
      </Section>

      <Section title="8. Cookies">
        <p>
          Chúng tôi dùng cookies cần thiết để authentication (Clerk session cookie) và theme preference.
          Không có tracking cookies cho mục đích quảng cáo.
        </p>
      </Section>

      <Section title="9. Trẻ em">
        <p>
          Dịch vụ không dành cho trẻ em dưới 16 tuổi. Nếu phát hiện tài khoản của trẻ em, chúng tôi sẽ xóa ngay.
        </p>
      </Section>

      <Section title="10. Thay đổi chính sách">
        <p>
          Chúng tôi có thể cập nhật chính sách này. Thay đổi quan trọng sẽ thông báo qua email trước 30 ngày.
        </p>
      </Section>

      <Section title="11. Liên hệ">
        <p>
          Email: <a href="mailto:support@jobihome.vn">support@jobihome.vn</a>
          <br />
          Mọi yêu cầu về dữ liệu cá nhân: phản hồi trong vòng 7 ngày làm việc.
        </p>
      </Section>

      <p className="text-xs text-slate-500 italic mt-12">
        Tài liệu này có giá trị tham khảo. Để được tư vấn pháp lý đầy đủ, vui lòng liên hệ luật sư.
      </p>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-8 mb-3">{title}</h2>
      <div className="text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed prose prose-slate dark:prose-invert prose-sm">{children}</div>
    </section>
  );
}
