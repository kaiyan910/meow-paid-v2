"use client";

import {
  ArrowLeftRight,
  BarChart3,
  Bot,
  ListOrdered,
  Plus,
  Settings,
} from "lucide-react";
/**
 * MainPage — protected shell layout rendered for all /main/* routes.
 * Consists of a top bar, a scrollable content area,
 * and a bottom navigation bar with four tab links.
 */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMetaStore } from "@/store/meta.store";

const NAV_ITEMS = [
  {
    to: "/main/transactions" as const,
    icon: ListOrdered,
    label: "main.nav.transactions",
  },
  {
    to: "/main/statistics" as const,
    icon: BarChart3,
    label: "main.nav.statistics",
  },
  {
    to: "/main/transfer" as const,
    icon: ArrowLeftRight,
    label: "main.nav.transfer",
  },
  {
    to: "/main/meta" as const,
    icon: Settings,
    label: "main.nav.meta",
  },
] as const;
const headerActionClass =
  "size-9 border-2 shadow-[2px_2px_0px_0px] shadow-border/60 transition-all active:shadow-none";

function MainPage({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const setCreateDialogOpen = useMetaStore((s) => s.setCreateDialogOpen);

  const isMetaTab = pathname.startsWith("/main/meta");
  const isTransactionsTab = pathname === "/main/transactions";
  const showHeaderAction = isMetaTab || isTransactionsTab;

  /** Header "+" opens meta create dialog or navigates to create transaction. */
  const handleHeaderAction = () => {
    if (isMetaTab) {
      setCreateDialogOpen(true);
    } else if (isTransactionsTab) {
      router.push("/main/transactions/create");
    }
  };

  return (
    <div className="mx-auto flex h-screen max-w-[700px] flex-col bg-background">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b-2 border-border px-4">
        <h1 className="text-base font-bold tracking-[0.25em] uppercase text-primary">
          {t("main.title")}
        </h1>
        {showHeaderAction && (
          <div className="flex items-center gap-2">
            {isTransactionsTab && (
              <Button
                asChild
                size="icon"
                variant="outline"
                className={headerActionClass}
              >
                <Link
                  href="/main/transactions/receipt"
                  aria-label={t("receipt.title")}
                >
                  <Bot aria-hidden="true" />
                </Link>
              </Button>
            )}
            <Button
              type="button"
              size="icon"
              variant="outline"
              className={headerActionClass}
              onClick={handleHeaderAction}
            >
              <Plus aria-hidden="true" />
              <span className="sr-only">{t("main.add")}</span>
            </Button>
          </div>
        )}
      </header>

      {/* Tab content */}
      <main className="flex-1 overflow-y-auto">{children}</main>

      {/* Bottom navigation */}
      <nav className="flex h-16 shrink-0 border-t-2 border-border">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const isActive = pathname === to;
          return (
            <Link
              key={to}
              href={to}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-5" />
              <span className="text-[10px] tracking-wider uppercase">
                {t(label)}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export { MainPage };
