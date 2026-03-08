/**
 * Zod schemas for transaction form validation.
 */
import { z } from "zod";

export const transactionItemSchema = z.object({
  payment_subtype_id: z.string().min(1),
  price: z.number().positive(),
});

export const transactionSchema = z.object({
  transaction_date: z.string().min(1),
  shop_id: z.string().min(1),
  payee_id: z.string().min(1),
  remark: z.string().max(100).nullable(),
  items: z.array(transactionItemSchema).min(1),
});

export type TransactionItemFormValues = z.infer<typeof transactionItemSchema>;
export type TransactionFormValues = z.infer<typeof transactionSchema>;
