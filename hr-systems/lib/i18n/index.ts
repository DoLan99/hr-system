import en from "@/messages/en.json";
import vi from "@/messages/vi.json";

export type Locale = "en" | "vi";
export const SUPPORTED_LOCALES: Locale[] = ["en", "vi"];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "hr_locale";

const messages: Record<Locale, typeof en> = { en, vi: vi as typeof en };

function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : undefined;
}

export function createTranslator(locale: Locale) {
  const dict = messages[locale] ?? messages[DEFAULT_LOCALE];
  const fallback = messages[DEFAULT_LOCALE];

  return function t(key: string, params?: Record<string, string | number>): string {
    let value =
      getNestedValue(dict as unknown as Record<string, unknown>, key) ??
      getNestedValue(fallback as unknown as Record<string, unknown>, key) ??
      key;

    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        value = value.replace(`{${k}}`, String(v));
      });
    }

    return value;
  };
}

export function isValidLocale(value: unknown): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  vi: "Tiếng Việt",
};
