import {
  type ReceiptDraft,
  type ReceiptImage,
  receiptAgentSnapshotSchema,
} from "@/schemas/receipt.schema";
import type { ReceiptMessage } from "@/store/receipt.store";
import { HttpAgent } from "@ag-ui/client";
import type { Message } from "@ag-ui/core";

type ReceiptTurn = {
  threadId: string;
  history: ReceiptMessage[];
  message: ReceiptMessage;
  image?: ReceiptImage;
  draft: ReceiptDraft | null;
  locale: "en" | "zh";
  abortController: AbortController;
};

/** Sends a single AG-UI turn, attaching the source image only for the upload. */
export async function runReceiptTurn(turn: ReceiptTurn) {
  const { threadId, history, message, image, draft, locale, abortController } =
    turn;
  const messages: Message[] = history
    .slice(-8)
    .map((entry) => ({ id: entry.id, role: entry.role, content: entry.text }));
  messages.push({
    id: message.id,
    role: "user",
    content: image
      ? [
          { type: "text", text: message.text },
          {
            type: "image",
            source: {
              type: "data",
              mimeType: image.mimeType,
              value: image.data,
            },
          },
        ]
      : message.text,
  });
  const agent = new HttpAgent({
    url: "/api/receipt-agent",
    headers: { "x-meowpaid": "1" },
    threadId,
    initialMessages: messages,
    initialState: { draft, locale },
  });
  let snapshot: unknown;
  let code: string | undefined;
  const result = await agent
    .runAgent(
      { abortController },
      {
        onStateSnapshotEvent: ({ event }) => {
          snapshot = event.snapshot;
        },
        onRunErrorEvent: ({ event }) => {
          code = event.code;
        },
      },
    )
    .catch(() => null);
  if (code === "not_configured") throw new Error(code);
  const parsed = receiptAgentSnapshotSchema.safeParse(snapshot);
  const reply = result?.newMessages.find((entry) => entry.role === "assistant");
  if (!parsed.success || !reply || typeof reply.content !== "string")
    throw new Error("receipt_run_failed");
  return {
    state: parsed.data,
    reply: {
      id: reply.id,
      role: "assistant",
      text: reply.content,
    } satisfies ReceiptMessage,
  };
}
