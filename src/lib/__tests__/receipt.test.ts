import { confirmReceipt, getReceiptTotals } from "@/lib/receipt";
import type { ReceiptDraft } from "@/schemas/receipt.schema";
import { describe, expect, it } from "vitest";

const food = "00000000-0000-4000-8000-000000000001";
const drinks = "00000000-0000-4000-8000-000000000002";
const category = "00000000-0000-4000-8000-000000000003";
const payee = "00000000-0000-4000-8000-000000000004";

const draft: ReceiptDraft = {
  shopId: null,
  newShop: { name: "Market", categoryId: category },
  date: "2026-11-24",
  discount: "2.50",
  paidTotal: "17.55",
  lines: [
    { id: food, label: "Bread", amount: "7.15", subtypeId: food },
    { id: drinks, label: "Rice", amount: "8.55", subtypeId: food },
    { id: category, label: "Tea", amount: "4.35", subtypeId: drinks },
  ],
};

describe("receipt confirmation", () => {
  it("combines item amounts by subtype and keeps the transaction discount separate", () => {
    expect(getReceiptTotals(draft)).toMatchObject({
      subtotal: 2005,
      total: 1755,
      difference: 0,
    });
    expect(confirmReceipt(draft, payee)).toEqual({
      newShop: { name: "Market", categoryId: category },
      shopId: null,
      payeeId: payee,
      date: "2026-11-24T12:00:00+08:00",
      discount: 2.5,
      paidTotal: 17.55,
      items: [
        { payment_subtype_id: food, price: 15.7 },
        { payment_subtype_id: drinks, price: 4.35 },
      ],
    });
  });

  it("requires a matching receipt total and a subtype for every positive item", () => {
    expect(confirmReceipt({ ...draft, paidTotal: "17.54" }, payee)).toBeNull();
    expect(confirmReceipt({ ...draft, paidTotal: "" }, payee)).toBeNull();
    expect(
      confirmReceipt(
        { ...draft, lines: [{ ...draft.lines[0], subtypeId: null }] },
        payee,
      ),
    ).toBeNull();
  });
});
