"use client";

import { ReceiptCropDialog } from "@/components/receipt/receipt-crop-dialog";
import { ReceiptReview } from "@/components/receipt/receipt-review";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConfirmReceipt } from "@/hooks/use-transactions";
import { confirmReceipt } from "@/lib/receipt";
import { runReceiptTurn } from "@/lib/receipt-client";
import type { CroppedReceiptImage } from "@/lib/receipt-image";
import { cn } from "@/lib/utils";
import {
  type ReceiptMessage,
  type ReceiptSessionStore,
  createReceiptSession,
} from "@/store/receipt.store";
import { useTransactionStore } from "@/store/transaction.store";
import { ArrowLeft, ArrowUp, Bot, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "zustand";

type ChatError = { key: "notConfigured" | "runFailed" } | { detail: string };
type RecognitionUpload = CroppedReceiptImage & { name: string };

/** Renders live reply updates without rerendering the draft or composer. */
function ReceiptConversation({ store }: { store: ReceiptSessionStore }) {
  const { t } = useTranslation();
  const messages = useStore(store, (state) => state.messages);
  const pendingReply = useStore(store, (state) => state.pendingReply);
  const running = useStore(store, (state) => state.running);
  const scrollPane = useRef<HTMLDivElement>(null);
  const followLatest = useRef(true);

  useEffect(() => {
    const pane = scrollPane.current;
    if (pane && followLatest.current) pane.scrollTop = pane.scrollHeight;
  });

  if (!messages.length) return null;
  const visibleMessages = pendingReply ? [...messages, pendingReply] : messages;

  return (
    <div
      ref={scrollPane}
      className="max-h-72 overflow-y-auto rounded-md border border-border px-3 py-3"
      onScroll={({ currentTarget: pane }) => {
        followLatest.current =
          pane.scrollHeight - pane.scrollTop - pane.clientHeight <= 16;
      }}
    >
      <ol
        aria-label={t("receipt.conversation")}
        aria-live="polite"
        aria-busy={running && Boolean(pendingReply?.text)}
        className="flex flex-col gap-3"
      >
        {visibleMessages.map((message) => (
          <li
            key={message.id}
            className={cn(
              "flex max-w-[92%] items-start gap-2 rounded-md px-3 py-2 text-sm",
              message.role === "user"
                ? "self-end bg-primary/10"
                : "self-start bg-muted",
            )}
          >
            {message.role === "assistant" ? (
              <Bot className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            ) : null}
            <span className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
              {message.text || (
                <span className="text-muted-foreground">
                  {t("receipt.working")}
                  <span
                    aria-hidden="true"
                    className="inline-block motion-safe:animate-receipt-reply-dots"
                  >
                    ...
                  </span>
                </span>
              )}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Runs a receipt conversation and discards its state when the user leaves. */
export function ReceiptAssistantPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [store] = useState(createReceiptSession);
  const running = useStore(store, (state) => state.running);
  const fileInput = useRef<HTMLInputElement>(null);
  const chooseButton = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const inFlight = useRef<AbortController | null>(null);
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(
    null,
  );
  const [photo, setPhoto] = useState<File | null>(null);
  const [retryUpload, setRetryUpload] = useState<RecognitionUpload | null>(
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

  async function send(messageText: string, upload?: RecognitionUpload) {
    const before = store.getState();
    if (before.running || confirmation.isPending) return false;
    const abortController = new AbortController();
    inFlight.current = abortController;
    setError(null);
    if (upload) setRetryUpload(null);

    const threadId = upload ? crypto.randomUUID() : before.threadId;
    const history = upload ? [] : before.messages;
    const message: ReceiptMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: messageText,
    };
    const reply: ReceiptMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      text: "",
    };
    store.setState({
      running: true,
      messages: [...before.messages, message],
      pendingReply: reply,
    });

    try {
      const result = await runReceiptTurn({
        threadId,
        history,
        message,
        draft: upload ? null : before.draft,
        image: upload?.image,
        abortController,
        locale: i18n.language.startsWith("zh") ? "zh" : "en",
        onReply: ({ text }) => {
          if (!abortController.signal.aborted)
            store.setState({ pendingReply: { ...reply, text } });
        },
      });
      if (abortController.signal.aborted) return false;

      if (upload && !result.state.draft) {
        store.setState({ messages: before.messages, pendingReply: null });
        setRetryUpload(upload);
        setError({ detail: result.reply.text });
        return false;
      }

      if (upload) {
        setPreview({
          url: URL.createObjectURL(upload.blob),
          name: upload.name,
        });
        confirmation.reset();
        setText("");
      }
      store.setState({
        ...(upload
          ? { threadId, draftId: crypto.randomUUID(), payeeId: null }
          : {}),
        messages: [...history, message, { ...reply, text: result.reply.text }],
        pendingReply: null,
        draft: result.state.draft,
        viewerId: result.state.viewerId,
      });
      return true;
    } catch (failure) {
      if (abortController.signal.aborted) return false;
      store.setState({ messages: before.messages, pendingReply: null });
      if (upload) setRetryUpload(upload);
      setError({
        key:
          failure instanceof Error && failure.message === "not_configured"
            ? "notConfigured"
            : "runFailed",
      });
      return false;
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
        <h2 ref={heading} tabIndex={-1} className="text-lg font-bold">
          {t("receipt.title")}
        </h2>
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
              if (file && !busy) setPhoto(file);
            }}
          />
          <Button
            ref={chooseButton}
            type="button"
            variant="outline"
            className="self-start"
            disabled={busy}
            onClick={() => fileInput.current?.click()}
          >
            <Upload aria-hidden="true" />
            {t(preview ? "receipt.replace" : "receipt.upload")}
          </Button>
          {retryUpload && (
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              className="max-w-full self-start"
              onClick={() => {
                void send(t("receipt.readRequest"), retryUpload);
              }}
            >
              <span className="truncate">
                {t("receipt.retry", { name: retryUpload.name })}
              </span>
            </Button>
          )}
        </div>
        <ReceiptConversation store={store} />
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {"key" in error ? t(`receipt.${error.key}`) : error.detail}
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
      {photo && (
        <ReceiptCropDialog
          file={photo}
          onCancel={() => setPhoto(null)}
          onRead={(prepared) => {
            setPhoto(null);
            void send(t("receipt.readRequest"), {
              ...prepared,
              name: photo.name,
            });
          }}
          onCloseFocus={() => {
            const target = chooseButton.current?.disabled
              ? heading.current
              : chooseButton.current;
            target?.focus();
          }}
        />
      )}
    </div>
  );
}
