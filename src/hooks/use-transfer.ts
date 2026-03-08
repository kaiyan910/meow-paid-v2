/**
 * TanStack Query hook for transfer summary data.
 * Fetches total paid per user for a given month.
 */
import { useQuery } from "@tanstack/react-query";
import type moment from "moment";

import { supabase } from "@/lib/supabase";

interface PayeeTotalRow {
  payee_id: string;
  total: number;
}

/** Fetches total amount paid by each user for a given month. */
export function useTransferSummary(month: moment.Moment) {
  const startOfMonth = month.clone().startOf("month").toISOString();
  const endOfMonth = month.clone().endOf("month").toISOString();

  return useQuery({
    queryKey: ["transfer", "summary", startOfMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("payee_id, price")
        .gte("transaction_date", startOfMonth)
        .lte("transaction_date", endOfMonth);
      if (error) throw error;

      /* Aggregate totals per payee on the client side. */
      const totals = new Map<string, number>();
      for (const row of data) {
        const current = totals.get(row.payee_id) ?? 0;
        totals.set(row.payee_id, current + row.price);
      }

      const result: PayeeTotalRow[] = [];
      for (const [payee_id, total] of totals) {
        result.push({ payee_id, total: Math.round(total * 10) / 10 });
      }
      return result;
    },
  });
}
