import type { NextRequest } from "next/server";

import { readData, requireApiUser } from "@/lib/server/api";
import { dateRangeSchema, payeeTotalSchema } from "@/schemas/api.schema";

/** Aggregates payments on the server before returning the settlement inputs. */
export function GET(request: NextRequest) {
  return requireApiUser(request, async ({ supabase }) => {
    const { start, end } = dateRangeSchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    return payeeTotalSchema.array().parse(
      readData(
        await supabase.rpc("get_payee_spending_totals", {
          start_date: start,
          end_date: end,
        }),
      ),
    );
  });
}
