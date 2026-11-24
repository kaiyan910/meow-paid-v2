"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";

import i18n, { initializeBrowserLanguage } from "@/i18n";

/** Sets up per-app query state and initializes the browser's language and PWA. */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    initializeBrowserLanguage();

    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      void navigator.serviceWorker
        .register("/sw.js")
        .catch((error: unknown) => {
          console.warn("MeowPaid service worker registration failed", error);
        });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </QueryClientProvider>
  );
}
