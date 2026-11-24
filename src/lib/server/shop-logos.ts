import "server-only";

import { ApiError } from "@/lib/server/api";
import { getSupabaseConfig } from "@/lib/server/supabase";

const apiPrefix = "/api/shop-logos/";

function publicBucket() {
  const { url } = getSupabaseConfig();
  return new URL(
    `${url.replace(/\/$/, "")}/storage/v1/object/public/shop-logos/`,
  );
}

/** Validates and encodes one object key, including keys stored in folders. */
export function encodeLogoPath(path: string[]) {
  if (
    path.some(
      (part) =>
        !part ||
        part === "." ||
        part === ".." ||
        /[/\\]/.test(part) ||
        part.includes("\u0000"),
    )
  ) {
    throw new ApiError(400);
  }
  return path.map((part) => encodeURIComponent(part)).join("/");
}

export function publicLogoUrl(path: string[]) {
  const bucket = publicBucket();
  bucket.pathname += encodeLogoPath(path);
  return bucket.href;
}

/** Gives the browser an app URL for both new and previously stored logos. */
export function toAppLogoUrl(logo: string) {
  const bucket = publicBucket();
  const url = URL.parse(logo);
  if (
    !url ||
    url.origin !== bucket.origin ||
    !url.pathname.startsWith(bucket.pathname)
  ) {
    return logo;
  }

  try {
    const path = url.pathname
      .slice(bucket.pathname.length)
      .split("/")
      .map(decodeURIComponent);
    return apiPrefix + encodeLogoPath(path);
  } catch {
    return "";
  }
}

/** Preserves the public URL format used by the shops table. */
export function toStoredLogoUrl(logo: string) {
  if (logo.startsWith(apiPrefix)) {
    try {
      return publicLogoUrl(
        logo.slice(apiPrefix.length).split("/").map(decodeURIComponent),
      );
    } catch {
      throw new ApiError(400);
    }
  }

  const url = URL.parse(logo);
  if (url?.protocol !== "https:" && url?.protocol !== "http:")
    throw new ApiError(400);
  return logo;
}
