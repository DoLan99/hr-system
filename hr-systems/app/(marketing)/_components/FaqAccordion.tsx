"use client";

import { useState } from "react";

const FAQS = [
  { q: "Có xuất hóa đơn đỏ (VAT) không?", a: "Có. jobihome xuất hóa đơn điện tử đầy đủ theo quy định của Bộ Tài chính Việt Nam. Bạn cung cấp thông tin công ty, chúng tôi xử lý trong 2–3 ngày làm việc." },
  { q: "Thanh toán bằng gì?", a: "Chúng tôi hỗ trợ VNPAY, MoMo, thẻ Visa/Mastercard và chuyển khoản ngân hàng nội địa. Tất cả giao dịch được mã hóa SSL." },
  { q: "Data có bị mất không?", a: "Dữ liệu được mã hóa AES-256, lưu trữ trên AWS Singapore, backup tự động hàng ngày. Bạn có thể xuất toàn bộ dữ liệu bất cứ lúc nào." },
  { q: "Mời nhân viên qua email được không?", a: "Được. Chỉ cần nhập email nhân viên, hệ thống tự gửi lời mời và hướng dẫn setup. Toàn bộ quá trình mất dưới 2 phút." },
  { q: "Hỗ trợ ở đâu?", a: "Gói miễn phí có email support. Gói trả phí có live chat ưu tiên và onboarding 1-1 qua Zalo hoặc Google Meet." },
  { q: "Có app mobile không?", a: "Hiện tại là web responsive (chạy mượt trên mobile browser). App native iOS/Android đang trong roadmap quý 4/2026." },
];

export function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
      {FAQS.map((faq, i) => (
        <div key={i}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-medium text-gray-800 pr-4">{faq.q}</span>
            <svg
              width="16" height="16" viewBox="0 0 16 16" fill="none"
              className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${open === i ? "rotate-180" : ""}`}
            >
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {open === i && (
            <div className="px-6 pb-4 text-sm text-gray-500 leading-[1.75]">{faq.a}</div>
          )}
        </div>
      ))}
    </div>
  );
}
