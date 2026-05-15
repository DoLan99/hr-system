import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { Providers } from "./providers";
import { LOCALE_COOKIE, isValidLocale, DEFAULT_LOCALE } from "@/lib/i18n";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HR Management System",
  description: "HR, task and payroll management system",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isValidLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <Providers locale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
