import type { z } from "zod";

type ApiOptions = { method: "POST" | "PATCH" | "DELETE"; body?: unknown };

/** Calls the same-origin API and validates its JSON response. */
export async function apiFetch<T>(
  path: string,
  schema: z.ZodType<T>,
  options?: ApiOptions,
): Promise<T> {
  const headers = new Headers();
  let body: BodyInit | undefined;
  if (options) {
    headers.set("x-meowpaid", "1");
    if (options.body instanceof FormData) {
      body = options.body;
    } else if (options.body !== undefined) {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(options.body);
    }
  }

  const response = await fetch(path, {
    method: options?.method,
    body,
    headers,
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return schema.parse(await response.json());
}
