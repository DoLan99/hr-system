"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useState } from "react";
import { useTheme, type Theme } from "@/lib/contexts/theme-context";
import { cn } from "@/lib/utils";

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
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:text-slate-500 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition"
        aria-label="Chuyển theme"
      >
        <Current className="w-[17px] h-[17px]" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-20 w-36 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-card-md py-1">
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
                  className={cn(
                    "flex items-center gap-2 w-full px-3 py-1.5 text-[13px] transition",
                    active
                      ? "text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-950 font-medium"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700",
                  )}
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
