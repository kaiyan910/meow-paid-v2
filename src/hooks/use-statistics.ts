import { useQuery } from "@tanstack/react-query";
import type { Moment } from "moment";
import { z } from "zod";

import { apiFetch } from "@/lib/api";
import { monthRange } from "@/lib/month-range";
import {
  monthlySummarySchema,
  paymentSubtypeOptionSchema,
} from "@/schemas/api.schema";

/** Fetches one month of category totals. */
export function useMonthlyStats(month: Moment) {
  const range = monthRange(month);
  const params = new URLSearchParams({ mode: "summary", ...range });

  return useQuery({
    queryKey: ["statistics", "monthly", range.start],
    queryFn: () => apiFetch(`/api/statistics?${params}`, monthlySummarySchema),
  });
}

/** Fetches all six locally bounded months in one API request. */
export function useMonthlyTotals(
  currentMonth: Moment,
  paymentTypeId: string | null,
  paymentSubtypeId: string | null,
) {
  return useQuery({
    queryKey: [
      "statistics",
      "totals",
      monthRange(currentMonth).start,
      paymentTypeId,
      paymentSubtypeId,
    ],
    queryFn: async () => {
      const months = Array.from({ length: 6 }, (_, index) =>
        currentMonth.clone().subtract(5 - index, "months"),
      );
      const params = new URLSearchParams({
        mode: "totals",
        ranges: JSON.stringify(months.map(monthRange)),
      });
      if (paymentSubtypeId) params.set("paymentSubtype", paymentSubtypeId);
      else if (paymentTypeId) params.set("paymentType", paymentTypeId);

      const totals = await apiFetch(
        `/api/statistics?${params}`,
        z.array(z.number()).length(6),
      );
      return months.map((month, index) => ({
        label: month.format("MMM"),
        total: totals[index],
      }));
    },
  });
}

/** Fetches payment subtypes filtered by payment type ID. */
export function usePaymentSubtypesByType(paymentTypeId: string | null) {
  return useQuery({
    queryKey: ["meta", "payment_subtypes", "by_type", paymentTypeId],
    queryFn: () =>
      apiFetch(
        `/api/meta/payment_subtypes?paymentType=${encodeURIComponent(paymentTypeId ?? "")}`,
        paymentSubtypeOptionSchema.array(),
      ),
    enabled: !!paymentTypeId,
  });
}
