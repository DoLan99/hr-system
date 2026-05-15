"use client";

import { createContext, useContext, useState, useTransition, ReactNode } from "react";
import {
  Locale,
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  SUPPORTED_LOCALES,
  createTranslator,
  isValidLocale,
} from "./index";

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslateFn;
  isPending: boolean;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale?: string;
}) {
  const [locale, setLocaleState] = useState<Locale>(
    isValidLocale(initialLocale) ? initialLocale : DEFAULT_LOCALE
  );
  const [isPending, startTransition] = useTransition();

  const t = createTranslator(locale);

  function setLocale(newLocale: Locale) {
    if (!SUPPORTED_LOCALES.includes(newLocale)) return;
    startTransition(() => {
      document.cookie = `${LOCALE_COOKIE}=${newLocale};path=/;max-age=${365 * 24 * 60 * 60};SameSite=Lax`;
      setLocaleState(newLocale);
    });
    // persist to DB (fire-and-forget)
    fetch("/api/employees/me/locale", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: newLocale }),
    }).catch(() => {});
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, isPending }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
