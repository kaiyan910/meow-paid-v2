import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import "@/i18n";
import { ReceiptReview } from "@/components/receipt/receipt-review";
import { createReceiptSession } from "@/store/receipt.store";

const payer = "00000000-0000-4000-8000-000000000001";
const shop = "00000000-0000-4000-8000-000000000002";
const food = "00000000-0000-4000-8000-000000000003";
vi.mock("@/hooks/use-meta-queries", () => ({
  useShops: () => ({ data: [{ id: shop, name: "Market" }] }),
  useShopCategories: () => ({ data: [] }),
  usePaymentSubtypes: () => ({ data: [{ id: food, name: "Food" }] }),
}));
vi.mock("@/hooks/use-profile", () => ({ useProfiles: () => ({ data: [] }) }));
afterEach(cleanup);

it("starts with the signed-in payee, then lets the user correct the paid total and explicitly confirm", async () => {
  const user = userEvent.setup();
  const store = createReceiptSession();
  store.setState({
    viewerId: payer,
    draft: {
      shopId: shop,
      newShop: null,
      date: "2026-11-24",
      discount: "2.15",
      paidTotal: "10.00",
      lines: [{ id: food, label: "Tea", amount: "12.35", subtypeId: food }],
    },
  });
  const onConfirm = vi.fn();
  render(
    <ReceiptReview
      store={store}
      busy={false}
      saving={false}
      saveError={false}
      onConfirm={onConfirm}
    />,
  );
  expect((screen.getByLabelText("Payee") as HTMLSelectElement).value).toBe(
    payer,
  );
  const confirm = screen.getByRole("button", {
    name: "Confirm and save transaction",
  });
  expect((confirm as HTMLButtonElement).disabled).toBe(true);
  await user.clear(screen.getByLabelText("Receipt total (HKD)"));
  await user.type(screen.getByLabelText("Receipt total (HKD)"), "10.20");
  expect((confirm as HTMLButtonElement).disabled).toBe(false);
  expect(onConfirm).not.toHaveBeenCalled();
  await user.click(confirm);
  expect(onConfirm).toHaveBeenCalledOnce();
});
