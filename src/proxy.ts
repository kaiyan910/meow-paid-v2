import { type NextRequest, NextResponse } from "next/server";

import { createRequestSession, getVerifiedUserId } from "@/lib/server/supabase";

/** Protects page navigation and persists any session refresh on the response. */
export async function proxy(request: NextRequest) {
  const session = createRequestSession(request);
  const userId = await getVerifiedUserId(session.supabase);
  const isLogin = request.nextUrl.pathname === "/";

  if (isLogin && userId) {
    return session.respond(
      NextResponse.redirect(new URL("/main/transactions", request.url)),
    );
  }

  if (!isLogin && !userId) {
    return session.respond(NextResponse.redirect(new URL("/", request.url)));
  }

  return session.respond(NextResponse.next({ request }));
}

export const config = {
  matcher: ["/", "/main/:path*"],
};
