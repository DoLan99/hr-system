"use client";

import { useState } from "react";
import { Globe, Check } from "lucide-react";
import { useLocale } from "@/lib/i18n/context";
import { SUPPORTED_LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function SettingsClient() {
  const { locale, setLocale, t, isPending } = useLocale();
  const [saved, setSaved] = useState(false);

  function handleSelectLocale(newLocale: Locale) {
    if (newLocale === locale) return;
    setLocale(newLocale);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Language Section */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <Globe className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-slate-900">{t("settings.language")}</p>
            <p className="text-[12px] text-slate-500 mt-0.5">{t("settings.languageDescription")}</p>
          </div>
        </div>

        <div className="p-4 space-y-2">
          {SUPPORTED_LOCALES.map((loc) => {
            const isSelected = locale === loc;
            return (
              <button
                key={loc}
                onClick={() => handleSelectLocale(loc)}
                disabled={isPending}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all text-left",
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl leading-none">
                    {loc === "en" ? "🇬🇧" : "🇻🇳"}
                  </span>
                  <div>
                    <p className={cn(
                      "text-[13px] font-medium",
                      isSelected ? "text-blue-700" : "text-slate-800"
                    )}>
                      {LOCALE_LABELS[loc]}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {loc === "en" ? "English (Default)" : "Tiếng Việt"}
                    </p>
                  </div>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {saved && (
          <div className="mx-4 mb-4 px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <p className="text-[13px] text-emerald-700 font-medium">{t("settings.saved")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
