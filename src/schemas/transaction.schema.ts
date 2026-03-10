/**
 * Zod schemas for transaction form validation.
 */
import { z } from "zod";

/** Schema for a single payment item in the submission payload. */
export const transactionItemSchema = z.object({
  payment_subtype_id: z.string().min(1),
  price: z.number().positive(),
});

/** Schema for the final transaction submission payload. */
export const transactionSchema = z.object({
  transaction_date: z.string().min(1),
  shop_id: z.string().min(1),
  payee_id: z.string().min(1),
  remark: z.string().max(100).nullable(),
  items: z.array(transactionItemSchema).min(1),
});

/** Schema for a single payment item row in the form (price is a string during editing). */
export const transactionItemFormSchema = z.object({
  payment_subtype_id: z.string().min(1, "Payment subtype is required"),
  price: z.string().min(1, "Price is required"),
});

/** Schema for the TanStack Form default values. */
export const transactionFormSchema = z.object({
  transaction_date: z.date({ error: "Transaction date is required" }),
  shop_id: z.string().min(1, "Shop is required"),
  payee_id: z.string().min(1, "Payee is required"),
  remark: z.string().max(100).optional(),
  items: z
    .array(transactionItemFormSchema)
    .min(1, "At least one item is required"),
});

export type TransactionItemFormValues = z.infer<typeof transactionItemSchema>;
export type TransactionFormValues = z.infer<typeof transactionSchema>;
export type TransactionFormDefaults = z.infer<typeof transactionFormSchema>;
