"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useState } from "react";
import { useTheme, type Theme } from "@/lib/contexts/theme-context";

const OPTIONS: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "Sáng" },
  { value: "dark", icon: Moon, label: "Tối" },
  { value: "system", icon: Monitor, label: "Hệ thống" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const Current = OPTIONS.find((o) => o.value === theme)?.icon ?? Sun;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center w-[34px] h-[34px] rounded-lg transition-colors"
        style={{ color: "var(--dash-text-2)", background: "transparent" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--dash-elev)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
        aria-label="Chuyển theme"
      >
        <Current className="w-[17px] h-[17px]" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-10 z-20 w-36 rounded-xl py-1 shadow-xl"
            style={{
              background: "var(--dash-elev)",
              border: "1px solid var(--dash-border)",
            }}
          >
            {OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = theme === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    setTheme(opt.value);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-[13px] transition-colors"
                  style={{
                    color: active ? "var(--dash-accent-2)" : "var(--dash-text-2)",
                    background: active ? "var(--dash-accent-soft)" : "transparent",
                    fontWeight: active ? 600 : 400,
                  }}
                  onMouseEnter={(e) => {
                    if (!active) (e.currentTarget as HTMLElement).style.background = "var(--dash-elev-2)";
                  }}
                  onMouseLeave={(e) => {
                    if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
