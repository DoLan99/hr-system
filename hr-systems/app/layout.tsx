import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { cookies } from "next/headers";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Providers } from "./providers";
import { LOCALE_COOKIE, isValidLocale, DEFAULT_LOCALE } from "@/lib/i18n";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400","500","600","700","800"], variable: "--font-plus-jakarta" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jobihome.vn";
const SITE_NAME = "jobihome.vn";
const SITE_DESC = "Hệ thống quản lý team & nhân sự cho startup Việt — tasks, time tracking, payroll, audit trong 1 workspace.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Quản lý team & nhân sự cho startup Việt`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESC,
  keywords: [
    "quản lý nhân sự",
    "HR system",
    "time tracking",
    "task management",
    "payroll",
    "Vietnam SaaS",
    "tech lead",
    "startup tools",
    "jobihome",
  ],
  authors: [{ name: "jobihome.vn", url: SITE_URL }],
  creator: "jobihome.vn",
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: SITE_URL,
    title: `${SITE_NAME} — Quản lý team & nhân sự cho startup Việt`,
    description: SITE_DESC,
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Quản lý team & nhân sự cho startup Việt`,
    description: SITE_DESC,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
};

// Chạy trước React hydration để tránh flash of light theme.
// Đọc localStorage và áp class 'dark' lên <html> nếu cần.
const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('hr-system-theme');
    var theme = stored === 'dark' || stored === 'light' ? stored : 'system';
    var resolved = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;
    if (resolved === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isValidLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;

  return (
    <ClerkProvider>
      <html lang={locale} suppressHydrationWarning>
        <head>
          <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        </head>
        <body className={`${inter.variable} ${plusJakarta.variable} font-sans antialiased`}>
          <Providers locale={locale}>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
