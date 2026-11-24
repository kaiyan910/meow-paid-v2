import { confirmReceipt } from "@/lib/receipt";
import { ApiError, readData, requireApiUser } from "@/lib/server/api";
import { readBoundedJson } from "@/lib/server/request-json";
import { idSchema } from "@/schemas/api.schema";
import { receiptConfirmSchema } from "@/schemas/receipt.schema";
import type { NextRequest } from "next/server";

/** Confirms a reviewed receipt and creates its proposed shop in the same write. */
export function POST(request: NextRequest) {
  return requireApiUser(request, async ({ supabase }) => {
    const { draftId, draft, payeeId } = receiptConfirmSchema.parse(
      await readBoundedJson(request, 96 * 1024),
    );
    const values = confirmReceipt(draft, payeeId);
    if (!values) throw new ApiError(400);

    const transactionId = readData(
      await supabase.rpc("confirm_receipt_transaction", {
        p_draft_id: draftId,
        p_date: values.date,
        p_shop_id: values.shopId,
        p_shop_name: values.newShop?.name ?? null,
        p_shop_category_id: values.newShop?.categoryId ?? null,
        p_payee_id: values.payeeId,
        p_items: values.items,
        p_discount: values.discount,
        p_paid_total: values.paidTotal,
      }),
    );
    return idSchema.parse(transactionId);
  });
}
