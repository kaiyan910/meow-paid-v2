import { idSchema } from "@/schemas/api.schema";
import { z } from "zod";

export const receiptImageMaxBytes = 3 * 1024 * 1024;
export const receiptImageMaxDimension = 1000;
export const receiptImageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export const receiptImageSchema = z.object({
  mimeType: z.enum(receiptImageTypes),
  data: z
    .string()
    .min(4)
    .max(Math.ceil(receiptImageMaxBytes / 3) * 4)
    .regex(/^[A-Za-z0-9+/]+={0,2}$/),
});

export const receiptAmountSchema = z.string().regex(/^\d{0,9}(?:\.\d{0,2})?$/);
const newShopSchema = z.object({
  name: z.string().trim().max(120),
  categoryId: idSchema.nullable(),
});
const recognizedLineSchema = z.object({
  label: z.string().max(160),
  amount: receiptAmountSchema,
  subtypeId: idSchema.nullable(),
});
const recognizedDraftSchema = z.object({
  shopId: idSchema.nullable(),
  newShop: newShopSchema.nullable(),
  date: z.union([z.iso.date(), z.literal("")]),
  discount: receiptAmountSchema,
  paidTotal: receiptAmountSchema,
  lines: recognizedLineSchema.array().max(120),
});

export const receiptDraftSchema = recognizedDraftSchema.extend({
  lines: recognizedLineSchema.extend({ id: idSchema }).array().max(120),
});
export type ReceiptDraft = z.infer<typeof receiptDraftSchema>;
export type ReceiptImage = z.infer<typeof receiptImageSchema>;

export const receiptAgentResultSchema = z.object({
  reply: z.string().min(1).max(1800),
  draft: recognizedDraftSchema.nullable(),
});

export const receiptAgentStateSchema = z.object({
  draft: receiptDraftSchema.nullable(),
  locale: z.enum(["en", "zh"]),
});
export const receiptAgentSnapshotSchema = receiptAgentStateSchema.extend({
  viewerId: idSchema,
});

export const receiptConfirmSchema = z.object({
  draftId: idSchema,
  payeeId: idSchema,
  draft: receiptDraftSchema,
});
