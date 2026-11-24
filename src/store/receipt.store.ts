import type { ReceiptDraft } from "@/schemas/receipt.schema";
import { createStore } from "zustand";

export type ReceiptMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};
type ReceiptSession = {
  threadId: string;
  draftId: string;
  draft: ReceiptDraft | null;
  viewerId: string | null;
  payeeId: string | null;
  messages: ReceiptMessage[];
  running: boolean;
  updateDraft: (change: (draft: ReceiptDraft) => ReceiptDraft) => void;
};

/** Creates an in-memory store per visit to the receipt assistant page. */
export function createReceiptSession() {
  return createStore<ReceiptSession>((set) => ({
    threadId: crypto.randomUUID(),
    draftId: crypto.randomUUID(),
    draft: null,
    viewerId: null,
    payeeId: null,
    messages: [],
    running: false,
    updateDraft: (change) =>
      set((state) => (state.draft ? { draft: change(state.draft) } : state)),
  }));
}

export type ReceiptSessionStore = ReturnType<typeof createReceiptSession>;
