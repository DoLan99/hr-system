"use client";

import { useState } from "react";

export function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  function getUrl() {
    return typeof window !== "undefined" ? window.location.href : "";
  }

  function copyLink() {
    navigator.clipboard.writeText(getUrl()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const encoded = {
    url: () => encodeURIComponent(getUrl()),
    title: encodeURIComponent(title),
  };

  const BUTTONS = [
    {
      label: "LinkedIn",
      color: "#0A66C2",
      href: () => `https://www.linkedin.com/sharing/share-offsite/?url=${encoded.url()}`,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
          <rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
        </svg>
      ),
    },
    {
      label: "Facebook",
      color: "#1877F2",
      href: () => `https://www.facebook.com/sharer/sharer.php?u=${encoded.url()}`,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
        </svg>
      ),
    },
    {
      label: "X",
      color: "#000",
      href: () => `https://twitter.com/intent/tweet?url=${encoded.url()}&text=${encoded.title}`,
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="rounded-2xl p-5" style={{ background: "var(--lp-surface)", border: "1px solid var(--lp-border)" }}>
      <p className="font-bold text-[0.93rem] mb-4" style={{ color: "var(--lp-text)" }}>Chia sẻ bài viết</p>
      <div className="flex flex-col gap-2">
        {BUTTONS.map((btn) => (
          <a
            key={btn.label}
            href={btn.href()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[0.85rem] font-medium transition-colors"
            style={{
              background: "var(--lp-bg)",
              border: "1px solid var(--lp-border)",
              color: "var(--lp-text-2)",
              textDecoration: "none",
            }}
          >
            <span style={{ color: btn.color, display: "flex", alignItems: "center" }}>{btn.icon}</span>
            Chia sẻ lên {btn.label}
          </a>
        ))}

        {/* Copy link */}
        <button
          onClick={copyLink}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[0.85rem] font-medium transition-colors"
          style={{
            background: copied ? "rgba(74,222,128,0.08)" : "var(--lp-bg)",
            border: `1px solid ${copied ? "rgba(74,222,128,0.3)" : "var(--lp-border)"}`,
            color: copied ? "var(--lp-ok)" : "var(--lp-text-2)",
            cursor: "pointer",
            textAlign: "left",
            width: "100%",
            transition: "background 0.2s, border-color 0.2s, color 0.2s",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", color: copied ? "var(--lp-ok)" : "var(--lp-text-3)" }}>
            {copied ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12l5 5L20 6"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            )}
          </span>
          {copied ? "Đã sao chép link!" : "Sao chép link bài viết"}
        </button>
      </div>

      <p className="text-[0.72rem] mt-4 text-center" style={{ color: "var(--lp-text-3)" }}>
        Share lên LinkedIn — reach tốt nhất với audience HR & startup
      </p>
    </div>
  );
}
