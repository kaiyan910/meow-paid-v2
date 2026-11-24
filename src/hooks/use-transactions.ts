import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Moment } from "moment";
import { z } from "zod";

import { apiFetch } from "@/lib/api";
import { monthRange } from "@/lib/month-range";
import { transactionRowSchema } from "@/schemas/api.schema";
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

function useTransactionMutation<T>(mutationFn: (input: T) => Promise<null>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TX_KEY });
      void queryClient.invalidateQueries({ queryKey: ["statistics"] });
      void queryClient.invalidateQueries({ queryKey: ["transfer"] });
    },
  });
}

export function useCreateTransaction() {
  return useTransactionMutation((body: TransactionFormValues) =>
    apiFetch("/api/transactions", z.null(), { method: "POST", body }),
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
