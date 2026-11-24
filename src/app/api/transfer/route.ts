import type { NextRequest } from "next/server";

import { readData, requireApiUser } from "@/lib/server/api";
import { dateRangeSchema } from "@/schemas/api.schema";

/** Aggregates payments on the server before returning the settlement inputs. */
export function GET(request: NextRequest) {
  return requireApiUser(request, async ({ supabase }) => {
    const { start, end } = dateRangeSchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const rows = readData(
      await supabase
        .from("transactions")
        .select("payee_id, price")
        .gte("transaction_date", start)
        .lte("transaction_date", end),
    );
    const totals = new Map<string, number>();
    for (const row of rows ?? []) {
      totals.set(row.payee_id, (totals.get(row.payee_id) ?? 0) + row.price);
    }
    return Array.from(totals, ([payee_id, total]) => ({
      payee_id,
      total: Math.round(total * 10) / 10,
    }));
  });
}
