import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { Providers } from "@/app/providers";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "MeowPaid v2",
  description: "Expense tracking and splitting app",
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/icons-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a1a1a",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
