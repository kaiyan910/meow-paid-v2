import "server-only";
import { ApiError } from "@/lib/server/api";

/** Rejects oversized bodies before buffering or parsing all of their contents. */
export async function readBoundedJson(
  request: Request,
  maxBytes: number,
): Promise<unknown> {
  if (!request.body) throw new ApiError(400);
  if (Number(request.headers.get("content-length")) > maxBytes)
    throw new ApiError(413);
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let json = "";
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        void reader.cancel().catch(() => undefined);
        throw new ApiError(413);
      }
      json += decoder.decode(value, { stream: true });
    }
    return JSON.parse(json + decoder.decode());
  } finally {
    reader.releaseLock();
  }
}
