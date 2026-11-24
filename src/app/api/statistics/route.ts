import type { NextRequest } from "next/server";
import { z } from "zod";

import { readData, requireApiUser } from "@/lib/server/api";
import type { RequestSupabase } from "@/lib/server/supabase";
import {
  dateRangeSchema,
  idSchema,
  monthlyStatSchema,
} from "@/schemas/api.schema";

const querySchema = z.discriminatedUnion("mode", [
  dateRangeSchema.safeExtend({ mode: z.literal("breakdown") }),
  dateRangeSchema.safeExtend({ mode: z.literal("summary") }),
  z.object({
    mode: z.literal("totals"),
    ranges: z
      .string()
      .transform((value) => JSON.parse(value) as unknown)
      .pipe(dateRangeSchema.array().length(6)),
    paymentType: idSchema.optional(),
    paymentSubtype: idSchema.optional(),
  }),
]);

async function getMonthlyStats(
  supabase: RequestSupabase,
  range: z.infer<typeof dateRangeSchema>,
) {
  return monthlyStatSchema.array().parse(
    readData(
      await supabase.rpc("get_monthly_stats", {
        start_date: range.start,
        end_date: range.end,
      }),
    ),
  );
}

async function getMonthlySpendingTotal(
  supabase: RequestSupabase,
  range: z.infer<typeof dateRangeSchema>,
) {
  return z.number().parse(
    readData(
      await supabase.rpc("get_monthly_spending_total", {
        start_date: range.start,
        end_date: range.end,
      }),
    ),
  );
}

/** Returns the category breakdown and actual spending for browser-provided month boundaries. */
export function GET(request: NextRequest) {
  return requireApiUser(request, async ({ supabase }) => {
    const query = querySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    if (query.mode === "breakdown") return getMonthlyStats(supabase, query);
    if (query.mode === "summary") {
      const [breakdown, paidTotal] = await Promise.all([
        getMonthlyStats(supabase, query),
        getMonthlySpendingTotal(supabase, query),
      ]);
      return { breakdown, paidTotal };
    }

    return Promise.all(
      query.ranges.map(async (range) => {
        if (!query.paymentType && !query.paymentSubtype)
          return getMonthlySpendingTotal(supabase, range);
        const rows = await getMonthlyStats(supabase, range);
        let total = 0;
        for (const row of rows) {
          if (
            query.paymentSubtype &&
            row.payment_subtype_id !== query.paymentSubtype
          )
            continue;
          if (query.paymentType && row.payment_type_id !== query.paymentType)
            continue;
          total += row.total;
        }
        return Math.round(total * 100) / 100;
      }),
    );
  });
}
