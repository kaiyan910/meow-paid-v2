import "server-only";

import { type NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  type RequestSupabase,
  createRequestSession,
  getVerifiedUserId,
} from "@/lib/server/supabase";

export class ApiError extends Error {
  constructor(readonly status: number) {
    super(`Request failed (${status})`);
  }
}

type Session = ReturnType<typeof createRequestSession>;

type RequestContext = {
  supabase: RequestSupabase;
  userId: string;
};

/** Applies the same error, session, and same-origin handling to every app endpoint. */
export async function handleApi(
  request: NextRequest,
  handler: (supabase: RequestSupabase) => Promise<unknown>,
) {
  let session: Session | undefined;
  let response: NextResponse;

  try {
    if (request.method !== "GET" && request.headers.get("x-meowpaid") !== "1") {
      throw new ApiError(403);
    }

    session = createRequestSession(request);
    const result = await handler(session.supabase);
    response =
      result instanceof NextResponse ? result : NextResponse.json(result);
  } catch (error) {
    let status = 500;
    if (error instanceof ApiError) status = error.status;
    else if (error instanceof ZodError || error instanceof SyntaxError)
      status = 400;
    else
      console.error(
        "MeowPaid API request failed",
        request.nextUrl.pathname,
        error,
      );

    response = NextResponse.json({ error: "Request failed" }, { status });
  }

  response.headers.set("Cache-Control", "private, no-store");
  return session ? session.respond(response) : response;
}

/** Verifies identity at the API boundary before running queries under the user's RLS role. */
export function requireApiUser(
  request: NextRequest,
  handler: (context: RequestContext) => Promise<unknown>,
) {
  return handleApi(request, async (supabase) => {
    const userId = await getVerifiedUserId(supabase);
    if (!userId) throw new ApiError(401);
    return handler({ supabase, userId });
  });
}

/** Maps known database failures to status codes without exposing database details. */
export function readData<T>(result: {
  data: T;
  error: { code: string } | null;
}): T {
  if (!result.error) return result.data;
  const { code } = result.error;
  if (code === "PGRST116" || code === "P0002") throw new ApiError(404);
  if (code === "42501") throw new ApiError(403);
  if (code === "23503" || code === "23505") throw new ApiError(409);
  if (code === "22023" || code === "23514") throw new ApiError(400);
  throw new Error(`Supabase query failed (${code})`);
}
