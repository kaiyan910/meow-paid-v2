/**
 * TanStack Query hooks for transaction CRUD.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type moment from "moment";

import { supabase } from "@/lib/supabase";
import type { TransactionWithDetails } from "@/types/database";

const TX_SELECT =
  "*, shops(name, logo, shop_categories(name)), transaction_items(*, payment_subtypes(name))";

/** Fetches transactions for a given month. */
export function useTransactions(month: moment.Moment) {
  const startOfMonth = month.clone().startOf("month").toISOString();
  const endOfMonth = month.clone().endOf("month").toISOString();

  return useQuery({
    queryKey: ["transactions", startOfMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select(TX_SELECT)
        .gte("transaction_date", startOfMonth)
        .lte("transaction_date", endOfMonth)
        .order("transaction_date", { ascending: false });
      if (error) throw error;
      return data as TransactionWithDetails[];
    },
  });
}

interface CreateTransactionInput {
  transaction_date: string;
  shop_id: string;
  payee_id: string;
  remark: string | null;
  items: Array<{ payment_subtype_id: string; price: number }>;
}

/** Creates a transaction with its items in a single operation. */
export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTransactionInput) => {
      const totalPrice = input.items.reduce((sum, item) => sum + item.price, 0);

      // Insert transaction
      const { data: tx, error: txError } = await supabase
        .from("transactions")
        .insert({
          transaction_date: input.transaction_date,
          shop_id: input.shop_id,
          payee_id: input.payee_id,
          price: totalPrice,
          remark: input.remark,
        })
        .select()
        .single();
      if (txError) throw txError;

      // Insert transaction items
      const items = input.items.map((item) => ({
        transaction_id: tx.id,
        payment_subtype_id: item.payment_subtype_id,
        price: item.price,
      }));

      const { error: itemsError } = await supabase
        .from("transaction_items")
        .insert(items);
      if (itemsError) throw itemsError;

      return tx;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

/** Fetches a single transaction by ID. */
export function useTransaction(id: string) {
  return useQuery({
    queryKey: ["transactions", "detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select(TX_SELECT)
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as TransactionWithDetails;
    },
    enabled: !!id,
  });
}

/** Updates a transaction and replaces its items. */
export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTransactionInput & { id: string }) => {
      const totalPrice = input.items.reduce((sum, item) => sum + item.price, 0);

      // Update transaction
      const { error: txError } = await supabase
        .from("transactions")
        .update({
          transaction_date: input.transaction_date,
          shop_id: input.shop_id,
          payee_id: input.payee_id,
          price: totalPrice,
          remark: input.remark,
        })
        .eq("id", input.id);
      if (txError) throw txError;

      // Delete old items (cascade would handle this on tx delete, but we're updating)
      const { error: delError } = await supabase
        .from("transaction_items")
        .delete()
        .eq("transaction_id", input.id);
      if (delError) throw delError;

      // Insert new items
      const items = input.items.map((item) => ({
        transaction_id: input.id,
        payment_subtype_id: item.payment_subtype_id,
        price: item.price,
      }));
      const { error: itemsError } = await supabase
        .from("transaction_items")
        .insert(items);
      if (itemsError) throw itemsError;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

/** Deletes a transaction (items cascade-deleted). */
export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
