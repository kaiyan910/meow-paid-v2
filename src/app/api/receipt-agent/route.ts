import { ApiError, requireApiUser } from "@/lib/server/api";
import {
  prepareReceiptMessages,
  receiptRunMessagesSchema,
  runReceiptAgent,
} from "@/lib/server/receipt-agent";
import { readBoundedJson } from "@/lib/server/request-json";
import { idSchema } from "@/schemas/api.schema";
import {
  receiptAgentStateSchema,
  receiptImageMaxBytes,
} from "@/schemas/receipt.schema";
import { type AGUIEvent, EventType, PROTOCOL_VERSION } from "@ag-ui/core";
import { EventEncoder } from "@ag-ui/encoder";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;
const inputSchema = z.object({
  threadId: idSchema,
  runId: idSchema,
  state: receiptAgentStateSchema,
  messages: receiptRunMessagesSchema,
});
const maxRequestBytes = Math.ceil(receiptImageMaxBytes / 3) * 4 + 128 * 1024;

/** Runs the authenticated receipt agent and returns its AG-UI event stream. */
export function POST(request: NextRequest) {
  return requireApiUser(request, async ({ supabase, userId }) => {
    const { threadId, runId, state, messages } = inputSchema.parse(
      await readBoundedJson(request, maxRequestBytes),
    );
    const modelMessages = await prepareReceiptMessages(messages);
    const encoder = new EventEncoder();
    const utf8 = new TextEncoder();
    const clientAbort = new AbortController();
    const signal = AbortSignal.any([
      request.signal,
      clientAbort.signal,
      AbortSignal.timeout(55_000),
    ]);
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (event: AGUIEvent) => {
          if (!clientAbort.signal.aborted)
            controller.enqueue(utf8.encode(encoder.encodeSSE(event)));
        };
        send({
          type: EventType.RUN_STARTED,
          threadId,
          runId,
          protocolVersion: PROTOCOL_VERSION,
        });
        const messageId = crypto.randomUUID();
        let streamedReply = "";
        const sendReplyDelta = (delta: string) => {
          if (!delta) return;
          if (!streamedReply)
            send({
              type: EventType.TEXT_MESSAGE_START,
              messageId,
              role: "assistant",
            });
          send({ type: EventType.TEXT_MESSAGE_CONTENT, messageId, delta });
          streamedReply += delta;
        };
        try {
          const result = await runReceiptAgent(
            supabase,
            modelMessages,
            state.draft,
            state.locale,
            signal,
            sendReplyDelta,
          );
          signal.throwIfAborted();
          if (!result.reply.startsWith(streamedReply)) throw new ApiError(502);
          sendReplyDelta(result.reply.slice(streamedReply.length));
          send({ type: EventType.TEXT_MESSAGE_END, messageId });
          send({
            type: EventType.STATE_SNAPSHOT,
            snapshot: {
              draft: result.draft,
              locale: state.locale,
              viewerId: userId,
            },
          });
          send({ type: EventType.RUN_FINISHED, threadId, runId });
        } catch (error) {
          const code =
            error instanceof ApiError && error.status === 503
              ? "not_configured"
              : "receipt_run_failed";
          send({
            type: EventType.RUN_ERROR,
            code,
            message: "Receipt processing failed",
          });
        } finally {
          if (!clientAbort.signal.aborted) controller.close();
        }
      },
      cancel() {
        clientAbort.abort();
      },
    });
    return new NextResponse(stream, {
      headers: {
        "Content-Type": encoder.getContentType(),
        "X-Accel-Buffering": "no",
      },
    });
  });
}
