import "server-only";

import { readData } from "@/lib/server/api";
import { toAppLogoUrl } from "@/lib/server/shop-logos";
import type { RequestSupabase } from "@/lib/server/supabase";
import type { transactionWriteSchema } from "@/schemas/api.schema";
import type { z } from "zod";

export const transactionSelect =
  "*, shops(name, logo, shop_categories(name)), transaction_items(*, payment_subtypes(name))";

/** Converts stored logos at both transaction response boundaries. */
export function withAppShopLogo<T extends { shops: { logo: string } | null }>(
  row: T,
): T {
  if (!row.shops) return row;
  return {
    ...row,
    shops: { ...row.shops, logo: toAppLogoUrl(row.shops.logo) },
  };
}

/** Saves the parent and its item rows in one database transaction. */
export async function saveTransaction(
  supabase: RequestSupabase,
  input: z.infer<typeof transactionWriteSchema>,
  id: string | null,
) {
  const { data, error } = await supabase.rpc("save_transaction_with_items", {
    p_id: id,
    p_date: input.transaction_date,
    p_shop_id: input.shop_id,
    p_payee_id: input.payee_id,
    p_remark: input.remark,
    p_items: input.items,
  });
  readData({ data, error });
  return null;
}
