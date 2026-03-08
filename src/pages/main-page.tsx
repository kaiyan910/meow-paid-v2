/**
 * MainPage — protected shell layout rendered for all /main/* routes.
 * Consists of a top bar, a scrollable content area (<Outlet />),
 * and a bottom navigation bar with four tab links.
 */
import {
  Link,
  Outlet,
  getRouteApi,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import {
  ArrowLeftRight,
  BarChart3,
  ListOrdered,
  Plus,
  Settings,
} from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { useMetaStore } from "@/store/meta.store";

// getRouteApi avoids a circular dependency with router.tsx
const routeApi = getRouteApi("/main");

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

function MainPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const { user } = routeApi.useLoaderData();

  const setCreateDialogOpen = useMetaStore((s) => s.setCreateDialogOpen);

  // Hydrate the auth store with the loader result on mount / refresh.
  useEffect(() => {
    if (user) setUser(user);
  }, [user, setUser]);

  // Redirect bare /main path to the default tab.
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    if (pathname === "/main") {
      void navigate({ to: "/main/transactions", replace: true });
    }
  }, [pathname, navigate]);

  const isMetaTab = pathname.startsWith("/main/meta");
  const isTransactionsTab = pathname === "/main/transactions";
  const showHeaderAction = isMetaTab || isTransactionsTab;

  /** Header "+" opens meta create dialog or navigates to create transaction. */
  const handleHeaderAction = () => {
    if (isMetaTab) {
      setCreateDialogOpen(true);
    } else if (isTransactionsTab) {
      void navigate({ to: "/main/transactions/create" });
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
          <Button
            size="icon"
            variant="outline"
            className="size-9 border-2 shadow-[2px_2px_0px_0px] shadow-border/60 transition-all active:translate-x-[px] active:translate-y-[px] active:shadow-none"
            onClick={handleHeaderAction}
          >
            <Plus className="size-4" />
            <span className="sr-only">{t("main.add")}</span>
          </Button>
        )}
      </header>

      {/* Tab content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav className="flex h-16 shrink-0 border-t-2 border-border">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const isActive = pathname === to;
          return (
            <Link
              key={to}
              to={to}
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
