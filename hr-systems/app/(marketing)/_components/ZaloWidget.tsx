"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";

type Msg = { from: "user" | "bot"; text: string; time: string };

function now() {
  return new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

const BOT_REPLIES: Record<string, string> = {
  default: "Cảm ơn bạn đã liên hệ! Đội hỗ trợ của chúng tôi sẽ phản hồi trong vòng vài phút. Hoặc bạn có thể chat trực tiếp qua Zalo bên dưới để được hỗ trợ nhanh hơn.",
  bảng_giá: "Jobihome có 3 gói: **Starter** (miễn phí), **Growth** (499k/tháng) và **Scale** (999k/tháng). Bạn muốn tư vấn gói nào phù hợp?",
  dùng_thử: "Bạn có thể dùng thử miễn phí 14 ngày, không cần thẻ tín dụng. Nhấn 'Dùng thử' trên menu để bắt đầu ngay!",
  tính_năng: "Jobihome có đầy đủ: quản lý task, chấm công, tính lương, đánh giá KPI và nhiều hơn nữa. Bạn muốn tìm hiểu tính năng cụ thể nào?",
};

function getBotReply(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("giá") || t.includes("pricing") || t.includes("phí")) return BOT_REPLIES.bảng_giá;
  if (t.includes("thử") || t.includes("trial") || t.includes("free")) return BOT_REPLIES.dùng_thử;
  if (t.includes("tính năng") || t.includes("feature") || t.includes("module")) return BOT_REPLIES.tính_năng;
  return BOT_REPLIES.default;
}

const QUICK_REPLIES = ["Bảng giá?", "Dùng thử miễn phí", "Xem tính năng"];

export function ZaloWidget() {
  const [chatOpen, setChatOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: "bot", text: "Xin chào! 👋 Mình là trợ lý của jobihome.vn. Mình có thể giúp gì cho bạn?", time: now() },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatOpen) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, chatOpen, typing]);

  function send(text: string) {
    const t = text.trim();
    if (!t) return;
    const userMsg: Msg = { from: "user", text: t, time: now() };
    setMsgs((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { from: "bot", text: getBotReply(t), time: now() }]);
    }, 900);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2.5">

      {/* ── Chat panel ── */}
      {chatOpen && (
        <div
          className="flex flex-col overflow-hidden"
          style={{
            width: 340, height: 480, borderRadius: 18,
            background: "#fff",
            boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
            border: "1px solid #E5E7EB",
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ background: "linear-gradient(135deg,#2F6BFF,#1a3fa8)" }}>
            <div className="relative flex-shrink-0">
              <div className="grid place-items-center rounded-full" style={{ width: 38, height: 38, background: "rgba(255,255,255,0.2)" }}>
                <MessageCircle size={20} color="#fff" />
              </div>
              <span className="absolute bottom-0 right-0 block w-2.5 h-2.5 rounded-full bg-green-400" style={{ border: "2px solid #2F6BFF" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm leading-tight">jobihome Support</p>
              <p className="text-[0.72rem]" style={{ color: "rgba(255,255,255,0.75)" }}>● Online · Phản hồi trong vài phút</p>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="grid place-items-center rounded-full flex-shrink-0 transition-colors"
              style={{ width: 32, height: 32, background: "rgba(255,255,255,0.15)", color: "#fff" }}
              aria-label="Đóng chat"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3" style={{ background: "#F8FAFC" }}>
            {msgs.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.from === "user" ? "flex-row-reverse" : "flex-row"}`}>
                {m.from === "bot" && (
                  <div className="grid place-items-center rounded-full flex-shrink-0 self-end" style={{ width: 28, height: 28, background: "linear-gradient(135deg,#2F6BFF,#1a3fa8)" }}>
                    <MessageCircle size={14} color="#fff" />
                  </div>
                )}
                <div className="flex flex-col gap-0.5" style={{ maxWidth: "76%" }}>
                  <div
                    className="text-sm leading-relaxed px-3 py-2"
                    style={{
                      borderRadius: m.from === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                      background: m.from === "user" ? "#2F6BFF" : "#fff",
                      color: m.from === "user" ? "#fff" : "#1E293B",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                    }}
                  >
                    {m.text}
                  </div>
                  <span className="text-[0.68rem] text-gray-400 px-1">{m.time}</span>
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex gap-2 items-end">
                <div className="grid place-items-center rounded-full flex-shrink-0" style={{ width: 28, height: 28, background: "linear-gradient(135deg,#2F6BFF,#1a3fa8)" }}>
                  <MessageCircle size={14} color="#fff" />
                </div>
                <div className="px-3 py-2 rounded-2xl flex gap-1 items-center" style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="block rounded-full bg-gray-400" style={{ width: 6, height: 6, animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies */}
          <div className="flex gap-1.5 px-4 py-2 flex-wrap flex-shrink-0" style={{ borderTop: "1px solid #F1F5F9" }}>
            {QUICK_REPLIES.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                className="text-xs px-3 py-1.5 rounded-full transition-colors"
                style={{ border: "1px solid #2F6BFF", color: "#2F6BFF", background: "transparent", fontWeight: 500 }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#EEF3FF"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-3 flex-shrink-0" style={{ borderTop: "1px solid #F1F5F9" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Nhập tin nhắn..."
              className="flex-1 text-sm outline-none px-3 py-2 rounded-xl"
              style={{ background: "#F1F5F9", color: "#1E293B", border: "none" }}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim()}
              className="grid place-items-center rounded-xl flex-shrink-0 transition-opacity"
              style={{
                width: 36, height: 36,
                background: input.trim() ? "#2F6BFF" : "#E2E8F0",
                color: input.trim() ? "#fff" : "#94A3B8",
              }}
              aria-label="Gửi"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Live chat trigger ── */}
      <button
        onClick={() => setChatOpen((v) => !v)}
        aria-label="Chat hỗ trợ"
        className="group flex items-center gap-2 rounded-full transition-transform hover:scale-105"
        style={{
          height: 44,
          padding: "0 14px 0 10px",
          background: "#fff",
          border: "1px solid #E9ECEF",
          boxShadow: "0 4px 14px rgba(0,0,0,0.10)",
          cursor: "pointer",
        }}
      >
        <MessageCircle size={20} color="#2F6BFF" strokeWidth={2} />
        <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#6B7280", whiteSpace: "nowrap" }}>
          {chatOpen ? "Đóng chat" : "Live chat"}
        </span>
      </button>

      {/* ── Zalo button ── */}
      <a
        href="https://zalo.me"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Liên hệ Zalo"
        className="group flex items-center gap-2 rounded-full transition-transform hover:scale-105"
        style={{
          height: 52,
          padding: "0 16px 0 12px",
          background: "#0068FF",
          boxShadow: "0 4px 16px rgba(0,104,255,0.35)",
        }}
      >
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
          <path d="M16 3C8.8 3 3 8.3 3 14.8c0 3.1 1.3 5.9 3.5 8L5 27l4.5-1.4C11.2 26.5 13.5 27 16 27c7.2 0 13-5.3 13-11.8S23.2 3 16 3z" fill="white" />
          <path d="M10.5 11.5h8l-5.5 7.5H19" stroke="#0068FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>
          Hỗ trợ Zalo
        </span>
      </a>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
