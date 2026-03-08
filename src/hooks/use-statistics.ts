/**
 * TanStack Query hooks for statistics data.
 * Fetches monthly breakdowns and multi-month totals from Supabase.
 */
import { useQuery } from "@tanstack/react-query";
import type moment from "moment";

import { supabase } from "@/lib/supabase";

interface MonthlyStatRow {
  payment_subtype_id: string;
  payment_subtype_name: string;
  payment_type_id: string;
  payment_type_name: string;
  total: number;
}

interface MonthlyTotalRow {
  month_start: string;
  total: number;
}

/** Fetches category breakdown for a single month. */
export function useMonthlyStats(month: moment.Moment) {
  const startOfMonth = month.clone().startOf("month").toISOString();
  const endOfMonth = month.clone().endOf("month").toISOString();

  return useQuery({
    queryKey: ["statistics", "monthly", startOfMonth],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_monthly_stats", {
        start_date: startOfMonth,
        end_date: endOfMonth,
      });
      if (error) throw error;
      return data as MonthlyStatRow[];
    },
  });
}

/** Fetches monthly totals for the last 6 months, optionally filtered. */
export function useMonthlyTotals(
  currentMonth: moment.Moment,
  paymentTypeId: string | null,
  paymentSubtypeId: string | null,
) {
  const endDate = currentMonth.clone().endOf("month").toISOString();

  return useQuery({
    queryKey: [
      "statistics",
      "totals",
      endDate,
      paymentTypeId,
      paymentSubtypeId,
    ],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_monthly_totals", {
        end_date: endDate,
        num_months: 6,
        p_payment_type_id: paymentTypeId || null,
        p_payment_subtype_id: paymentSubtypeId || null,
      });
      if (error) throw error;
      return data as MonthlyTotalRow[];
    },
  });
}

/** Fetches payment subtypes filtered by payment type ID. */
export function usePaymentSubtypesByType(paymentTypeId: string | null) {
  return useQuery({
    queryKey: ["meta", "payment_subtypes", "by_type", paymentTypeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_subtypes")
        .select("id, name")
        .eq("payment_type_id", paymentTypeId as string)
        .order("name");
      if (error) throw error;
      return data as Array<{ id: string; name: string }>;
    },
    enabled: !!paymentTypeId,
  });
}
