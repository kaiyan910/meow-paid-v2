"use client";

import { ReceiptReview } from "@/components/receipt/receipt-review";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConfirmReceipt } from "@/hooks/use-transactions";
import { confirmReceipt } from "@/lib/receipt";
import { prepareReceiptImage, runReceiptTurn } from "@/lib/receipt-client";
import { cn } from "@/lib/utils";
import {
  type ReceiptMessage,
  createReceiptSession,
} from "@/store/receipt.store";
import { useTransactionStore } from "@/store/transaction.store";
import { ArrowLeft, ArrowUp, Bot, Loader2, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "zustand";

type ChatError = "badImage" | "notConfigured" | "runFailed";

/** Runs a receipt conversation and discards its state when the user leaves. */
export function ReceiptAssistantPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [store] = useState(createReceiptSession);
  const messages = useStore(store, (state) => state.messages);
  const running = useStore(store, (state) => state.running);
  const fileInput = useRef<HTMLInputElement>(null);
  const inFlight = useRef<AbortController | null>(null);
  const conversationEnd = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(
    null,
  );
  const [text, setText] = useState("");
  const [error, setError] = useState<ChatError | null>(null);
  const confirmation = useConfirmReceipt();
  const busy = running || confirmation.isPending;

  useEffect(() => () => inFlight.current?.abort(), []);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview.url);
    },
    [preview],
  );
  useEffect(() => {
    if (messages.length)
      conversationEnd.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  async function send(messageText: string, file?: File) {
    const before = store.getState();
    if (before.running || confirmation.isPending) return false;
    const abortController = new AbortController();
    inFlight.current = abortController;
    store.setState({ running: true });
    setError(null);
    try {
      const upload = file
        ? await prepareReceiptImage(file).catch(() => null)
        : null;
      if (abortController.signal.aborted) return false;
      if (file && !upload) {
        setError("badImage");
        return false;
      }
      if (file && upload) {
        setPreview({ url: URL.createObjectURL(upload.blob), name: file.name });
        confirmation.reset();
        store.setState({
          threadId: crypto.randomUUID(),
          draftId: crypto.randomUUID(),
          draft: null,
          payeeId: null,
          messages: [],
        });
      }
      const { threadId, messages: history, draft } = store.getState();
      const message: ReceiptMessage = {
        id: crypto.randomUUID(),
        role: "user",
        text: messageText,
      };
      store.setState({ messages: [...history, message] });
      try {
        const result = await runReceiptTurn({
          threadId,
          history,
          message,
          draft,
          image: upload?.image,
          abortController,
          locale: i18n.language.startsWith("zh") ? "zh" : "en",
        });
        if (abortController.signal.aborted) return false;
        store.setState({
          messages: [...history, message, result.reply],
          draft: result.state.draft,
          viewerId: result.state.viewerId,
        });
        return true;
      } catch (failure) {
        if (abortController.signal.aborted) return false;
        store.setState({ messages: history });
        setError(
          failure instanceof Error && failure.message === "not_configured"
            ? "notConfigured"
            : "runFailed",
        );
        return false;
      }
    } finally {
      if (!abortController.signal.aborted) store.setState({ running: false });
      inFlight.current = null;
    }
  }

  async function save() {
    const { draft, draftId, payeeId, viewerId } = store.getState();
    const payer = payeeId ?? viewerId;
    if (!draft || !payer || !confirmReceipt(draft, payer) || busy) return;
    try {
      await confirmation.mutateAsync({ draftId, draft, payeeId: payer });
      const [year, month] = draft.date.split("-").map(Number);
      useTransactionStore.getState().setMonth(year, month - 1);
      router.replace("/main/transactions");
    } catch {
      // The draft ID stays the same for a retry after a failed response.
    }
  }

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      <header className="flex items-center gap-3">
        <Button
          asChild
          variant="ghost"
          size="icon"
          aria-label={t("receipt.back")}
        >
          <Link href="/main/transactions">
            <ArrowLeft aria-hidden="true" />
          </Link>
        </Button>
        <h2 className="text-lg font-bold">{t("receipt.title")}</h2>
      </header>

      <section aria-label={t("receipt.title")} className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 rounded-md border-2 border-dashed border-border p-4">
          {preview ? (
            <details>
              <summary className="cursor-pointer break-all text-sm font-medium">
                {t("receipt.preview")} · {preview.name}
              </summary>
              <img
                src={preview.url}
                alt={t("receipt.preview")}
                className="mt-3 max-h-[65vh] w-full object-contain"
              />
            </details>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("receipt.uploadHint")}
            </p>
          )}
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="hidden"
            aria-label={t("receipt.upload")}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = "";
              if (file) void send(t("receipt.readRequest"), file);
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="self-start"
            disabled={busy}
            onClick={() => fileInput.current?.click()}
          >
            <Upload aria-hidden="true" />
            {t(preview ? "receipt.replace" : "receipt.upload")}
          </Button>
        </div>
        {messages.length > 0 && (
          <div className="max-h-72 overflow-y-auto rounded-md border border-border px-3 py-3">
            <ol
              aria-label={t("receipt.conversation")}
              aria-live="polite"
              className="flex flex-col gap-3"
            >
              {messages.map((message) => (
                <li
                  key={message.id}
                  className={cn(
                    "flex max-w-[92%] items-start gap-2 rounded-md px-3 py-2 text-sm",
                    message.role === "user"
                      ? "self-end bg-primary/10"
                      : "self-start bg-muted",
                  )}
                >
                  {message.role === "assistant" && (
                    <Bot
                      className="mt-0.5 size-4 shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  <span className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                    {message.text}
                  </span>
                </li>
              ))}
            </ol>
            <div ref={conversationEnd} />
          </div>
        )}
        {running && (
          <output className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            {t("receipt.working")}
          </output>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {t(`receipt.${error}`)}
          </p>
        )}
        <form
          className="flex items-center gap-2"
          onSubmit={async (event) => {
            event.preventDefault();
            if (text.trim() && (await send(text.trim()))) setText("");
          }}
        >
          <Input
            aria-label={t("receipt.message")}
            placeholder={t("receipt.messagePlaceholder")}
            value={text}
            maxLength={2000}
            disabled={busy}
            onChange={(event) => setText(event.target.value)}
          />
          <Button
            type="submit"
            size="icon"
            aria-label={t("receipt.send")}
            disabled={busy || !text.trim()}
          >
            <ArrowUp aria-hidden="true" />
          </Button>
        </form>
      </section>
      <ReceiptReview
        store={store}
        busy={busy}
        saving={confirmation.isPending}
        saveError={confirmation.isError}
        onConfirm={() => {
          void save();
        }}
      />
    </div>
  );
}
