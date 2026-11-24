import { z } from "zod";

import {
  transactionItemSchema,
  transactionSchema,
} from "@/schemas/transaction.schema";

export const idSchema = z.guid();
const createdAt = z.string().nullable();
const namedRow = z.object({
  id: idSchema,
  name: z.string(),
  created_at: createdAt,
});
const relatedName = namedRow.pick({ name: true }).nullable();

export const shopCategoryRowSchema = namedRow;
export const paymentTypeRowSchema = namedRow;
export const shopRowSchema = namedRow.extend({
  shop_category_id: idSchema,
  logo: z.string().nullable(),
  shop_categories: relatedName,
});
export const paymentSubtypeRowSchema = namedRow.extend({
  payment_type_id: idSchema,
  payment_types: relatedName,
});
export const paymentSubtypeOptionSchema = namedRow.pick({
  id: true,
  name: true,
});
export const profileRowSchema = z.object({
  id: idSchema,
  user_id: idSchema,
  display_name: z.string().nullable(),
  created_at: createdAt,
});

export const transactionWriteSchema = transactionSchema.extend({
  transaction_date: z.iso.datetime({ offset: true }),
  shop_id: idSchema,
  payee_id: idSchema,
  items: transactionItemSchema
    .extend({ payment_subtype_id: idSchema })
    .array()
    .min(1),
});

export const transactionRowSchema = z.object({
  id: idSchema,
  transaction_date: z.string(),
  shop_id: idSchema,
  payee_id: idSchema,
  price: z.number(),
  discount: z.number().default(0),
  remark: z.string().nullable(),
  created_at: createdAt,
  shops: z
    .object({
      name: z.string(),
      logo: z.string().nullable(),
      shop_categories: relatedName,
    })
    .nullable(),
  transaction_items: z.array(
    z.object({
      id: idSchema,
      transaction_id: idSchema,
      payment_subtype_id: idSchema,
      price: z.number(),
      created_at: createdAt,
      payment_subtypes: relatedName,
    }),
  ),
});

export const monthlyStatSchema = z.object({
  payment_subtype_id: idSchema,
  payment_subtype_name: z.string(),
  payment_type_id: idSchema,
  payment_type_name: z.string(),
  total: z.number(),
});
export const monthlySummarySchema = z.object({
  paidTotal: z.number(),
  breakdown: monthlyStatSchema.array(),
});
export const payeeTotalSchema = z.object({
  payee_id: idSchema,
  total: z.number(),
});

export const dateRangeSchema = z
  .object({
    start: z.iso.datetime({ offset: true }),
    end: z.iso.datetime({ offset: true }),
  })
  .refine(({ start, end }) => Date.parse(start) <= Date.parse(end));
