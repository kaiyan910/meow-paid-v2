import {
  type ReceiptDraft,
  type ReceiptImage,
  receiptAgentSnapshotSchema,
  receiptImageMaxBytes,
  receiptImageSchema,
  receiptImageTypes,
} from "@/schemas/receipt.schema";
import type { ReceiptMessage } from "@/store/receipt.store";
import { HttpAgent } from "@ag-ui/client";
import type { Message } from "@ag-ui/core";

/** Compresses large supported photos locally and returns a transient preview and image payload. */
export async function prepareReceiptImage(file: File) {
  if (!file.size || file.size > 24 * 1024 * 1024)
    throw new Error("Invalid image size");
  const allowedMime = receiptImageTypes.some((type) => type === file.type);
  let blob: Blob = file;
  if (!allowedMime || file.size > receiptImageMaxBytes) {
    const bitmap = await createImageBitmap(file);
    try {
      const scale = Math.min(1, 2800 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Cannot decode image");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (value) =>
            value ? resolve(value) : reject(new Error("Cannot encode image")),
          "image/jpeg",
          0.85,
        );
      });
    } finally {
      bitmap.close();
    }
  }
  if (blob.size > receiptImageMaxBytes) throw new Error("Image too large");

  const url = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Cannot read image"));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
  return {
    blob,
    image: receiptImageSchema.parse({
      mimeType: blob.type,
      data: url.split(",")[1],
    }),
  };
}

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
