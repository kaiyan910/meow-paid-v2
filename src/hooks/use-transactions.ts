import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Moment } from "moment";
import { z } from "zod";

import { apiFetch } from "@/lib/api";
import { monthRange } from "@/lib/month-range";
import { idSchema, transactionRowSchema } from "@/schemas/api.schema";
import type { receiptConfirmSchema } from "@/schemas/receipt.schema";
import type { TransactionFormValues } from "@/schemas/transaction.schema";

const TX_KEY = ["transactions"];

/** Fetches transactions for a given month. */
export function useTransactions(month: Moment) {
  const range = monthRange(month);
  return useQuery({
    queryKey: [...TX_KEY, range.start],
    queryFn: () =>
      apiFetch(
        `/api/transactions?${new URLSearchParams(range)}`,
        transactionRowSchema.array(),
      ),
  });
}

/** Fetches a single transaction by ID. */
export function useTransaction(id: string) {
  return useQuery({
    queryKey: [...TX_KEY, "detail", id],
    queryFn: () => apiFetch(transactionPath(id), transactionRowSchema),
    enabled: !!id,
  });
}

function transactionPath(id: string) {
  return `/api/transactions/${encodeURIComponent(id)}`;
}

function useTransactionMutation<T, Result>(
  mutationFn: (input: T) => Promise<Result>,
  options: { changesShops?: boolean; gcTime?: number } = {},
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    gcTime: options.gcTime,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TX_KEY });
      void queryClient.invalidateQueries({ queryKey: ["statistics"] });
      void queryClient.invalidateQueries({ queryKey: ["transfer"] });
      if (options.changesShops)
        void queryClient.invalidateQueries({ queryKey: ["meta", "shops"] });
    },
  });
}

export function useCreateTransaction() {
  return useTransactionMutation((body: TransactionFormValues) =>
    apiFetch("/api/transactions", z.null(), { method: "POST", body }),
  );
}

/** Saves a reviewed receipt through the confirmation endpoint. */
export function useConfirmReceipt() {
  return useTransactionMutation(
    (body: z.infer<typeof receiptConfirmSchema>) =>
      apiFetch("/api/receipt-agent/confirm", idSchema, {
        method: "POST",
        body,
      }),
    { changesShops: true, gcTime: 0 },
  );
}

export function useUpdateTransaction() {
  return useTransactionMutation(
    ({ id, ...body }: TransactionFormValues & { id: string }) =>
      apiFetch(transactionPath(id), z.null(), { method: "PATCH", body }),
  );
}

export function useDeleteTransaction() {
  return useTransactionMutation((id: string) =>
    apiFetch(transactionPath(id), z.null(), { method: "DELETE" }),
  );
}
