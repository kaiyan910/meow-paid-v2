import type { NextRequest } from "next/server";

import { ApiError, handleApi } from "@/lib/server/api";
import { loginSchema } from "@/schemas/auth.schema";

/** Signs in with email and password and returns the session as cookies. */
export function POST(request: NextRequest) {
  return handleApi(request, async (supabase) => {
    const credentials = loginSchema.parse(await request.json());
    const { error } = await supabase.auth.signInWithPassword(credentials);
    if (error) throw new ApiError(error.status === 429 ? 429 : 401);
    return null;
  });
}

/** Ends the current session and removes its cookies. */
export function DELETE(request: NextRequest) {
  return handleApi(request, async (supabase) => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new ApiError(502);
    return null;
  });
}
