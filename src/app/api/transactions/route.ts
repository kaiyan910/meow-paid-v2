import type { NextRequest } from "next/server";

import { readData, requireApiUser } from "@/lib/server/api";
import {
  saveTransaction,
  transactionSelect,
  withAppShopLogo,
} from "@/lib/server/transactions";
import {
  dateRangeSchema,
  transactionRowSchema,
  transactionWriteSchema,
} from "@/schemas/api.schema";

/** Lists the transactions and item breakdowns in the requested month. */
export function GET(request: NextRequest) {
  return requireApiUser(request, async ({ supabase }) => {
    const { start, end } = dateRangeSchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const rows = readData(
      await supabase
        .from("transactions")
        .select(transactionSelect)
        .gte("transaction_date", start)
        .lte("transaction_date", end)
        .order("transaction_date", { ascending: false }),
    );
    return transactionRowSchema.array().parse(rows).map(withAppShopLogo);
  });
}

/** Creates the transaction and all of its item rows together. */
export function POST(request: NextRequest) {
  return requireApiUser(request, async ({ supabase }) => {
    return saveTransaction(
      supabase,
      transactionWriteSchema.parse(await request.json()),
      null,
    );
  });
}
