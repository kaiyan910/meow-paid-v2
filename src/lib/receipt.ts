import {
  type ReceiptDraft,
  receiptAmountSchema,
} from "@/schemas/receipt.schema";

/** Parses an HKD input as integer cents, including intermediate form values. */
export function receiptCents(value: string) {
  if (!value || value === "." || !receiptAmountSchema.safeParse(value).success)
    return null;
  const [units, fraction = ""] = value.split(".");
  return Number(units) * 100 + Number(fraction.padEnd(2, "0"));
}

/** Computes the amount they will record and the difference from the receipt. */
export function getReceiptTotals(draft: ReceiptDraft) {
  const subtotal = draft.lines.reduce(
    (sum, line) => sum + (receiptCents(line.amount) ?? 0),
    0,
  );
  const discount = receiptCents(draft.discount);
  const paid = receiptCents(draft.paidTotal);
  const total = discount === null ? null : subtotal - discount;
  const difference = paid === null || total === null ? null : total - paid;
  return { subtotal, total, difference };
}

/** Validates and groups the reviewed receipt before it can be written. */
export function confirmReceipt(draft: ReceiptDraft, payeeId: string) {
  const { total, difference } = getReceiptTotals(draft);
  const discount = receiptCents(draft.discount);
  const shopName = draft.newShop?.name.trim();
  const newShop =
    !draft.shopId && shopName && draft.newShop?.categoryId
      ? { name: shopName, categoryId: draft.newShop.categoryId }
      : null;
  if (
    !payeeId ||
    !draft.date ||
    (!draft.shopId && !newShop) ||
    total === null ||
    discount === null ||
    difference !== 0
  )
    return null;

  const amounts = new Map<string, number>();
  for (const line of draft.lines) {
    const amount = receiptCents(line.amount);
    if (amount === null) return null;
    if (amount === 0) continue;
    if (!line.subtypeId) return null;
    amounts.set(line.subtypeId, (amounts.get(line.subtypeId) ?? 0) + amount);
  }
  if (!amounts.size) return null;

  return {
    shopId: draft.shopId,
    newShop,
    payeeId,
    date: `${draft.date}T12:00:00+08:00`,
    discount: discount / 100,
    paidTotal: total / 100,
    items: Array.from(amounts, ([payment_subtype_id, amount]) => ({
      payment_subtype_id,
      price: amount / 100,
    })),
  };
}
