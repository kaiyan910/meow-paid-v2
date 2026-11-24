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

/** Returns a category breakdown or six filtered totals using browser-provided month boundaries. */
export function GET(request: NextRequest) {
  return requireApiUser(request, async ({ supabase }) => {
    const query = querySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    if (query.mode === "breakdown") return getMonthlyStats(supabase, query);

    return Promise.all(
      query.ranges.map(async (range) => {
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
        return Math.round(total * 10) / 10;
      }),
    );
  });
}
