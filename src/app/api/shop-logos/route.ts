import type { NextRequest } from "next/server";
import { z } from "zod";

import { ApiError, requireApiUser } from "@/lib/server/api";
import { toAppLogoUrl } from "@/lib/server/shop-logos";

const uploadSchema = z
  .file()
  .min(1)
  .refine((file) => file.type.startsWith("image/"));

/** Uploads an image under a server-generated object key. */
export function POST(request: NextRequest) {
  return requireApiUser(request, async ({ supabase }) => {
    const file = uploadSchema.parse((await request.formData()).get("file"));
    const extension = file.name.match(/\.([a-z0-9]{1,10})$/i)?.[0] ?? "";
    const bucket = supabase.storage.from("shop-logos");
    const { error, data } = await bucket.upload(
      `${crypto.randomUUID()}${extension}`,
      file,
    );
    if (error) throw new ApiError(502);
    return toAppLogoUrl(bucket.getPublicUrl(data.path).data.publicUrl);
  });
}
