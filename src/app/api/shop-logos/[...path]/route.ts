import { type NextRequest, NextResponse } from "next/server";

import { ApiError, requireApiUser } from "@/lib/server/api";
import { publicLogoUrl } from "@/lib/server/shop-logos";

/** Streams an existing logo from the fixed Storage bucket through the app origin. */
export function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return requireApiUser(request, async () => {
    const { path } = await params;
    const image = await fetch(publicLogoUrl(path), {
      cache: "no-store",
      redirect: "error",
      signal: request.signal,
    });
    if (!image.ok)
      throw new ApiError(
        image.status === 404 || image.status === 400 ? 404 : 502,
      );

    const type = image.headers.get("content-type");
    if (!type?.startsWith("image/")) {
      await image.body?.cancel();
      throw new ApiError(404);
    }
    return new NextResponse(image.body, {
      headers: {
        "Content-Type": type,
        "Content-Security-Policy": "default-src 'none'; sandbox",
        "X-Content-Type-Options": "nosniff",
      },
    });
  });
}
