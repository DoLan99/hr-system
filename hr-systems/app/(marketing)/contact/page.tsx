import type { Metadata } from "next";
import { Mail, MessageCircle, Bug, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Liên hệ — jobihome.vn",
  description: "Kênh liên hệ với đội ngũ jobihome.vn — support, hợp tác, báo bug.",
};

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 space-y-12">
      <header className="text-center space-y-3">
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-slate-100">Liên hệ</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Có câu hỏi? Cần hỗ trợ? Muốn báo bug? Chúng tôi sẵn sàng hỗ trợ.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <ContactCard
          icon={<Mail className="w-5 h-5" />}
          title="Email Support"
          value="support@jobihome.vn"
          href="mailto:support@jobihome.vn"
          desc="Phản hồi trong vòng 24h (T2-T6)"
        />
        <ContactCard
          icon={<MessageCircle className="w-5 h-5" />}
          title="Zalo OA"
          value="@jobihome"
          desc="Hỗ trợ nhanh qua Zalo"
        />
        <ContactCard
          icon={<Bug className="w-5 h-5" />}
          title="Báo bug / Feature request"
          value="bugs@jobihome.vn"
          href="mailto:bugs@jobihome.vn"
          desc="Cho người dùng kỹ thuật"
        />
        <ContactCard
          icon={<Clock className="w-5 h-5" />}
          title="Giờ làm việc"
          value="T2 - T6 · 9h - 18h"
          desc="Email ngoài giờ phản hồi T2 tiếp theo"
        />
      </div>

      <section className="rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 p-6 space-y-3">
        <h2 className="text-lg font-bold text-blue-900 dark:text-blue-200">📋 Khi liên hệ support, vui lòng kèm:</h2>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1.5 list-disc list-inside">
          <li>Tên workspace (slug) của bạn</li>
          <li>Email tài khoản</li>
          <li>Mô tả vấn đề + screenshot (nếu có)</li>
          <li>Browser + OS</li>
          <li>Mã đơn hàng / số tiền chuyển khoản (nếu liên quan billing)</li>
        </ul>
      </section>

      <section className="text-center text-sm text-slate-600 dark:text-slate-400 space-y-2">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">Doanh nghiệp / Hợp tác</h3>
        <p>
          Cần gói custom enterprise, white-label, hoặc tích hợp riêng?
          <br />
          Email: <a href="mailto:business@jobihome.vn" className="text-blue-600 hover:underline">business@jobihome.vn</a>
        </p>
      </section>
    </div>
  );
}

function ContactCard({
  icon, title, value, href, desc,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  href?: string;
  desc: string;
}) {
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    href ? (
      <a href={href} className="block hover:border-blue-300 transition">{children}</a>
    ) : (
      <div>{children}</div>
    );

  return (
    <Wrapper>
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 h-full">
        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
          {icon}
        </div>
        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</p>
        <p className="font-semibold text-slate-900 dark:text-slate-100 mt-1">{value}</p>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5">{desc}</p>
      </div>
    </Wrapper>
  );
}
