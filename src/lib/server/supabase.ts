import "server-only";

import { type CookieOptions, createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

/** Reads the server configuration, with a fallback for existing local .env files. */
export function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!url || !key) throw new Error("Missing Supabase server configuration");
  return { url, key };
}

/** Keeps the user's session in HTTP-only cookies and carries token refreshes to the response. */
export function createRequestSession(request: NextRequest) {
  const { url, key } = getSupabaseConfig();
  const updates = new Map<string, { value: string; options: CookieOptions }>();
  const supabase = createServerClient(url, key, {
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      path: "/",
    },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies) => {
        for (const { name, value, options } of cookies) {
          request.cookies.set(name, value);
          updates.set(name, { value, options });
        }
      },
    },
  });

  return {
    supabase,
    respond(response: NextResponse) {
      for (const [name, { value, options }] of updates) {
        response.cookies.set(name, value, options);
      }
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    },
  };
}

export type RequestSupabase = ReturnType<
  typeof createRequestSession
>["supabase"];

/** Returns only a user ID from a verified access token. */
export async function getVerifiedUserId(supabase: RequestSupabase) {
  const { data, error } = await supabase.auth.getClaims();
  return error ? null : (data?.claims.sub ?? null);
}
