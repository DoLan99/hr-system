"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { LocaleProvider } from "@/lib/i18n/context";

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
    <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={true}>
      <QueryClientProvider client={queryClient}>
        <LocaleProvider initialLocale={locale}>
          {children}
        </LocaleProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
