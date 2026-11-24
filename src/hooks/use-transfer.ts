import { useQuery } from "@tanstack/react-query";
import type { Moment } from "moment";

import { apiFetch } from "@/lib/api";
import { monthRange } from "@/lib/month-range";
import { payeeTotalSchema } from "@/schemas/api.schema";

/** Fetches server-aggregated monthly payments per payee. */
export function useTransferSummary(month: Moment) {
  const range = monthRange(month);
  return useQuery({
    queryKey: ["transfer", "summary", range.start],
    queryFn: () =>
      apiFetch(
        `/api/transfer?${new URLSearchParams(range)}`,
        payeeTotalSchema.array(),
      ),
  });
}
