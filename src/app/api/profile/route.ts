import type { NextRequest } from "next/server";

import { readData, requireApiUser } from "@/lib/server/api";
import { profileSchema } from "@/schemas/profile.schema";

/** Returns the active user's profile or the RLS-visible list of payees. */
export function GET(request: NextRequest) {
  return requireApiUser(request, async ({ supabase, userId }) => {
    const query = supabase.from("profiles").select("*");
    if (request.nextUrl.searchParams.get("list") === "1") {
      return readData(await query.order("display_name"));
    }
    return readData(await query.eq("user_id", userId).single());
  });
}

/** Updates the active user's display name. */
export function PATCH(request: NextRequest) {
  return requireApiUser(request, async ({ supabase, userId }) => {
    const values = profileSchema.parse(await request.json());
    return readData(
      await supabase
        .from("profiles")
        .update(values)
        .eq("user_id", userId)
        .select()
        .single(),
    );
  });
}
