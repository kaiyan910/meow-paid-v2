import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import "@/i18n";
import { MainPage } from "@/screens/main-page";

const navigation = vi.hoisted(() => ({ pathname: "/main/transactions" }));
vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ push: vi.fn() }),
}));
afterEach(cleanup);

it("puts the receipt assistant immediately before the transaction add button", () => {
  render(<MainPage>{null}</MainPage>);
  const assistant = screen.getByRole("link", { name: "Receipt assistant" });
  expect(assistant).toHaveAttribute("href", "/main/transactions/receipt");
  expect(assistant.nextElementSibling).toBe(
    screen.getByRole("button", { name: "Add" }),
  );
});

it("keeps the receipt assistant on the transactions home screen", () => {
  navigation.pathname = "/main/meta";
  render(<MainPage>{null}</MainPage>);
  expect(screen.queryByRole("link", { name: "Receipt assistant" })).toBeNull();
  expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
});
