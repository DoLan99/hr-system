"use client";

import { MessageCircle } from "lucide-react";

export function ZaloWidget() {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-2.5">
      {/* Chat button */}
      <a
        href="#"
        aria-label="Chat hỗ trợ"
        className="flex items-center justify-center rounded-full transition-transform hover:scale-105"
        style={{
          width: 44,
          height: 44,
          background: "#fff",
          border: "1.5px solid #E9ECEF",
          boxShadow: "0 4px 14px rgba(0,0,0,0.10)",
        }}
      >
        <MessageCircle size={20} color="#3B5BDB" strokeWidth={2} />
      </a>

      {/* Zalo button */}
      <a
        href="https://zalo.me"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Liên hệ Zalo"
        className="flex items-center justify-center rounded-full transition-transform hover:scale-105"
        style={{
          width: 52,
          height: 52,
          background: "#0068FF",
          boxShadow: "0 4px 16px rgba(0,104,255,0.35)",
        }}
      >
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
          <text x="2" y="20" fontSize="18" fontWeight="bold" fill="white" fontFamily="Arial, sans-serif">Z</text>
        </svg>
      </a>
    </div>
  );
}
