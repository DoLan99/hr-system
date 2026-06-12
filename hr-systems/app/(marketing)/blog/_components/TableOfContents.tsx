"use client";

import { useEffect, useState } from "react";

export interface TocItem {
  id: string;
  title: string;
  level: number;
}

export function TableOfContents({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[];

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the topmost visible heading
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: "0px 0px -70% 0px", threshold: 0 }
    );

    headings.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--lp-surface)", border: "1px solid var(--lp-border)" }}>
      <div className="px-5 pt-5 pb-3" style={{ borderBottom: "1px solid var(--lp-border)" }}>
        <p className="font-bold text-[0.93rem]" style={{ color: "var(--lp-text)" }}>Nội dung bài viết</p>
      </div>
      <nav aria-label="Table of contents" className="p-3">
        <ol className="flex flex-col gap-0.5">
          {items.map((item) => {
            const isActive = activeId === item.id;
            return (
              <li key={item.id} style={{ paddingLeft: item.level === 3 ? 16 : 0 }}>
                <a
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[0.82rem] leading-snug transition-colors"
                  style={{
                    color: isActive ? "var(--lp-accent-ink)" : "var(--lp-text-2)",
                    background: isActive ? "var(--lp-accent-soft)" : "transparent",
                    fontWeight: isActive ? 600 : 400,
                    textDecoration: "none",
                  }}
                >
                  {item.level === 2 && (
                    <span
                      className="flex-shrink-0 rounded-sm"
                      style={{ width: 3, height: 14, background: isActive ? "var(--lp-accent)" : "var(--lp-border-strong)" }}
                    />
                  )}
                  {item.level === 3 && (
                    <span className="flex-shrink-0" style={{ width: 3, height: 3, borderRadius: "50%", background: isActive ? "var(--lp-accent)" : "var(--lp-text-3)" }} />
                  )}
                  {item.title}
                </a>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
