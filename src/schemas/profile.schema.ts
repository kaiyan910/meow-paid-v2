/**
 * Zod schema for profile update validation.
 */
import { z } from "zod";

export const profileSchema = z.object({
  display_name: z.string().nullable(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
