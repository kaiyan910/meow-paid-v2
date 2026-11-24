import "server-only";

import { type CookieOptions, createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

/** Reads the private Next.js runtime configuration. */
export function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SECRET_KEY?.trim();

  if (!url) throw new Error("SUPABASE_URL is required");
  if (!key?.startsWith("sb_secret_") || key === "sb_secret_") {
    throw new Error("SUPABASE_SECRET_KEY must be a Supabase secret API key");
  }
  return { url, key };
}

/** Keeps the user's session in HTTP-only cookies and carries token refreshes to the response. */
export function createRequestSession(request: NextRequest) {
  const { url, key } = getSupabaseConfig();
  const authUrl = new URL("auth/v1/", `${url.replace(/\/+$/, "")}/`);
  const updates = new Map<string, { value: string; options: CookieOptions }>();
  const supabase = createServerClient(url, key, {
    global: {
      fetch: async (input, init) => {
        const headers = new Headers(init?.headers);
        if (headers.get("authorization") === `Bearer ${key}`) {
          headers.delete("authorization");
        }

        // Auth can sign in or refresh without a user JWT. Data must run under RLS.
        const target = new URL(input instanceof Request ? input.url : input);
        if (
          target.origin !== authUrl.origin ||
          (!headers.has("authorization") &&
            !target.pathname.startsWith(authUrl.pathname))
        ) {
          return Response.json(
            { message: "Supabase request requires a user access token" },
            { status: 401 },
          );
        }

        return fetch(input, { ...init, headers, redirect: "error" });
      },
    },
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
