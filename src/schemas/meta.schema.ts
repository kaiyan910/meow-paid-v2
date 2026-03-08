/**
 * Zod schemas for meta-data create / update forms.
 * Used by TanStack Form validators and for pre-submit validation.
 */
import { z } from "zod";

export const shopCategorySchema = z.object({
  name: z.string().min(1),
});

export const shopSchema = z.object({
  name: z.string().min(1),
  shop_category_id: z.string().min(1),
  logo: z.string().min(1),
});

export const paymentTypeSchema = z.object({
  name: z.string().min(1),
});

export const paymentSubtypeSchema = z.object({
  name: z.string().min(1),
  payment_type_id: z.string().min(1),
});

export type ShopCategoryFormValues = z.infer<typeof shopCategorySchema>;
export type ShopFormValues = z.infer<typeof shopSchema>;
export type PaymentTypeFormValues = z.infer<typeof paymentTypeSchema>;
export type PaymentSubtypeFormValues = z.infer<typeof paymentSubtypeSchema>;
