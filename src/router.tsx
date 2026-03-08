/**
 * TanStack Router configuration.
 * Defines all application routes and their auth guards via beforeLoad.
 * /main is a protected layout route; its tab children render inside its <Outlet />.
 */
import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";

import { supabase } from "@/lib/supabase";
import { CreateTransactionPage } from "@/pages/create-transaction-page";
import { EditTransactionPage } from "@/pages/edit-transaction-page";
import { LoginPage } from "@/pages/login-page";
import { MainPage } from "@/pages/main-page";
import { MetaTab } from "@/pages/tabs/meta-tab";
import { StatisticsTab } from "@/pages/tabs/statistics-tab";
import { TransactionsTab } from "@/pages/tabs/transactions-tab";
import { TransferTab } from "@/pages/tabs/transfer-tab";

const rootRoute = createRootRoute({
  component: Outlet,
});

/** Public route — redirect to /main if already authenticated. */
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LoginPage,
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      throw redirect({ to: "/main/transactions" });
    }
  },
});

/**
 * Protected layout route — auth guard runs for all children.
 * Loader fetches the current user so child tabs can access it via useLoaderData.
 */
const mainRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/main",
  component: MainPage,
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: "/" });
    }
  },
  loader: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return { user };
  },
});

const transactionsRoute = createRoute({
  getParentRoute: () => mainRoute,
  path: "transactions",
  component: TransactionsTab,
});

const statisticsRoute = createRoute({
  getParentRoute: () => mainRoute,
  path: "statistics",
  component: StatisticsTab,
});

const metaRoute = createRoute({
  getParentRoute: () => mainRoute,
  path: "meta",
  component: MetaTab,
});

const transferRoute = createRoute({
  getParentRoute: () => mainRoute,
  path: "transfer",
  component: TransferTab,
});

const createTransactionRoute = createRoute({
  getParentRoute: () => mainRoute,
  path: "transactions/create",
  component: CreateTransactionPage,
});

const editTransactionRoute = createRoute({
  getParentRoute: () => mainRoute,
  path: "transactions/$txId/edit",
  component: EditTransactionPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  mainRoute.addChildren([
    transactionsRoute,
    createTransactionRoute,
    editTransactionRoute,
    statisticsRoute,
    metaRoute,
    transferRoute,
  ]),
]);

export const router = createRouter({ routeTree });

// Register router types globally for useNavigate / Link type safety.
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
