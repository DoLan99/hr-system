"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { LocaleProvider } from "@/lib/i18n/context";
import { ThemeProvider } from "@/lib/contexts/theme-context";
import { Toaster } from "@/components/ui/toaster";

export function Providers({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale?: string;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <LocaleProvider initialLocale={locale}>
          {children}
          <Toaster />
        </LocaleProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
